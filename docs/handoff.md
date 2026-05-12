# Talent Rediscovery — Handoff

## 1. Working name

**Talent Rediscovery**

This is a temporary concept name. The product name is not final and should not block product, architecture, or validation work.

## 2. Core narrative

The current product thesis is:

> Recruiters already have talent in their databases, but they do not have a fast way to access, remember, and reuse that information when a new search appears.

A shorter version:

> Most recruiters do not have a lack-of-data problem. They have an access, memory, and data-reuse problem.

The product should focus on helping recruiters rediscover candidates they already have before they go out to source new ones.

## 3. Problem statement

Recruiters often have candidate information spread across Excel files, CSVs, Google Sheets, Notion databases, ATS exports, CV folders, old application forms, and other semi-structured sources.

Even when those candidates are valuable, the information is rarely reused because:

- the database is hard to search,
- the structure is inconsistent,
- filters are too rigid,
- candidate data is incomplete or stale,
- recruiters do not remember what is already in the database,
- reviewing profiles one by one creates too much friction.

The result is that each new search often starts almost from scratch, even when potentially good candidates already exist in the recruiter’s own Talent Pool.

## 4. Product thesis

Talent Rediscovery should make an existing Talent Pool feel like an active recruiting memory.

Instead of forcing recruiters to manually filter candidates by rigid fields, the recruiter should be able to describe what they need through text or an optional Voice Copilot. The system can show interpreted Search Criteria for transparency, but the MVP should not recreate a manual filter builder:

> “I need a Senior Backend Engineer in Bogotá, Python or Node, at least 4 years of experience, fintech or startup background, intermediate English, and availability within 30 days.”

The system should then search the normalized Talent Pool, return the best Matches, and explain why each Candidate Record is relevant.

The goal is not only to retrieve candidates, but to help the recruiter make a decision.

## 5. Strategic positioning

Talent Rediscovery should not be positioned as a generic “AI recruiting platform” or as a direct replacement for LinkedIn sourcing tools.

The sharper positioning is:

> Before searching for new candidates, ask the Talent Pool you already built.

Possible messaging directions:

- “Talk to your Talent Pool.”
- “Rediscover candidates you already have.”
- “Turn old spreadsheets into active recruiting memory.”
- “Find hidden Matches inside your own Talent Pool.”
- “Stop starting every search from zero.”

## 6. Differentiation from AI sourcing agents

Other tools may focus on external sourcing:

```text
Need candidate
→ Search LinkedIn and external databases
→ Filter candidates
→ Contact candidates
→ Follow up
→ Schedule interviews
```

Talent Rediscovery should focus first on internal candidate recovery:

```text
Need candidate
→ Upload or connect existing Talent Pool
→ Normalize Candidate Records
→ Submit a Search Request through text or optional Voice Copilot
→ Receive Shortlist of Matches
→ Understand Match reasons and gaps
→ Follow the Suggested Next Action
```

This is not primarily a “find new candidates on the internet” product. It is a “recover candidates you already have” product.

## 7. Initial target users

Potential initial users:

- freelance recruiters,
- small recruiting agencies,
- talent acquisition consultants,
- small HR teams,
- companies with candidate spreadsheets but weak ATS usage,
- recruiters who rely on Excel, Sheets, Notion, or manual candidate trackers.

The best early users are likely people who already feel the pain of having useful candidate data but not being able to reuse it efficiently.

## 8. Initial validation questions

The first validation interviews should not ask:

> “Would you use an AI recruiting agent?”

They should ask things like:

- “When a new search comes in, how do you check if you already have candidates?”
- “Where does your Talent Pool live today?”
- “Do you reuse old candidates often?”
- “What makes it hard to search your existing Talent Pool?”
- “How long does it take you to find viable candidates from your own data?”
- “Have you ever sourced externally and later realized you already had someone in your base?”
- “Would it help if you could submit a Search Request in natural language and receive a Shortlist from your existing Talent Pool?”
- “What would make you trust or distrust the recommendations?”

## 9. MVP goal

The MVP should validate this core moment:

