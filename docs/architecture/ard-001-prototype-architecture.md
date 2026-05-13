# ARD-001: Prototype Architecture For Talent Rediscovery

## Status

Superseded for frontend shell decisions by `docs/adr/0001-tanstack-frontend-shell.md`. The domain and MVP scope constraints remain active unless superseded separately.

## Context

Talent Rediscovery is validating whether recruiters can get value from rediscovering candidates they already have before sourcing externally.

The first prototype should validate product value, not final architecture. The project should avoid heavy technical commitments until real recruiter interviews and concierge tests show strong pull.

## Decision

### 1. Start With File Upload

The first prototype will start with CSV upload. Excel, Notion, and other tool-specific imports are out of scope unless they become validation blockers.

Candidate Records will be parsed, previewed, normalized lightly, and kept in memory for the first demo. Uploaded Talent Pools will not be persisted in the MVP. Normalization is a central risk because each recruiter may bring a different CSV structure.

Normalization will use a hybrid model: canonical fields for common matching concepts and preserved source fields for non-canonical CSV data. If persistence is introduced later, flexible fields such as skills and unmapped source data can be represented as JSONB-style fields, without choosing a production database in the MVP.

### 2. Avoid A Frontend Framework Initially

The first prototype will avoid Next.js, Astro, TanStack Start, Remix, and similar frameworks.

The prototype can use:

- `index.html`.
- Browser primitives.
- Plain JavaScript or TypeScript.
- Web Components where reusable UI is useful.

This keeps the project easier to inspect, modify, and reason about while product shape is still unclear.

### 3. Use pnpm And Node >= 24

The project will use pnpm as the package manager and Node >= 24 for local development.

Future setup files should document this with `.nvmrc` and `package.json` engines when code is introduced.

### 4. Support Text First With Optional Voice Copilot

Text search is required. Voice Copilot is optional.

Voice Copilot through GPT Realtime or equivalent browser voice interaction may be useful for demos, but the product must work through text because recruiters may not always be in a context where speaking to the app is natural.

Voice Copilot is an interaction layer over Search Requests, Shortlists, and Matches. In the MVP it may create Search Requests, navigate to Matches, answer follow-up questions about Match evidence, compare Matches, and request editable message drafts. It must not modify Candidate Records, persist decisions, send outreach, or execute external actions.

### 5. Do Not Use RAG In The First Prototype

The first prototype will not use embeddings, vector databases, long-term memory, or full RAG.

The MVP may use AI assistance for Search Request interpretation, Voice Copilot interaction, explanation phrasing, and message drafting. It must not use AI as an opaque source of truth for Matches. Every Match must be grounded in Candidate Record evidence.

For a small validation dataset, it is acceptable to:

```text
Upload Talent Pool File
-> Parse rows
-> Normalize Candidate Records into canonical fields plus preserved source fields
-> Keep Candidate Records in memory
-> Interpret Search Criteria from the Search Request
-> Evaluate Candidate Records against Search Criteria with evidence-grounded matching
-> Return a reasoned Shortlist of Matches
```

This is intentionally not the scalable final architecture.

### 6. Explain Every Match

Every candidate recommendation must include:

- Qualitative Match strength: Strong, Possible, or Weak.
- Reasons.
- Evidence found in the Candidate Record.
- Gaps or missing information.
- Risks or validation points.
- Suggested Next Action.

A percentage-style score without evidence is not acceptable for this product thesis. The MVP should expose qualitative Match strength labels instead of numeric precision.

AI-generated explanations are acceptable only when they cite or summarize evidence present in the Candidate Record.

### 7. Do Not Model Freshness In The MVP

Freshness does not add enough value at this stage of the project to justify a formal state model.

Possible future states were discussed:

```text
fresh
warm
cold
unknown
```

These are out of scope for the first prototype.

The first prototype can surface stale availability, old contact dates, or missing updates as Match evidence, gaps, or risks without modeling Freshness as its own state.

### 8. Defer External Integrations

ATS integrations, Notion import or migration, LinkedIn scraping, automated outreach, calendar scheduling, authentication, billing, and multi-tenant SaaS infrastructure are all out of scope.

## Consequences

Positive consequences:

- Faster validation.
- Lower framework and infrastructure overhead.
- Easier agent-driven editing.
- Lower risk of overbuilding before customer validation.
- Lower privacy and deletion burden during early validation.
- Better focus on the Shortlist explanation experience.

Negative consequences:

- The prototype will not scale to large Talent Pools.
- No persistent multi-user product behavior initially.
- Recruiters cannot return to a previously uploaded Talent Pool without uploading again.
- Manual or semi-manual workflows may remain necessary during validation.
- Architecture will need to evolve if the idea validates.

## Revisit When

Revisit this decision when:

- At least 3 recruiters show strong pull.
- At least 1 recruiter completes a concierge test with real or anonymized data.
- Candidate files exceed what can be handled comfortably in memory.
- Privacy, persistence, or integrations become blockers for paid pilots.
