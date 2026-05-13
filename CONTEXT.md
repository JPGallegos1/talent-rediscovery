# Talent Rediscovery

Talent Rediscovery helps recruiters reuse existing candidate information by treating their stored candidate data as a searchable recruiting memory.

## Language

**Talent Pool**:
A recruiter's existing set of **Candidate Records**, regardless of whether it lives in spreadsheets, ATS exports, notes, CV folders, or other semi-structured sources.
_Avoid_: candidate database, candidate base, talent database

**Candidate**:
A real person who may be considered for a role.

**Candidate Record**:
An entry inside a **Talent Pool** that represents available information about a **Candidate**; normalized as a hybrid of canonical fields and preserved non-canonical source fields.

**Search Request**:
The recruiter's natural-language description of the role or profile they want to find.

**Search Criteria**:
The structured constraints interpreted from a **Search Request**, such as skills, seniority, location, industry, language level, and availability; visible for transparency but not manually editable in the MVP.

**Match**:
An evaluation of a **Candidate Record** against **Search Criteria**, including qualitative match strength, reasons, evidence, gaps, risks, and **Suggested Next Action**; evidence, gaps, and risks are sections of the **Match**, not standalone domain concepts in the MVP.

**Suggested Next Action**:
The recommended recruiter action after reviewing a **Match**, such as validating availability, preparing a recontact message, saving for later, or skipping.

**Shortlist**:
An ephemeral ordered list of **Matches** returned for a **Search Request**.

**Talent Pool File**:
A file uploaded by a recruiter that contains **Candidate Records**; CSV is the required MVP format, while Excel, Notion, and other tool-specific imports are out of scope unless they become validation blockers.

**Voice Copilot**:
An optional interaction layer for the demo that lets recruiters create Search Requests and navigate or ask follow-up questions about a Shortlist and its Matches; not a core domain concept.

**Intelligence Layer**:
The AI-assisted interaction layer used by chat or Voice Copilot to create Search Requests, navigate Shortlists, explain or compare Matches, and request editable message drafts. It is not the source of truth for matching, does not modify Candidate Records, does not edit Search Criteria manually, and does not execute external actions.

In the MVP, the **Intelligence Layer** may request only these interaction actions: create a **Search Request**, navigate to a **Match**, explain a **Match**, compare existing **Matches**, request an editable message draft, and show interpreted **Search Criteria** as read-only information.

## Relationships

- A **Talent Pool** contains many **Candidate Records**.
- A **Candidate Record** represents one **Candidate**.
- Multiple **Candidate Records** may refer to the same **Candidate**, but the MVP does not automatically resolve identity.
- A recruiter searches a **Talent Pool** when a new role or **Search Request** appears.
- A **Search Request** can be interpreted into **Search Criteria**.
- Talent Rediscovery evaluates **Candidate Records** against **Search Criteria**.
- Evaluating a **Candidate Record** against **Search Criteria** produces a **Match**.
- A **Match** includes one **Suggested Next Action**.
- Talent Rediscovery returns a **Shortlist** from a **Talent Pool**.
- A **Voice Copilot** can operate on a **Search Request**, **Shortlist**, or **Match**, but it does not modify **Candidate Records** or execute external actions in the MVP.
- The **Intelligence Layer** can assist interaction with **Search Requests**, **Shortlists**, and **Matches**, but Talent Rediscovery still evaluates **Candidate Records** against **Search Criteria** through evidence-grounded matching.

## Example Dialogue

> **Dev:** "When a recruiter uploads a spreadsheet, are they creating a new candidate database?"
> **Domain expert:** "Call it a **Talent Pool**. Recruiters already use that term, and the data may come from spreadsheets, ATS exports, CV folders, or notes."

> **Dev:** "If the same person appears twice in an uploaded file, do we have one Candidate or two?"
> **Domain expert:** "Potentially one **Candidate**, but two **Candidate Records**. For the MVP, flag obvious duplicates instead of trying to merge identities automatically."

> **Dev:** "If a recruiter says 'React profiles with fintech experience and good English', is that the criteria?"
> **Domain expert:** "The sentence is the **Search Request**. The extracted skills, industry, and language requirements are **Search Criteria**. Keep the original request visible because interpretation may be imperfect."

> **Dev:** "Is a Match just a Candidate Record in the shortlist?"
> **Domain expert:** "No. A **Match** is the evaluation of that **Candidate Record** for a specific **Search Request**. The same **Candidate Record** could be a strong Match for one search and weak for another."

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

> **Dev:** "Should the MVP require CSV and Excel upload from day one?"
> **Domain expert:** "No. Start CSV-first. Excel or tool-specific imports can be added later only if they become validation blockers."

