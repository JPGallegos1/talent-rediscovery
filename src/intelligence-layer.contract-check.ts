import {
  intelligenceLayerActionTypes,
  isAllowedIntelligenceLayerActionType,
  type CompactShortlistMatchContext,
  type IntelligenceLayerAction,
} from "./intelligence-layer.js";

const allowedActions: IntelligenceLayerAction[] = [
  { type: "createSearchRequest", searchRequest: "Senior React profiles with fintech experience" },
  { type: "navigateToMatch", matchId: "row-2" },
  { type: "explainMatch", matchId: "row-2" },
  { type: "compareMatches", matchIds: ["row-2", "row-7"] },
  { type: "requestMessageDraft", matchId: "row-2" },
  { type: "showCurrentCriteria" },
];

const actionTypes = intelligenceLayerActionTypes satisfies readonly [
  "createSearchRequest",
  "navigateToMatch",
  "explainMatch",
  "compareMatches",
  "requestMessageDraft",
  "showCurrentCriteria",
];

const compactContext = [
  {
    matchId: "row-2",
    candidateRecordLabel: "Candidate Record 2",
    currentRole: "Senior Frontend Engineer",
    strength: "Strong",
    reasons: ["Candidate Record shows React evidence."],
    evidence: [{ label: "Skills", value: "React, TypeScript", matched: "Matched requested skill: React" }],
    gaps: ["No obvious missing requested criteria; still validate details with the Candidate."],
    risks: ["Validate current interest and availability before recontacting this Candidate."],
    suggestedNextAction: "Prepare a recontact message grounded in the listed evidence.",
  },
] satisfies CompactShortlistMatchContext[];

// @ts-expect-error Prohibited external action execution is intentionally absent from the contract.
const sendMessageAction: IntelligenceLayerAction = { type: "sendMessage", matchId: "row-2" };

// @ts-expect-error Manual Search Criteria editing is intentionally absent from the contract.
const editCriteriaAction: IntelligenceLayerAction = { type: "editSearchCriteria", skills: ["React"] };

// @ts-expect-error Candidate Record mutation is intentionally absent from the contract.
const editCandidateRecordAction: IntelligenceLayerAction = { type: "editCandidateRecord", rowNumber: 2 };

if (allowedActions.length !== actionTypes.length || compactContext.length !== 1 || isAllowedIntelligenceLayerActionType("sendMessage")) {
  throw new Error("Intelligence Layer contract check failed.");
}