```text
Recruiter uploads Talent Pool
→ Recruiter submits a Search Request through text or optional Voice Copilot
→ System returns a Shortlist of Matches
→ Each Match includes reasons, gaps, and data to validate
→ Recruiter can prepare a message draft when contact or recontact is the Suggested Next Action
```

The goal is to validate whether recruiters perceive value in querying their existing Talent Pool conversationally.

The MVP does not need to prove the final architecture.

## 10. MVP scope

### In scope for the first prototype

- Upload a CSV Talent Pool File.
- Parse and display Candidate Records.
- Normalize Candidate Records at a basic level.
- Allow the recruiter to submit a Search Request through text.
- Optionally add Voice Copilot as a demo interaction layer over Search Requests, Shortlists, and Matches.
- Return a ranked Shortlist of Matches.
- Explain why each Candidate Record matched.
- Highlight missing or uncertain information.
- Generate a simple editable message draft when contact or recontact is the Suggested Next Action.
- Produce a Loom demo.
- Use the demo for cold outreach and conversations with recruiters.

### Out of scope for the first prototype

- Full RAG architecture.
- Vector database.
- Long-term memory.
- ATS integrations.
- Direct Notion import or migration.
- LinkedIn scraping.
- Automated outreach.
- Automated follow-ups.
- Calendar scheduling.
- Multi-tenant SaaS architecture.
- Billing.
- Role-based permissions.
- Production-grade authentication.
- Complex candidate state machine.
- Final frontend framework decision.

## 11. Product behavior

The system should not only return a list of candidates. It should return a decision-support output.

Each Match should include:

```text
Candidate
Qualitative Match strength
Reasons for the Match
Evidence found in the Candidate Record
Gaps or missing information
Risks or validation points
Suggested Next Action
```

Example:

```text
María Gómez — Strong Match

Reasons:
- React and TypeScript appear in two recent roles.
- Worked in a fintech environment.
- English level is listed as advanced.
- Has previous remote work experience.

Gaps:
- No clear backend experience.
- Availability is not confirmed.

Suggested Next Action:
- Recontact to validate availability and interest.
```

## 12. Deferred Freshness state machine

A future candidate freshness model was discussed:

```text
fresh
warm
cold
unknown
```

This model is not valuable enough for the current stage and should not be implemented in the first prototype.

For now, it should remain documented in the ARD as a deferred concept.

Possible future meaning:

- `fresh`: recently updated or recently contacted.
- `warm`: updated within a reasonable period, but may require validation.
- `cold`: old or inactive record.
- `unknown`: no reliable date or activity signal.

The first prototype can simply surface stale availability, old contact dates, or missing updates as Match evidence, gaps, or risks.

## 13. Technical direction

### 13.1 Frontend framework decision

Do not choose a frontend framework in the first iteration.

Avoid starting with:

- Next.js,
- Astro,
- TanStack Start,
- Remix,
- or any other app framework.

Reasoning:

- The project is still validating product value.
- Framework conventions can add unnecessary context.
- Agent-written code benefits from simpler project shape.
- Browser primitives are easier for coding agents to inspect, modify, and reason about.
- The prototype should avoid premature routing, SSR, SSG, loader/action, and deployment decisions.
- The frontend should remain close to web fundamentals until the product shape is clearer.

The initial frontend can use:

- `index.html`,
- browser primitives,
- Web Components where useful,
- plain JavaScript or TypeScript,
- strict conventions for routing, rendering, state, and API calls.

This follows the idea described by Chris Tate:

> “Maybe we don’t start with a frontend framework. Maybe we start with an index.html, browser primitives, Web Components for reusable UI and a strict convention for how agents route, render, mutate state and handle data.”

### 13.2 Initial frontend structure

Possible initial structure:

```text
apps/prototype/
  index.html
  src/
    main.ts
    router.ts
    state.ts
    api-client.ts
    components/
      upload-candidates.ts
      search-console.ts
      voice-panel.ts
      match-results.ts
      candidate-card.ts
    services/
      parse-csv.ts
      normalize-candidates.ts
      match-candidates.ts
      realtime-session.ts
```

