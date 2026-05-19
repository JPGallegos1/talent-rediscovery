# Recollect

Recollect helps recruiters preserve, enrich, retrieve, and reuse valuable candidate relationships over time. Its product promise is: never lose a great candidate again.

**Talent Rediscovery** remains the core capability inside Recollect: helping recruiters reuse existing candidate information by treating stored recruiting data as searchable recruiting memory.

## Language

**Talent Pool**:
A recruiter's existing set of **Candidate Records**, regardless of whether it lives in spreadsheets, ATS exports, notes, CV folders, or other semi-structured sources.
_Avoid_: candidate database, candidate base, talent database

**Candidate**:
A real person who may be considered for a role. In Recollect's persisted memory model, **Candidate** is the root identity object and should remain a minimal durable identity shell, not a copy of imported profile fields such as name, email, role, skills, location, or availability. The MVP may initially create one **Candidate** per imported row and flag possible duplicates, but it must not automatically merge identities without human confirmation.

**Candidate Record**:
An imported or captured source entry that represents available information about a **Candidate**; normalized as a hybrid of canonical fields and preserved non-canonical source fields. A **Candidate Record** is evidence about a **Candidate**, not the Candidate's durable identity, and should carry imported profile fields rather than promoting them all onto **Candidate**; missing-field indicators and search terms are derived aids, not durable domain concepts.

**Candidate Note**:
A durable recruiter-approved note attached to a **Candidate**, created from typed input, transcribed audio, imported notes, or other recruiter-provided context. A **Candidate Note** must store provenance, such as who created it, when, source input type, and whether the content was manual, imported, transcribed, or inferred. Proposed notes, raw transcripts, and inferred extractions are not **Candidate Notes** until confirmed by a human.

**Provenance**:
The source and confirmation context that explains where recruiting memory came from, who created or confirmed it, when it was captured, and whether uncertainty or staleness applies. Provenance separates source type, confirmation metadata, uncertainty, and staleness rather than collapsing them into one status.

**Search Request**:
The recruiter's natural-language description of the role or profile they want to find. When persisted, a **Search Request** should preserve the original text and the read-only **Search Criteria** interpretation used at that time.

**Search Criteria**:
The structured constraints interpreted from a **Search Request**, such as skills, seniority, location, industry, language level, and availability; visible for transparency but not manually editable in the MVP. If the interpretation is wrong, the recruiter revises the **Search Request** rather than editing criteria directly.

**Match**:
An evaluation of a **Candidate Record** against **Search Criteria**, optionally enriched by confirmed **Candidate Notes** attached to the same **Candidate**, including qualitative match strength, reasons, evidence, gaps, risks, and **Suggested Next Action**; evidence, gaps, and risks are sections of the **Match**, not standalone domain concepts in the MVP.

**Suggested Next Action**:
The recommended recruiter action after reviewing a **Match**, such as validating availability, preparing a recontact message, saving for later, or skipping.

**Shortlist**:
An ephemeral ordered list of **Matches** returned for a **Search Request**.

**Talent Pool File**:
A file uploaded by a recruiter that contains **Candidate Records**; CSV is the required MVP format, while Excel, Notion, and other tool-specific imports are out of scope unless they become validation blockers. In the MVP, a **Talent Pool File** is not a separate persisted domain object; source reference details are stored as provenance on **Candidate Records**.

**Voice Copilot**:
An optional interaction layer for the demo that lets recruiters create Search Requests, navigate or ask follow-up questions about a Shortlist and its Matches, and dictate proposed Candidate Notes; not a core domain concept. Audio commands, raw transcripts, and extracted note proposals are not durable memory until confirmed.

**Serenity**:
The named recruiting memory agent inside Recollect. Serenity helps recruiters retrieve, compare, explain, and reuse candidate knowledge with visible evidence and human control. Serenity is not the decision-maker, must not express preferences or feelings about Candidates, and must not evaluate a Candidate's general worth.

**Intelligence Layer**:
The AI-assisted interaction layer used by chat or Voice Copilot to create Search Requests, navigate Shortlists, explain or compare Matches, and request editable message drafts. It is not the source of truth for matching, does not modify Candidate Records, does not edit Search Criteria manually, and does not execute external actions.

