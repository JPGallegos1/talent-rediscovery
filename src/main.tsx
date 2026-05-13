import { createRoute, createRootRoute, createRouter, Link, Outlet, RouterProvider } from "@tanstack/react-router";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { createRoot } from "react-dom/client";
import { parseCsvTalentPool, type CandidateRecord } from "./csv-candidate-records.js";
import { canDraftMessageFromSuggestedNextAction, draftMessageFromMatch } from "./message-draft.js";
import { interpretSearchCriteria, type SearchCriteria } from "./search-criteria.js";
import { buildShortlist, type Match } from "./shortlist-matches.js";
import "./styles.css";

type AppSession = {
  talentPoolFileName: string | null;
  candidateRecordCount: number;
  candidateRecords: CandidateRecord[];
  searchRequest: string;
  searchCriteria: SearchCriteria | null;
  shortlist: Match[];
  selectedMatchId: string | null;
  copilotTranscript: { speaker: "recruiter" | "copilot"; text: string }[];
};

type AppSessionContextValue = {
  session: AppSession;
  setSession: Dispatch<SetStateAction<AppSession>>;
};

const initialSession: AppSession = {
  talentPoolFileName: null,
  candidateRecordCount: 0,
  candidateRecords: [],
  searchRequest: "",
  searchCriteria: null,
  shortlist: [],
  selectedMatchId: null,
  copilotTranscript: [
    {
      speaker: "copilot",
      text: "Load a CSV Talent Pool File, then run a Search Request to create an evidence-grounded Shortlist.",
    },
  ],
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

function AppSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession>(initialSession);
  const value = useMemo(() => ({ session, setSession }), [session]);

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

function useAppSession() {
  const value = useContext(AppSessionContext);

  if (!value) {
    throw new Error("useAppSession must be used inside AppSessionProvider");
  }

  return value;
}

function RootLayout() {
  return (
    <AppSessionProvider>
      <div className="min-h-screen bg-paper text-ink lg:h-screen lg:overflow-hidden">
        <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
          <SideNav />

          <div className="flex min-w-0 flex-1 flex-col lg:ml-[280px]">
            <TopAppBar />
            <MobileNav />
            <main className="custom-scrollbar min-w-0 flex-1 overflow-y-auto bg-paper px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </AppSessionProvider>
  );
}

function SideNav() {
  return (
    <aside className="hidden h-screen w-[280px] shrink-0 flex-col border-r border-outline-soft/40 bg-surface px-4 py-6 lg:fixed lg:left-0 lg:top-0 lg:z-20 lg:flex">
      <Link to="/" className="flex items-center gap-3 px-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-slate-strong text-white">
          <span className="material-symbols-outlined text-[24px]">data_exploration</span>
        </span>
        <span>
          <span className="block font-serif text-2xl font-bold leading-7 text-slate">Talent Rediscovery</span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Recruiting memory</span>
        </span>
      </Link>

      <Link
        to="/talent-pool"
        className="mt-12 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-strong px-4 py-3 text-sm font-bold text-white transition hover:bg-slate"
      >
        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
        Upload Talent Pool
      </Link>

      <nav className="mt-8 grid gap-2 text-sm font-semibold">
        <NavLink to="/" label="Home" icon="psychology" />
        <NavLink to="/talent-pool" label="Talent Pool" icon="group" />
        <span className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted/70" aria-disabled="true">
          <span className="material-symbols-outlined">verified</span>
          Matches
        </span>
      </nav>

      <div className="mt-auto border-t border-outline-soft/50 pt-5">
        <p className="px-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">MVP boundary</p>
        <p className="mt-2 px-4 text-sm leading-6 text-muted">
          In-memory Talent Pools, ephemeral Shortlists, no external actions.
        </p>
      </div>
    </aside>
  );
}

function TopAppBar() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-outline-soft/40 bg-paper/90 px-5 shadow-sm backdrop-blur-md sm:px-8 lg:px-10">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold text-slate lg:hidden">
          <span className="material-symbols-outlined text-[24px]">data_exploration</span>
          Talent Rediscovery
        </Link>
        <label className="relative hidden w-full max-w-md md:block" htmlFor="workspace-search">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft">search</span>
          <input
            id="workspace-search"
            className="w-full rounded-full border border-outline-soft/40 bg-surface-low py-2 pl-10 pr-4 text-sm text-muted outline-none"
            placeholder="Search current session..."
            readOnly
          />
        </label>
      </div>

      <div className="flex items-center gap-3 text-muted">
        <span className="hidden rounded-full bg-surface-high px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] sm:inline-flex">Demo session</span>
        <button type="button" className="rounded-full p-2 text-muted-soft" disabled aria-label="Notifications unavailable in MVP">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button type="button" className="rounded-full p-2 text-muted-soft" disabled aria-label="Help unavailable in MVP">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
        <div className="flex size-8 items-center justify-center rounded-full border border-outline-soft/60 bg-earth-strong text-xs font-bold text-white" aria-hidden="true">
          TR
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-outline-soft/40 bg-surface px-5 py-3 text-sm font-semibold sm:px-8 lg:hidden">
      <NavLink to="/" label="Home" icon="psychology" compact />
      <NavLink to="/talent-pool" label="Talent Pool" icon="group" compact />
    </nav>
  );
}

