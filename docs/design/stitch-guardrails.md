# Stitch Visual Fidelity Guardrails

Lightweight guardrails so future agents and contributors preserve the Stitch-based UI direction without reintroducing forbidden MVP behavior or contradicting the domain model.

---

## 1. Route Fidelity Expectations

### `/` Home — Empty State (first-time user, no Candidate Records)

| Expectation | Enforcement |
|---|---|
| Layout follows Stitch `home/` design: centered hero left canvas + Copilot panel right (380px) | Visual review |
| Hero shows `database_off` icon, "Your Talent Pool is Empty" heading, and description | Must not show SearchRequestForm or workspace UI |
| Upload CTA links to `/talent-pool` with prominent button + privacy note | Must not auto-upload |
| Steps bento grid (3 cards) visible for product education | Visual review |
| Copilot panel shows "Waiting for data" status + welcome message bubble | "Copilot requires a Talent Pool to function" footer |
| Copilot composer disabled with "Upload data to start chatting..." placeholder | Must not accept input |
| `SearchRequestForm` (textarea + submit) must NOT appear | Prohibited in empty state |

### `/` Home — Active Workspace (Candidate Records loaded)

| Expectation | Enforcement |
|---|---|
| Layout follows Stitch `copilot_cockpit_talent_rediscovery/`: workspace left + Copilot panel right (380px) | Visual review |
| Search Request execution is explicit via textarea + submit button | Must not auto-run on chat |
| Interpreted Search Criteria shown read-only with Primary Intent + Extracted Criteria chips | No inline editing |
| Shortlist Match cards show qualitative label only (Strong / Possible / Weak) | Must not reintroduce percentage scores |
| Match cards separate Evidence, Gaps/Risks, and Suggested Next Action into distinct areas | Visual review |
| Copilot panel uses chat bubble treatment with composer textarea (disabled until Chat Copilot is implemented) | Disabled affordances only |
| Empty Shortlist state guides to run a Search Request | Must not claim Matches without explicit execution |

### `/talent-pool` Talent Pool

| Expectation | Enforcement |
|---|---|
| CSV upload uses Stitch dropzone with dashed border + cloud icon + drag-and-drop | Must not add other intake methods |
| Table shows Candidate Records — not Candidates or Candidate profiles | Domain language |
| Columns: Name, Current Role, Location, Exp. (Yrs), Skills (chips), Status / Warnings, Source | Visual review |
| Status column uses color-coded badges: Validated (green), Duplicate Suspected (red), Normalization Gap (gray), Unknown (neutral) | Must not use generic indicators |
| Source values use CSV-safe language (e.g., "CSV Upload", "ATS Export CSV") | Must not show Greenhouse API, LinkedIn Scrape, etc. |
| Filter and Export buttons present as disabled affordances only | Active behavior out of scope |
| Pagination present as disabled affordance | Must not imply real pagination |
| No inline editing, real sync, background validation, or external import | Blocked by MVP boundary |

### `/matches/$matchId` Match Detail

| Expectation | Enforcement |
|---|---|
| Layout follows Stitch bento: header card + 8-col left evidence + 4-col right considerations/action | Visual review |
| Page is clearly session-scoped Match detail, not a persistent Candidate profile | Domain language |
| Strength badge uses qualitative label only (Strong / Possible / Weak) with color-coded styling | Must not reintroduce percentage scores |
| Evidence of Fit section uses verified-icon cards for each reason | Visual review |
| Candidate Record Evidence section shows matched fields with value + matched tag | Visual review |
| Considerations section splits into Points to Validate (risks) and Missing Information (gaps) | Visual review |
| Message draft area uses create-button-first then editable textarea; never auto-sends | Must not imply send action |
| Breadcrumb/back affordance links to Home cockpit with Search Request context | Must not link to persistent profiles |
| Empty / missing session context guides back to load Talent Pool + run Search Request | Must not show empty detail |