**Memory Intelligence Layer**:
The AI-assisted memory layer used by Serenity to retrieve and reason over recruiting memory. It is auxiliary to Recollect's source of truth and must not become the canonical store for Candidate, Candidate Record, Candidate Note, or Search Request data.

**Candidate Memory Retrieval**:
The read-only retrieval of stored memory for a known **Candidate**, including relevant **Candidate Records**, **Candidate Notes**, provenance, history, and memory gaps. It is distinct from searching a **Talent Pool** for Matches.

In the current implemented interaction contract, the **Intelligence Layer** may request only these interaction actions: create a **Search Request**, navigate to a **Match**, explain a **Match**, compare existing **Matches**, request an editable message draft, and show interpreted **Search Criteria** as read-only information. Durable memory writes require separate Serenity memory actions with human confirmation.

Serenity memory actions are separate from the current **Intelligence Layer** interaction actions. Memory actions may retrieve Candidate memory, propose Candidate Notes, confirm Candidate Notes, show history or provenance, and identify memory gaps, but durable writes still require human confirmation.

## Relationships

- A **Talent Pool** contains many **Candidate Records**.
- A **Candidate** may have many **Candidate Records**.
- A **Candidate Record** provides source evidence about one **Candidate**.
- A **Candidate Record** preserves provenance for its imported or captured source, such as file reference, row number, creator, or import time when available.
- A **Candidate** may have many **Candidate Notes**.
- A proposed note becomes a **Candidate Note** only after human confirmation.
- **Candidate Records** and **Candidate Notes** should share a small common **Provenance** shape rather than inventing separate source metadata rules for each entity.
- A **Search Request** may be persisted as recruiting memory, but the resulting **Shortlist** and **Matches** remain derived unless a later workflow requires saved snapshots.
- Multiple **Candidate Records** may refer to the same **Candidate**, but the MVP does not automatically resolve identity.
- A recruiter searches a **Talent Pool** when a new role or **Search Request** appears.
- Serenity retrieves **Candidate Memory** when the recruiter asks what Recollect knows about a known **Candidate**.
- A **Search Request** can be interpreted into **Search Criteria**.
- Talent Rediscovery evaluates **Candidate Records** against **Search Criteria**, and may enrich **Matches** with confirmed **Candidate Notes** from the same **Candidate**.
- Evaluating a **Candidate Record** against **Search Criteria** produces a **Match**.
- A **Match** includes one **Suggested Next Action**.
- Talent Rediscovery returns a **Shortlist** from a **Talent Pool**.
- A **Voice Copilot** can operate on a **Search Request**, **Shortlist**, or **Match**, but it does not modify **Candidate Records** or execute external actions in the MVP.
- Audio input may create interaction actions or proposed notes, but only confirmed **Candidate Notes** become durable memory.
- The **Intelligence Layer** can assist interaction with **Search Requests**, **Shortlists**, and **Matches**, but Talent Rediscovery still evaluates **Candidate Records** against **Search Criteria** through evidence-grounded matching.
- Serenity can assist with persisted recruiting memory, but durable writes such as **Candidate Notes** require human confirmation and must remain transparent about source, uncertainty, and relevance.
- Serenity memory actions are separate from **Intelligence Layer** interaction actions because they can affect persisted recruiting memory.
- Searching a **Talent Pool** produces **Matches**; retrieving **Candidate Memory** returns contextual memory for a known **Candidate**.
- Confirmed **Candidate Notes** may contribute evidence to a **Match**, but unconfirmed proposals, raw transcripts, or inferred extractions must not affect match strength.

## Memory Boundaries

