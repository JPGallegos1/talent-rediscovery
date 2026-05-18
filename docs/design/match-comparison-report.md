# Advanced Match Comparison Report

## Purpose

The advanced comparison report gives a recruiter a fuller, side-by-side view after Copilot has already completed a compact comparison for explicit Match IDs.

The report remains an interaction layer over the current Shortlist. It does not create saved Shortlists, persistent Candidate profiles, Candidate Record edits, outreach actions, or external workflow automation.

## Entry Point

Copilot may offer the report only after a compact comparison has at least two valid Match IDs from the current Shortlist.

Recommended Copilot copy:

```text
I compared these Matches using the current Shortlist evidence. Do you want a detailed comparison report?
```

CTA copy:

```text
Open detailed comparison
```

The CTA opens `/to-compare` after the browser-memory session stores the generated report payload.

## Match Selection

The recruiter chooses Matches by explicit Match IDs, such as `row-2` and `row-7`.

Copilot must not infer IDs from vague references unless the current chat context makes them explicit. If fewer than two valid Match IDs are available, Copilot should list the available Match IDs and ask the recruiter to choose at least two.

## Report Data

The report is generated from existing Match data in the current Shortlist only:

- Match ID.
- Candidate Record label.
- Current role.
- Qualitative Match strength.
- Reasons.
- Candidate Record evidence.
- Gaps.
- Risks.
- Suggested Next Action.

The report may add comparison-specific grouping, such as shared evidence and differentiators, but those summaries must be derived from the existing Match sections.

## Route Shape

Use a dedicated session route:

```text
/to-compare
```

The route reads the active comparison report from in-memory app state. It should not encode Match data in the URL and should not recover report content after refresh.

## Page Structure

The report page should render:

- Header: Search Request, compared Match IDs, and session-scoped boundary text.
- Summary strip: compared Match cards with qualitative strength labels only.
- Shared evidence: evidence points common across selected Matches.
- Side-by-side Match columns: Candidate Record label, role, strength, reasons, differentiators, evidence, gaps, risks, and Suggested Next Action.
- Footer action: return to the Shortlist or ask Copilot to compare different Match IDs.

## Empty And Stale State

If `/to-compare` is opened after refresh, direct navigation, or stale state, show a safe fallback:

```text
No comparison report is available for this session.
```

The fallback should explain that comparison reports are session-scoped and guide the recruiter back to Home to run a Search Request and ask Copilot to compare at least two current Matches.

## MVP Boundaries

The report must not introduce:

- Persisted Shortlists.
- Saved comparison reports.
- Persistent Candidate profiles.
- Candidate Record mutation.
- Manual Search Criteria editing.
- Outreach sending.
- External actions or imports.
- Percentage Match scores.

## Implementation Slices

1. Add browser-memory comparison report state to the app store.
2. Extend the `compareMatches` tool handling to optionally create a detailed report from explicit Match IDs.
3. Render `/to-compare` with side-by-side report sections and stale-session fallback.
4. Keep deterministic checks focused on store reset behavior and prohibited persistence boundaries.