function NavLink({ to, label, icon, compact = false }: { to: "/" | "/talent-pool"; label: string; icon: string; compact?: boolean }) {
  return (
    <Link
      to={to}
      className={[
        "flex items-center gap-3 rounded-lg text-muted transition hover:bg-surface-high hover:text-slate [&.active]:border-l-4 [&.active]:border-earth [&.active]:bg-surface-high/70 [&.active]:font-bold [&.active]:text-slate",
        compact ? "shrink-0 px-3 py-2 [&.active]:pl-2" : "px-4 py-3 [&.active]:pl-3",
      ].join(" ")}
      activeOptions={{ exact: to === "/" }}
    >
      <span className="material-symbols-outlined">{icon}</span>
      {label}
    </Link>
  );
}

function HomeRoute() {
  const { session, setSession } = useAppSession();
  const [draftSearchRequest, setDraftSearchRequest] = useState(session.searchRequest);
  const [searchStatus, setSearchStatus] = useState("Load a Talent Pool File before running a Search Request.");
  const hasTalentPool = session.candidateRecordCount > 0;

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasTalentPool) {
      setSearchStatus("Upload a Talent Pool File before running a Search Request.");
      return;
    }

    const searchRequest = draftSearchRequest.trim();

    if (!searchRequest) {
      setSearchStatus("Enter a Search Request before running the search.");
      return;
    }

    const searchCriteria = interpretSearchCriteria(searchRequest);
    const shortlist = buildShortlist(session.candidateRecords, searchCriteria);

    setSession((current) => ({
      ...current,
      searchRequest,
      searchCriteria,
      shortlist,
      selectedMatchId: null,
    }));
    setSearchStatus(`Search Request run. Returned ${shortlist.length} Matches in the Shortlist.`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-earth">Home cockpit</p>
            <h2 className="mt-2 font-serif text-[32px] font-semibold leading-10 tracking-[-0.01em] text-slate">
              Talent Discovery Workspace
            </h2>
            <p className="mt-2 text-base leading-7 text-muted">Draft intent, review criteria, and uncover evidence-grounded Matches.</p>
          </div>
          {hasTalentPool ? (
            <span className="hidden rounded-full bg-surface-high px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted sm:inline-flex">
              {session.candidateRecordCount} Candidate Records
            </span>
          ) : null}
        </div>

        <SearchRequestForm
          draftSearchRequest={draftSearchRequest}
          onDraftChange={setDraftSearchRequest}
          searchStatus={searchStatus}
          hasTalentPool={hasTalentPool}
          onSubmit={handleSearchSubmit}
        />

        <SearchCriteriaPanel searchCriteria={session.searchCriteria} searchRequest={session.searchRequest} />

        <ShortlistSection matches={session.shortlist} />
      </div>

      <CopilotPanel />
    </div>
  );
}

