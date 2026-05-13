import assert from "node:assert/strict";

import { interpretSearchCriteria } from "../src/search-criteria.js";

const fintechReact = interpretSearchCriteria(
  "Senior React profiles with fintech experience, good English, remote Colombia, available in 2 weeks",
);

assert.deepEqual(fintechReact.skills, ["React"]);
assert.equal(fintechReact.seniority, "Senior or Lead");
assert.deepEqual(fintechReact.industry, ["fintech"]);
assert.deepEqual(fintechReact.location, ["remote", "colombia"]);
assert.equal(fintechReact.languageLevel, "Good English");
assert.equal(fintechReact.availability, "2 weeks");

const backend = interpretSearchCriteria("Python and FastAPI for banking with advanced English");
assert.deepEqual(backend.skills, ["Python", "FastAPI"]);
assert.deepEqual(backend.industry, ["banking"]);
assert.equal(backend.languageLevel, "Advanced English");

assert.equal(interpretSearchCriteria("   "), null, "empty Search Requests should not produce Search Criteria");
assert.deepEqual(
  interpretSearchCriteria("Someone curious and adaptable"),
  {},
  "unknown criteria should return an empty transparent extraction",
);

console.log("Search Criteria checks passed.");
