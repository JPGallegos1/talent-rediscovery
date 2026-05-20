import { describe, expect, it } from "vitest";
import { createSearchRequestFailureOutput } from "../src/copilot-tool-output.js";

describe("Copilot tool output", () => {
  it("returns a tool result when Search Request persistence fails", () => {
    expect(createSearchRequestFailureOutput(new Error("Search Request API unavailable"))).toEqual({
      applied: false,
      error: {
        category: "server_error",
        message: "Search Request API unavailable",
      },
      guidance: "Retry the Search Request. The current Talent Pool and Shortlist were not changed.",
    });
  });
});
