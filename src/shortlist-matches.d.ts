import type { CandidateRecord } from "./csv-candidate-records.js";
import type { SearchCriteria } from "./search-criteria.js";

export type MatchStrength = "Strong" | "Possible" | "Weak";

export type MatchEvidence = {
  source: "Candidate Record" | "Candidate Note";
  field: string;
  label: string;
  value: string;
  matched: string;
};

export type MatchCandidateNote = {
  id: string;
  candidateId: string;
  content: string;
  confirmed?: boolean;
  durable?: boolean;
};

export type Match = {
  candidateRecord: CandidateRecord;
  strength: MatchStrength;
  reasons: string[];
  evidence: MatchEvidence[];
  gaps: string[];
  risks: string[];
  suggestedNextAction: string;
};

export function buildShortlist(
  candidateRecords: CandidateRecord[],
  searchCriteria: SearchCriteria | null,
  options?: { limit?: number; candidateNotes?: MatchCandidateNote[] },
): Match[];
