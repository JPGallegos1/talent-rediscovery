import { describe, expect, it } from "vitest";
import { canDraftMessageFromSuggestedNextAction, draftMessageFromMatch } from "@recollect/domain/message-draft.js";
import type { Match } from "@recollect/domain/shortlist-matches.js";

const match = {
  candidateRecord: {
    canonicalFields: {
      name: "Ana Torres",
      currentRole: "Senior React Engineer",
      skills: { terms: ["React", "TypeScript"] },
      industries: ["fintech"],
      location: "Colombia",
      englishLevel: "Advanced English",
    },
  },
  searchRequest: "Senior React profile with fintech experience and good English",
  suggestedNextAction: "Recontact this Candidate to validate availability.",
} as Match & { searchRequest: string };

describe("editable message drafts", () => {
  it("only drafts messages for contact-oriented Suggested Next Actions", () => {
    expect(canDraftMessageFromSuggestedNextAction(match.suggestedNextAction)).toBe(true);
    expect(canDraftMessageFromSuggestedNextAction("Save for later")).toBe(false);
  });

  it("creates an editable draft grounded in the Match", () => {
    const draft = draftMessageFromMatch(match);

    expect(draft).toMatch(/Ana Torres/);
    expect(draft).toMatch(/Senior React Engineer/);
    expect(draft).toMatch(/React, TypeScript/);
    expect(draft).toMatch(/Senior React profile with fintech experience and good English/);
    expect(draft).toMatch(/validate your current interest, availability, and fit/);
  });

  it("refuses drafts for skip-oriented Matches", () => {
    expect(() => draftMessageFromMatch({ ...match, suggestedNextAction: "Skip this Match." })).toThrow(/only available for contact or recontact/);
  });
});
