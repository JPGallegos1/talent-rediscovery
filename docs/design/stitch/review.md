# Stitch Design Review

Review of Stitch exports in `docs/design/stitch/` against `CONTEXT.md` and `docs/adr/0001-tanstack-frontend-shell.md`.

Stitch is a visual starting point only. `CONTEXT.md`, the ADRs, and the current domain implementation remain the source of truth for product language, behavior, scope, and data boundaries. When Stitch-generated UI conflicts with the project domain model, keep the visual pattern and replace the incorrect product behavior or terminology.

## Keep

- The overall Corporate Modern / Editorial visual direction from `DESIGN.md` fits the product better than a generic SaaS dashboard.
- The warm paper background, slate/earth palette, and Noto Serif + Plus Jakarta Sans pairing are good candidates for Tailwind theme tokens.
- The `/` cockpit layout direction is useful: main Shortlist workspace plus a right-side Copilot panel.
- The `/talent-pool` table layout is a good basis for TanStack Table.
- The `/matches/$matchId` detail layout is a good basis for evidence, gaps, risks, and Suggested Next Action.
- The right-column detail treatment in the Match page is useful for keeping validation points visible.

## Required Corrections Before Implementation

- Rename product labels from `RecruitAI` to `Talent Rediscovery`.
- Replace `Dashboard` navigation with domain routes that exist in the ADR: `/`, `/talent-pool`, and `/matches/$matchId` when session context exists.
- Treat the Stitch `Copilot` tab as the product Home route `/`, not as a separate `/copilot` page.
- Remove or disable `Settings`, `Notifications`, and generic account/profile affordances unless needed for visual framing only.
- Replace all percentage Match scores such as `92% Match` or `88% Match` with qualitative labels: `Strong`, `Possible`, or `Weak`.
- Replace `candidates added to shortlist` with `Matches returned in the Shortlist`; a Shortlist contains Matches, not Candidates.
- Replace `Active Search Parameters` with `Interpreted Search Criteria` and keep it read-only.
- Replace `Extracted Entities` with `Search Criteria` or concrete criteria labels.
- Avoid `Candidate Profile`, `Full Profile`, or profile-avatar language unless it is clearly a Candidate Record view. The MVP works with Candidate Records, not full candidate profiles.
- Remove `Greenhouse API`, `LinkedIn Scrape`, and any source examples that imply ATS/API/scraping integrations. Use CSV-safe examples such as `CSV Upload`, `ATS Export CSV`, `Recruiter Notes CSV`, or `Legacy Spreadsheet`.
- Remove `Export` as an active action in `/talent-pool`; exporting is not in MVP scope.
- Remove real `sync`, `validated`, `last active`, and background revalidation language unless clearly disabled/future-only.
- Replace `Running the search against your talent pool now` with language that preserves explicit execution, such as `Ready to run this Search Request` before the user confirms.
- Ensure the empty state for `/` is designed: Copilot can explain the product and draft a pending Search Request, but cannot create a real Shortlist without a loaded Talent Pool File.
- Ensure the `Draft Message` UI never implies sending. Prefer `Create editable draft` and supporting copy: `Talent Rediscovery never sends outreach automatically.`
- Remove `Regenerate Tone` unless it is implemented as requesting a new editable draft and remains review-only.

## Route-Specific Notes

### `/` Home / Copilot Cockpit

Use the `copilot_cockpit_talent_rediscovery` layout as the strongest starting point, but correct the domain language.

Implementation translation:

- Main center area: current Search Request, read-only Search Criteria, and current Shortlist.
- Right panel: Chat Copilot first; Voice Copilot controls can be present but may remain disabled until realtime is implemented.
- Navigation label should be `Home` or an equivalent product-home label, even if the visual export calls it `Copilot`.
- Search Request creation should be explicit: chat can draft or propose a Search Request, but building a Shortlist requires a clear run action.
- Match cards should show qualitative strength, reasons, evidence, gaps/risks summary, and Suggested Next Action.

### `/talent-pool`

Use `talent_pool_candidate_records` as a structural basis, not as-is.

Implementation translation:

- CSV Talent Pool File upload remains the only active intake.
- Table should show Candidate Records, not Candidates.
- Columns should include row number, name, current role, location, years experience, skills, industries, English level, availability, last contact date, source, normalization gaps, and duplicate warnings when available.
- Source field expansion is allowed; inline editing, export, real sync, ATS import, and background validation are not.

### `/matches/$matchId`

Use `match_detail_candidate_analysis` as a strong layout basis after scope corrections.

Implementation translation:

- The page is a session-scoped Match detail, not a persistent candidate profile.
- Header should show Candidate Record display fields plus qualitative Match strength.
- Main sections should map directly to Match fields: reasons, Candidate Record evidence, gaps, risks, and Suggested Next Action.
- Message drafting remains editable and review-only; no send action.

## DESIGN.md Notes

- `DESIGN.md` is useful as a temporary design-token source and visual direction document.
- Move its token values into Tailwind config during implementation instead of importing Stitch's CDN config directly.
- Keep the design language, but do not copy external image URLs or generated avatar assets into product code.
- The missing `executive_talent_intelligence` folder only contributed `DESIGN.md`, which now exists at the repository root. No additional export is needed for the current visual review.
