export const intelligenceLayerActionTypes = [
  "createSearchRequest",
  "navigateToMatch",
  "explainMatch",
  "compareMatches",
  "requestMessageDraft",
  "showCurrentCriteria",
];

export function isAllowedIntelligenceLayerActionType(actionType) {
  return intelligenceLayerActionTypes.includes(actionType);
}

export function toCompactShortlistContext(matches) {
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
