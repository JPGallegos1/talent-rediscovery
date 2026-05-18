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
- Replace `Ready to run this Search Request` with auto-execution language such as `Evaluating Candidate Records against this Search Request` after recruiter intent is submitted and Candidate Records are loaded.
- Ensure the empty state for `/` is designed: Copilot can explain the product and draft a pending Search Request, but cannot create a real Shortlist without a loaded Talent Pool File.
- Ensure the `Draft Message` UI never implies sending. Prefer `Create editable draft` and supporting copy: `Talent Rediscovery never sends outreach automatically.`
- Remove `Regenerate Tone` unless it is implemented as requesting a new editable draft and remains review-only.

## Route-Specific Notes

### `/` Home — Empty State (first-time user)

Use `docs/design/stitch/home/` as the authoritative design for first-time users who have not yet loaded a Talent Pool.

Implementation translation:

- Full-page centered hero with `database_off` icon, "Your Talent Pool is Empty" heading, and description.
- Prominent "Upload Talent Pool (CSV)" CTA linking to `/talent-pool`.
- Privacy note: "Your data is processed in-memory only and remains strictly confidential."
- Steps bento grid (3 cards: Upload Data → Describe Need → Review Matches) for product education.
- Educational links at bottom ("Learn about Talent Rediscovery", "Privacy & Security").
- Right-side Copilot panel shows "Waiting for data" status and welcome message; input is disabled with "Upload data to start chatting..." placeholder.
- `SearchRequestForm` (text area + submit) must NOT appear in this state.

### `/` Home — Data Ready (Candidate Records loaded, no Search Request executed)

Use `docs/design/stitch/home/copilot_data_ready_no_search/` as the authoritative design for the state just after uploading a CSV Talent Pool File, before any Search Request has been executed.

Implementation translation:

- Hero card shows Candidate Record count prominently (e.g. "1,204 records ready to search").
- Secondary metric cards show useful indicators (normalized count, source file, session boundary).
- Suggested prompt chips appear as clickable shortcuts (e.g. "Find Senior Backend Engineers").
- No SearchRequestForm is visible in this state — the search is initiated from the Copilot chat.
- Right-side Copilot panel says "Data loaded successfully. I'm ready to help..." with an enabled textarea.
- Correct domain labels: no Enrichment Rate percentages, no ATS & LinkedIn sources, no Last Sync.

### `/` Home — Active Workspace (Candidate Records loaded, Search Request executed)

Use `docs/design/stitch/copilot_cockpit_talent_rediscovery/` as the design basis for users who have loaded a Talent Pool AND executed a Search Request. This state activates only after a Search Request produces a Shortlist.

Implementation translation:

- Main center area: current Search Request, read-only Interpreted Search Criteria, and current Shortlist.
- Right panel: Chat Copilot first; Voice Copilot controls can be present but may remain disabled until realtime is implemented.
- Navigation label should be `Home` or an equivalent product-home label, even if the visual export calls it `Copilot`.
- Search Request re-execution is available for refinement, but the initial intent originates from the Copilot chat.
- Match cards should show qualitative strength, reasons, evidence, gaps/risks summary, and Suggested Next Action.

### `/` Home — Error / Thinking / Tool Calling States

These temporary or error states apply to both the Data Ready and Active Workspace modes. The right-side Copilot panel changes its appearance based on the current state.

**Thinking state** (`docs/design/stitch/home/copilot_agent_thinking_state/`):
- Copilot bubble shows "Copilot is analyzing the Talent Pool" with animated dots.
- Progress bars indicate processing steps (check_circle for completed, hourglass for pending).
- Input textarea is disabled during processing with "Ask a follow-up question..." placeholder.

**Tool Calling state** (`docs/design/stitch/home/copilot_tool_calling_interaction/`):
- "Agent Activity" panel appears in the chat timeline when the AI calls Intelligence Layer tools.
- Each tool call shows the tool name, duration (e.g. "0.8s"), and JSON arguments.
- Completed tool calls show check_circle; in-progress calls show a spinner.
- Input textarea disabled with "AI is working..." placeholder. "Press Esc to cancel" hint.

**Client Error 4xx** (`docs/design/stitch/home/copilot_client_error_4xx/`):
- Copilot responds with a red-tinted error bubble: "I couldn't interpret that request."
- A rephrase suggestion example is shown inline.
- Left canvas may show suggested search cards to guide the recruiter.
- Textarea stays enabled for the recruiter to try again.

**Server Error 5xx** (`docs/design/stitch/home/copilot_server_error_5xx/`):
- Full-screen center canvas with cloud_off icon, "Unexpected Error (500)", and description.
- "Retry Connection" and "Return to Dashboard" buttons.
- Error trace details shown (ERR_INTEL_LAYER_TIMEOUT).
- Copilot sidebar shows "System Maintenance" with disabled input.

**Offline State** (`docs/design/stitch/home/copilot_offline_state/`):
- Copilot sidebar shows offline indicator.
- Input disabled with "Copilot is currently offline..." placeholder.
- "Connection lost" message with Retry button.
- No full-screen interruption — only the Copilot panel reflects the offline status.

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
