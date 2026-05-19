# PRD: Recollect Persisted Recruiting Memory Demo Slice

Status: current for the next demo slice. This PRD supersedes the earlier in-memory Talent Rediscovery prototype PRD. Domain language and architectural boundaries are governed by `CONTEXT.md`, ADR 0002, and ADR 0003.

## Problem Statement

Recruiters already have valuable Candidate Records spread across CSV exports, spreadsheets, notes, ATS exports, and other semi-structured sources, but that knowledge is easy to lose. The current prototype can parse an uploaded Talent Pool File and return an explained Shortlist, but the memory disappears with the session and cannot preserve recruiter-approved knowledge over time.

Recruiters need Recollect to preserve, enrich, retrieve, and reuse recruiting memory without turning incomplete imports, AI guesses, or audio transcripts into durable facts. They also need Serenity to make memory transparent: what is remembered, where it came from, whether it was confirmed, and how it contributed to a Match.

## Solution

Build a narrow persisted-memory demo slice for Recollect. The slice persists the first durable memory objects in Supabase through `apps/api`: Candidate, Candidate Record, Candidate Note, and Search Request. Shortlists and Matches remain derived and temporary.

The recruiter can import CSV Candidate Records, run a Search Request, review Matches with evidence and provenance, add or confirm at least one Candidate Note, and see confirmed Candidate Notes enrich future Match explanations. Serenity may retrieve memory, propose notes, explain provenance, and show memory gaps, but durable memory writes require human confirmation.

## User Stories

1. As a recruiter, I want to upload a CSV Talent Pool File, so that I can reuse Candidate Records I already have.
2. As a recruiter, I want uploaded rows to become Candidate Records, so that imported data is preserved as evidence rather than treated as final truth.
3. As a recruiter, I want each imported Candidate Record to be associated with a Candidate identity shell, so that Recollect can attach multiple pieces of memory to the same person over time.
4. As a recruiter, I want Candidate to remain minimal, so that imported names, emails, roles, skills, locations, and availability do not become unconfirmed durable identity truth.
5. As a recruiter, I want Recollect to preserve original source fields, so that unusual CSV columns are not lost during normalization.
6. As a recruiter, I want Recollect to normalize obvious fields for matching, so that Search Requests can find relevant Candidate Records despite inconsistent CSV schemas.
7. As a recruiter, I want imported source details such as file reference and row number preserved as provenance, so that I can understand where a Candidate Record came from.
8. As a recruiter, I want duplicate-looking Candidate Records to be flagged rather than auto-merged, so that identity decisions stay under human control.
9. As a recruiter, I want to submit a Search Request in natural language, so that I do not need to manually build filters.
10. As a recruiter, I want Recollect to show read-only Search Criteria interpreted from my Search Request, so that I can understand how my request was interpreted.
11. As a recruiter, I want Search Requests to be persisted with their criteria snapshot, so that the system preserves what interpretation was used at that time.
12. As a recruiter, I want to revise the Search Request instead of editing criteria manually, so that the workflow remains conversational and transparent.
13. As a recruiter, I want the system to return a Shortlist of Matches, so that I can focus on the most relevant Candidate Records.
14. As a recruiter, I want Match strength shown qualitatively as Strong, Possible, or Weak, so that I am not misled by false precision.
15. As a recruiter, I want every Match to include reasons, evidence, gaps, risks, and a Suggested Next Action, so that I can decide what to validate next.
16. As a recruiter, I want evidence to distinguish Candidate Record evidence from Candidate Note evidence, so that I can judge the reliability of each claim.
17. As a recruiter, I want confirmed Candidate Notes to enrich Matches, so that recruiter-approved memory improves rediscovery beyond the original CSV.
18. As a recruiter, I want unconfirmed note proposals and raw transcripts excluded from Match strength, so that temporary AI output does not become decision evidence.
19. As a recruiter, I want to create a Candidate Note manually, so that I can preserve relevant recruiting memory from my own knowledge.
20. As a recruiter, I want Serenity to propose a Candidate Note from typed or dictated input, so that I can save useful memory faster.
21. As a recruiter, I want to review and confirm a proposed Candidate Note before it is saved, so that durable memory stays human-approved.
22. As a recruiter, I want Candidate Notes to preserve provenance, so that I can see who created or confirmed the note and what source it came from.
23. As a recruiter, I want provenance to separate source type, confirmation, uncertainty, and staleness, so that one status does not hide important context.
24. As a recruiter, I want Serenity to avoid storing sensitive or irrelevant personal details, so that Candidate memory remains safe and recruiting-relevant.
25. As a recruiter, I want Serenity to retrieve Candidate Memory for a known Candidate, so that I can ask what Recollect knows about that person.
26. As a recruiter, I want Candidate Memory Retrieval to show Candidate Records, Candidate Notes, provenance, and memory gaps, so that I can understand the complete recruiting memory context.
27. As a recruiter, I want searching a Talent Pool to remain distinct from retrieving Candidate Memory, so that global matching and candidate-specific recall do not blur.
28. As a recruiter, I want a Candidate memory panel in Match detail, so that I can see relevant stored memory while reviewing a Match.
29. As a recruiter, I want provenance chips on evidence and notes, so that I can quickly see whether memory was imported, manual, transcribed, inferred, confirmed, stale, or uncertain.
30. As a recruiter, I want Serenity to explain a Match using only grounded evidence, so that I can trust or reject the recommendation.
31. As a recruiter, I want Serenity to prepare editable message drafts only when appropriate, so that I can act faster without the system sending outreach.
32. As a recruiter, I want Serenity to refuse sending messages or contacting Candidates, so that external actions remain under human control.
33. As a recruiter, I want audio to create commands or note proposals without automatically saving transcripts, so that speech input remains useful but safe.
34. As a founder, I want the demo to show persisted memory end-to-end, so that Recollect feels different from an in-memory CSV matcher.
35. As a founder, I want the demo to avoid full multi-tenant SaaS complexity, so that validation is not delayed by infrastructure that is not yet needed.
36. As a developer, I want `apps/admin` to avoid direct Supabase access, so that frontend code cannot bypass the canonical API boundary.
37. As a developer, I want `apps/api` to own Supabase access and AI SDK tool orchestration, so that persistence, confirmation gates, and app-facing actions are controlled in one boundary.
38. As a developer, I want `apps/memory` to return proposals and derived memory outputs, so that the Memory Intelligence Layer does not become the source of truth.
39. As a developer, I want mem0 to remain derived from confirmed Supabase data, so that auxiliary retrieval cannot overwrite canonical recruiting memory.
40. As a developer, I want the migration to happen in vertical slices, so that the demo remains functional while moving toward the planned monorepo.