function SearchRequestForm({
  draftSearchRequest,
  onDraftChange,
  searchStatus,
  hasTalentPool,
  onSubmit,
}: {
  draftSearchRequest: string;
  onDraftChange: (value: string) => void;
  searchStatus: string;
  hasTalentPool: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="rounded-xl border border-outline-soft/20 bg-surface-lowest p-6 shadow-stitch-card">
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-earth">Search Request</p>
          <h3 className="mt-2 font-serif text-xl font-semibold text-slate">Describe the profile you need</h3>
          <p className="mt-2 text-sm leading-6 text-muted">
            The Copilot can help draft recruiter intent, but building a Shortlist requires an explicit run action.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-slate" htmlFor="search-request">
          Search Request
          <textarea
            id="search-request"
            className="min-h-28 rounded-xl border border-outline-soft/30 bg-surface-lowest p-4 text-base font-normal leading-7 text-ink outline-none transition focus:border-slate"
            placeholder='Example: "Senior React profiles with fintech experience, good English, remote Colombia"'
            value={draftSearchRequest}
            onChange={(event) => onDraftChange(event.target.value)}
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted" aria-live="polite">
            {searchStatus}
          </p>
          {hasTalentPool ? (
            <button type="submit" className="rounded-lg bg-slate-strong px-4 py-3 text-sm font-bold text-white transition hover:bg-slate">
              Run Search Request
            </button>
          ) : (
            <Link to="/talent-pool" className="rounded-lg bg-slate-strong px-4 py-3 text-sm font-bold text-white transition hover:bg-slate">
              Load Talent Pool File
            </Link>
          )}
        </div>
      </form>
    </section>
  );
}