- Supabase is the planned source of truth for persisted recruiting memory.
- mem0 is a derived auxiliary retrieval and reasoning layer for Serenity, not the canonical record store.
- mem0 synchronization happens after Supabase persistence and must remain derived from confirmed canonical data.
- The first persisted memory slice is **Candidate**, **Candidate Record**, **Candidate Note**, and **Search Request**.
- **Shortlists** and **Matches** remain derived and temporary until recruiters need saved snapshots, sharing, auditing, or comparison history.
- Recollect should not store personal data beyond what is relevant to the role or recruiting relationship being considered.
- Serenity must make stored memory transparent: what is remembered, where it came from, whether it was imported, extracted, transcribed, inferred, confirmed, stale, incomplete, or uncertain.
- Serenity must prioritize safety of stored recruiting memory and avoid turning unconfirmed inferences into facts.
- Serenity should propose or store only recruiting-relevant memory such as skills, experience, role preferences, availability, seniority, work location preferences, contact preferences, and professional interaction history.
- Serenity must avoid storing sensitive or irrelevant personal data such as health, family status, religion, politics, appearance, personal finances, or protected attributes unless there is an explicit legitimate work-related reason and the recruiter confirms careful wording.
- Provenance for persisted recruiting memory should include separate axes for source type, source reference when available, creator, creation time, confirmer, confirmation time, uncertainty, and staleness when applicable.
- AI-assisted or inferred memory can become durable only after human confirmation, and its provenance must preserve that it originated as an inference or proposal with supporting evidence when available.
- Serenity may act without confirmation only for read-only or reversible actions such as retrieving memory, explaining provenance, showing memory gaps, or navigating UI.
- Serenity must require human confirmation before durable memory writes such as creating Candidate Notes, confirming inferred memory, updating provenance, or marking memory stale.
- Serenity must refuse external or high-risk actions such as sending messages, contacting Candidates, auto-merging identities, deleting memory, or storing irrelevant or sensitive personal data.

## Architecture Boundaries

- The monorepo is planned around `apps/admin`, `apps/api`, and `apps/memory`.
- `apps/admin` is the TanStack admin application and may use TanStack Start for frontend routing, SSR, server routes, or frontend-owned middleware, but it must not instantiate or directly import Supabase clients.
- `apps/api` is the only canonical Supabase access boundary for persisted recruiting memory and protects Supabase access from other apps.
- TanStack Start server routes or server functions in `apps/admin` are allowed only as frontend/BFF middleware; any secure or durable operation must delegate to `apps/api`.
- `apps/memory` is the Memory Intelligence Layer for Serenity-specific retrieval, extraction, enrichment, and reasoning work; it must not directly read from or write to Supabase.
- `apps/memory` returns proposals, extracted fields, summaries, retrieval context, or note candidates to `apps/api` instead of persisting durable facts.
- Durable writes to persisted recruiting memory must pass through `apps/api` and preserve confirmation, provenance, uncertainty, and relevance limits.

## Example Dialogue

> **Dev:** "When a recruiter uploads a spreadsheet, are they creating a new candidate database?"
> **Domain expert:** "Call it a **Talent Pool**. Recruiters already use that term, and the data may come from spreadsheets, ATS exports, CV folders, or notes."

> **Dev:** "If the same person appears twice in an uploaded file, do we have one Candidate or two?"
> **Domain expert:** "Potentially one **Candidate**, but two **Candidate Records**. For the MVP, flag obvious duplicates instead of trying to merge identities automatically."

> **Dev:** "When we persist the CSV data, should all normalized row fields become Candidate fields?"
> **Domain expert:** "No. Keep **Candidate** as a minimal identity object and persist imported or captured profile details as **Candidate Records**. A row is evidence about a person, not the durable truth of the person."

> **Dev:** "Should Candidate store the person's name or email from the first imported row?"
> **Domain expert:** "Not as durable identity truth in the MVP. Use Candidate as an identity shell and derive the visible label from Candidate Record evidence until a later confirmed identity workflow needs canonical identity fields."

> **Dev:** "If a recruiter says 'React profiles with fintech experience and good English', is that the criteria?"
> **Domain expert:** "The sentence is the **Search Request**. The extracted skills, industry, and language requirements are **Search Criteria**. Keep the original request visible because interpretation may be imperfect."

> **Dev:** "Is a Match just a Candidate Record in the shortlist?"
> **Domain expert:** "No. A **Match** is the evaluation of that **Candidate Record** for a specific **Search Request**. The same **Candidate Record** could be a strong Match for one search and weak for another."

