import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { buildSystemPrompt, intelligenceActionTools } from "./intelligence-handler.js";

type ApiEnvironment = Record<string, string | undefined>;

type ApiAppOptions = {
  env?: ApiEnvironment;
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

export function getChatModel(env: ApiEnvironment = process.env) {
  return env.OPENAI_CHAT_MODEL || "gpt-4o";
}

export function createApiApp({ env = process.env }: ApiAppOptions = {}) {
  const openai = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
  });
  const chatModel = getChatModel(env);
  const app = new Hono();

  app.use("/api/*", cors());

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