function SearchCriteriaPanel({
  searchCriteria,
  searchRequest,
}: {
  searchCriteria: SearchCriteria | null;
  searchRequest: string;
}) {
  if (!searchCriteria || Object.keys(searchCriteria).length === 0) {
    return null;
  }

  const entities: { label: string; value: string; color: string }[] = [];

  if (searchCriteria.skills && searchCriteria.skills.length > 0) {
    entities.push({ label: `Skills: ${searchCriteria.skills.join(", ")}`, value: "skill", color: "slate" });
  }
  if (searchCriteria.seniority) {
    entities.push({ label: `Seniority: ${searchCriteria.seniority}`, value: "seniority", color: "slate" });
  }
  if (searchCriteria.location && searchCriteria.location.length > 0) {
    entities.push({ label: `Location: ${searchCriteria.location.join(", ")}`, value: "location", color: "slate" });
  }
  if (searchCriteria.industry && searchCriteria.industry.length > 0) {
    entities.push({ label: `Industry: ${searchCriteria.industry.join(", ")}`, value: "industry", color: "earth" });
  }
  if (searchCriteria.languageLevel) {
    entities.push({ label: `Language: ${searchCriteria.languageLevel}`, value: "language", color: "slate" });
  }
  if (searchCriteria.availability) {
    entities.push({ label: `Availability: ${searchCriteria.availability}`, value: "availability", color: "slate" });
  }

  return (
    <section className="rounded-xl border border-outline-soft/20 bg-surface-lowest p-6 shadow-stitch-card">
      <div className="mb-4 flex items-center gap-2 border-b border-outline-soft/10 pb-4">
        <span className="material-symbols-outlined text-earth">tune</span>
        <h3 className="font-serif text-xl font-semibold text-slate">Interpreted Search Criteria</h3>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Primary Intent</h4>
          <p className="text-base leading-7 text-ink">{searchRequest}</p>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Extracted Criteria</h4>
          <div className="flex flex-wrap gap-2">
            {entities.length > 0 ? (
              entities.map((entity) => (
                <span
                  key={entity.value}
                  className={`rounded px-3 py-1 text-xs font-semibold ${
                    entity.color === "earth"
                      ? "bg-earth-soft text-earth"
                      : "bg-slate-soft text-slate"
                  }`}
                >
                  {entity.label}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted">No structured criteria could be interpreted.</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShortlistSection({ matches }: { matches: Match[] }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-xl font-semibold text-slate">Ranked Shortlist</h3>
        {matches.length > 0 ? (
          <span className="rounded bg-surface-high px-2 py-1 text-xs font-semibold text-muted">
            {matches.length} Matches found
          </span>
        ) : null}
      </div>
      {matches.length > 0 ? (
        <div className="space-y-4">
          {matches.map((match, index) => (
            <MatchCard key={getMatchId(match)} match={match} index={index} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-outline-soft/20 bg-surface-lowest p-8 text-center shadow-stitch-card">
          <span className="material-symbols-outlined mb-4 text-[48px] text-slate/40">folder_open</span>
          <h3 className="font-serif text-xl font-semibold text-slate">No Matches yet</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted">
            Load a Talent Pool File and explicitly run a Search Request to create an ephemeral Shortlist.
          </p>
        </div>
      )}
    </section>
  );
}

function MatchCard({ match, index }: { match: Match; index: number }) {
  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: getMatchId(match) }}
      className="relative block rounded-xl border border-outline-soft/20 bg-surface-lowest p-6 shadow-stitch-card transition-shadow hover:shadow-md"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-earth" />
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-earth">Match {index + 1}</p>
          <h4 className="mt-1 font-serif text-xl font-semibold text-slate">{getCandidateRecordLabel(match)}</h4>
          <p className="mt-1 text-sm text-muted">{match.candidateRecord.canonicalFields.currentRole || "Role not provided"}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
          match.strength === "Strong"
            ? "bg-evidence-soft text-evidence"
            : match.strength === "Possible"
            ? "bg-secondary-soft text-secondary-strong"
            : "bg-risk-soft text-risk"
        }`}>
          {match.strength}
        </span>
      </div>
      <div className="grid gap-4 border-t border-outline-soft/10 pt-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Evidence</p>
          <ul className="space-y-1 text-sm leading-6 text-ink">
            {match.reasons.slice(0, 3).map((reason) => (
              <li key={reason} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-evidence" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Gaps & Risks</p>
          {match.gaps.length > 0 || match.risks.length > 0 ? (
            <ul className="space-y-1 text-sm leading-6 text-muted">
              {match.gaps.slice(0, 1).map((gap) => (
                <li key={gap} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-secondary-strong" />
                  {gap}
                </li>
              ))}
              {match.risks.slice(0, 1).map((risk) => (
                <li key={risk} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-risk" />
                  {risk}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No significant gaps or risks identified.</p>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate">{match.suggestedNextAction}</p>
    </Link>
  );
}

function TalentPoolRoute() {
  const { session, setSession } = useAppSession();
  const [uploadStatus, setUploadStatus] = useState("No Talent Pool File selected yet.");
  const [uploadError, setUploadError] = useState(false);

  async function handleTalentPoolFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const [file] = event.target.files ?? [];

    if (!file) {
      setUploadStatus("No Talent Pool File selected yet.");
      setUploadError(false);
      return;
    }

    if (!isCsvFile(file)) {
      setUploadStatus("Unsupported Talent Pool File. Upload a CSV file.");
      setUploadError(true);
      return;
    }

    try {
      const csvText = await file.text();
      const parsed = parseCsvTalentPool(csvText);
      setSession((current) => ({
        ...current,
        talentPoolFileName: file.name,
        candidateRecordCount: parsed.candidateRecords.length,
        candidateRecords: parsed.candidateRecords,
        searchRequest: "",
        searchCriteria: null,
        shortlist: [],
        selectedMatchId: null,
      }));
      setUploadStatus(`Parsed ${parsed.candidateRecords.length} Candidate Records from ${file.name}.`);
      setUploadError(false);
    } catch (error) {
      setSession((current) => ({
        ...current,
        talentPoolFileName: null,
        candidateRecordCount: 0,
        candidateRecords: [],
        searchRequest: "",
        searchCriteria: null,
        shortlist: [],
        selectedMatchId: null,
      }));
      setUploadStatus(error instanceof Error ? error.message : "The Talent Pool File could not be parsed.");
      setUploadError(true);
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-outline-soft bg-surface-lowest p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-earth">CSV-first intake</p>
        <h1 className="mt-4 font-serif text-4xl font-semibold text-slate">Upload a CSV Talent Pool File</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
          Candidate Records will stay in browser memory for the MVP. This route will review normalized canonical fields while preserving non-canonical source fields.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-outline-soft bg-surface-lowest p-6">
          <div className="rounded-xl border border-dashed border-outline-soft bg-surface-low p-6">
            <h2 className="font-serif text-2xl font-semibold text-slate">Talent Pool File upload</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Upload CSV only. No ATS import, Notion import, sync, export, inline editing, or persistence is active here.
            </p>
            <label className="mt-5 inline-flex cursor-pointer rounded-lg bg-slate px-4 py-3 text-sm font-semibold text-white hover:bg-slate-strong">
              Choose CSV Talent Pool File
              <input className="sr-only" type="file" accept=".csv,text/csv" onChange={handleTalentPoolFileChange} />
            </label>
            <p className={`mt-4 text-sm leading-6 ${uploadError ? "text-earth" : "text-muted"}`} aria-live="polite">
              {uploadStatus}
            </p>
          </div>

          <CandidateRecordTable records={session.candidateRecords} />
        </section>

        <aside className="rounded-2xl border border-outline-soft bg-surface-low p-6">
          <h2 className="font-serif text-xl font-semibold text-slate">In-memory boundary</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Current file: {session.talentPoolFileName ?? "none"}. Refreshes may lose Talent Pool and Shortlist state until persistence is explicitly introduced.
          </p>
        </aside>
      </div>
    </section>
  );
}

function isCsvFile(file: File) {
  return file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
}

function CandidateRecordTable({ records }: { records: CandidateRecord[] }) {
  const columns = useMemo<ColumnDef<CandidateRecord>[]>(
    () => [
      { header: "Row", accessorFn: (record) => record.rowNumber },
      { header: "Name", accessorFn: (record) => formatCell(record.canonicalFields.name) },
      { header: "Current role", accessorFn: (record) => formatCell(record.canonicalFields.currentRole) },
      { header: "Location", accessorFn: (record) => formatCell(record.canonicalFields.location) },
      { header: "Years experience", accessorFn: (record) => formatCell(record.canonicalFields.yearsExperience) },
      { header: "Skills", accessorFn: (record) => formatList(record.canonicalFields.skills.terms) },
      { header: "Industries", accessorFn: (record) => formatList(record.canonicalFields.industries) },
      { header: "English level", accessorFn: (record) => formatCell(record.canonicalFields.englishLevel) },
      { header: "Availability", accessorFn: (record) => formatCell(record.canonicalFields.availability) },
      { header: "Last contact", accessorFn: (record) => formatCell(record.canonicalFields.lastContactDate) },
      { header: "Source", accessorFn: (record) => formatCell(record.canonicalFields.source) },
      { header: "Normalization gaps", accessorFn: (record) => formatList(record.gaps.map((gap) => gap.label)) },
      { header: "Duplicate warnings", accessorFn: (record) => getDuplicateWarning(record, records) },
    ],
    [records],
  );
  const table = useReactTable({ data: records, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-outline-soft">
      <table className="min-w-[1280px] divide-y divide-outline-soft text-left text-sm">
        <thead className="bg-surface text-xs uppercase tracking-[0.14em] text-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 font-semibold">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-outline-soft bg-surface-lowest align-top">
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="max-w-[220px] px-4 py-4 text-muted">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                No Candidate Records loaded in this session.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(value: string | number) {
  return value ? String(value) : "Not provided";
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "Not provided";
}

function getDuplicateWarning(record: CandidateRecord, records: CandidateRecord[]) {
  const name = record.canonicalFields.name.trim().toLowerCase();

  if (!name) {
    return "Not enough data";
  }

  const duplicateRows = records.filter((candidateRecord) => candidateRecord.canonicalFields.name.trim().toLowerCase() === name);

  return duplicateRows.length > 1 ? `Possible duplicate name across ${duplicateRows.length} rows` : "None detected";
}

function MatchDetailRoute() {
  const { matchId } = matchRoute.useParams();
  const { session } = useAppSession();
  const [draftText, setDraftText] = useState("");
  const [draftStatus, setDraftStatus] = useState("Talent Rediscovery never sends outreach automatically.");
  const match = session.shortlist.find((candidateMatch) => getMatchId(candidateMatch) === matchId);

  if (match) {
    const isDraftable = canDraftMessageFromSuggestedNextAction(match.suggestedNextAction);

    function handleCreateDraft() {
      if (!match) {
        return;
      }

      try {
        setDraftText(draftMessageFromMatch({ ...match, searchRequest: session.searchRequest }));
        setDraftStatus("Editable draft created for recruiter review. It has not been sent.");
      } catch (error) {
        setDraftStatus(error instanceof Error ? error.message : "The editable draft could not be created.");
      }
    }

    return (
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-2xl border border-outline-soft bg-surface-lowest p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-earth">Session-scoped Match detail</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-serif text-4xl font-semibold text-slate">{getCandidateRecordLabel(match)}</h1>
              <p className="mt-2 text-muted">{match.candidateRecord.canonicalFields.currentRole || "Role not provided"}</p>
            </div>
            <span className="rounded-full bg-slate px-4 py-2 text-sm font-semibold text-white">{match.strength}</span>
          </div>
          <DetailSection title="Reasons" items={match.reasons} />
          <DetailSection title="Candidate Record evidence" items={match.evidence.map((item) => `${item.label}: ${item.value} (${item.matched})`)} />
          <DetailSection title="Gaps" items={match.gaps} />
          <section className="mt-8 rounded-2xl border border-outline-soft bg-surface-low p-6">
            <h2 className="font-serif text-xl font-semibold text-slate">Create editable draft</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Available when the Suggested Next Action is contact or recontact-oriented. Talent Rediscovery never sends outreach automatically.
            </p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-slate px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-outline-soft"
              disabled={!isDraftable}
              onClick={handleCreateDraft}
            >
              Create editable draft
            </button>
            <p className="mt-3 text-sm leading-6 text-muted" aria-live="polite">
              {isDraftable ? draftStatus : "Editable drafts are unavailable unless the Suggested Next Action is to contact or recontact."}
            </p>
            {draftText ? (
              <label className="mt-4 grid gap-2 text-sm font-semibold text-slate" htmlFor="message-draft">
                Editable message draft
                <textarea
                  id="message-draft"
                  className="min-h-48 rounded-xl border border-outline-soft bg-surface-lowest p-4 text-sm font-normal leading-6 text-ink outline-none focus:border-slate"
                  value={draftText}
                  onChange={(event) => setDraftText(event.target.value)}
                />
              </label>
            ) : null}
          </section>
        </article>

        <aside className="rounded-2xl border border-outline-soft bg-surface-low p-6">
          <h2 className="font-serif text-xl font-semibold text-slate">Suggested Next Action</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{match.suggestedNextAction}</p>
          <DetailSection title="Risks" items={match.risks} compact />
        </aside>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-outline-soft bg-surface-lowest p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-earth">Session-scoped Match detail</p>
      <h1 className="mt-4 font-serif text-4xl font-semibold text-slate">No Match is available for this session</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
        Match detail routes are not persistent deep links. Load a Talent Pool File and run a Search Request to create an ephemeral Shortlist before opening a Match.
      </p>
      <Link to="/" className="mt-6 inline-flex rounded-lg bg-slate px-4 py-3 text-sm font-semibold text-white hover:bg-slate-strong">
        Return to Home
      </Link>
    </section>
  );
}



function DetailSection({ title, items, compact = false }: { title: string; items: string[]; compact?: boolean }) {
  return (
    <section className={compact ? "mt-6" : "mt-8"}>
      <h2 className="font-serif text-xl font-semibold text-slate">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li key={item} className="rounded-lg bg-surface-low px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function getMatchId(match: Match) {
  return `row-${match.candidateRecord.rowNumber}`;
}

function getCandidateRecordLabel(match: Match) {
  return match.candidateRecord.canonicalFields.name || `Candidate Record ${match.candidateRecord.rowNumber}`;
}

function CopilotPanel() {
  const { session } = useAppSession();

  return (
    <aside className="mt-6 flex w-full flex-col overflow-hidden rounded-xl border border-outline-soft/20 bg-surface-low shadow-stitch-panel xl:mt-0 xl:ml-6 xl:w-[380px] xl:shrink-0">
      <div className="flex items-center justify-between border-b border-outline-soft/10 bg-surface/50 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-2 text-slate">
          <span className="material-symbols-outlined">psychology</span>
          <h3 className="font-serif text-xl font-semibold">Discovery Copilot</h3>
        </div>
        <button
          type="button"
          className="rounded-full p-1 text-muted-soft transition hover:text-slate"
          disabled
          aria-label="Copilot menu unavailable in MVP"
        >
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {session.copilotTranscript.map((message, index) => {
          const isCopilot = message.speaker === "copilot";
          return (
            <div key={`${message.speaker}-${index}`} className={`flex flex-col gap-1 ${isCopilot ? "items-start" : "items-end"}`}>
              <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">
                {isCopilot ? "Copilot" : "You"}
              </span>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  isCopilot
                    ? "rounded-tl-sm border border-outline-soft/20 bg-surface-lowest text-ink"
                    : "rounded-tr-sm bg-slate text-white"
                }`}
              >
                {message.text}
              </div>
            </div>
          );
        })}

        <div className="flex items-start gap-2 rounded-lg border border-secondary/10 bg-secondary-container/30 px-4 py-3 text-sm leading-6 text-muted">
          <span className="material-symbols-outlined shrink-0 text-[16px]">check_circle</span>
          <span>Talent Rediscovery never sends outreach automatically. All message drafts require recruiter review before use.</span>
        </div>
      </div>

      <div className="border-t border-outline-soft/10 bg-surface px-5 py-4">
        <div className="flex items-center rounded-xl border border-outline-soft/30 bg-surface-lowest shadow-sm transition-all focus-within:border-slate focus-within:ring-1 focus-within:ring-slate/20">
          <textarea
            className="custom-scrollbar w-full resize-none border-none bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-muted-soft"
            placeholder="Draft a new search intent..."
            rows={2}
            disabled
          />
          <div className="flex shrink-0 items-center gap-1 pr-2 pb-2 self-end">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full text-muted-soft transition hover:text-slate"
              disabled
              aria-label="Voice Copilot not active in this slice"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full bg-earth text-white shadow-sm transition hover:bg-earth-strong"
              disabled
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
        <p className="mt-2 px-1 text-xs text-muted-soft">Chat Copilot is not active in this slice.</p>
      </div>
    </aside>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeRoute,
});

const talentPoolRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/talent-pool",
  component: TalentPoolRoute,
});

const matchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/matches/$matchId",
  component: MatchDetailRoute,
});

const routeTree = rootRoute.addChildren([indexRoute, talentPoolRoute, matchRoute]);
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing root element");
}

createRoot(rootElement).render(<RouterProvider router={router} />);
