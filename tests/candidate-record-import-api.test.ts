import { describe, expect, it } from "vitest";
import { createApiApp } from "../server/app.js";

describe("Candidate Record import API", () => {
  it("persists CSV rows as minimal Candidates and evidence-bearing Candidate Records", async () => {
    const app = createApiApp({ env: {} });
    const csvText = [
      "Name,Current Role,Skills,Location,English Level,Availability,Portfolio URL",
      "Ada Lovelace,Senior React Engineer,\"React, TypeScript, fintech\",Remote,Advanced,Available,https://example.test/ada",
    ].join("\n");

    const response = await app.request("/api/talent-pool/import-csv", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: "talent-pool.csv",
        csvText,
        creatorId: "recruiter-1",
      }),
    });

    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.imported).toEqual({ candidateCount: 1, candidateRecordCount: 1 });
    expect(payload.candidates).toHaveLength(1);
    expect(payload.candidates[0]).toEqual({
      id: expect.stringMatching(/^candidate_/),
      createdAt: expect.any(String),
    });
    expect(payload.candidates[0]).not.toHaveProperty("name");
    expect(payload.candidates[0]).not.toHaveProperty("email");

    expect(payload.candidateRecords).toHaveLength(1);
    expect(payload.candidateRecords[0]).toMatchObject({
      id: expect.stringMatching(/^candidate_record_/),
      candidateId: payload.candidates[0].id,
      rowNumber: 2,
      canonicalFields: {
        name: "Ada Lovelace",
        currentRole: "Senior React Engineer",
        location: "Remote",
        englishLevel: "Advanced",
        availability: "Available",
      },
      sourceFields: {
        "Portfolio URL": "https://example.test/ada",
      },
      provenance: {
        sourceType: "imported",
        sourceReference: {
          fileName: "talent-pool.csv",
          rowNumber: 2,
        },
        creatorId: "recruiter-1",
        uncertainty: null,
        staleness: null,
      },
      possibleDuplicateCandidateRecordIds: [],
    });
  });

  it("retrieves persisted Candidate Records through the API boundary", async () => {
    const app = createApiApp({ env: {} });
    const csvText = [
      "Name,Current Role,Skills,Location",
      "Ada Lovelace,Senior React Engineer,React,Remote",
      "Grace Hopper,Backend Engineer,Node.js,New York",
    ].join("\n");

    await app.request("/api/talent-pool/import-csv", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fileName: "talent-pool.csv", csvText }),
    });

    const response = await app.request("/api/candidate-records");
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.candidateRecords).toHaveLength(2);
    expect(payload.candidateRecords.map((record: { candidateId: string }) => record.candidateId)).toEqual([
      "candidate_1",
      "candidate_2",
    ]);
    expect(payload.candidateRecords[0].canonicalFields.name).toBe("Ada Lovelace");
    expect(payload.candidateRecords[1].canonicalFields.name).toBe("Grace Hopper");
  });

  it("flags duplicate-looking Candidate Records without auto-merging Candidates", async () => {
    const app = createApiApp({ env: {} });
    const csvText = [
      "Name,Current Role,Skills",
      "Ada Lovelace,Senior React Engineer,React",
      "Ada Lovelace,Frontend Lead,TypeScript",
    ].join("\n");

    const response = await app.request("/api/talent-pool/import-csv", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fileName: "talent-pool.csv", csvText }),
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.candidates).toHaveLength(2);
    expect(payload.candidates.map((candidate: { id: string }) => candidate.id)).toEqual(["candidate_1", "candidate_2"]);
    expect(payload.candidateRecords.map((record: { candidateId: string }) => record.candidateId)).toEqual([
      "candidate_1",
      "candidate_2",
    ]);
    expect(payload.candidateRecords[0].possibleDuplicateCandidateRecordIds).toEqual(["candidate_record_2"]);
    expect(payload.candidateRecords[1].possibleDuplicateCandidateRecordIds).toEqual(["candidate_record_1"]);
  });
});
