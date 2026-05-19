# Split Recollect Into App, API, And Memory Apps

Status: accepted

Recollect will move toward a monorepo organized under `apps/admin`, `apps/api`, and `apps/memory`. The TanStack admin frontend in `apps/admin` must not instantiate Supabase or directly access Supabase credentials; persisted recruiting memory is accessed through `apps/api`, while `apps/memory` handles Serenity's specialized memory intelligence work such as retrieval, extraction, enrichment, and reasoning.

`apps/admin` may be implemented with TanStack Start. TanStack Start server routes and server functions are allowed as frontend-owned middleware, SSR support, or BFF glue for the admin experience, but they do not become the canonical backend boundary. Any operation that requires trusted credentials, Supabase access, durable recruiting memory writes, confirmation gates, or secure product actions must call `apps/api`.

`apps/api` is the only canonical Supabase access boundary. `apps/memory` must not directly read from or write to Supabase; it receives scoped context from `apps/api` and returns proposals, extracted fields, summaries, retrieval context, or note candidates. Durable writes happen through `apps/api` after validation and human confirmation where required, and mem0 synchronization happens only after Supabase persistence so it remains derived.

The AI SDK interaction layer, whether using the current Vercel AI SDK or a later TanStack AI spike, belongs in `apps/api` because it owns app-facing orchestration, auth/session context, tool validation, streaming, confirmation gates, and persistence decisions. `apps/memory` should be a FastAPI service focused on memory retrieval, extraction, enrichment, and reasoning from scoped context; it returns derived outputs to `apps/api` rather than owning product tools or durable actions.

This boundary protects candidate data by keeping database access out of the frontend and keeps the Memory Intelligence Layer from becoming the canonical store or an uncontrolled writer of recruiter-approved facts.

Migration should happen in vertical slices rather than a big-bang rewrite: first move the current server boundary into `apps/api` while preserving the existing Intelligence Layer contract, then move the frontend into `apps/admin` without changing behavior, then add Supabase persistence through `apps/api`, and finally add `apps/memory` behind `apps/api` for memory proposals and retrieval.
