# MVP Scope: Recollect Persisted Memory Slice

Status: current. This replaces the earlier weekend/in-memory prototype scope. The current MVP is the smallest productized slice that proves Recollect can preserve and reuse recruiting memory with human control.

## The Single Thing

Recollect helps a recruiter reuse an existing Talent Pool by preserving Candidate Records and recruiter-confirmed Candidate Notes, then using that memory to produce evidence-grounded Matches for a Search Request.

If the MVP does only one thing, it should prove this moment:

```text
Recruiter imports existing Candidate Records
-> Recollect preserves them as recruiting memory
-> Recruiter confirms one useful Candidate Note
-> Recruiter submits a Search Request
-> Recollect returns Matches with evidence and provenance
```

## Minimalist Constraint

Build as little as possible. This is not the full Recollect platform. It is a demoable memory loop that can be tested with recruiters and improved manually before automating more workflows.

The MVP should stay close to forms and lists:

- Upload CSV.
- Show Candidate Records.
- Show Matches.
- Confirm a Candidate Note.
- Show evidence and provenance.

## Stage 1: Manual

Before or alongside the software slice, keep a concierge version available:

1. Ask a recruiter for an anonymized Talent Pool File or representative CSV.
2. Ask for one real Search Request.
3. Manually inspect and normalize enough Candidate Records to produce a useful Shortlist.
4. Add one or two recruiter-confirmed notes manually.
5. Return a Shortlist with reasons, evidence, gaps, risks, Suggested Next Action, and provenance.
6. Ask whether the recruiter would use this again or pay for it.

Manual output:

- 5 to 10 Matches.
- Strong, Possible, or Weak Match strength.
- Evidence separated by Candidate Record and Candidate Note.
- Clear gaps and risks.
- One Suggested Next Action per Match.
- One example of preserved Candidate memory.

## Stage 2: Processized

Document the repeatable process before automating more:

1. Receive CSV.
2. Map obvious canonical fields.
3. Preserve unmapped source fields.
4. Create one minimal Candidate per imported row unless duplicate review is explicitly needed.
5. Store Candidate Records with provenance.
6. Capture or propose Candidate Notes only when recruiting-relevant.
7. Require human confirmation before Candidate Notes become durable.
8. Interpret the Search Request into read-only Search Criteria.
9. Match Candidate Records against Search Criteria.
10. Enrich Match evidence with confirmed Candidate Notes only.
11. Show provenance and uncertainty.
12. Ask the recruiter what was useful, missing, or wrong.

This process is the product blueprint. Only automate steps that have proven useful in recruiter conversations.

## Stage 3: Productized Demo Slice

The productized MVP should include only the following:

- CSV Talent Pool File upload.
- Candidate Record parsing and normalization.
- Supabase persistence through `apps/api` for Candidate, Candidate Record, Candidate Note, and Search Request.
- Minimal Candidate identity shells.
- Candidate Records as imported/captured evidence with canonical fields plus preserved source data.
- Shared Provenance for Candidate Records and Candidate Notes.
- Search Request creation with original text and read-only Search Criteria snapshot.
- Derived Shortlists and Matches.
- Matching from Candidate Record evidence, enriched by confirmed Candidate Notes.
- Candidate memory panel on Match detail.
- Evidence panel separating Candidate Record evidence from Candidate Note evidence.
- Confirm-note modal or sheet.
- Provenance chips for source, confirmation, staleness, and uncertainty.
- Serenity memory actions for retrieving memory, proposing notes, confirming notes, showing provenance, and identifying gaps.
- Act/confirm/refuse policy for Serenity actions.

## Weekend Version

If this must be reduced to a weekend slice, cut everything except:

1. Persist CSV import into Candidate and Candidate Record.
2. Persist one manual confirmed Candidate Note.
3. Persist one Search Request with criteria snapshot.
4. Return Matches using Candidate Record evidence and the confirmed Candidate Note.
5. Show provenance in the Match detail.

Do not build audio, mem0 sync, advanced history, batch review, merge UI, saved Shortlists, deletion workflows, or TanStack AI migration in the weekend version.

## In Scope

- Recollect naming and Serenity memory agent framing.
- Talent Rediscovery as the core capability.
- CSV-first Talent Pool File upload.
- Candidate as minimal identity shell.
- Candidate Record as evidence-bearing imported/captured memory.
- Candidate Note as durable recruiter-confirmed memory.
- Search Request persistence with criteria snapshot.
- Shortlists and Matches as derived, temporary outputs.
- Confirmed Candidate Notes contributing Match evidence.
- Provenance displayed in the UI.
- Strict relevance guardrails for stored memory.
- `apps/api` as the Supabase and AI SDK orchestration boundary.
- `apps/admin` as the TanStack admin application, optionally implemented with TanStack Start for frontend routing, SSR, server routes, and frontend-owned middleware.
- TanStack Start server routes or server functions as frontend/BFF glue only; Supabase access, durable writes, confirmation gates, and secure actions stay in `apps/api`.
- `apps/memory` as a FastAPI Memory Intelligence Layer that returns proposals and derived outputs.

## Out Of Scope

- Full SaaS onboarding.
- Multi-tenant auth and role-based permissions.
- Billing.
- Saved Shortlists.
- Persisted Match snapshots.
- Auto-merging identities.
- Deleting memory.
- External outreach.
- Sending messages.
- Automated follow-ups.
- Calendar scheduling.
- ATS integrations.
- LinkedIn scraping.
- Notion import.
- Excel import unless validation demands it.
- Full RAG as source of truth.
- mem0 as canonical storage.
- Direct Supabase access from `apps/admin` or `apps/memory`.
- Full audit workflows.
- Advanced Candidate history.
- Batch note review.
- Merge UI.
- TanStack AI migration.

## Initial Price Point

Start with a paid concierge offer before treating the software as the business:

- USD 100 to 300 for a small Talent Pool rediscovery report for one role.
- USD 300 to 750 for a Talent Pool memory audit plus one reusable Shortlist workflow.

The price test should happen with a manual or semi-manual delivery if needed. Payment matters more than feature completeness.

## Feedback Collection

After each demo or concierge run, ask:

- Which Match was actually useful?
- Which evidence made you trust or reject the Match?
- What memory was missing?
- Would you want Recollect to remember this Candidate Note next time?
- Did provenance make the result more trustworthy?
- What would you pay to run this on another role?
- Would you share another Talent Pool File for a second run?

Strong-pull signals:

- Recruiter asks to use their own data.
- Recruiter gives a second Search Request.
- Recruiter corrects or adds Candidate Notes.
- Recruiter asks how to keep memory for future searches.
- Recruiter discusses payment or pilot usage.

## Success Criteria

The MVP succeeds if:

- A recruiter understands the value in under two minutes.
- A CSV import produces visible Candidate Records with provenance.
- A Search Request produces evidence-grounded Matches.
- At least one confirmed Candidate Note is preserved and reused.
- The recruiter can see why a Match was produced.
- The recruiter can tell which evidence came from a Candidate Record versus a Candidate Note.
- The recruiter trusts the human confirmation boundary.
- The recruiter asks to try another role or Talent Pool.

## Cut Scope Order

If implementation pressure rises, cut in this order:

1. Remove audio note-taking.
2. Remove mem0 sync.
3. Remove `apps/memory` runtime and mock its proposals behind `apps/api`.
4. Remove advanced Candidate Memory Retrieval UI beyond the Match detail panel.
5. Remove editable message draft generation.
6. Keep only CSV import, Search Request, one confirmed Candidate Note, Matches, evidence, and provenance.
