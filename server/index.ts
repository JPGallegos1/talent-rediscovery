import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { buildSystemPrompt, intelligenceActionTools } from "./intelligence-handler.js";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chatModel = process.env.OPENAI_CHAT_MODEL || "gpt-4o";

const app = new Hono();

app.use("/api/*", cors());

type ChatPayload = {
  messages: { role: string; content: string }[];
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

  const messagesValid = value.messages.every((message) => {
    return isRecord(message) && typeof message.role === "string" && typeof message.content === "string";
  });

  const { sessionContext } = value;

  return (
    messagesValid &&
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

    if (!process.env.OPENAI_API_KEY) {
      return c.json(copilotError("configuration_error", "Copilot chat is not configured."), 503);
    }

    const systemMessage = {
      role: "system" as const,
      content: buildSystemPrompt(payload.sessionContext),
    };

    const result = streamText({
      model: openai(chatModel),
      messages: [systemMessage, ...payload.messages],
      tools: intelligenceActionTools,
      maxSteps: 5,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Copilot chat request failed", error);

    return c.json(copilotError("server_error", "Copilot chat failed unexpectedly."), 500);
  }
});

app.get("/api/health", (c) => {
  return c.json({ status: "ok", model: chatModel, keySet: !!process.env.OPENAI_API_KEY });
});

const port = parseInt(process.env.PORT || "3001", 10);

console.log(`Talent Rediscovery Intelligence Layer server starting on port ${port}...`);
console.log(`Chat model: ${chatModel}`);
console.log(`API key set: ${!!process.env.OPENAI_API_KEY}`);

serve({ fetch: app.fetch, port });