> **Dev:** "Can Candidate Notes affect whether someone is a Match?"
> **Domain expert:** "Confirmed **Candidate Notes** can enrich a **Match** when they belong to the same **Candidate**, but the explanation must distinguish Candidate Record evidence from Candidate Note evidence and show provenance. Unconfirmed proposals or raw transcripts must not affect match strength."

> **Dev:** "Should Recontact Message be a core domain term?"
> **Domain expert:** "Not yet. Treat it as one possible **Suggested Next Action**. Other Matches may require validating availability, asking for an updated CV, saving for later, or skipping."

> **Dev:** "Should we model Freshness with states like fresh, warm, cold, and unknown?"
> **Domain expert:** "Not in the MVP. Treat stale availability, old contact dates, or missing updates as evidence, gaps, or risks inside a **Match**. Do not add a Freshness state yet."

> **Dev:** "Are Evidence, Gap, and Risk separate concepts?"
> **Domain expert:** "Not yet. They are required sections inside a **Match**. Model them separately only if the product later needs independent workflows around them."

> **Dev:** "Should a Shortlist be a saved snapshot of Matches?"
> **Domain expert:** "Not in the MVP. A **Shortlist** is just the ordered result returned for a **Search Request**. Do not persist Shortlists until recruiters need saving, sharing, auditing, or comparison workflows."

> **Dev:** "Should recruiters edit Search Criteria manually if interpretation is wrong?"
> **Domain expert:** "Not in the MVP. Show the interpreted **Search Criteria** for transparency, but let recruiters revise the **Search Request** instead of recreating a manual filter builder."

> **Dev:** "When persisting a Search Request, do we store only the text or also the interpreted criteria?"
> **Domain expert:** "Store the original **Search Request** text and the read-only **Search Criteria** interpretation used at that moment. Do not make the criteria manually editable; corrections happen by revising the Search Request."

> **Dev:** "Should the MVP require CSV and Excel upload from day one?"
> **Domain expert:** "No. Start CSV-first. Excel or tool-specific imports can be added later only if they become validation blockers."

> **Dev:** "Do we need to persist Talent Pool File as its own table?"
> **Domain expert:** "Not in the MVP. Store source reference details on **Candidate Records** as provenance. Add a separate file or import-batch object only when reimport, batch deletion, upload history, or audit workflows need it."

> **Dev:** "Should we support Notion imports because some recruiters may keep Talent Pools there?"
> **Domain expert:** "Not now. Do not add Notion import or migration in the MVP. The hard problem to account for is normalization, because every recruiter can bring a different CSV structure."

> **Dev:** "Should normalization force every CSV into a closed schema?"
> **Domain expert:** "No. Use a hybrid model: normalize obvious canonical fields for matching, but preserve non-canonical source fields. Flexible fields such as skills and unmapped source data can be stored as JSONB, while missing-field indicators and search terms can be recalculated unless performance later requires materializing them."

> **Dev:** "Should Match strength be a percentage score?"
> **Domain expert:** "Not in the MVP. Show qualitative labels such as Strong, Possible, and Weak. Percentages imply false precision when Candidate Records are incomplete or uncertain."

> **Dev:** "Should the MVP persist uploaded Talent Pools?"
> **Domain expert:** "The first prototype kept the uploaded **Talent Pool** in memory. For Recollect's next demo slice, persist recruiting memory in Supabase through **Candidate**, **Candidate Record**, **Candidate Note**, and **Search Request**. Keep **Shortlists** and **Matches** derived until recruiters need saved snapshots, sharing, auditing, or comparison history."

> **Dev:** "Can Serenity save a note from chat or audio?"
> **Domain expert:** "Yes, but durable **Candidate Notes** require human confirmation. Serenity should preserve provenance, avoid storing personal data beyond what is relevant to the role or recruiting relationship, and never turn unconfirmed inferences into facts."

> **Dev:** "Should Serenity's proposed note drafts be stored as Candidate Notes with a pending status?"
> **Domain expert:** "No. Treat proposed notes, raw transcripts, and inferred extractions as temporary proposals until a recruiter confirms the content. Only confirmed memory becomes a **Candidate Note**."