> **Dev:** "Should we support Notion imports because some recruiters may keep Talent Pools there?"
> **Domain expert:** "Not now. Do not add Notion import or migration in the MVP. The hard problem to account for is normalization, because every recruiter can bring a different CSV structure."

> **Dev:** "Should normalization force every CSV into a closed schema?"
> **Domain expert:** "No. Use a hybrid model: normalize obvious canonical fields for matching, but preserve non-canonical source fields. If persistence is introduced later, flexible fields such as skills and unmapped source data can be stored as JSONB."

> **Dev:** "Should Match strength be a percentage score?"
> **Domain expert:** "Not in the MVP. Show qualitative labels such as Strong, Possible, and Weak. Percentages imply false precision when Candidate Records are incomplete or uncertain."

> **Dev:** "Should the MVP persist uploaded Talent Pools?"
> **Domain expert:** "No. Keep the uploaded **Talent Pool** in memory for the first prototype. Persist only after recruiters need returning sessions, collaboration, saved work, or paid pilots with stronger privacy requirements."

> **Dev:** "Is Voice Chat just another way to submit a Search Request?"
> **Domain expert:** "No. Treat it as a **Voice Copilot** interaction layer. It can create Search Requests, explain Matches, navigate to a Candidate Record, compare Matches, or prepare a message draft, but it should not become a core domain object or execute external actions in the MVP."

> **Dev:** "Should the Intelligence Layer replace the matching logic?"
> **Domain expert:** "No. The **Intelligence Layer** improves chat and voice interaction. Matching remains evidence-grounded in **Candidate Record** data, and AI must not become the source of truth for **Match** strength or claims."

> **Dev:** "Can the Intelligence Layer edit records or take action for the recruiter?"
> **Domain expert:** "No. It can request interaction actions like navigating to a **Match** or preparing an editable draft, but it cannot edit **Candidate Records**, manually edit **Search Criteria**, send messages, save Shortlists, persist Talent Pools, or import external sources."

> **Dev:** "Should AI decide Matches as a black box from the start?"
> **Domain expert:** "No. Use AI where it helps the demo and interaction, but keep Matches evidence-grounded. A Match must be explainable from Candidate Record evidence, even if AI helps interpret the Search Request or power the Voice Copilot."

## Flagged Ambiguities

- "candidate database" and "candidate base" were both used to mean **Talent Pool**. Resolved: use **Talent Pool** as the canonical domain term.
- "candidate" was used both for the real person and for rows in uploaded data. Resolved: use **Candidate** for the person and **Candidate Record** for the data entry.
- "search" was used for both the recruiter's text and the system's interpreted constraints. Resolved: use **Search Request** for the original input and **Search Criteria** for interpreted constraints.
- "Freshness" was considered as a possible state model. Resolved: do not model it in the MVP; represent stale or missing update signals as **Match** evidence, gaps, or risks.
- "Shortlist" could mean either a live result or a saved snapshot. Resolved: in the MVP, a **Shortlist** is an ephemeral ordered list of **Matches**, not a persisted snapshot.
- Editable **Search Criteria** would pull the product back toward manual filters. Resolved: in the MVP, **Search Criteria** are visible but not manually editable; recruiters revise the **Search Request** instead.
- Upload format scope could expand too early. Resolved: CSV is required for the MVP; Excel, Notion, and other tool-specific imports are deferred unless they block validation.
- CSV-first does not mean uniform input. Resolved: Candidate Record normalization is a key MVP concern because each recruiter may bring a different CSV structure.
- Candidate Record normalization should not force a closed schema. Resolved: use a hybrid model with canonical fields for matching and preserved non-canonical source fields; if persistence is introduced later, flexible fields such as skills and unmapped source data can use JSONB.
- Numeric **Match** scores can imply false precision. Resolved: expose qualitative match strength labels in the MVP: Strong, Possible, and Weak.
- Persisting uploaded **Talent Pools** adds privacy, deletion, auth, and product-scope complexity. Resolved: keep the **Talent Pool** in memory for the MVP.
- Voice interaction could be confused with core product behavior. Resolved: **Voice Copilot** is an optional demo interaction layer over Search Requests, Shortlists, and Matches, not a core domain concept.
- AI matching could become an opaque black box. Resolved: the MVP may be AI-assisted, but every **Match** must be evidence-grounded in **Candidate Record** data.
- "Intelligence Layer" could sound like product intelligence or matching automation. Resolved: in the MVP, the **Intelligence Layer** is only an interaction layer for chat and **Voice Copilot** over Search Requests, Shortlists, and Matches.
- Copilot actions could blur into automation. Resolved: allowed **Intelligence Layer** actions are limited to creating Search Requests, navigating to Matches, explaining or comparing Matches, requesting editable message drafts, and showing read-only Search Criteria.
