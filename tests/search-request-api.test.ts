import { describe, expect, it } from "vitest";
import { createApiApp } from "../server/app.js";

describe("Search Request API", () => {
  it("persists original text with a read-only Search Criteria snapshot", async () => {
    const app = createApiApp({ env: {} });

    const response = await app.request("/api/search-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        searchRequest: "Senior React profiles with fintech experience and advanced English",
        creatorId: "recruiter-1",
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.searchRequest).toEqual({
      id: "search_request_1",
      originalText: "Senior React profiles with fintech experience and advanced English",
      searchCriteria: {
        skills: ["React"],
        seniority: "Senior or Lead",
        industry: ["fintech"],
        languageLevel: "Advanced English",
      },
      criteriaEditable: false,
      creatorId: "recruiter-1",
      createdAt: expect.any(String),
    });
  });

  it("retrieves persisted Search Requests through the API boundary", async () => {
    const app = createApiApp({ env: {} });

    await app.request("/api/search-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ searchRequest: "Python FastAPI fintech Colombia with good English" }),
    });

    const response = await app.request("/api/search-requests");
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.searchRequests).toHaveLength(1);
    expect(payload.searchRequests[0]).toMatchObject({
      id: "search_request_1",
      originalText: "Python FastAPI fintech Colombia with good English",
      criteriaEditable: false,
      searchCriteria: {
        skills: ["Python", "FastAPI"],
        industry: ["fintech"],
        location: ["colombia"],
        languageLevel: "Good English",
      },
    });
  });
});
