# Stitch UI Brief

Temporary brief for generating the next Talent Rediscovery UI direction in Stitch. This file can be deleted after the design direction has been used.

## Files To Provide

- `index.html`
- `src/prototype-shell.css`
- `src/prototype-shell.js`
- `CONTEXT.md`

## Product Context

Talent Rediscovery helps recruiters reuse existing candidate information by treating their stored candidate data as a searchable recruiting memory.

Use the project domain language consistently:

- Talent Pool
- Talent Pool File
- Candidate Record
- Search Request
- Search Criteria
- Match
- Shortlist
- Suggested Next Action
- Intelligence Layer
- Voice Copilot

## Target Stack

The next frontend will be rebuilt as:

- Vite
- TanStack Router
- TypeScript
- Tailwind

The current framework-free UI is only context for the existing flow. Do not assume the current visual style must be preserved.

## Desired Information Architecture

Design around these routes:

- `/`: main Copilot-driven recruiting cockpit.
- `/talent-pool`: CSV Talent Pool File upload and Candidate Record review table.
- `/matches/$matchId`: session-scoped Match detail view for a Match in the current ephemeral Shortlist.

The `/` cockpit should support a Copilot-first experience:

- Chat and Voice Copilot area, likely on the right side.
- Current Shortlist and Match workspace in the center.
- Ability to create or draft a Search Request from recruiter intent.
- Explicit action to run the Search Request before showing Matches.
- Read-only interpreted Search Criteria after execution.

The `/talent-pool` route should focus on:

- CSV Talent Pool File upload.
- Candidate Records in a table suitable for TanStack Table.
- Columns for row number, name, current role, location, years experience, skills, industries, English level, availability, last contact date, source, normalization gaps, and duplicate warnings when available.
- Optional source field expansion, but no editing.

The `/matches/$matchId` route should focus on one Match:

- Match strength: Strong, Possible, or Weak.
- Reasons.
- Candidate Record evidence.
- Gaps or missing information.
- Risks or validation points.
- Suggested Next Action.
- Editable message draft affordance only when the Suggested Next Action is contact/recontact-oriented.

## Hard Product Constraints

Do not design these as active MVP behaviors:

- Editing Candidate Records.
- Manually editing Search Criteria.
- Sending messages or outreach.
- Persisting Talent Pools.
- Saving Shortlists.
- External sync.
- ATS imports.
- Notion imports.
- Background revalidation.
- Numeric percentage Match scores.

Uploaded Talent Pools remain in memory for the MVP. Shortlists are ephemeral. Match claims must be grounded in Candidate Record evidence.

## UX Goals

The product should feel like a trustworthy recruiting cockpit, not a generic dashboard.

Prioritize:

- Trust and explainability.
- Clear separation between evidence, gaps, and risks.
- Fast understanding of why a Candidate Record is a Match.
- Copilot assistance that feels constrained and safe.
- Clear empty state when no Talent Pool File has been uploaded.
- Responsive desktop and mobile behavior.

Avoid:

- Generic SaaS dashboard sameness.
- Overpromising automation.
- Hiding evidence behind black-box AI language.
- UI that implies persisted records, real sync, or automatic outreach.
