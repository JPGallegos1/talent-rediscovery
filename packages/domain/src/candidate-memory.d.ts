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

export function splitMatchEvidenceByMemorySource(evidence: CandidateMemoryEvidence[]): {
  candidateRecordEvidence: CandidateMemoryEvidence[];
  candidateNoteEvidence: CandidateMemoryEvidence[];
};

export function formatProvenanceChips(provenance: CandidateMemoryProvenance | undefined): string[];

export function deriveCandidateMemoryGaps(candidateRecords: CandidateMemoryRecord[]): string[];