## Implementation Decisions

- Recollect is the product; Serenity is the named recruiting memory agent.
- Talent Rediscovery remains the core capability inside Recollect.
- The first persisted memory slice is Candidate, Candidate Record, Candidate Note, and Search Request.
- Supabase is the source of truth for persisted recruiting memory.
- mem0 may be used only as a derived auxiliary retrieval and reasoning layer.
- Candidate is the identity shell that groups candidate memory and remains minimal in the MVP.
- Candidate Record carries imported or captured profile evidence, including canonical fields and preserved non-canonical source data.
- Candidate Note is durable recruiter-approved memory and exists only after human confirmation.
- Search Request persists the original recruiter text and the read-only Search Criteria interpretation used at that time.
- Shortlists and Matches remain derived and temporary until saved snapshots, sharing, audit, or comparison history become explicit needs.
- Talent Pool File is not a persisted domain object in the MVP; source reference details live as provenance on Candidate Records.
- Provenance is a shared shape for Candidate Records and Candidate Notes.
- Provenance must separate source type, source reference, creator, creation time, confirmer, confirmation time, uncertainty, and staleness where applicable.
- AI-assisted or inferred memory may become durable only after human confirmation and must preserve that it originated as a proposal or inference.
- Serenity may act without confirmation only for read-only or reversible actions such as retrieving memory, explaining provenance, showing memory gaps, or navigating UI.
- Serenity must require confirmation before durable memory writes such as creating Candidate Notes, confirming inferred memory, updating provenance, or marking memory stale.
- Serenity must refuse external or high-risk actions such as sending messages, contacting Candidates, auto-merging identities, deleting memory, or storing irrelevant or sensitive personal data.
- The current Intelligence Layer interaction actions remain separate from Serenity memory actions.
- The Intelligence Layer may create Search Requests, navigate to Matches, explain Matches, compare existing Matches, request editable message drafts, and show interpreted Search Criteria.
- Serenity memory actions may retrieve Candidate Memory, propose Candidate Notes, confirm Candidate Notes, show history/provenance, and identify memory gaps.
- `apps/admin` is the TanStack admin application and must not instantiate or directly import Supabase clients.
- `apps/api` is the only canonical Supabase access boundary and owns app-facing AI SDK orchestration, auth/session context, tool validation, streaming, confirmation gates, and persistence decisions.
- `apps/memory` is a FastAPI service for memory retrieval, extraction, enrichment, and reasoning from scoped context.
- `apps/memory` must not directly read from or write to Supabase.
- Migration should happen in vertical slices: API boundary first, frontend move second, Supabase persistence third, memory service fourth.
- The UI slice should include a Candidate memory panel, evidence split between Candidate Record and Candidate Note, confirm-note sheet/modal, and provenance chips.