---

## 2. Required Domain Language Corrections

Applied from `docs/design/stitch/review.md`. Any future Stitch export or UI work must apply these corrections before committing code.

| Stitch Export | Required Replacement |
|---|---|
| RecruitAI | Talent Rediscovery |
| Dashboard | Home (route `/`) |
| Settings | Remove or disable |
| Notifications | Disable until explicitly implemented |
| `92% Match`, `88% Match` | Strong, Possible, Weak |
| Candidates added to shortlist | Matches returned in the Shortlist |
| Active Search Parameters | Interpreted Search Criteria |
| Extracted Entities | Search Criteria or concrete label |
| Candidate Profile / Full Profile | Candidate Record view |
| Greenhouse API, LinkedIn Scrape | CSV Upload, ATS Export CSV, Recruiter Notes CSV |
| Export (active) | Disable — out of MVP scope |
| Running the search against your talent pool now | Ready to run this Search Request (explicit execution) |
| Send / Send outreach | Create editable draft — Talent Rediscovery never sends outreach automatically |
| Regenerate Tone | (Omit or implement as requesting a new editable draft) |
| Last active: 2 days ago | Omit — session-scoped Match, not persistent profile |

---

## 3. Explicitly Prohibited MVP Behaviors

These must not appear as active functionality. They may appear as disabled affordances or future-placeholder text only.

- Active Export (any format)
- Real sync or background revalidation
- External import (Greenhouse, Notion, LinkedIn, ATS API)
- Send outreach or automated message delivery
- Persistent Candidate profiles or Full Profile views
- Percentage Match scores (`92%`, `88%`, etc.)
- Manual editing of Interpreted Search Criteria
- Inline editing of Candidate Records
- Candidate Record mutation from chat or Copilot
- Background data persistence or Talent Pool saving
- Real-time background status updates (e.g., "Validated", "Last active")

---

## 4. Tailwind Token Usage

Tokens are defined in `src/styles.css` and follow the Stitch/DESIGN.md palette.

### Color tokens

| Token | Value | Usage |
|---|---|---|
| `bg-paper` / `bg-background` | `#fbf9f3` | Page background |
| `text-ink` / `text-on-surface` | `#1b1c18` | Primary body text |
| `text-muted` / `text-on-surface-variant` | `#424848` | Secondary/muted text |
| `text-muted-soft` | `#737878` | Placeholder / disabled text |
| `text-slate` | `#293738` | Primary brand / headings |
| `bg-slate` | `#293738` | Primary button filled |
| `bg-slate-strong` | `#3f4e4f` | Button hover, primary-container |
| `bg-slate-soft` | `#d5e6e6` | Chip / badge background |
| `text-earth` | `#433128` | Accent / tertiary |
| `bg-earth-soft` | `#faddcf` | Chip background (earth) |
| `bg-surface-lowest` | `#ffffff` | Card / elevated surface |
| `bg-surface-low` | `#f6f3ed` | Subtle surface |
| `bg-surface` | `#f0eee8` | Default surface |
| `bg-surface-high` | `#eae8e2` | Header / hover surface |
| `bg-surface-highest` | `#e4e2dc` | Table header surface |
| `text-evidence` | `#2e5e3e` | Evidence / positive indicator |
| `bg-evidence-soft` | `#e2f1e6` | Evidence badge / chip |
| `text-risk` | `#ba1a1a` | Risk / error indicator |
| `bg-risk-soft` | `#ffdad6` | Risk badge / chip |
| `text-secondary-strong` | `#595f60` | Secondary indicator |
| `bg-secondary-soft` | `#dee4e3` | Secondary badge / chip |
| `border-outline-soft` | `#c2c7c7` | Subtle borders |

### Spacing patterns

| Pattern | Usage |
|---|---|
| `p-6` / `px-6 py-4` | Card padding |
| `gap-6` | Section spacing |
| `space-y-6` | Stack elements |
| `p-4` / `px-4 py-3` | Dense component padding |

