import assert from "node:assert/strict";
import type { UIMessage } from "ai";
import { useAppStore } from "../src/app-store.js";
import { parseCsvTalentPool } from "../src/csv-candidate-records.js";
import { interpretSearchCriteria } from "../src/search-criteria.js";
import { buildShortlist } from "../src/shortlist-matches.js";

function resetStore() {
  useAppStore.setState(useAppStore.getInitialState(), true);
}

function currentState() {
  return useAppStore.getState();
}

const csv = `Name,Current Role,Skills,Location,English Level,Availability
Ada Lovelace,Senior React Engineer,"React, TypeScript, fintech",Remote,Advanced,Available
Grace Hopper,Backend Engineer,"Node.js, distributed systems",New York,Advanced,Unknown`;

resetStore();

const { candidateRecords } = parseCsvTalentPool(csv);
const criteria = interpretSearchCriteria("Senior React profiles with fintech experience and advanced English");
const shortlist = buildShortlist(candidateRecords, criteria);
const messages: UIMessage[] = [
  {
    id: "msg-1",
    role: "user",
    parts: [{ type: "text", text: "Find senior React profiles with fintech experience" }],
  },
];

currentState().loadTalentPool({ talentPoolFileName: "talent-pool.csv", candidateRecords });
currentState().applySearchRequest({
  searchRequest: "Senior React profiles with fintech experience and advanced English",
  searchCriteria: criteria,
  shortlist,
});
currentState().setCopilotMessages(messages);
currentState().setCopilotInput("Compare the first two Matches");
currentState().setCopilotError({ kind: "offline", message: "Copilot is unreachable." });
currentState().selectMatch("row-1");
currentState().setMessageDraft("row-1", "Hi Ada, I am reconnecting about a React role.");
currentState().setComparisonReport({
  searchRequest: currentState().searchRequest,
  comparedMatchIds: ["row-1", "row-2"],
  sharedEvidence: ["English level: Advanced"],
  matches: shortlist.slice(0, 2).map((match) => ({
    matchId: `row-${match.candidateRecord.rowNumber}`,
    candidateRecordLabel: match.candidateRecord.canonicalFields.name || `Candidate Record ${match.candidateRecord.rowNumber}`,
    currentRole: match.candidateRecord.canonicalFields.currentRole,
    strength: match.strength,
    reasons: match.reasons,
    evidence: match.evidence.map((item) => ({ label: item.label, value: item.value, matched: item.matched })),
    gaps: match.gaps,
    risks: match.risks,
    suggestedNextAction: match.suggestedNextAction,
    differentiators: match.evidence.map((item) => `${item.label}: ${item.matched}`),
  })),
});

assert.equal(currentState().talentPoolFileName, "talent-pool.csv");
assert.equal(currentState().candidateRecords.length, 2);
assert.equal(currentState().searchRequest, "Senior React profiles with fintech experience and advanced English");
assert.equal(currentState().searchCriteria, criteria);
assert.equal(currentState().shortlist, shortlist);
assert.deepEqual(currentState().copilotMessages, messages);
assert.equal(currentState().copilotInput, "Compare the first two Matches");
assert.equal(currentState().copilotError?.kind, "offline");
assert.equal(currentState().selectedMatchId, "row-1");
assert.equal(currentState().messageDraftsByMatchId["row-1"], "Hi Ada, I am reconnecting about a React role.");
assert.deepEqual(currentState().comparisonReport?.comparedMatchIds, ["row-1", "row-2"]);

currentState().selectMatch(null);

assert.equal(currentState().selectedMatchId, null);
assert.equal(currentState().candidateRecords.length, 2);
assert.equal(currentState().shortlist.length, shortlist.length);
assert.deepEqual(currentState().copilotMessages, messages);
assert.equal(currentState().messageDraftsByMatchId["row-1"], "Hi Ada, I am reconnecting about a React role.");
assert.deepEqual(currentState().comparisonReport?.comparedMatchIds, ["row-1", "row-2"]);

currentState().applySearchRequest({
  searchRequest: "Backend profiles with distributed systems experience",
  searchCriteria: interpretSearchCriteria("Backend profiles with distributed systems experience"),
  shortlist: buildShortlist(candidateRecords, interpretSearchCriteria("Backend profiles with distributed systems experience")),
});

assert.deepEqual(currentState().messageDraftsByMatchId, {});
assert.equal(currentState().comparisonReport, null);

resetStore();

assert.equal(currentState().talentPoolFileName, null);
assert.equal(currentState().candidateRecords.length, 0);
assert.equal(currentState().searchRequest, "");
assert.equal(currentState().searchCriteria, null);
assert.equal(currentState().shortlist.length, 0);
assert.deepEqual(currentState().copilotMessages, []);
assert.equal(currentState().copilotInput, "");
assert.equal(currentState().copilotError, null);
assert.equal(currentState().selectedMatchId, null);
assert.deepEqual(currentState().messageDraftsByMatchId, {});
assert.equal(currentState().comparisonReport, null);

console.log("App store session state checks passed.");
