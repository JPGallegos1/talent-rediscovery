import type { CandidateRecord } from "./csv-candidate-records.js";

export type CandidateMemoryRecord = CandidateRecord & {
  id?: string;
  candidateId?: string;
  provenance?: {
    sourceType: string;
    sourceReference?: {
      fileName?: string;
      rowNumber?: number;
    };
    creatorId: string | null;
    createdAt: string;
    confirmerId: string | null;
    confirmedAt: string | null;
    uncertainty: string | null;
    staleness: string | null;
  };
  possibleDuplicateCandidateRecordIds?: string[];
};

export type CandidateMemoryNote = {
  id: string;
  candidateId: string;
  content: string;
  provenance: {
    sourceType: string;
    creatorId: string | null;
    createdAt: string;
    confirmerId: string;
    confirmedAt: string;
    uncertainty: string | null;
    staleness: string | null;
  };
};

export type CandidateMemory = {
  candidateId: string;
  candidateRecords: CandidateMemoryRecord[];
  candidateNotes: CandidateMemoryNote[];
  memoryGaps: string[];
};

export type CandidateMemoryEvidence = {
  source: "Candidate Record" | "Candidate Note";
  field: string;
  label: string;
  value: string;
  matched: string;
};

export type CandidateMemoryProvenance = NonNullable<CandidateMemoryRecord["provenance"]> | CandidateMemoryNote["provenance"];

export function splitMatchEvidenceByMemorySource(evidence: CandidateMemoryEvidence[]) {
  return {
    candidateRecordEvidence: evidence.filter((item) => item.source === "Candidate Record"),
    candidateNoteEvidence: evidence.filter((item) => item.source === "Candidate Note"),
  };
}

export function formatProvenanceChips(provenance: CandidateMemoryProvenance | undefined) {
  if (!provenance) {
    return ["Provenance unavailable"];
  }

  const confirmationChip = provenance.confirmerId
    ? `Confirmed by ${provenance.confirmerId}`
    : "Not human-confirmed";
  const uncertaintyChip = provenance.uncertainty ? [`Uncertain: ${provenance.uncertainty}`] : [];
  const stalenessChip = provenance.staleness ? [`Stale: ${provenance.staleness}`] : [];

  return [
    `Source: ${provenance.sourceType}`,
    confirmationChip,
    ...uncertaintyChip,
    ...stalenessChip,
  ];
}

export function deriveCandidateMemoryGaps(candidateRecords: CandidateMemoryRecord[]) {
  const gaps = candidateRecords.flatMap((candidateRecord) => {
    const missingFieldGaps = candidateRecord.gaps
      .filter((gap) => gap.field !== "name")
      .map((gap) => `Missing Candidate Record field: ${gap.label}.`);
    const staleContactGap = isStaleLastContact(candidateRecord.canonicalFields.lastContactDate)
      ? [`Last contact may be stale: ${candidateRecord.canonicalFields.lastContactDate}.`]
      : [];

    return [...missingFieldGaps, ...staleContactGap];
  });

  return [...new Set(gaps)];
}

function isStaleLastContact(value: string) {
  const year = Number.parseInt(String(value).slice(0, 4), 10);

  return Number.isFinite(year) && year < 2026;
}