### Shadow tokens

| Token | CSS | Usage |
|---|---|---|
| `shadow-stitch-card` | `0 4px 20px rgba(63,78,79,0.05)` | Cards, tables, sections |
| `shadow-stitch-panel` | `-4px 0 24px rgba(63,78,79,0.03)` | Right-side panel |

### Typography

| Class | Font | Weight | Size |
|---|---|---|---|
| `.font-serif` | Noto Serif | varies | varies |
| `.font-sans` | Plus Jakarta Sans | varies | varies |
| Heading L | `.font-serif text-[32px] font-semibold` | 600 | 32px |
| Heading M | `.font-serif text-2xl font-semibold` | 600 | 24px |
| Heading S | `.font-serif text-xl font-semibold` | 600 | 20px |
| Body | `.text-base leading-7` | 400 | 16px |
| Body small | `.text-sm leading-6` | 400 | 14px |
| Label | `.text-xs font-semibold uppercase tracking-wider` | 600 | 12px |

### Icons

Use Material Symbols Outlined (`material-symbols-outlined` class) for all icons. Key icons used across routes:

- `data_exploration` — Brand
- `cloud_upload` — Upload action
- `psychology` — Copilot / intelligence
- `group` — Talent Pool nav
- `verified` — Matches nav / evidence
- `tune` — Search Criteria
- `check_circle` — Evidence / strength badge
- `insights` — Evidence section
- `history` — Candidate Record evidence
- `balance` — Considerations
- `warning` — Risks / Points to Validate
- `help` — Gaps / Missing Info
- `forward_to_inbox` — Suggested Next Action
- `arrow_back` — Breadcrumb back
- `location_on` — Location display
- `search` — Search bar
- `notifications` — (disabled)
- `help_outline` — (disabled)
- `filter_list` — Filter (disabled)
- `download` — Export (disabled)
- `send` — Chat composer (disabled)
- `mic` — Voice Copilot (disabled)

---

## 5. Component Usage Conventions

Use inline Tailwind utilities rather than extracting components prematurely. The following patterns have been established:

- **Cards**: `rounded-xl border border-outline-soft/20 bg-surface-lowest p-6 shadow-stitch-card`
- **Buttons (primary)**: `rounded-lg bg-slate-strong px-4 py-3 text-sm font-bold text-white hover:bg-slate`
- **Buttons (disabled)**: Add `disabled:cursor-not-allowed disabled:bg-outline-soft`
- **Badges**: `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold`
- **Chips**: `rounded px-3 py-1 text-xs font-semibold`
- **Section headers**: `text-xs font-semibold uppercase tracking-[0.2em] text-earth` for eyebrow + heading below
- **Match strength badge**: Rounded-full with gap, icon + label. Colors per strength tier (evidence/soft, secondary-soft, risk-soft)
- **Dropzone**: `rounded-xl border-2 border-dashed border-outline-soft/40 p-8 text-center`
- **Table**: `w-full text-left` with `border-b border-outline-soft/20` rows, `bg-surface-container-low` for header row

---

## 6. Review Checklist

Before merging any UI change:

- [ ] No percentage Match scores introduced
- [ ] No "RecruitAI", "Dashboard", "Settings" labels
- [ ] No send outreach, persist, export, sync, or external import behavior added as active
- [ ] No inline editing of Candidate Records or Search Criteria
- [ ] Copilot does not auto-execute Search Requests
- [ ] Match detail is clearly session-scoped, not a persistent profile
- [ ] Source labels do not reference Greenhouse API, LinkedIn Scrape, etc.
- [ ] Empty states guide the recruiter (load Talent Pool → run Search Request)
- [ ] All /talent-pool table values use domain-correct field names
- [ ] Stitch `screen.png` or `code.html` exports are corrected for domain language before implementation
