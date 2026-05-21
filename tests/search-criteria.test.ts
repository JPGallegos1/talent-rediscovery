import { describe, expect, it } from "vitest";
import { interpretSearchCriteria } from "@recollect/domain/search-criteria.js";

describe("Search Criteria interpretation", () => {
  it("extracts transparent criteria from a natural-language Search Request", () => {
    const criteria = interpretSearchCriteria(
      "Senior React profiles with fintech experience, good English, remote Colombia, available in 2 weeks",
    );

    expect(criteria).toEqual({
      skills: ["React"],
      seniority: "Senior or Lead",
      industry: ["fintech"],
      location: ["remote", "colombia"],
      languageLevel: "Good English",
      availability: "2 weeks",
    });
  });

  it("extracts backend, industry, and language criteria", () => {
    const criteria = interpretSearchCriteria("Python and FastAPI for banking with advanced English");

    expect(criteria?.skills).toEqual(["Python", "FastAPI"]);
    expect(criteria?.industry).toEqual(["banking"]);
    expect(criteria?.languageLevel).toBe("Advanced English");
  });

  it("keeps empty or unknown interpretation transparent", () => {
    expect(interpretSearchCriteria("   ")).toBeNull();
    expect(interpretSearchCriteria("Someone curious and adaptable")).toEqual({});
  });
});
