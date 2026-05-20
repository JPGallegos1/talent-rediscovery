import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseCsvTalentPool } from "../src/csv-candidate-records.js";
import { interpretSearchCriteria } from "../src/search-criteria.js";
import { buildShortlist } from "../src/shortlist-matches.js";

describe("Shortlist matching", () => {
  it("returns evidence-grounded Matches for a Search Request", async () => {
    const sample = await readFile(new URL("../data/synthetic-candidate-records.csv", import.meta.url), "utf8");
    const talentPool = parseCsvTalentPool(sample);
    const criteria = interpretSearchCriteria("Senior React profiles with fintech experience, good English, remote Colombia");
    const shortlist = buildShortlist(talentPool.candidateRecords, criteria);

    expect(shortlist.length).toBeGreaterThan(0);
    expect(shortlist.length).toBeLessThanOrEqual(6);
    expect(shortlist[0].candidateRecord.canonicalFields.name).toBe("Lucia Vega");
    expect(shortlist[0].strength).toBe("Strong");
    expect(shortlist[0].reasons.some((reason) => reason.includes("React"))).toBe(true);
    expect(shortlist[0].evidence.some((item) => item.field === "skills" && item.value.includes("React"))).toBe(true);
    expect(shortlist[0].evidence.every((item) => item.value && item.source === "Candidate Record")).toBe(true);
    expect(shortlist[0].gaps.some((gap) => gap.includes("seniority"))).toBe(true);
    expect(shortlist[0].risks.length).toBeGreaterThan(0);
    expect(shortlist[0].suggestedNextAction).toBeTruthy();
    expect("score" in shortlist[0]).toBe(false);
    expect("percentage" in shortlist[0]).toBe(false);
    expect(shortlist.every((match) => ["Strong", "Possible", "Weak"].includes(match.strength))).toBe(true);
    expect(shortlist.every((match) => match.evidence.length > 0)).toBe(true);
    expect(shortlist.every((match) => match.gaps.length > 0)).toBe(true);
    expect(shortlist.every((match) => match.risks.length > 0)).toBe(true);
  });

  it("derives a new Shortlist for each Search Request instead of reusing a snapshot", async () => {
    const sample = await readFile(new URL("../data/synthetic-candidate-records.csv", import.meta.url), "utf8");
    const talentPool = parseCsvTalentPool(sample);
    const reactShortlist = buildShortlist(
      talentPool.candidateRecords,
      interpretSearchCriteria("Senior React profiles with fintech experience, good English, remote Colombia"),
    );
    const pythonShortlist = buildShortlist(talentPool.candidateRecords, interpretSearchCriteria("Python FastAPI fintech Colombia B2"));

    expect(pythonShortlist.map((match) => match.candidateRecord.rowNumber)).not.toEqual(
      reactShortlist.map((match) => match.candidateRecord.rowNumber),
    );
  });
});