All file and directory names must use **kebab-case**.

Examples:

```text
candidate-card.ts
match-results.ts
normalize-candidates.ts
realtime-session.ts
upload-candidates.ts
```

Avoid:

```text
CandidateCard.ts
matchResults.ts
normalize_candidates.ts
RealtimeSession.ts
```

### 13.3 Package manager

Use **pnpm** as the package manager.

Do not use npm, yarn, or bun unless a future ARD explicitly changes this decision.

### 13.4 Node environment

Use **Node >= 24**.

Document this in the project setup files.

Possible future files:

```text
.nvmrc
package.json
```

Example `.nvmrc`:

```text
24
```

Example `package.json` field:

```json
{
  "engines": {
    "node": ">=24",
    "pnpm": ">=9"
  }
}
```

The pnpm version can be adjusted later depending on the local environment.

### 13.5 Voice Copilot

GPT Realtime can be used for the Voice Copilot, but voice should not be the only interaction mode.

The product should support:

```text
Text input
Optional Voice Copilot
```

Voice Copilot is a differentiating experience, especially for demos, but the product should still work by text because recruiters may not always be in a context where speaking to the app is natural. In the MVP, Voice Copilot may create Search Requests, navigate to Matches, explain Match evidence, compare Matches, and request message drafts. It must not modify Candidate Records, persist decisions, send outreach, or execute external actions.

### 13.6 No RAG in first prototype

The first prototype should not start with RAG, embeddings, or vector search. AI assistance is acceptable for Search Request interpretation, Voice Copilot interaction, explanation phrasing, and message drafting, but Matches must remain grounded in Candidate Record evidence.

For a small demo dataset, it is acceptable to:

```text
Upload file
→ Parse rows
→ Normalize candidates
→ Keep Candidate Records in memory
→ Use AI assistance only where it preserves evidence-grounded Matches
→ Return a reasoned Shortlist
```

This is not the final scalable architecture, but it is enough to validate the value proposition.

RAG, embeddings, vector databases, and memory should be considered only after early validation.

## 14. Architecture decision records

Create an initial ARD.

Recommended file:

```text
docs/architecture/ard-001-prototype-architecture.md
```

All directories and files must remain in kebab-case.

### ARD-001 suggested content

**Title:** Prototype architecture for Talent Rediscovery

**Status:** Proposed

**Context:**  
Recruiters have existing candidate data but struggle to access, remember, and reuse it. The first prototype should validate whether a conversational interface can retrieve useful candidates from uploaded files.

**Decisions:**

1. Start with CSV-first upload.
2. Avoid frontend framework in the first iteration.
3. Use browser primitives and Web Components where useful.
4. Use pnpm.
5. Use Node >= 24.
6. Support text-first interaction.
7. Add optional Voice Copilot if it does not delay validation.
8. Do not implement RAG, vector search, persistence, or long-term memory in the first prototype.
9. Explain all Matches.
10. Do not model Freshness in the MVP.
11. Defer external integrations.

**Consequences:**

- Faster prototype.
- Less framework overhead.
- Easier for agents to reason about the project.
- Less scalable in the short term.
- Architecture will need to evolve if the idea validates.

## 15. Suggested skill repositories

Two skill repositories were identified as useful, but they should not be installed wholesale at the beginning.

### 15.1 Matt Pocock skills

Repository:

```text
https://github.com/mattpocock/skills
```

These skills are more technically oriented and useful for software/product execution.

Initial skills to consider:

```text
/handoff
/to-prd
/to-issues
/grill-with-docs
/tdd
```

Do not install or use all skills at once. Start with the smallest useful subset.

### 15.2 Slavingia skills

Repository:

```text
https://github.com/slavingia/skills
```

These skills are useful for product validation, MVP thinking, marketing, and first customers.

Initial skills to consider:

```text
/validate-idea
/find-community
/mvp
/processize
/first-customers
/pricing
/marketing-plan
```

Again, do not install all skills initially. Use only the ones required for the current stage.

