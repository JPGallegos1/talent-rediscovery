import { describe, expect, it } from "vitest";
import { createApiApp } from "@recollect/api/app.js";

describe("Candidate Memory API", () => {
  it("retrieves Candidate Records, confirmed Candidate Notes, provenance, and memory gaps for a known Candidate", async () => {
    const app = createApiApp({ env: {} });
    const importResponse = await app.request("/api/talent-pool/import-csv", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: "talent-pool.csv",
        csvText: [
          "Name,Current Role,Skills,Availability,Last Contact",
          "Ada Lovelace,Senior React Engineer,React,,2025-01-01",
        ].join("\n"),
        creatorId: "recruiter-1",
      }),
    });
    const importPayload = await importResponse.json();
    const candidateId = importPayload.candidates[0].id as string;

    await app.request("/api/candidate-notes/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        candidateId,
        content: "Confirmed fintech marketplace experience and preference for remote roles.",
        sourceType: "manual",
        creatorId: "recruiter-1",
        confirmerId: "recruiter-1",
      }),
    });

    const response = await app.request(`/api/candidates/${candidateId}/memory`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.candidateMemory).toMatchObject({
      candidateId,
      candidateRecords: [
        {
          candidateId,
          canonicalFields: {
            name: "Ada Lovelace",
            currentRole: "Senior React Engineer",
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
        },
      ],
      candidateNotes: [
        {
          candidateId,
          content: "Confirmed fintech marketplace experience and preference for remote roles.",
          provenance: {
            sourceType: "manual",
            creatorId: "recruiter-1",
            confirmerId: "recruiter-1",
            uncertainty: null,
            staleness: null,
          },
        },
      ],
      memoryGaps: expect.arrayContaining([
        "Missing Candidate Record field: Availability.",
        "Last contact may be stale: 2025-01-01.",
      ]),
    });
  });

  it("returns a validation error when Candidate Memory is requested for an unknown Candidate", async () => {
    const app = createApiApp({ env: {} });

    const response = await app.request("/api/candidates/candidate_missing/memory");
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({
      error: {
        category: "validation_error",
        message: "Candidate does not exist.",
      },
    });
  });
});
