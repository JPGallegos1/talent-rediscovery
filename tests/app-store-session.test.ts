import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { useAppStore } from "../apps/admin/src/app-store.js";
import { parseCsvTalentPool } from "@recollect/domain/csv-candidate-records.js";
import { interpretSearchCriteria } from "@recollect/domain/search-criteria.js";
import { buildShortlist } from "@recollect/domain/shortlist-matches.js";

function resetStore() {
  useAppStore.setState(useAppStore.getInitialState(), true);
}

function currentState() {
  return useAppStore.getState();
}

describe("browser-memory session state", () => {
  it("preserves current demo state and clears derived artifacts at the right boundaries", () => {
    const csv = `Name,Current Role,Skills,Location,English Level,Availability
Ada Lovelace,Senior React Engineer,"React, TypeScript, fintech",Remote,Advanced,Available
Grace Hopper,Backend Engineer,"Node.js, distributed systems",New York,Advanced,Unknown`;
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

    resetStore();

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

    expect(currentState().talentPoolFileName).toBe("talent-pool.csv");
    expect(currentState().candidateRecords).toHaveLength(2);
    expect(currentState().searchRequest).toBe("Senior React profiles with fintech experience and advanced English");
    expect(currentState().searchCriteria).toBe(criteria);
    expect(currentState().shortlist).toBe(shortlist);
    expect(currentState().copilotMessages).toEqual(messages);
    expect(currentState().copilotInput).toBe("Compare the first two Matches");
    expect(currentState().copilotError?.kind).toBe("offline");
    expect(currentState().selectedMatchId).toBe("row-1");
    expect(currentState().messageDraftsByMatchId["row-1"]).toBe("Hi Ada, I am reconnecting about a React role.");
    expect(currentState().comparisonReport?.comparedMatchIds).toEqual(["row-1", "row-2"]);

    currentState().selectMatch(null);

    expect(currentState().selectedMatchId).toBeNull();
    expect(currentState().candidateRecords).toHaveLength(2);
    expect(currentState().shortlist).toHaveLength(shortlist.length);
    expect(currentState().copilotMessages).toEqual(messages);
    expect(currentState().messageDraftsByMatchId["row-1"]).toBe("Hi Ada, I am reconnecting about a React role.");
    expect(currentState().comparisonReport?.comparedMatchIds).toEqual(["row-1", "row-2"]);

    const backendCriteria = interpretSearchCriteria("Backend profiles with distributed systems experience");
    currentState().applySearchRequest({
      searchRequest: "Backend profiles with distributed systems experience",
      searchCriteria: backendCriteria,
      shortlist: buildShortlist(candidateRecords, backendCriteria),
    });

    expect(currentState().messageDraftsByMatchId).toEqual({});
    expect(currentState().comparisonReport).toBeNull();

    resetStore();

    expect(currentState().talentPoolFileName).toBeNull();
    expect(currentState().candidateRecords).toHaveLength(0);
    expect(currentState().searchRequest).toBe("");
    expect(currentState().searchCriteria).toBeNull();
    expect(currentState().shortlist).toHaveLength(0);
    expect(currentState().copilotMessages).toEqual([]);
    expect(currentState().copilotInput).toBe("");
    expect(currentState().copilotError).toBeNull();
    expect(currentState().selectedMatchId).toBeNull();
    expect(currentState().messageDraftsByMatchId).toEqual({});
    expect(currentState().comparisonReport).toBeNull();
  });
});
