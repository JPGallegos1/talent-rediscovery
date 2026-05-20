import { describe, expect, it } from "vitest";
import {
  deriveCandidateMemoryGaps,
  formatProvenanceChips,
  splitMatchEvidenceByMemorySource,
  type CandidateMemoryRecord,
} from "../src/candidate-memory.js";

describe("Candidate Memory helpers", () => {
  it("separates Match evidence from Candidate Records and Candidate Notes", () => {
    const result = splitMatchEvidenceByMemorySource([
      { source: "Candidate Record", field: "skills", label: "Skills", value: "React", matched: "Matched requested skill: React" },
      { source: "Candidate Note", field: "candidateNote", label: "Candidate Note", value: "Confirmed fintech context.", matched: "Matched requested industry: fintech" },
    ]);

    expect(result.candidateRecordEvidence.map((item) => item.value)).toEqual(["React"]);
    expect(result.candidateNoteEvidence.map((item) => item.value)).toEqual(["Confirmed fintech context."]);
  });

  it("formats provenance chips across source, confirmation, uncertainty, and staleness axes", () => {
    expect(formatProvenanceChips({
      sourceType: "manual",
      creatorId: "recruiter-1",
      createdAt: "2026-05-20T00:00:00.000Z",
      confirmerId: "recruiter-2",
      confirmedAt: "2026-05-20T01:00:00.000Z",
      uncertainty: "inferred from interview notes",
      staleness: "availability older than 90 days",
    })).toEqual([
      "Source: manual",
      "Confirmed by recruiter-2",
      "Uncertain: inferred from interview notes",
      "Stale: availability older than 90 days",
    ]);
  });

  it("derives memory gaps from missing Candidate Record fields and stale contact context", () => {
    const candidateRecord = {
      canonicalFields: {
        lastContactDate: "2025-01-01",
      },
      gaps: [
        { field: "availability", label: "Availability" },
        { field: "name", label: "Name" },
      ],
    } as CandidateMemoryRecord;

    expect(deriveCandidateMemoryGaps([candidateRecord])).toEqual([
      "Missing Candidate Record field: Availability.",
      "Last contact may be stale: 2025-01-01.",
    ]);
  });
});