> **Dev:** "Should Candidate Records and Candidate Notes each have their own source metadata model?"
> **Domain expert:** "No. Use a small shared **Provenance** shape for persisted recruiting memory so Recollect can consistently explain where memory came from, who created or confirmed it, and whether uncertainty applies."

> **Dev:** "Should manual, imported, transcribed, inferred, confirmed, stale, and uncertain all be values of one provenance status?"
> **Domain expert:** "No. Those are different axes. Keep source type separate from confirmation metadata, and represent uncertainty or staleness without making them compete with how the memory was captured."

> **Dev:** "Can Serenity persist an inferred fact if it marks it as inferred?"
> **Domain expert:** "Not without human confirmation. An inferred or AI-assisted proposal may become durable memory only after the recruiter confirms it, and the provenance must still show that it originated as an inference with supporting evidence when available."

> **Dev:** "Can Serenity act autonomously if the recruiter intent is clear?"
> **Domain expert:** "Only for read-only or reversible actions. Durable memory writes require confirmation, and external or high-risk actions such as sending messages, deleting memory, or auto-merging identities must be refused in the MVP."

> **Dev:** "Should Serenity remember any personal detail if the recruiter says it out loud?"
> **Domain expert:** "No. Serenity should only propose or store memory relevant to the role or recruiting relationship, and should avoid sensitive or irrelevant personal data unless there is an explicit legitimate work-related reason and confirmed careful wording."

> **Dev:** "Is Voice Chat just another way to submit a Search Request?"
> **Domain expert:** "No. Treat it as a **Voice Copilot** interaction layer. It can create Search Requests, explain Matches, navigate to a Candidate Record, compare Matches, or prepare a message draft, but it should not become a core domain object or execute external actions in the MVP."

> **Dev:** "Should audio transcripts automatically become Candidate Notes?"
> **Domain expert:** "No. Audio can drive commands, Search Requests, or proposed Candidate Notes, but raw transcripts and extracted note proposals remain temporary until a recruiter confirms the durable note."

> **Dev:** "Should the Intelligence Layer replace the matching logic?"
> **Domain expert:** "No. The **Intelligence Layer** improves chat and voice interaction. Matching remains evidence-grounded in **Candidate Record** data, and AI must not become the source of truth for **Match** strength or claims."

> **Dev:** "Can the Intelligence Layer edit records or take action for the recruiter?"
> **Domain expert:** "No. The current interaction contract can request actions like navigating to a **Match** or preparing an editable draft, but it cannot edit **Candidate Records**, manually edit **Search Criteria**, send messages, save Shortlists, persist Talent Pools, or import external sources. Durable memory writes belong to separate Serenity memory actions and require human confirmation."

> **Dev:** "Should Serenity memory tools be added to the current Copilot action contract?"
> **Domain expert:** "No. Keep memory actions separate from the current **Intelligence Layer** interaction actions. Retrieving memory, proposing notes, confirming notes, showing provenance, and detecting memory gaps have different safety and confirmation requirements."

> **Dev:** "Should AI decide Matches as a black box from the start?"
> **Domain expert:** "No. Use AI where it helps the demo and interaction, but keep Matches evidence-grounded. A Match must be explainable from Candidate Record evidence, even if AI helps interpret the Search Request or power the Voice Copilot."

> **Dev:** "Is retrieving Candidate memory the same as searching the Talent Pool?"
> **Domain expert:** "No. Searching the **Talent Pool** evaluates **Candidate Records** against **Search Criteria** and returns **Matches**. Retrieving **Candidate Memory** is a read-only Serenity action for a known **Candidate**, returning records, notes, provenance, history, or gaps."

> **Dev:** "Can the Memory Intelligence Layer read or write Supabase directly?"
> **Domain expert:** "No. `apps/api` is the canonical Supabase boundary. `apps/memory` receives scoped context from `apps/api` and returns proposals or derived memory outputs; it does not persist durable recruiting memory directly."

## Flagged Ambiguities

