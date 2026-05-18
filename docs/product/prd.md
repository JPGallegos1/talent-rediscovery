# Product Requirements Document

## Product

Talent Rediscovery

## Problem Statement

Recruiters already have candidate data in spreadsheets, ATS exports, CV folders, notes, and other semi-structured sources, but they often cannot reuse it quickly when a new search starts.

The current workflow depends on rigid filters, inconsistent fields, manual memory, and repeated external sourcing. This causes recruiters to start from scratch even when relevant candidates may already exist in their own Talent Pool.

## Solution

Build a lightweight prototype that lets a recruiter upload a Talent Pool file, submit a Search Request in natural language, and receive an explained Shortlist from their own data.

The prototype must focus on decision support, not just search. Each Match should explain why the Candidate Record is relevant, what evidence supports the Match, what information is missing, and what the recruiter should do next.

## Primary User

The first user is a freelance recruiter or small agency recruiter who maintains candidate data outside a mature ATS workflow and needs faster candidate reuse.

## User Stories

1. As a recruiter, I want to upload a CSV Talent Pool file, so that I can search Candidate Records I already have.
2. As a recruiter, I want to preview uploaded Candidate Records, so that I can confirm the file was parsed correctly.
3. As a recruiter, I want the system to handle imperfect candidate data, so that missing or inconsistent fields do not block the workflow.
4. As a recruiter, I want to submit a Search Request in natural language, so that I do not need to build rigid filters manually.
5. As a recruiter, I want to search by skills, seniority, location, industry, language level, availability, and notes, so that the Shortlist reflects how I actually think about candidates.
6. As a recruiter, I want to receive a ranked Shortlist of Matches, so that I can focus on the most relevant evaluations first.
7. As a recruiter, I want each Match to include reasons, so that I understand why the Candidate Record was selected.
8. As a recruiter, I want each Match to include evidence from the Candidate Record, so that I can verify the recommendation.
9. As a recruiter, I want each Match to include missing information, so that I know what to validate before contacting the Candidate.
10. As a recruiter, I want each Match to include risks or validation points, so that I can avoid over-trusting incomplete data.
11. As a recruiter, I want each Match to include a Suggested Next Action, so that I know whether to contact, validate, or skip the Candidate.
12. As a recruiter, I want a Suggested Next Action to optionally help me prepare a message draft, so that I can act on a promising Match quickly without making the message itself the core product object.
13. As a recruiter, I want the prototype to work with text input, so that I can use it in normal work contexts.
14. As a founder validating the product, I want a synthetic demo dataset, so that I can show the product without exposing real candidate data.
15. As a founder validating the product, I want a Loom-ready flow, so that I can explain the value in under two minutes.
16. As a founder validating the product, I want the prototype to avoid complex infrastructure, so that validation is not delayed by premature architecture.

## Functional Requirements

### Upload Talent Pool File

The prototype must support CSV upload first.

Excel and tool-specific imports are deferred unless they become validation blockers.

Direct Notion import or migration is out of scope for the MVP.

The prototype should parse rows into Candidate Records and show a preview before search.

The prototype should tolerate missing fields and inconsistent values.

### Candidate Normalization

The prototype must normalize common fields lightly enough to support matching, because each recruiter may bring a different CSV structure.

Normalization should use a hybrid model: canonical fields for common matching concepts and preserved non-canonical source fields for anything not confidently mapped.

Initial normalized concepts:

- Candidate name.
- Current role.
- Skills.
- Years of experience.
- Location.
- English level.
- Industries.
- Availability.
- Salary expectation.
- Source.
- Last contact date.
- Notes.

Flexible concepts such as skills should not assume a uniform shape. They may contain lists, free text, tags, mixed languages, seniority hints, or tool-specific formatting.

Normalization must not hide uncertainty. Missing, vague, or stale information should remain visible in Match explanations.

Normalization should preserve enough source context to explain why a Match was produced, even when a CSV column is unusual, incomplete, or not mapped cleanly.

### Search Request And Search Criteria

The prototype must provide a text input where the recruiter submits a Search Request describing the target profile.

The prototype should derive Search Criteria from the Search Request where useful, while keeping the original Search Request visible.

When a Search Request is submitted after a Talent Pool has been loaded, the prototype should auto-execute the Search Request and return the resulting Shortlist without requiring a separate manual run action.

The MVP should show interpreted Search Criteria for transparency, but it must not provide granular manual editing of Search Criteria. If interpretation is wrong, the recruiter should revise the Search Request and let the prototype produce a new Shortlist from the revised request.

The prototype should support requests like:

```text
I need a Senior Backend Engineer in Bogota, Python or Node, at least 4 years of experience, fintech or startup background, intermediate English, and availability within 30 days.
```

Voice Copilot is optional and must not delay text search. It is an interaction layer over Search Requests, Shortlists, and Matches, not a replacement for the text-first workflow.

