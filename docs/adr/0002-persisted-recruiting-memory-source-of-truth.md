# Persist Recruiting Memory In Supabase With mem0 As An Auxiliary Layer

Status: accepted

Recollect is moving from an in-memory Talent Rediscovery prototype toward a recruiting memory platform, so persisted memory is now required for the next demo slice. Supabase will be the source of truth for persisted recruiting memory, starting with Candidate, Candidate Record, Candidate Note, and Search Request; mem0 may be used as a derived retrieval and reasoning layer for Serenity, but it must not become the canonical store for candidate data, notes, provenance, or recruiter-approved facts. Shortlists and Matches remain derived and temporary until saved snapshots, auditing, sharing, or comparison history become explicit product needs.

This keeps Recollect in control of provenance, deletion, editing, privacy boundaries, and human-confirmed memory while still allowing Serenity to use a specialized memory layer for retrieval and reasoning.

The next demo slice should prove persisted recruiting memory end-to-end: import CSV data into Candidate and Candidate Record memory, allow at least one confirmed Candidate Note, persist Search Requests with their read-only Search Criteria snapshot, produce Matches from Candidate Record evidence enriched by confirmed Candidate Notes, and show evidence and provenance in the UI. Auth multi-tenancy, saved Shortlists, external outreach, auto-merge, deletion workflows, and AI SDK migration are out of scope for this slice.

The UI should stay minimal for the slice: a Candidate memory panel on Match detail, an evidence panel that separates Candidate Record evidence from confirmed Candidate Note evidence, a confirmation sheet/modal before saving a proposed Candidate Note, and simple provenance chips for source type, confirmation, staleness, or uncertainty. Advanced history, batch review, merge UI, and full audit workflows are out of scope.
