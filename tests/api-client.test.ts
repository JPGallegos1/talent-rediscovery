import { describe, expect, it } from "vitest";
import { createSearchRequest, importCsvTalentPool } from "../src/api-client.js";

describe("admin API client", () => {
  it("imports CSV Talent Pool Files through the API boundary", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ input, init });

      return new Response(JSON.stringify({ imported: { candidateCount: 1, candidateRecordCount: 1 }, candidateRecords: [] }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    };

    const result = await importCsvTalentPool(
      { fileName: "talent-pool.csv", csvText: "Name\nAda", creatorId: "recruiter-1" },
      fetchImpl,
    );

    expect(result.imported).toEqual({ candidateCount: 1, candidateRecordCount: 1 });
    expect(requests).toHaveLength(1);
    expect(requests[0].input).toBe("/api/talent-pool/import-csv");
    expect(requests[0].init).toMatchObject({ method: "POST", headers: { "content-type": "application/json" } });
    expect(JSON.parse(String(requests[0].init?.body))).toEqual({
      fileName: "talent-pool.csv",
      csvText: "Name\nAda",
      creatorId: "recruiter-1",
    });
  });

  it("surfaces API import validation errors", async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ error: { message: "The Talent Pool File has headers but no Candidate Records." } }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });

    await expect(importCsvTalentPool({ fileName: "empty.csv", csvText: "Name\n" }, fetchImpl)).rejects.toThrow(
      /no Candidate Records/,
    );
  });

  it("creates Search Requests through the API boundary", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ input, init });

      return new Response(
        JSON.stringify({
          searchRequest: {
            id: "search_request_1",
            originalText: "Senior React profiles",
            searchCriteria: { skills: ["React"], seniority: "Senior or Lead" },
            criteriaEditable: false,
            creatorId: null,
            createdAt: "2026-05-20T00:00:00.000Z",
          },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      );
    };

    const result = await createSearchRequest({ searchRequest: "Senior React profiles" }, fetchImpl);

    expect(result.searchRequest.searchCriteria).toEqual({ skills: ["React"], seniority: "Senior or Lead" });
    expect(result.searchRequest.criteriaEditable).toBe(false);
    expect(requests[0].input).toBe("/api/search-requests");
    expect(JSON.parse(String(requests[0].init?.body))).toEqual({ searchRequest: "Senior React profiles" });
  });
});