## 16. Suggested skill execution order

Recommended order:

### Step 1 — Handoff

Use Matt Pocock’s:

```text
/handoff
```

Goal:

- Convert this conversation and product thinking into a compact project context.
- Make it easy to continue in Codex.
- Avoid losing strategic decisions.

### Step 2 — Validate idea

Use Slavingia’s:

```text
/validate-idea
```

Goal:

- Stress-test the problem.
- Define validation assumptions.
- Prepare recruiter interview questions.
- Avoid building too much too soon.

### Step 3 — Find community

Use Slavingia’s:

```text
/find-community
```

Goal:

- Identify where recruiters, sourcers, and talent teams discuss pain points.
- Find possible places for outreach.
- Inform cold messages and positioning.

### Step 4 — MVP

Use Slavingia’s:

```text
/mvp
```

Goal:

- Reduce the scope aggressively.
- Define what must exist for the first Loom/demo.
- Decide what is intentionally excluded.

### Step 5 — Domain model and grill the concept

Use Matt Pocock’s:

```text
/grill-with-docs
```

Goal:

- Define core concepts:
  - candidate,
  - Talent Pool,
  - Search Request,
  - Search Criteria,
  - Match,
  - Match evidence,
  - Match gaps,
  - Shortlist,
  - Suggested Next Action,
  - stale or missing update signals as Match evidence, gaps, or risks.
- Challenge product and architecture assumptions.
- Identify hidden risks.
- Clarify edge cases.
- Avoid weak PRD assumptions.

### Step 6 — PRD

Use Matt Pocock’s:

```text
/to-prd
```

Goal:

- Convert the validated concept into a product requirements document.
- Include problem statement, user stories, out-of-scope, modules, and acceptance criteria.

### Step 7 — Issues

Use Matt Pocock’s:

```text
/to-issues
```

Goal:

- Break the PRD into actionable implementation tasks.

### Step 8 — TDD

Use Matt Pocock’s:

```text
/tdd
```

Goal:

- Introduce tests once the prototype scope is stable enough.
- Avoid over-testing before the product behavior is clear.

## 17. Recommended first project folder

Create a folder with a single context file first.

Example:

```text
talent-rediscovery/
  docs/
    handoff.md
```

Then let Codex use this file as the initial context before creating more files.

All future files should use kebab-case.

## 18. Suggested next files after handoff

After this handoff is created, the next files should likely be:

```text
docs/architecture/ard-001-prototype-architecture.md
docs/product/problem-statement.md
docs/product/validation-plan.md
docs/product/mvp-scope.md
docs/product/prd.md
```

These should not all be created immediately unless the selected skills require them.

## 19. Prototype user flow

Initial user flow:

```text
1. Recruiter opens the prototype.
2. Recruiter uploads a CSV Talent Pool File.
3. System parses the Candidate Records.
4. System asks recruiter to describe the search.
5. Recruiter types or speaks the desired profile.
6. System normalizes the request.
7. System evaluates Candidate Records.
8. System returns top Matches.
9. Each Match includes reasons, gaps, and validation points.
10. Recruiter asks follow-up questions or requests a message draft when contact or recontact is the Suggested Next Action.
```

## 20. Demo dataset

Before using real recruiter data, create a realistic synthetic dataset.

The dataset should include:

- candidate name,
- current role,
- skills,
- years of experience,
- location,
- English level,
- industries,
- availability,
- salary expectation if available,
- source,
- last contact date if available,
- notes.

The dataset should intentionally include imperfect data:

- missing English level,
- outdated last contact date,
- vague seniority,
- inconsistent skill names,
- duplicate candidates,
- unclear availability,
- mixed languages.

This makes the demo more realistic.

## 21. Loom demo structure

The Loom should tell a story, not just show features.

Suggested structure:

```text
1. Problem:
   Recruiters already have a Talent Pool, but it is hard to reuse.

2. Cost:
   Every new search starts almost from zero.

3. Demo:
   Upload a candidate spreadsheet.

4. Interaction:
   Ask for a candidate profile through text or optional Voice Copilot.

5. Output:
   Receive Matches, reasons, gaps, and Suggested Next Actions.

6. Vision:
   Turn old Talent Pools into active recruiting memory.
```