Allowed Voice Copilot intents in the MVP demo:

- Create or revise a Search Request from speech.
- Navigate to a specific Match or Candidate Record from the Shortlist.
- Ask why a Match is Strong, Possible, or Weak.
- Compare Matches in the current Shortlist.
- Request an editable message draft when the Suggested Next Action is to contact or recontact.

Voice Copilot must not modify Candidate Records, edit Search Criteria manually, persist decisions, send outreach, or execute external actions.

### Shortlist Results

The prototype must return an ephemeral ranked Shortlist of Matches from the uploaded Candidate Records.

Matching may be AI-assisted, but it must be evidence-grounded. The system must not invent Matches that cannot be explained from Candidate Record data.

The MVP must not persist Shortlists as snapshots.

Each Match must include these sections:

- Candidate name.
- Qualitative Match strength: Strong, Possible, or Weak.
- Reasons.
- Evidence from the Candidate Record.
- Gaps or missing information.
- Risks or validation points.
- Suggested Next Action.

### Suggested Next Action

The prototype should provide a Suggested Next Action for each Match.

If the Suggested Next Action is to contact or recontact the Candidate, the prototype may generate a simple editable message draft.

The message should be editable and should not send automatically.

## Implementation Decisions

- Use a lightweight prototype instead of a full SaaS architecture.
- Use CSV as the required upload format for the first build.
- Treat CSV normalization as a central product risk, not a solved implementation detail.
- Use a hybrid Candidate Record normalization model: canonical fields plus preserved source fields.
- If persistence is introduced later, flexible fields such as skills and unmapped source data can be represented as JSONB; this does not require choosing a production database in the MVP.
- Keep Candidate Records in memory for the first prototype.
- Do not persist uploaded Talent Pools in the MVP.
- Avoid RAG, embeddings, vector databases, and long-term memory.
- Use the accepted TanStack frontend shell for the demo iteration: Vite, TanStack Router, TypeScript, and Tailwind.
- Treat the earlier framework-free/browser-primitives direction as superseded for frontend shell decisions by `docs/adr/0001-tanstack-frontend-shell.md`.
- Use pnpm and Node >= 24 once package setup is introduced.
- Keep Voice Copilot optional and scoped as an interaction layer.
- Prioritize explained matching over opaque scoring.
- Use AI assistance only where it improves interpretation, interaction, or drafting without breaking evidence-grounded Matches.
- Do not expose percentage-style Match scores in the MVP; use qualitative Match strength labels instead.
- Show Search Criteria for transparency without turning the experience into a manual filter builder.
- Do not model Freshness states in the first prototype; stale or missing update signals should appear as Match evidence, gaps, or risks.
- Use synthetic data for demos before using real candidate data.

## Testing Decisions

Tests should verify observable behavior through public interfaces, not implementation details.

Priority behaviors to test when code begins:

- CSV parsing converts uploaded rows into Candidate Records.
- Candidate normalization preserves missing and uncertain information.
- Matching returns Candidate Records that satisfy visible Search Criteria as Matches.
- Match explanations include reasons, evidence, gaps, risks, and Suggested Next Actions as sections of the Match.
- AI-assisted matching, if used, remains verifiable through Candidate Record evidence.
- Suggested Next Action behavior can include message drafting when contacting the Candidate is the recommended action.

Do not over-test styling, internal helpers, or framework-free implementation details.

## Out Of Scope

- Excel upload unless it becomes a validation blocker.
- Voice Copilot unless text search and explained Shortlist are already working.
- ATS integrations.
- Direct Notion import or migration.
- LinkedIn scraping.
- Automated outreach.
- Automated follow-ups.
- Calendar scheduling.
- Billing.
- Authentication.
- Persisted uploaded Talent Pools.
- Role-based permissions.
- Multi-tenant data model.
- Production privacy/compliance implementation.
- RAG.
- Embeddings.
- Vector database.
- Long-term memory.
- Freshness state machine for Candidate Records.

## Success Metrics

Product validation success:

- 10 recruiter conversations completed.
- At least 3 strong-pull signals observed.
- At least 1 recruiter shares a real or anonymized Talent Pool File.
- At least 1 concierge or demo Shortlist is judged useful.
- At least 1 recruiter discusses payment, pilot, or repeated usage.

Prototype success:

- A recruiter understands the value in under 2 minutes.
- A CSV can be uploaded and previewed.
- A text search produces a Shortlist.
- Each Shortlist item is a Match with reasons, evidence, gaps, risks, and Suggested Next Action.
- The demo can be recorded as a coherent Loom.

## Further Notes

The prototype should not be treated as the final architecture. Its purpose is to validate demand for candidate rediscovery before investing in integrations, persistence, privacy infrastructure, or advanced AI retrieval.

Future versions could improve Talent Pool normalization across recruiters or agencies. No vendor, integration, or third-party normalization decision is part of the MVP.
