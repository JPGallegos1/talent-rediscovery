import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { parseCsvTalentPool } from "../src/csv-candidate-records.js";

const sample = await readFile(new URL("../data/synthetic-candidate-records.csv", import.meta.url), "utf8");
const parsedSample = parseCsvTalentPool(sample);

assert.equal(parsedSample.candidateRecords.length, 14, "synthetic Talent Pool File should parse all records");
assert.equal(parsedSample.candidateRecords[0].canonicalFields.name, "Sofia Ramos");
assert.deepEqual(parsedSample.candidateRecords[0].canonicalFields.skills.terms.slice(0, 2), ["Python", "FastAPI"]);
assert.deepEqual(parsedSample.candidateRecords[0].canonicalFields.skills.normalizedTerms.slice(0, 2), ["python", "fastapi"]);
assert.equal(parsedSample.candidateRecords[2].canonicalFields.location, "Remote - Colombia");
assert.equal(parsedSample.candidateRecords[7].canonicalFields.englishLevel, "", "missing fields should become empty values");
assert.equal(parsedSample.candidateRecords[7].sourceFields.english_level, "");
assert.deepEqual(parsedSample.candidateRecords[7].gaps, [
  { field: "yearsExperience", label: "Years experience" },
  { field: "englishLevel", label: "English level" },
  { field: "salaryExpectationUsd", label: "Salary expectation" },
]);
assert.equal(
  parsedSample.candidateRecords[7].canonicalFields.lastContactDate,
  "2023-08-21",
  "stale last contact information should be preserved",
);

const sparse = parseCsvTalentPool("name,skills,notes\nAna,\"React; Node\",\"Missing most canonical fields\"\n");
assert.equal(sparse.candidateRecords[0].canonicalFields.currentRole, "");
assert.deepEqual(sparse.candidateRecords[0].canonicalFields.skills, {
  raw: "React; Node",
  terms: ["React", "Node"],
  normalizedTerms: ["react", "nodejs"],
});
assert(sparse.candidateRecords[0].gaps.some((gap) => gap.field === "currentRole"));

const recruiterVariants = parseCsvTalentPool(
  [
    "Contact Name,Position,Tech Stack,Yrs Exp,Region,English Proficiency,Vertical,Notice,Last Reached Out,Recruiter Notes,Portfolio URL",
    "Bea Lopez,Platform Engineer,\"Node.js, JS, TS, Postgres\",6,Remote LATAM,B2,Fintech,Unknown,Unknown,Has old payments notes,https://example.test/bea",
  ].join("\n"),
);
const variantRecord = recruiterVariants.candidateRecords[0];
assert.equal(variantRecord.canonicalFields.name, "Bea Lopez");
assert.equal(variantRecord.canonicalFields.currentRole, "Platform Engineer");
assert.deepEqual(variantRecord.canonicalFields.skills.terms, ["Node.js", "JS", "TS", "Postgres"]);
assert.deepEqual(variantRecord.canonicalFields.skills.normalizedTerms, ["nodejs", "javascript", "typescript", "postgresql"]);
assert.equal(variantRecord.canonicalFields.lastContactDate, "Unknown");
assert.equal(variantRecord.sourceFields["Portfolio URL"], "https://example.test/bea");
assert.equal(variantRecord.sourceFieldMappings.name, "Contact Name");
assert(variantRecord.searchTerms.includes("nodejs"));
assert(variantRecord.searchTerms.includes("javascript"), "JS aliases should support basic inconsistent skill search");
assert(variantRecord.searchTerms.includes("portfolio"));

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