Suggested key line:

> Before searching for new candidates, ask the Talent Pool you already built.

## 22. Outreach strategy

Do not start by selling the app.

Start by validating the pain.

Possible message:

```text
Hola, [Nombre]. Estoy validando una idea para recruiters y agencias.

La hipótesis es simple: muchas veces ya tienen buenos candidatos en Excels, ATS o bases viejas, pero no vuelven a consultarlas porque buscar ahí consume demasiado tiempo.

Estoy armando una demo donde podés subir una base y preguntarle en lenguaje natural:
“Buscame perfiles React con inglés y experiencia fintech”
y el sistema devuelve una Shortlist explicada.

¿Te pasa este problema o en tu caso tu base actual sí es fácil de reutilizar?
```

## 23. Landing page concept

The first landing page should be simple and focused.

Possible English version:

```text
Headline:
Talk to your Talent Pool.

Subheadline:
Upload your old spreadsheets and rediscover candidates that already match your next search.

CTA:
Join the private beta.
```

Possible Spanish version:

```text
Headline:
Hablá con tu Talent Pool.

Subheadline:
Subí tus Excels o bases viejas y encontrá Matches para tus próximas búsquedas en minutos.

CTA:
Sumarme a la beta.
```

Sections:

```text
Problem
Solution
How it works
Who it is for
Private beta CTA
```

## 24. Key hypotheses

### Problem hypothesis

Recruiters have Talent Pools that are underused because searching and reusing them is too time-consuming.

### Value hypothesis

A conversational interface can reduce the time needed to find relevant candidates from existing data.

### Trust hypothesis

Recruiters need explanations, evidence, and gaps. A score alone is not enough.
The MVP should expose qualitative Match strength labels rather than percentage-style scores.

### Action hypothesis

After finding a Match, the next valuable action is captured as a Suggested Next Action, such as recontacting, validating missing data, skipping, or preparing a client-facing summary.

### Channel hypothesis

LinkedIn outreach and conversations with recruiter contacts are enough to generate early validation interviews.

### Technical hypothesis

A simple upload + text-first prototype with optional Voice Copilot can validate interest before introducing RAG, memory, vector databases, or integrations.

## 25. Open questions

Questions still unresolved:

- Is the strongest user segment freelance recruiters, small agencies, or internal HR teams?
- How big are typical Talent Pool files?
- What formats do recruiters actually use most often?
- How stale are their databases?
- Do they trust AI-assisted Match rankings?
- What level of explanation is required for trust?
- Would they upload real candidate data into an early tool?
- Would they prefer local/private processing for sensitive candidate data?
- Is Voice Copilot genuinely useful or mostly useful for demos?
- What is the first paid use case?
- Should the product charge per recruiter, per database, per search, or per agency?
- How much automation should happen after the Shortlist?

## 26. Immediate next steps

1. Save this handoff as:

```text
docs/handoff.md
```

2. Create the project folder.

```text
talent-rediscovery/
  docs/
    handoff.md
```

3. Install only the required skills.

Initial recommended subset:

```text
Matt Pocock:
- /handoff
- /to-prd
- /to-issues
- /grill-with-docs

Slavingia:
- /validate-idea
- /find-community
- /mvp
```

4. Create ARD-001.

```text
docs/architecture/ard-001-prototype-architecture.md
```

5. Run validation and MVP scoping before writing too much implementation code.

6. Build a synthetic Candidate Record dataset.

7. Vibe-code the first prototype.

8. Record a Loom.

9. Contact recruiters and validate the pain.

## 27. Guiding principle

Do not overbuild the AI system before validating the problem. Avoid opaque AI matching that cannot be explained from Candidate Record evidence.

The first goal is not to build the final recruiting intelligence architecture.

The first goal is to prove that this moment creates value:

```text
“I uploaded my Talent Pool, described what I needed, and found useful candidates I would otherwise have missed.”
```
