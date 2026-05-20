import { describe, expect, it } from "vitest";
import { createApiApp } from "../server/app.js";

describe("API boundary", () => {
  it("exposes health without starting the listener", async () => {
    const app = createApiApp({
      env: {
        OPENAI_CHAT_MODEL: "boundary-test-model",
      },
    });

    const response = await app.request("/api/health");

    await expect(response.json()).resolves.toEqual({
      status: "ok",
      model: "boundary-test-model",
      keySet: false,
    });
    expect(response.status).toBe(200);
  });

  it("returns structured validation errors for invalid chat payloads", async () => {
    const app = createApiApp({ env: {} });

    const response = await app.request("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });

    await expect(response.json()).resolves.toEqual({
      error: {
        category: "validation_error",
        message: "Chat request must include messages and sessionContext.",
      },
    });
    expect(response.status).toBe(400);
  });
});
