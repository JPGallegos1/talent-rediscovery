import { tool, type ToolSet } from "ai";
import { z } from "zod";

export const intelligenceActionTools = {
  createSearchRequest: tool({
    description: "Create a Search Request from the recruiter's intent. Use this when the recruiter describes the profile they need so the client can evaluate Candidate Records and show a Shortlist when Matches exist.",
    inputSchema: z.object({
      searchRequest: z.string().describe("The Search Request text describing the desired candidate profile."),
    }),
  }),
  navigateToMatch: tool({
    description: "Navigate to a specific Match's detail view from the current Shortlist. Use only matchIds shown in the current session context.",
    inputSchema: z.object({
      matchId: z.string().describe("The matchId of the Match to navigate to (e.g. 'row-2')."),
    }),
  }),
  explainMatch: tool({
    description: "Explain why a specific Candidate Record was matched. Use only the existing Match data for the requested matchId.",
    inputSchema: z.object({
      matchId: z.string().describe("The matchId of the Match to explain."),
    }),
  }),
  compareMatches: tool({
    description: "Compare two or more existing Matches from the current Shortlist using explicit matchIds. Do not infer missing matchIds.",
    inputSchema: z.object({
      matchIds: z.array(z.string()).describe("The matchIds of the Matches to compare (2 or more)."),
    }),
  }),
  requestMessageDraft: tool({
    description: "Generate an editable message draft for a Match. Only use for current Shortlist Matches whose Suggested Next Action supports contact or recontact.",
    inputSchema: z.object({
      matchId: z.string().describe("The matchId of the Match to draft a message for."),
    }),
  }),
  showCurrentCriteria: tool({
    description: "Display the currently interpreted Search Criteria as read-only session information. Do not offer manual criteria editing.",
    inputSchema: z.object({}),
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
    Match ID: ${m.matchId}
    Role: ${m.currentRole || "Not provided"}
    Reasons: ${m.reasons.slice(0, 3).join("; ")}
    Gaps: ${m.gaps.slice(0, 2).join("; ") || "None"}
    Risks: ${m.risks.slice(0, 2).join("; ") || "None"}
    Suggested Next Action: ${m.suggestedNextAction}`;
          })
          .join("\n")
      : "  No Shortlist yet. If the recruiter describes a role, create a Search Request so the client can evaluate Candidate Records and show Matches when evidence exists.";

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
1. createSearchRequest — create a Search Request so the client can evaluate Candidate Records and show a Shortlist when Matches exist
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
- You CANNOT manually edit Search Criteria; create a new Search Request instead when recruiter intent changes.
- You MUST NOT introduce candidate information that is not grounded in the provided Shortlist context.
- Match strength is qualitative: Strong, Possible, or Weak. Never use percentages.
- Always use domain-correct language: "Talent Pool", "Candidate Record", "Search Request", "Match", "Shortlist", "Suggested Next Action".`;
}

export function getIntelligenceLayerPrompt(): string {
  return intelligenceLayerPrompt;
}
