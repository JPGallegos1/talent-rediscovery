import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { parseCsvTalentPool } from "../src/csv-candidate-records.js";

const sample = await readFile(new URL("../data/synthetic-candidate-records.csv", import.meta.url), "utf8");
const parsedSample = parseCsvTalentPool(sample);

assert.equal(parsedSample.candidateRecords.length, 14, "synthetic Talent Pool File should parse all records");
assert.equal(parsedSample.candidateRecords[0].name, "Sofia Ramos");
assert.deepEqual(parsedSample.candidateRecords[0].skills.slice(0, 2), ["Python", "FastAPI"]);
assert.equal(parsedSample.candidateRecords[2].location, "Remote - Colombia");
assert.equal(parsedSample.candidateRecords[7].englishLevel, "", "missing fields should become empty values");
assert.equal(parsedSample.candidateRecords[7].sourceFields.english_level, "");

const sparse = parseCsvTalentPool("name,skills,notes\nAna,\"React; Node\",\"Missing most canonical fields\"\n");
assert.equal(sparse.candidateRecords[0].currentRole, "");
assert.deepEqual(sparse.candidateRecords[0].skills, ["React", "Node"]);

assert.throws(
  () => parseCsvTalentPool("name,notes\nAna,\"unterminated"),
  /unclosed quoted value/,
  "invalid CSV quoting should produce a clear parser error",
);

assert.throws(
  () => parseCsvTalentPool("name,skills\n"),
  /no Candidate Records/,
  "header-only files should be rejected",
);

console.log("CSV parser checks passed.");
