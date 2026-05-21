import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseCsvTalentPool } from "@recollect/domain/csv-candidate-records.js";
import { interpretSearchCriteria } from "@recollect/domain/search-criteria.js";
import { buildShortlist } from "@recollect/domain/shortlist-matches.js";

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

  it("enriches Matches with confirmed Candidate Note evidence only", () => {
    const talentPool = parseCsvTalentPool([
      "Name,Current Role,Skills,Location,English Level",
      "Ada Lovelace,Senior React Engineer,React,Remote,Advanced",
    ].join("\n"));
    const candidateRecord = { ...talentPool.candidateRecords[0], candidateId: "candidate_1" };
    const shortlist = buildShortlist(
      [candidateRecord],
      interpretSearchCriteria("Senior React profiles with fintech experience and advanced English"),
      {
        candidateNotes: [
          {
            id: "candidate_note_1",
            candidateId: "candidate_1",
            content: "Recruiter confirmed fintech marketplace experience and preference for remote roles.",
            confirmed: true,
          },
          {
            id: "candidate_note_proposal_1",
            candidateId: "candidate_1",
            content: "Unconfirmed proposal says banking experience.",
            confirmed: false,
          },
        ],
      },
    );

    expect(shortlist).toHaveLength(1);
    expect(shortlist[0].evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "Candidate Note",
          field: "candidateNote",
          label: "Candidate Note",
          value: "Recruiter confirmed fintech marketplace experience and preference for remote roles.",
          matched: "Matched requested industry: fintech",
        }),
      ]),
    );
    expect(shortlist[0].evidence.some((item) => item.value.includes("Unconfirmed proposal"))).toBe(false);
    expect(shortlist[0].reasons.some((reason) => reason.includes("Candidate Note confirms fintech"))).toBe(true);
  });
});