- "candidate database" and "candidate base" were both used to mean **Talent Pool**. Resolved: use **Talent Pool** as the canonical domain term.
- "candidate" was used both for the real person and for rows in uploaded data. Resolved: use **Candidate** for the person and **Candidate Record** for the data entry.
- Imported profile fields could be mistaken for durable **Candidate** attributes. Resolved: keep **Candidate** minimal and store imported/captured profile evidence on **Candidate Records**.
- Candidate labels could be mistaken for confirmed identity fields. Resolved: derive visible Candidate labels from **Candidate Record** evidence in the MVP rather than storing imported names or emails as durable Candidate truth.
- "search" was used for both the recruiter's text and the system's interpreted constraints. Resolved: use **Search Request** for the original input and **Search Criteria** for interpreted constraints.
- "Freshness" was considered as a possible state model. Resolved: do not model it in the MVP; represent stale or missing update signals as **Match** evidence, gaps, or risks.
- "Shortlist" could mean either a live result or a saved snapshot. Resolved: in the MVP, a **Shortlist** is an ephemeral ordered list of **Matches**, not a persisted snapshot.
- Editable **Search Criteria** would pull the product back toward manual filters. Resolved: in the MVP, **Search Criteria** are visible but not manually editable; recruiters revise the **Search Request** instead.
- Upload format scope could expand too early. Resolved: CSV is required for the MVP; Excel, Notion, and other tool-specific imports are deferred unless they block validation.
- CSV-first does not mean uniform input. Resolved: Candidate Record normalization is a key MVP concern because each recruiter may bring a different CSV structure.
- Candidate Record normalization should not force a closed schema. Resolved: use a hybrid model with canonical fields for matching and preserved non-canonical source fields; flexible fields such as skills and unmapped source data can use JSONB.
- Derived parser and matching aids could be mistaken for persisted domain concepts. Resolved: missing-field indicators and search terms support retrieval/matching, but they are not durable domain concepts unless later performance needs require materialization.
- Numeric **Match** scores can imply false precision. Resolved: expose qualitative match strength labels in the MVP: Strong, Possible, and Weak.
- Persisting uploaded **Talent Pools** adds privacy, deletion, auth, and product-scope complexity. Superseded for Recollect's next demo slice: persist the minimum recruiting memory in Supabase through **Candidate**, **Candidate Record**, **Candidate Note**, and **Search Request**, while keeping **Shortlists** and **Matches** derived.
- **Candidate Notes** from chat or audio could blur transcription, recruiter input, and Serenity inference. Resolved: durable **Candidate Notes** require human confirmation, provenance, relevance limits, and transparent uncertainty.
- Provenance could fragment across records and notes. Resolved: use a small common **Provenance** shape for persisted recruiting memory, while allowing entity-specific source references where needed.
- Provenance status could mix unrelated meanings. Resolved: separate source type, confirmation metadata, uncertainty, and staleness instead of using one combined status enum.
- Voice interaction could be confused with core product behavior. Resolved: **Voice Copilot** is an optional demo interaction layer over Search Requests, Shortlists, and Matches, not a core domain concept.
- Audio note-taking could blur commands, transcripts, proposed notes, and durable memory. Resolved: audio can produce interaction actions or proposed notes, but only confirmed **Candidate Notes** become durable memory.
- AI matching could become an opaque black box. Resolved: the MVP may be AI-assisted, but every **Match** must be evidence-grounded in **Candidate Record** data.
- Retrieval could blur global search with candidate-specific memory. Resolved: searching a **Talent Pool** returns **Matches**, while **Candidate Memory Retrieval** returns memory for a known **Candidate**.
- "Intelligence Layer" could sound like product intelligence or matching automation. Resolved: in the MVP, the **Intelligence Layer** is only an interaction layer for chat and **Voice Copilot** over Search Requests, Shortlists, and Matches.
- Copilot actions could blur into automation. Resolved: allowed **Intelligence Layer** actions are limited to creating Search Requests, navigating to Matches, explaining or comparing Matches, requesting editable message drafts, and showing read-only Search Criteria.
- Direct Supabase access from `apps/memory` could blur derived reasoning with canonical persistence. Resolved: `apps/api` is the only canonical Supabase access boundary; `apps/memory` works from scoped context and returns proposals or derived outputs.
