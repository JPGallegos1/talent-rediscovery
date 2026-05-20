import { describe, expect, it } from "vitest";
import { createApiApp } from "../server/app.js";

async function importCandidate(app: ReturnType<typeof createApiApp>) {
  const response = await app.request("/api/talent-pool/import-csv", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName: "talent-pool.csv",
      csvText: ["Name,Current Role,Skills", "Ada Lovelace,Senior React Engineer,React"].join("\n"),
      creatorId: "recruiter-1",
    }),
  });
  const payload = await response.json();

  return payload.candidates[0].id as string;
}

describe("Candidate Notes API", () => {
  it("does not persist proposed notes until human confirmation", async () => {
    const app = createApiApp({ env: {} });
    const candidateId = await importCandidate(app);

    const proposalResponse = await app.request("/api/candidate-notes/propose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        candidateId,
        content: "Prefers remote fintech roles and is available in two weeks.",
        sourceType: "manual",
        creatorId: "recruiter-1",
      }),
    });
    const proposalPayload = await proposalResponse.json();

    expect(proposalResponse.status).toBe(200);
    expect(proposalPayload.proposedCandidateNote).toMatchObject({
      candidateId,
      content: "Prefers remote fintech roles and is available in two weeks.",
      sourceType: "manual",
      durable: false,
    });

    const notesBeforeConfirmation = await app.request(`/api/candidates/${candidateId}/notes`);
    await expect(notesBeforeConfirmation.json()).resolves.toEqual({ candidateNotes: [] });

    const confirmResponse = await app.request("/api/candidate-notes/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        candidateId,
        content: proposalPayload.proposedCandidateNote.content,
        sourceType: proposalPayload.proposedCandidateNote.sourceType,
        creatorId: "recruiter-1",
        confirmerId: "recruiter-1",
      }),
    });
    const confirmPayload = await confirmResponse.json();

    expect(confirmResponse.status).toBe(201);
    expect(confirmPayload.candidateNote).toMatchObject({
      id: "candidate_note_1",
      candidateId,
      content: "Prefers remote fintech roles and is available in two weeks.",
      provenance: {
        sourceType: "manual",
        creatorId: "recruiter-1",
        confirmerId: "recruiter-1",
        uncertainty: null,
        staleness: null,
      },
    });

    const notesAfterConfirmation = await app.request(`/api/candidates/${candidateId}/notes`);
    const notesPayload = await notesAfterConfirmation.json();

    expect(notesAfterConfirmation.status).toBe(200);
    expect(notesPayload.candidateNotes).toHaveLength(1);
    expect(notesPayload.candidateNotes[0].id).toBe("candidate_note_1");
  });

  it("refuses sensitive or recruiting-irrelevant Candidate Notes", async () => {
    const app = createApiApp({ env: {} });
    const candidateId = await importCandidate(app);

    const response = await app.request("/api/candidate-notes/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        candidateId,
        content: "Candidate mentioned family health details unrelated to the role.",
        sourceType: "manual",
        creatorId: "recruiter-1",
        confirmerId: "recruiter-1",
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({
      error: {
        category: "validation_error",
        message: "Candidate Notes must be recruiting-relevant and avoid sensitive personal data.",
      },
    });
  });
});
