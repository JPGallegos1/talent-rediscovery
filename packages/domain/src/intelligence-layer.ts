import type { Match, MatchStrength } from "./shortlist-matches.js";

export const intelligenceLayerActionTypes = [
  "createSearchRequest",
  "navigateToMatch",
  "explainMatch",
  "compareMatches",
  "requestMessageDraft",
  "showCurrentCriteria",
] as const;

export type IntelligenceLayerActionType = (typeof intelligenceLayerActionTypes)[number];

export type IntelligenceLayerAction =
  | { type: "createSearchRequest"; searchRequest: string }
  | { type: "navigateToMatch"; matchId: string }
  | { type: "explainMatch"; matchId: string }
  | { type: "compareMatches"; matchIds: string[] }
  | { type: "requestMessageDraft"; matchId: string }
  | { type: "showCurrentCriteria" };

export type CompactMatchEvidence = {
  label: string;
  value: string;
  matched: string;
};

export type CompactShortlistMatchContext = {
  matchId: string;
  candidateRecordLabel: string;
  currentRole: string;
  strength: MatchStrength;
  reasons: string[];
  evidence: CompactMatchEvidence[];
  gaps: string[];
  risks: string[];
  suggestedNextAction: string;
};

export function isAllowedIntelligenceLayerActionType(actionType: string): actionType is IntelligenceLayerActionType {
  return intelligenceLayerActionTypes.includes(actionType as IntelligenceLayerActionType);
}

export function toCompactShortlistContext(matches: Match[]): CompactShortlistMatchContext[] {
  return matches.map((match) => ({
    matchId: `row-${match.candidateRecord.rowNumber}`,
    candidateRecordLabel: match.candidateRecord.canonicalFields.name || `Candidate Record ${match.candidateRecord.rowNumber}`,
    currentRole: match.candidateRecord.canonicalFields.currentRole,
    strength: match.strength,
    reasons: match.reasons,
    evidence: match.evidence.map((item) => ({
      label: item.label,
      value: item.value,
      matched: item.matched,
    })),
    gaps: match.gaps,
    risks: match.risks,
    suggestedNextAction: match.suggestedNextAction,
  }));
}
