# Implementation Slices

## Source

Based on `docs/product/prd.md`.

These slices are local issue drafts because no project issue tracker is configured yet.

## Slice 1: Project Setup For Prototype

Type: AFK

Blocked by: None

User stories covered: 16

### What To Build

Set up the minimal prototype project structure with pnpm, Node >= 24 documentation, and a framework-free browser entry point.

### Acceptance Criteria

- [ ] Project has setup files documenting Node >= 24 and pnpm.
- [ ] Prototype has an `index.html` entry point.
- [ ] Prototype source files use kebab-case names.
- [ ] A local dev command starts the prototype.
- [ ] No frontend framework is introduced.

## Slice 2: Synthetic Candidate Record Dataset

Type: AFK

Blocked by: None

User stories covered: 14, 15

### What To Build

Create a realistic synthetic Candidate Record dataset that can be used for demos, tests, and the Loom flow without exposing real candidate data.

### Acceptance Criteria

- [ ] Dataset includes candidate name, role, skills, experience, location, English level, industries, availability, source, last contact date, and notes.
- [ ] Dataset includes imperfect records with missing, stale, duplicated, vague, and mixed-language data.
- [ ] Dataset can be loaded by the prototype.
- [ ] Dataset supports at least one compelling demo search.

## Slice 3: CSV Upload And Candidate Record Preview

Type: AFK

Blocked by: Slice 1

User stories covered: 1, 2, 3

### What To Build

Allow the recruiter to upload a CSV file, parse rows into Candidate Records, and preview the records before searching.

### Acceptance Criteria

- [ ] Recruiter can select a CSV file in the browser.
- [ ] Prototype parses rows into Candidate Records.
- [ ] Prototype displays a readable preview of parsed records.
- [ ] Uploaded Talent Pool remains in memory and is not persisted.
- [ ] Missing fields do not crash the preview.
- [ ] Invalid or unsupported files produce a clear error state.

## Slice 4: Candidate Record Normalization

Type: AFK

Blocked by: Slice 3

User stories covered: 3, 5, 9, 10

### What To Build

Normalize uploaded Candidate Records into a hybrid internal shape with canonical fields for matching and preserved source fields for non-canonical CSV data.

### Acceptance Criteria

- [ ] Common fields are normalized for search and display.
- [ ] Different recruiter CSV column names can map into the same normalized concept where obvious.
- [ ] Missing values remain visible as gaps.
- [ ] Unmapped source fields are not silently discarded if they may contain useful evidence.
- [ ] Skills can be represented flexibly rather than forced into a single string or flat list shape.
- [ ] The normalized shape can later map to canonical columns plus JSONB-style flexible fields if persistence is introduced.
- [ ] Inconsistent skill names can still be searched in a basic way.
- [ ] Stale or unknown last contact information is preserved.
- [ ] Normalization behavior is covered by tests once the test setup exists.

## Slice 5: Text Search Request

Type: AFK

Blocked by: Slice 3

User stories covered: 4, 5, 13

### What To Build

Provide a text input where the recruiter describes the target profile as a Search Request and submits it against uploaded Candidate Records.

### Acceptance Criteria

- [ ] Recruiter can type a natural-language Search Request.
- [ ] Prototype can display interpreted Search Criteria when extraction is available.
- [ ] Prototype does not allow granular manual editing of Search Criteria.
- [ ] Recruiter can revise the Search Request and submit it again.
- [ ] Search cannot run before a Talent Pool is available.
- [ ] Submitted search is visible in the UI.
- [ ] Empty Search Requests show a clear validation message.

## Slice 6: Ranked Shortlist With Explanations

Type: AFK

Blocked by: Slice 4, Slice 5

User stories covered: 6, 7, 8, 9, 10, 11

### What To Build

Return an ephemeral ranked Shortlist of Matches where each Match includes qualitative Match strength, reasons, evidence, gaps, risks, and Suggested Next Action.

### Acceptance Criteria

