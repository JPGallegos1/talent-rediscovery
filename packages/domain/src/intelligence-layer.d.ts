import type { Match, MatchStrength } from "./shortlist-matches.js";

export const intelligenceLayerActionTypes: readonly [
  "createSearchRequest",
  "navigateToMatch",
  "explainMatch",
  "compareMatches",
  "requestMessageDraft",
  "showCurrentCriteria",
];

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

export function isAllowedIntelligenceLayerActionType(actionType: string): actionType is IntelligenceLayerActionType;

export function toCompactShortlistContext(matches: Match[]): CompactShortlistMatchContext[];
