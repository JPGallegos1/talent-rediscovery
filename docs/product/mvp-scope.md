# MVP Scope

## MVP Goal

Validate whether recruiters perceive value in querying an existing Talent Pool conversationally and receiving an explained Shortlist.

The MVP should prove one core moment:

> The recruiter uploads or shares a Talent Pool File, submits a Search Request, and finds useful candidates they would otherwise have missed.

## MVP Verdict

Build the smallest demoable workflow after initial conversations confirm the pain.

Before that, use a concierge workflow with real or anonymized data.

## Stage 1: Manual Concierge

### What It Does

For one recruiter and one role:

1. Receive a Talent Pool file or representative sample.
2. Receive a Search Request in natural language.
3. Produce an ephemeral Shortlist of Matches manually or semi-manually.
4. Explain reasons, evidence, gaps, risks, and Suggested Next Action.
5. Ask whether the result was useful enough to repeat or pay for.

### Tools

- Spreadsheet viewer.
- Manual analysis.
- AI assistance where useful for interpretation, Voice Copilot, or drafting, without allowing opaque Matches.
- Markdown or PDF report.

### Output

- 5 to 10 Matches.
- Qualitative Match strength: Strong, Possible, or Weak.
- Evidence from Candidate Records.
- Missing or uncertain information.
- Suggested validation question.
- Optional editable message draft when the Suggested Next Action is to contact or recontact.

## Stage 2: Weekend Demo Prototype

### Single Thing It Does

Upload a CSV Talent Pool file, ask for a profile in text, and return a ranked Shortlist of Matches with explanations.

### Required User Flow

1. Recruiter opens the prototype.
2. Recruiter uploads a CSV file.
3. Prototype parses and previews Candidate Records.
4. Recruiter types a Search Request.
5. Prototype returns a ranked Shortlist of Matches.
6. Each Match includes reasons, evidence, gaps, and a Suggested Next Action.
7. Recruiter can generate a simple editable message draft when the Suggested Next Action is to contact or recontact.

### In Scope

- CSV upload.
- CSV-first upload scope.
- Candidate table preview.
- Basic normalization of common fields.
- Tolerance for different recruiter CSV structures.
- Text Search Request input.
- Visible interpreted Search Criteria without manual filter editing.
- Small in-memory Candidate Record dataset.
- In-memory Talent Pool after upload.
- Match result cards.
- Match output with reasons, evidence, gaps, risks, and Suggested Next Action.
- Simple editable message draft generation when contact or recontact is the Suggested Next Action.
- Synthetic demo dataset with imperfect records.
- Loom demo script based on the core story.

### Optional Only If It Does Not Delay Validation

- Voice Copilot through GPT Realtime or equivalent browser voice interaction.
- Follow-up questions about the current Shortlist and Matches.

## Out Of Scope

- Full RAG architecture.
- Embeddings or vector database.
- Long-term memory.
- Excel upload unless it becomes a validation blocker.
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
- Persisted uploaded Talent Pools.
- Complex Candidate Record lifecycle state machine.
- Final frontend framework decision.
- Large-file processing.
- Enterprise privacy/compliance implementation.

## Weekend Build Constraint

If the prototype cannot be built in a weekend, cut scope in this order:

1. Remove Voice Copilot.
2. Do not add Excel support unless it becomes a validation blocker.
3. Remove follow-up interactions and keep one Search Request.
4. Remove persistence and keep the Shortlist in memory.
5. Remove styling polish and keep a clear functional interface.
6. Replace AI-assisted matching with deterministic evidence-grounded demo matching for the Loom.

## Candidate Data Shape

The demo dataset should include:

- Candidate name.
- Current role.
- Skills.
- Years of experience.
- Location.
- English level.
- Industries.
- Availability.
- Salary expectation if available.
- Source.
- Last contact date if available.
- Notes.

The dataset should intentionally include:

- Missing English levels.
- Outdated last contact dates.
- Vague seniority.
- Inconsistent skill names.
- Duplicate Candidate Records.
- Unclear availability.
- Mixed English and Spanish notes.

## Success Criteria

The MVP is successful if:

- A recruiter understands the value in under 2 minutes.
- A recruiter can map it to a real workflow they currently perform.
- The Shortlist includes at least one Match whose Candidate the recruiter considers worth contacting.
- The explanation format helps the recruiter trust or reject the recommendation.
- The recruiter asks to try it with their own data or another role.

## Initial Price Test

Start with a paid manual offer, not a full subscription:

- USD 25 to 100 for a one-role rediscovery report.
- USD 100 to 300 for a small Talent Pool audit and Shortlist package.

If recruiters refuse to pay anything for a manual result, do not assume software automation will fix the business model.