- [ ] Search returns a ranked Shortlist of Match cards.
- [ ] The Shortlist is not persisted as a snapshot.
- [ ] Each card includes qualitative Match strength: Strong, Possible, or Weak.
- [ ] No percentage-style Match score is exposed in the UI.
- [ ] Each card includes reasons for the Match.
- [ ] Each card includes evidence from the Candidate Record.
- [ ] Each Match is grounded in Candidate Record evidence rather than unsupported model output.
- [ ] Each card includes gaps or missing information.
- [ ] Each card includes risks or validation points.
- [ ] Each card includes a Suggested Next Action.
- [ ] The UI clearly distinguishes evidence from assumptions.

## Slice 7: Suggested Next Action Message Draft

Type: AFK

Blocked by: Slice 6

User stories covered: 12

### What To Build

Generate an editable message draft when a Match's Suggested Next Action is to contact or recontact the Candidate.

### Acceptance Criteria

- [ ] Recruiter can request a message draft from a Match whose Suggested Next Action is to contact or recontact.
- [ ] Message includes candidate context and role/search context.
- [ ] Message is editable.
- [ ] Message is not sent automatically.
- [ ] UI makes clear that the recruiter should review before using it.

## Slice 8: Loom Demo Flow

Type: HITL

Blocked by: Slice 2, Slice 6

User stories covered: 15

### What To Build

Prepare the prototype state, demo search, and script needed to record a Loom that tells the validation story clearly.

### Acceptance Criteria

- [ ] Demo starts with the problem: recruiters already have a Talent Pool but cannot reuse it easily.
- [ ] Demo uploads or loads the synthetic dataset.
- [ ] Demo asks one realistic Search Request.
- [ ] Demo shows explained Shortlist output.
- [ ] Demo can optionally show Voice Copilot navigating to a Match or asking why a Match is Strong, Possible, or Weak.
- [ ] Demo highlights reasons, evidence, gaps, and Suggested Next Actions.
- [ ] Demo closes with a validation ask for recruiters.

## Slice 9: Optional Voice Copilot Demo Layer

Type: HITL

Blocked by: Slice 6

User stories covered: 13, 15

### What To Build

Add an optional Voice Copilot demo layer that can create a Search Request, navigate the current Shortlist, explain a Match, compare Matches, and request an editable message draft without modifying Candidate Records or executing external actions.

### Acceptance Criteria

- [ ] Voice Copilot can turn speech into a Search Request.
- [ ] Voice Copilot can navigate to a specific Match or Candidate Record in the current Shortlist.
- [ ] Voice Copilot can answer follow-up questions using Match reasons, evidence, gaps, risks, and Suggested Next Action.
- [ ] Voice Copilot responses about Matches do not introduce claims unsupported by Candidate Record evidence.
- [ ] Voice Copilot can request an editable message draft when the Suggested Next Action is to contact or recontact.
- [ ] Voice Copilot cannot edit Search Criteria manually.
- [ ] Voice Copilot cannot modify Candidate Records.
- [ ] Voice Copilot cannot send outreach or execute external actions.

## Slice 10: Validation Outreach Tracker

Type: AFK

Blocked by: None

User stories covered: Product validation metrics

### What To Build

Create a lightweight tracker for recruiter conversations, outreach targets, strong-pull signals, concierge tests, and payment reactions.

### Acceptance Criteria

- [ ] Tracker captures segment, source, current workflow, pain intensity, data access, trust requirements, pricing reaction, and next action.
- [ ] Tracker supports at least 20 outreach targets.
- [ ] Tracker makes the 10-interview and 3-strong-signal gates visible.
- [ ] Tracker does not require a full CRM.

## Recommended Order

1. Slice 10: Validation Outreach Tracker.
2. Slice 2: Synthetic Candidate Record Dataset.
3. Slice 1: Project Setup For Prototype.
4. Slice 3: CSV Upload And Candidate Record Preview.
5. Slice 4: Candidate Record Normalization.
6. Slice 5: Text Search Request.
7. Slice 6: Ranked Shortlist With Explanations.
8. Slice 7: Suggested Next Action Message Draft.
9. Slice 8: Loom Demo Flow.
10. Slice 9: Optional Voice Copilot Demo Layer.

## Notes

Slice 10 can happen before code and should run in parallel with prototype work. If validation produces weak signals, stop before completing the full prototype.
