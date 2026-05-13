import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { parseCsvTalentPool } from "../src/csv-candidate-records.js";
import { interpretSearchCriteria } from "../src/search-criteria.js";
import { buildShortlist } from "../src/shortlist-matches.js";

const sample = await readFile(new URL("../data/synthetic-candidate-records.csv", import.meta.url), "utf8");
const talentPool = parseCsvTalentPool(sample);
const searchRequest = "Senior React profiles with fintech experience, good English, remote Colombia";
const criteria = interpretSearchCriteria(searchRequest);
const shortlist = buildShortlist(talentPool.candidateRecords, criteria);

assert(shortlist.length > 0, "a Search Request should return a useful Shortlist");
assert(shortlist.length <= 6, "the prototype should return a focused Shortlist, not persist every Match");
assert.equal(shortlist[0].candidateRecord.canonicalFields.name, "Lucia Vega");
assert.equal(shortlist[0].strength, "Strong");
assert(shortlist[0].reasons.some((reason) => reason.includes("React")));
assert(shortlist[0].evidence.some((item) => item.field === "skills" && item.value.includes("React")));
assert(shortlist[0].evidence.every((item) => item.value && item.source === "Candidate Record"));
assert(shortlist[0].gaps.some((gap) => gap.includes("seniority")), "seniority uncertainty should be surfaced as a gap");
assert(shortlist[0].risks.length > 0, "validation points should be present on each Match");
assert(shortlist[0].suggestedNextAction, "each Match needs one Suggested Next Action");
assert(!("score" in shortlist[0]), "Matches should not expose numeric score fields");
assert(!("percentage" in shortlist[0]), "Matches should not expose percentage-style Match scores");
assert(shortlist.every((match) => ["Strong", "Possible", "Weak"].includes(match.strength)));
assert(shortlist.every((match) => match.evidence.length > 0), "every Match must be grounded in Candidate Record evidence");
assert(shortlist.every((match) => match.gaps.length > 0), "every Match should show gaps or missing information");
assert(shortlist.every((match) => match.risks.length > 0), "every Match should show risks or validation points");

const updatedShortlist = buildShortlist(talentPool.candidateRecords, interpretSearchCriteria("Python FastAPI fintech Colombia B2"));
assert.notDeepEqual(
  updatedShortlist.map((match) => match.candidateRecord.rowNumber),
  shortlist.map((match) => match.candidateRecord.rowNumber),
  "Shortlists should be derived per Search Request instead of reused as a persisted snapshot",
);

console.log("Shortlist Match checks passed.");
