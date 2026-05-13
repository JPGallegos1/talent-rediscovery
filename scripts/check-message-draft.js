import assert from "node:assert/strict";

import { canDraftMessageFromSuggestedNextAction, draftMessageFromMatch } from "../src/message-draft.js";

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
};

assert.equal(canDraftMessageFromSuggestedNextAction(match.suggestedNextAction), true);
assert.equal(canDraftMessageFromSuggestedNextAction("Save for later"), false);

const draft = draftMessageFromMatch(match);

assert.match(draft, /Ana Torres/);
assert.match(draft, /Senior React Engineer/);
assert.match(draft, /React, TypeScript/);
assert.match(draft, /Senior React profile with fintech experience and good English/);
assert.match(draft, /validate your current interest, availability, and fit/);

assert.throws(
  () => draftMessageFromMatch({ ...match, suggestedNextAction: "Skip this Match." }),
  /only available for contact or recontact/,
);
