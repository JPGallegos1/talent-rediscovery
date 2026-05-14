import { tool, type ToolSet } from "ai";
import { z } from "zod";

export const intelligenceActionTools = {
  createSearchRequest: tool({
    description: "Create a new Search Request from the recruiter's intent. Use this when the recruiter describes the profile they need.",
    parameters: z.object({
      searchRequest: z.string().describe("The Search Request text describing the desired candidate profile."),
    }),
  }),
  navigateToMatch: tool({
    description: "Navigate to a specific Match's detail view. Use this when the recruiter asks to see a Match in detail.",
    parameters: z.object({
      matchId: z.string().describe("The matchId of the Match to navigate to (e.g. 'row-2')."),
    }),
  }),
  explainMatch: tool({
    description: "Explain why a specific Candidate Record was matched, showing reasons, evidence, gaps, and risks.",
    parameters: z.object({
      matchId: z.string().describe("The matchId of the Match to explain."),
    }),
  }),
  compareMatches: tool({
    description: "Compare two or more Matches side by side, highlighting differences in strengths, gaps, and risks.",
    parameters: z.object({
      matchIds: z.array(z.string()).describe("The matchIds of the Matches to compare (2 or more)."),
    }),
  }),
  requestMessageDraft: tool({
    description: "Generate an editable message draft for a Match. Only use when the Suggested Next Action is contact or recontact.",
    parameters: z.object({
      matchId: z.string().describe("The matchId of the Match to draft a message for."),
    }),
  }),
  showCurrentCriteria: tool({
    description: "Display the currently interpreted Search Criteria for transparency. Use when the recruiter asks what criteria were extracted.",
    parameters: z.object({}),
  }),
} satisfies ToolSet;

export function buildSystemPrompt(context: {
  searchRequest: string | null;
  searchCriteria: Record<string, unknown> | null;
  shortlist: unknown[];
  candidateRecordCount: number;
  talentPoolFileName: string | null;
  selectedMatchId: string | null;
}): string {
  const criteriaText = context.searchCriteria
    ? Object.entries(context.searchCriteria)
        .map(([key, value]) => `  ${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
        .join("\n")
    : "  No Search Criteria interpreted yet.";

  const shortlistText =
    context.shortlist.length > 0
      ? context.shortlist
          .map((m: any, i: number) => {
            return `  Match ${i + 1}: ${m.candidateRecordLabel} (${m.strength})
    Role: ${m.currentRole || "Not provided"}
    Reasons: ${m.reasons.slice(0, 3).join("; ")}
    Gaps: ${m.gaps.slice(0, 2).join("; ") || "None"}
    Risks: ${m.risks.slice(0, 2).join("; ") || "None"}
    Suggested Next Action: ${m.suggestedNextAction}`;
          })
          .join("\n")
      : "  No Shortlist yet. The recruiter must explicitly run a Search Request to create one.";

  return `You are the Talent Rediscovery Copilot — a constrained Intelligence Layer for recruiters.

Your purpose is to help recruiters rediscover candidates already in their Talent Pool. You do NOT source externally, edit Candidate Records, send messages, or execute actions outside the allowed tool set.

## Current session context

- Talent Pool: ${context.talentPoolFileName || "Not loaded"}
- Candidate Records loaded: ${context.candidateRecordCount}
- Current Search Request: ${context.searchRequest || "None"}
- Selected Match: ${context.selectedMatchId || "None"}

## Interpreted Search Criteria

${criteriaText}

## Current Shortlist

${shortlistText}

## Allowed actions

You may ONLY use these tools:
1. createSearchRequest — propose and execute a new Search Request
2. navigateToMatch — open a Match detail view
3. explainMatch — explain a Match with evidence
4. compareMatches — compare multiple Matches
5. requestMessageDraft — generate an editable message draft
6. showCurrentCriteria — show the interpreted Search Criteria

## Constraints

- You CANNOT modify Candidate Records.
- You CANNOT edit Search Criteria manually.
- You CANNOT send messages or outreach.
- You CANNOT persist Talent Pools or Shortlists.
- You CANNOT import external data.
- You MUST NOT introduce candidate information that is not grounded in the provided Shortlist context.
- Match strength is qualitative: Strong, Possible, or Weak. Never use percentages.
- Always use domain-correct language: "Talent Pool", "Candidate Record", "Search Request", "Match", "Shortlist", "Suggested Next Action".`;
}

export function getIntelligenceLayerPrompt(): string {
  return intelligenceLayerPrompt;
}
