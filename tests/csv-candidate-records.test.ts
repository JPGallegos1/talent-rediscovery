import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseCsvTalentPool } from "../src/csv-candidate-records.js";

describe("CSV Talent Pool parsing", () => {
  it("parses the synthetic Talent Pool File into normalized Candidate Records", async () => {
    const sample = await readFile(new URL("../data/synthetic-candidate-records.csv", import.meta.url), "utf8");
    const parsedSample = parseCsvTalentPool(sample);

    expect(parsedSample.candidateRecords).toHaveLength(14);
    expect(parsedSample.candidateRecords[0].canonicalFields.name).toBe("Sofia Ramos");
    expect(parsedSample.candidateRecords[0].canonicalFields.skills.terms.slice(0, 2)).toEqual(["Python", "FastAPI"]);
    expect(parsedSample.candidateRecords[0].canonicalFields.skills.normalizedTerms.slice(0, 2)).toEqual(["python", "fastapi"]);
    expect(parsedSample.candidateRecords[2].canonicalFields.location).toBe("Remote - Colombia");
    expect(parsedSample.candidateRecords[7].canonicalFields.englishLevel).toBe("");
    expect(parsedSample.candidateRecords[7].sourceFields.english_level).toBe("");
    expect(parsedSample.candidateRecords[7].gaps).toEqual([
      { field: "yearsExperience", label: "Years experience" },
      { field: "englishLevel", label: "English level" },
      { field: "salaryExpectationUsd", label: "Salary expectation" },
    ]);
    expect(parsedSample.candidateRecords[7].canonicalFields.lastContactDate).toBe("2023-08-21");
  });

  it("keeps sparse source fields and exposes normalization gaps", () => {
    const sparse = parseCsvTalentPool("name,skills,notes\nAna,\"React; Node\",\"Missing most canonical fields\"\n");

    expect(sparse.candidateRecords[0].canonicalFields.currentRole).toBe("");
    expect(sparse.candidateRecords[0].canonicalFields.skills).toEqual({
      raw: "React; Node",
      terms: ["React", "Node"],
      normalizedTerms: ["react", "nodejs"],
    });
    expect(sparse.candidateRecords[0].gaps.some((gap) => gap.field === "currentRole")).toBe(true);
  });

  it("normalizes recruiter-specific CSV column variants", () => {
    const recruiterVariants = parseCsvTalentPool(
      [
        "Contact Name,Position,Tech Stack,Yrs Exp,Region,English Proficiency,Vertical,Notice,Last Reached Out,Recruiter Notes,Portfolio URL",
        "Bea Lopez,Platform Engineer,\"Node.js, JS, TS, Postgres\",6,Remote LATAM,B2,Fintech,Unknown,Unknown,Has old payments notes,https://example.test/bea",
      ].join("\n"),
    );
    const variantRecord = recruiterVariants.candidateRecords[0];

    expect(variantRecord.canonicalFields.name).toBe("Bea Lopez");
    expect(variantRecord.canonicalFields.currentRole).toBe("Platform Engineer");
    expect(variantRecord.canonicalFields.skills.terms).toEqual(["Node.js", "JS", "TS", "Postgres"]);
    expect(variantRecord.canonicalFields.skills.normalizedTerms).toEqual(["nodejs", "javascript", "typescript", "postgresql"]);
    expect(variantRecord.canonicalFields.lastContactDate).toBe("Unknown");
    expect(variantRecord.sourceFields["Portfolio URL"]).toBe("https://example.test/bea");
    expect(variantRecord.sourceFieldMappings.name).toBe("Contact Name");
    expect(variantRecord.searchTerms).toContain("nodejs");
    expect(variantRecord.searchTerms).toContain("javascript");
    expect(variantRecord.searchTerms).toContain("portfolio");
  });

  it("rejects invalid or empty Talent Pool Files", () => {
    expect(() => parseCsvTalentPool("name,notes\nAna,\"unterminated")).toThrow(/unclosed quoted value/);
    expect(() => parseCsvTalentPool("name,skills\n")).toThrow(/no Candidate Records/);
  });
});