Major modules to build or modify:

- Persisted memory schema and repository module in the API boundary.
- CSV import module that converts parsed Candidate Records into persisted Candidates and Candidate Records.
- Search Request persistence module that stores original text and criteria snapshot.
- Matching module that evaluates Candidate Records and enriches Matches with confirmed Candidate Notes.
- Provenance module that exposes a shared provenance shape and formatting rules.
- Serenity memory action contract that separates retrieval/proposal/confirmation from existing interaction actions.
- Memory service client in the API boundary for scoped calls into the FastAPI Memory Intelligence Layer.
- Candidate memory UI surface in the admin application.
- Confirm-note UI flow with explicit human confirmation before durable writes.

Deep modules worth isolating:

- Candidate Record normalization and import mapping.
- Search Criteria interpretation and snapshot persistence.
- Evidence-grounded matching with Candidate Note enrichment.
- Provenance validation and display formatting.
- Serenity action policy for act, confirm, and refuse decisions.

## Testing Decisions

- Tests should verify observable behavior through public interfaces, not internal implementation details.
- Existing deterministic checks for CSV parsing, Search Criteria interpretation, Shortlist matching, message drafting, and app-store behavior should remain prior art.
- Persisted memory tests should verify that CSV import creates minimal Candidates and evidence-bearing Candidate Records without promoting imported profile fields onto Candidate.
- Candidate Note tests should verify that proposed notes are not durable until confirmation.
- Provenance tests should verify separated axes for source type, confirmation, uncertainty, and staleness.
- Search Request tests should verify that original text and interpreted criteria snapshot are preserved.
- Matching tests should verify that confirmed Candidate Notes can contribute evidence, while unconfirmed proposals, raw transcripts, and inferred extractions cannot affect Match strength.
- Serenity policy tests should verify act/confirm/refuse behavior for read-only actions, durable memory writes, and prohibited external or sensitive-data actions.
- API boundary tests should verify that `apps/admin` cannot bypass `apps/api` for Supabase access.
- Memory service integration tests should use scoped context fixtures and assert that derived outputs return to `apps/api` without direct persistence.
- UI tests should focus on user-observable flows: import, search, evidence/provenance display, note proposal review, and note confirmation.

## Out Of Scope

- Saved Shortlists.
- Persisted Match snapshots.
- Auto-merging Candidates or Candidate Records.
- Deleting memory workflows.
- Full audit workflow.
- Full multi-tenant auth and role-based permissions.
- External outreach, sending messages, automated follow-ups, or calendar scheduling.
- ATS integrations.
- LinkedIn scraping.
- Notion import.
- Excel import unless it becomes a validation blocker.
- Full RAG architecture as the canonical store.
- Making mem0 canonical.
- Direct Supabase access from `apps/admin` or `apps/memory`.
- TanStack AI migration; evaluate it later as a separate spike.
- Advanced history, batch review, merge UI, or enterprise compliance workflows.

## Further Notes

This PRD intentionally narrows the next slice to persisted recruiting memory that can be demonstrated end-to-end. The goal is not to build the final SaaS platform. The goal is to show that Recollect can preserve recruiter-approved memory, retrieve it safely with Serenity, and reuse it in evidence-grounded Talent Rediscovery without losing human control.
