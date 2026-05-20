import { describe, expect, it } from "vitest";
import { evaluateSerenityMemoryAction } from "../server/serenity-memory-policy.js";

describe("Serenity memory action policy", () => {
  it("allows read-only Candidate Memory actions without durable writes", () => {
    expect(evaluateSerenityMemoryAction({ action: "retrieveCandidateMemory" })).toMatchObject({
      decision: "act",
      durableWrite: false,
      requiresHumanConfirmation: false,
    });

    expect(evaluateSerenityMemoryAction({ action: "showMemoryGaps" })).toMatchObject({
      decision: "act",
      durableWrite: false,
      requiresHumanConfirmation: false,
    });

    expect(evaluateSerenityMemoryAction({ action: "navigateCandidateMemory" })).toMatchObject({
      decision: "act",
      durableWrite: false,
      requiresHumanConfirmation: false,
    });
  });

  it("requires explicit human confirmation before durable Candidate Note writes", () => {
    expect(evaluateSerenityMemoryAction({
      action: "confirmCandidateNote",
      content: "Confirmed React and fintech experience.",
      humanConfirmed: false,
    })).toMatchObject({
      decision: "confirm",
      durableWrite: true,
      requiresHumanConfirmation: true,
    });

    expect(evaluateSerenityMemoryAction({
      action: "confirmCandidateNote",
      content: "Confirmed React and fintech experience.",
      humanConfirmed: true,
    })).toMatchObject({
      decision: "act",
      durableWrite: true,
      requiresHumanConfirmation: true,
    });
  });

  it("refuses external, high-risk, sensitive, or recruiting-irrelevant memory actions", () => {
    for (const action of ["sendMessage", "contactCandidate", "autoMergeCandidates", "deleteMemory", "memoryServiceDirectSupabaseAccess"] as const) {
      expect(evaluateSerenityMemoryAction({ action })).toMatchObject({
        decision: "refuse",
        durableWrite: false,
      });
    }

    expect(evaluateSerenityMemoryAction({
      action: "proposeCandidateNote",
      content: "Candidate mentioned family health details unrelated to the role.",
      sourceType: "manual",
    })).toMatchObject({
      decision: "refuse",
      durableWrite: false,
      requiresHumanConfirmation: false,
    });
  });

  it("allows non-durable Candidate Note proposals while preserving proposal origin", () => {
    expect(evaluateSerenityMemoryAction({
      action: "proposeCandidateNote",
      content: "Candidate prefers remote fintech roles.",
      sourceType: "inferred",
    })).toMatchObject({
      decision: "act",
      durableWrite: false,
      requiresHumanConfirmation: false,
      memoryOrigin: "inferred",
    });

    expect(evaluateSerenityMemoryAction({
      action: "confirmCandidateNote",
      content: "Candidate prefers remote fintech roles.",
      sourceType: "inferred",
      humanConfirmed: true,
    })).toMatchObject({
      decision: "act",
      durableWrite: true,
      requiresHumanConfirmation: true,
      memoryOrigin: "inferred",
    });
  });

  it("keeps Serenity memory actions separate from Intelligence Layer interaction actions", () => {
    for (const action of ["createSearchRequest", "explainMatch", "compareMatches", "requestMessageDraft"] as const) {
      expect(evaluateSerenityMemoryAction({ action })).toMatchObject({
        decision: "refuse",
        durableWrite: false,
        reason: "Unsupported Serenity memory action.",
      });
    }
  });
});
