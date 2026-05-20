import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { parseCsvTalentPool } from "../src/csv-candidate-records.js";
import { interpretSearchCriteria } from "../src/search-criteria.js";
import { buildSystemPrompt, intelligenceActionTools } from "./intelligence-handler.js";
import {
  createMemoryRecruitingMemoryRepository,
  type CandidateNoteSourceType,
  type RecruitingMemoryRepository,
} from "./recruiting-memory.js";

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

const candidateNoteSourceTypes = new Set(["manual", "imported", "transcribed", "inferred"]);

function isCandidateNoteSourceType(value: unknown): value is CandidateNoteSourceType {
  return typeof value === "string" && candidateNoteSourceTypes.has(value);
}

function isCandidateNoteProposalPayload(
  value: unknown,
): value is { candidateId: string; content: string; sourceType: CandidateNoteSourceType; creatorId?: string | null } {
  return (
    isRecord(value) &&
    typeof value.candidateId === "string" &&
    value.candidateId.trim().length > 0 &&
    typeof value.content === "string" &&
    value.content.trim().length > 0 &&
    isCandidateNoteSourceType(value.sourceType) &&
    (value.creatorId === undefined || typeof value.creatorId === "string" || value.creatorId === null)
  );
}

function isCandidateNoteConfirmationPayload(
  value: unknown,
): value is { candidateId: string; content: string; sourceType: CandidateNoteSourceType; creatorId?: string | null; confirmerId: string } {
  const confirmerId = isRecord(value) ? value.confirmerId : undefined;

  return (
    isCandidateNoteProposalPayload(value) &&
    typeof confirmerId === "string" &&
    confirmerId.trim().length > 0
  );
}

function isRecruitingRelevantCandidateNote(content: string) {
  const normalized = content.toLowerCase();
  const sensitiveSignals = ["health", "family", "religion", "politics", "appearance", "financial", "finances"];

  return !sensitiveSignals.some((signal) => normalized.includes(signal));
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

    let parsed: ReturnType<typeof parseCsvTalentPool>;

    try {
      parsed = parseCsvTalentPool(payload.csvText);
    } catch (error) {
      return c.json(
        copilotError("validation_error", error instanceof Error ? error.message : "Talent Pool File could not be parsed."),
        400,
      );
    }

    try {
      const result = await recruitingMemory.importCandidateRecords({
        fileName: payload.fileName,
        creatorId: payload.creatorId ?? null,
        candidateRecords: parsed.candidateRecords,
      });

      return c.json(result, 201);
    } catch (error) {
      console.error("Talent Pool import failed", error);

      return c.json(copilotError("server_error", "Talent Pool File could not be imported."), 500);
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

  app.post("/api/candidate-notes/propose", async (c) => {
    const payload = await c.req.json().catch(() => null);

    if (!isCandidateNoteProposalPayload(payload)) {
      return c.json(copilotError("validation_error", "Candidate Note proposal requires candidateId, content, and sourceType."), 400);
    }

    if (!(await recruitingMemory.candidateExists(payload.candidateId))) {
      return c.json(copilotError("validation_error", "Candidate does not exist."), 404);
    }

    if (!isRecruitingRelevantCandidateNote(payload.content)) {
      return c.json(copilotError("validation_error", "Candidate Notes must be recruiting-relevant and avoid sensitive personal data."), 400);
    }

    return c.json({
      proposedCandidateNote: {
        candidateId: payload.candidateId,
        content: payload.content,
        sourceType: payload.sourceType,
        creatorId: payload.creatorId ?? null,
        durable: false,
      },
    });
  });

  app.post("/api/candidate-notes/confirm", async (c) => {
    const payload = await c.req.json().catch(() => null);

    if (!isCandidateNoteConfirmationPayload(payload)) {
      return c.json(copilotError("validation_error", "Candidate Note confirmation requires candidateId, content, sourceType, and confirmerId."), 400);
    }

    if (!(await recruitingMemory.candidateExists(payload.candidateId))) {
      return c.json(copilotError("validation_error", "Candidate does not exist."), 404);
    }

    if (!isRecruitingRelevantCandidateNote(payload.content)) {
      return c.json(copilotError("validation_error", "Candidate Notes must be recruiting-relevant and avoid sensitive personal data."), 400);
    }

    const candidateNote = await recruitingMemory.confirmCandidateNote(payload);

    return c.json({ candidateNote }, 201);
  });

  app.get("/api/candidates/:candidateId/notes", async (c) => {
    const candidateId = c.req.param("candidateId");

    if (!(await recruitingMemory.candidateExists(candidateId))) {
      return c.json(copilotError("validation_error", "Candidate does not exist."), 404);
    }

    const candidateNotes = await recruitingMemory.listCandidateNotes(candidateId);

    return c.json({ candidateNotes });
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
