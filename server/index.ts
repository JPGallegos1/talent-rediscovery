import { streamText } from "ai";
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

app.post("/api/chat", async (c) => {
  const { messages, sessionContext } = await c.req.json<{
    messages: { role: string; content: string }[];
    sessionContext: {
      searchRequest: string | null;
      searchCriteria: Record<string, unknown> | null;
      shortlist: unknown[];
      candidateRecordCount: number;
      talentPoolFileName: string | null;
      selectedMatchId: string | null;
    };
  }>();

  const systemMessage = {
    role: "system" as const,
    content: buildSystemPrompt(sessionContext),
  };

  const result = streamText({
    model: openai(chatModel),
    messages: [systemMessage, ...messages],
    tools: intelligenceActionTools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
});

app.get("/api/health", (c) => {
  return c.json({ status: "ok", model: chatModel, keySet: !!process.env.OPENAI_API_KEY });
});

const port = parseInt(process.env.PORT || "3001", 10);

console.log(`Talent Rediscovery Intelligence Layer server starting on port ${port}...`);
console.log(`Chat model: ${chatModel}`);
console.log(`API key set: ${!!process.env.OPENAI_API_KEY}`);

serve({ fetch: app.fetch, port });
