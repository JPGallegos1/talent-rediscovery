import { serve } from "@hono/node-server";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { createApiApp, getChatModel } from "./app.js";

if (existsSync(".env")) {
  loadEnvFile(".env");
}

const app = createApiApp();
const port = parseInt(process.env.PORT || "3001", 10);
const chatModel = getChatModel();

console.log(`Talent Rediscovery Intelligence Layer server starting on port ${port}...`);
console.log(`Chat model: ${chatModel}`);
console.log(`API key set: ${!!process.env.OPENAI_API_KEY}`);

serve({ fetch: app.fetch, port });
