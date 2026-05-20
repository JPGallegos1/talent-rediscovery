import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { parseCsvTalentPool } from "../src/csv-candidate-records.js";
import { interpretSearchCriteria } from "../src/search-criteria.js";
import { buildSystemPrompt, intelligenceActionTools } from "./intelligence-handler.js";
import { createMemoryRecruitingMemoryRepository, type RecruitingMemoryRepository } from "./recruiting-memory.js";

type ApiEnvironment = Record<string, string | undefined>;

type ApiAppOptions = {
  env?: ApiEnvironment;
  recruitingMemory?: RecruitingMemoryRepository;
};

type ChatPayload = {
  messages: UIMessage[];
  sessionContext: {
    searchRequest: string | null;
    searchCriteria: Record<string, unknown> | null;
    shortlist: unknown[];
    candidateRecordCount: number;
    talentPoolFileName: string | null;
    selectedMatchId: string | null;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isChatPayload(value: unknown): value is ChatPayload {
  if (!isRecord(value) || !Array.isArray(value.messages) || !isRecord(value.sessionContext)) {
    return false;
  }

  const { sessionContext } = value;

  return (
    isNullableString(sessionContext.searchRequest) &&
    (isRecord(sessionContext.searchCriteria) || sessionContext.searchCriteria === null) &&
    Array.isArray(sessionContext.shortlist) &&
    typeof sessionContext.candidateRecordCount === "number" &&
    isNullableString(sessionContext.talentPoolFileName) &&
    isNullableString(sessionContext.selectedMatchId)
  );
}

function copilotError(category: "validation_error" | "configuration_error" | "server_error", message: string) {
  return { error: { category, message } };
}

function isImportCsvPayload(value: unknown): value is { fileName: string; csvText: string; creatorId?: string | null } {
  return (
    isRecord(value) &&
    typeof value.fileName === "string" &&
    value.fileName.trim().length > 0 &&
    typeof value.csvText === "string" &&
    value.csvText.trim().length > 0 &&
    (value.creatorId === undefined || typeof value.creatorId === "string" || value.creatorId === null)
  );
}

function isSearchRequestPayload(value: unknown): value is { searchRequest: string; creatorId?: string | null } {
  return (
    isRecord(value) &&
    typeof value.searchRequest === "string" &&
    value.searchRequest.trim().length > 0 &&
    (value.creatorId === undefined || typeof value.creatorId === "string" || value.creatorId === null)
  );
}

export function getChatModel(env: ApiEnvironment = process.env) {
  return env.OPENAI_CHAT_MODEL || "gpt-4o";
}

export function createApiApp({ env = process.env, recruitingMemory = createMemoryRecruitingMemoryRepository() }: ApiAppOptions = {}) {
  const openai = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
  const chatModel = getChatModel(env);
  const app = new Hono();

  app.use("/api/*", cors());

  app.post("/api/talent-pool/import-csv", async (c) => {
    let payload: unknown;

    try {
      payload = await c.req.json();
    } catch {
      return c.json(copilotError("validation_error", "Talent Pool import body must be valid JSON."), 400);
    }

    if (!isImportCsvPayload(payload)) {
      return c.json(copilotError("validation_error", "Talent Pool import must include fileName and csvText."), 400);
    }

    try {
      const parsed = parseCsvTalentPool(payload.csvText);
      const result = await recruitingMemory.importCandidateRecords({
        fileName: payload.fileName,
        creatorId: payload.creatorId ?? null,
        candidateRecords: parsed.candidateRecords,
      });

      return c.json(result, 201);
    } catch (error) {
      return c.json(
        copilotError("validation_error", error instanceof Error ? error.message : "Talent Pool File could not be imported."),
        400,
      );
    }
  });

  app.get("/api/candidate-records", async (c) => {
    const candidateRecords = await recruitingMemory.listCandidateRecords();

    return c.json({ candidateRecords });
  });

  app.post("/api/search-requests", async (c) => {
    let payload: unknown;

    try {
      payload = await c.req.json();
    } catch {
      return c.json(copilotError("validation_error", "Search Request body must be valid JSON."), 400);
    }

    if (!isSearchRequestPayload(payload)) {
      return c.json(copilotError("validation_error", "Search Request text is required."), 400);
    }

    const searchCriteria = interpretSearchCriteria(payload.searchRequest) ?? {};
    const searchRequest = await recruitingMemory.createSearchRequest({
      originalText: payload.searchRequest,
      searchCriteria,
      creatorId: payload.creatorId ?? null,
    });

    return c.json({ searchRequest }, 201);
  });

  app.get("/api/search-requests", async (c) => {
    const searchRequests = await recruitingMemory.listSearchRequests();

    return c.json({ searchRequests });
  });

  app.post("/api/chat", async (c) => {
    try {
      let payload: unknown;

      try {
        payload = await c.req.json();
      } catch {
        return c.json(copilotError("validation_error", "Chat request body must be valid JSON."), 400);
      }

      if (!isChatPayload(payload)) {
        return c.json(copilotError("validation_error", "Chat request must include messages and sessionContext."), 400);
      }

      if (!env.OPENAI_API_KEY) {
        return c.json(copilotError("configuration_error", "Copilot chat is not configured."), 503);
      }

      let modelMessages: Awaited<ReturnType<typeof convertToModelMessages>>;

      try {
        modelMessages = await convertToModelMessages(payload.messages);
      } catch {
        return c.json(copilotError("validation_error", "Chat request messages are invalid."), 400);
      }

      const result = streamText({
        model: openai(chatModel),
        system: buildSystemPrompt(payload.sessionContext),
        messages: modelMessages,
        tools: intelligenceActionTools,
        stopWhen: stepCountIs(5),
      });

      return result.toUIMessageStreamResponse();
    } catch (error) {
      console.error("Copilot chat request failed", error);

      return c.json(copilotError("server_error", "Copilot chat failed unexpectedly."), 500);
    }
  });

  app.get("/api/health", (c) => {
    return c.json({ status: "ok", model: chatModel, keySet: !!env.OPENAI_API_KEY });
  });

  return app;
}
