# Use TanStack For The Demo Frontend Shell

Status: accepted

The framework-free prototype proved the core Talent Rediscovery flow, but the next demo iteration needs a richer product UI plus chat and Voice Copilot interactions. We will replace the static frontend shell with a Vite + TanStack Router app written in TypeScript, use Tailwind as the base styling library, and migrate the reusable domain modules to TypeScript without redesigning their behavior. The preserved domain logic covers CSV Talent Pool File parsing, Candidate Record normalization, Search Request interpretation, evidence-grounded Shortlists, and editable message drafts. Uploaded Talent Pools still remain in memory, Shortlists remain ephemeral, Search Criteria stay visible but not manually editable, and Matches must remain grounded in Candidate Record evidence.

TanStack Start or another TanStack full-stack setup is a likely future evolution if server functions, SSR, persistence, or integrated deployment become useful. It is not the current decision because the immediate need is a modern frontend shell plus a small explicit API boundary for AI session creation.

The AI work introduced in this frontend phase is an Intelligence Layer for chat and Voice Copilot, not a replacement for matching. It may create Search Requests, navigate Shortlists, explain or compare Matches from existing evidence, and request editable message drafts, but it must not decide the Shortlist, recalculate Match strength, modify Candidate Records, manually edit Search Criteria, send outreach, or introduce unsupported claims.

The Intelligence Layer should be implemented through a shared TypeScript contract. The first implementable slice is Chat Copilot through Vercel AI SDK; Voice Copilot with `gpt-realtime 2.0` should reuse the same interaction boundary and add realtime audio/session transport later.

The OpenAI key must remain server-side. The same repository will include a minimal TypeScript API for the prototype: first for Chat Copilot requests through Vercel AI SDK, then for creating ephemeral realtime sessions for Voice Copilot. This API does not introduce persistence, Candidate Record mutation, outreach sending, or external action execution.

Because uploaded Talent Pools remain in browser memory for the MVP, AI endpoints must receive only minimal session context from the client instead of storing Talent Pools server-side. Chat requests should send the current Search Request and a compact current Shortlist context made from Match display fields, strength, reasons, evidence, gaps, risks, and Suggested Next Action. Voice sessions should use ephemeral realtime sessions and client-held state/tools rather than server-side Talent Pool storage.

The shared Copilot action contract starts with: `createSearchRequest`, `navigateToMatch`, `explainMatch`, `compareMatches`, `requestMessageDraft`, and `showCurrentCriteria`. It must not expose actions for editing Candidate Records, manually editing Search Criteria, sending messages, saving Shortlists, persisting Talent Pools, or importing external sources.

The initial route shape is `/` for the main Copilot-driven recruiting cockpit, `/talent-pool` for CSV Talent Pool File upload plus TanStack Table review of Candidate Records, and `/matches/$matchId` for detail of a Match in the current ephemeral Shortlist. The main cockpit can place chat/Voice Copilot beside the current Shortlist and Match workspace. Match detail routes are session-scoped, not persistent deep links; if the in-memory Talent Pool or Shortlist context is missing, the UI should return to the cockpit or ask the recruiter to load a Talent Pool and submit a Search Request. Talent Pool revalidation, refresh, or sync affordances may appear only as future-disabled UI cues; the MVP must not implement real background revalidation, external synchronization, persistence, or non-CSV imports.

Shared app state should live in a typed client-side in-memory store or React context: uploaded Talent Pool metadata, normalized Candidate Records, current Search Request, interpreted Search Criteria, current Shortlist, selected Match id, and Copilot transcript/session state. The app should not use `localStorage`, URL state, or server persistence for Talent Pool or Shortlist data in this phase; refreshes may lose session state and guide the recruiter to load a Talent Pool again.

The `/` cockpit must load even before a Talent Pool exists. In that empty state, the Copilot may explain Talent Rediscovery, guide the recruiter to `/talent-pool`, and draft a pending Search Request from recruiter intent, but it must not create a real Shortlist or claim Matches until Candidate Records have been loaded from a Talent Pool File.

The `/talent-pool` route should show normalized Candidate Records in a TanStack Table: row number, name, current role, location, years experience, skills, industries, English level, availability, last contact date, source, normalization gaps, and duplicate warnings when available. The table may support client-side sorting, filtering, and source field expansion, but it must not support inline editing, saving, real sync, ATS import, or Candidate Record mutation in the MVP.

Search Requests in the new UI should be Copilot-first but explicitly executed. The `/` cockpit should use a chat-style composer that can turn recruiter intent into a Search Request, show the resulting Search Request, and require an explicit run action before building a Shortlist. Interpreted Search Criteria remain read-only; recruiters change them by revising the Search Request, not by editing filters.

OpenAI models should be configurable through environment variables. Chat Copilot should use Vercel AI SDK with a text-capable model configured by `OPENAI_CHAT_MODEL`; Voice Copilot should use `gpt-realtime 2.0` or equivalent configured by `OPENAI_REALTIME_MODEL`. Model names should not be hardcoded into domain logic.

Checks should remain deterministic by default. Domain checks for CSV parsing, Search Criteria interpretation, Shortlist matching, and message drafts should be migrated to TypeScript. Intelligence Layer checks should validate the shared action contract, compact Shortlist context, prompt safety constraints, and absence of prohibited tools without requiring `OPENAI_API_KEY`. Live OpenAI checks may exist as explicit optional commands only.

The code migration should wait for the Stitch-generated UI direction. The current documentation decision is to use Stitch output as the visual basis for the new TanStack + Tailwind frontend rather than porting the current framework-free UI directly.

Tailwind should be used utilities-first in the first migration. Extract local components only when repetition becomes concrete, such as `Button`, `Card`, `Panel`, `Badge`, or `MatchCard`. Do not create a formal design system before the Stitch direction and product UI patterns have stabilized.
