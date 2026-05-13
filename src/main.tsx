import { createRoute, createRootRoute, createRouter, Link, Outlet, RouterProvider } from "@tanstack/react-router";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { createRoot } from "react-dom/client";
import { parseCsvTalentPool, type CandidateRecord } from "./csv-candidate-records.js";
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
      <div className="min-h-screen bg-paper text-ink">
        <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-outline-soft bg-slate px-6 py-6 text-white lg:border-b-0 lg:border-r">
            <Link to="/" className="block font-serif text-2xl font-semibold leading-tight">
              Talent Rediscovery
            </Link>
            <p className="mt-3 text-sm leading-6 text-white/75">
              Search recruiting memory through Candidate Records, not external sourcing automation.
            </p>
            <nav className="mt-8 grid gap-2 text-sm font-semibold">
              <NavLink to="/" label="Home" />
              <NavLink to="/talent-pool" label="Talent Pool" />
            </nav>
          </aside>

          <main className="min-w-0 px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AppSessionProvider>
  );
}

function NavLink({ to, label }: { to: "/" | "/talent-pool"; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg px-3 py-2 text-white/75 transition hover:bg-white/10 hover:text-white [&.active]:bg-white/15 [&.active]:text-white"
      activeOptions={{ exact: to === "/" }}
    >
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
    setSearchStatus(`Search Request run. Returned ${shortlist.length} Matches in an ephemeral Shortlist.`);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-6">
        <header className="rounded-2xl border border-outline-soft bg-surface-lowest p-6 shadow-[0_4px_20px_rgba(63,78,79,0.05)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-earth">Home cockpit</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight text-slate sm:text-5xl">
            Rediscover the Candidates already in your Talent Pool.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
            Use a Search Request to create an ephemeral Shortlist of evidence-grounded Matches. Search Criteria are shown for transparency and stay read-only.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Talent Pool" value={session.talentPoolFileName ?? "Not loaded"} />
          <MetricCard label="Candidate Records" value={String(session.candidateRecordCount)} />
          <MetricCard label="Matches returned" value={String(session.shortlist.length)} />
        </section>

        <section className="rounded-2xl border border-outline-soft bg-surface-lowest p-6">
          <form className="space-y-5" onSubmit={handleSearchSubmit}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-earth">Search Request</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-slate">Run a Search Request explicitly</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                The Copilot can draft recruiter intent, but Talent Rediscovery should only run a Search Request after an explicit recruiter action.
              </p>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-slate" htmlFor="search-request">
              Search Request
              <textarea
                id="search-request"
                className="min-h-32 rounded-xl border border-outline-soft bg-surface-lowest p-4 text-base font-normal leading-7 text-ink outline-none transition focus:border-slate"
                placeholder="Example: Senior React profiles with fintech experience, good English, remote Colombia"
                value={draftSearchRequest}
                onChange={(event) => setDraftSearchRequest(event.target.value)}
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-muted" aria-live="polite">
                {searchStatus}
              </p>
              {hasTalentPool ? (
                <button type="submit" className="rounded-lg bg-slate px-4 py-3 text-sm font-semibold text-white hover:bg-slate-strong">
                  Run Search Request
                </button>
              ) : (
                <Link to="/talent-pool" className="rounded-lg bg-slate px-4 py-3 text-sm font-semibold text-white hover:bg-slate-strong">
                  Load Talent Pool File
                </Link>
              )}
            </div>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <InfoPanel title="Interpreted Search Criteria" emptyText="Search Criteria will appear here as read-only information after a Search Request runs." items={formatSearchCriteria(session.searchCriteria)} />
          <ShortlistPanel matches={session.shortlist} />
        </section>
      </section>

      <CopilotPanel />
    </div>
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
  const match = session.shortlist.find((candidateMatch) => getMatchId(candidateMatch) === matchId);

  if (match) {
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-outline-soft bg-surface-lowest p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-3 font-serif text-2xl font-semibold text-slate">{value}</p>
    </article>
  );
}

function InfoPanel({ title, emptyText, items = [] }: { title: string; emptyText: string; items?: string[] }) {
  return (
    <section className="rounded-2xl border border-outline-soft bg-surface-lowest p-6">
      <h2 className="font-serif text-2xl font-semibold text-slate">{title}</h2>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
          {items.map((item) => (
            <li key={item} className="rounded-lg bg-surface-low px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg bg-surface-low px-3 py-3 text-sm leading-6 text-muted">{emptyText}</p>
      )}
    </section>
  );
}

function ShortlistPanel({ matches }: { matches: Match[] }) {
  return (
    <section className="rounded-2xl border border-outline-soft bg-surface-lowest p-6">
      <h2 className="font-serif text-2xl font-semibold text-slate">Current Shortlist</h2>
      {matches.length > 0 ? (
        <div className="mt-4 space-y-4">
          {matches.map((match, index) => (
            <article key={getMatchId(match)} className="rounded-xl border border-outline-soft bg-surface-low p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-earth">Match {index + 1}</p>
                  <h3 className="mt-2 font-serif text-xl font-semibold text-slate">{getCandidateRecordLabel(match)}</h3>
                  <p className="mt-1 text-sm text-muted">{match.candidateRecord.canonicalFields.currentRole || "Role not provided"}</p>
                </div>
                <span className="rounded-full bg-slate px-3 py-1 text-xs font-semibold text-white">{match.strength}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted">{match.suggestedNextAction}</p>
              <div className="mt-3 grid gap-3 text-sm leading-6 text-muted sm:grid-cols-2">
                <SummaryList title="Reasons" items={match.reasons.slice(0, 2)} />
                <SummaryList title="Evidence" items={match.evidence.slice(0, 2).map((item) => `${item.label}: ${item.value}`)} />
              </div>
              <Link to="/matches/$matchId" params={{ matchId: getMatchId(match) }} className="mt-4 inline-flex text-sm font-semibold text-slate hover:text-earth">
                Open Match detail
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-surface-low px-3 py-3 text-sm leading-6 text-muted">No Matches yet. Load a Talent Pool File and explicitly run a Search Request.</p>
      )}
    </section>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-semibold text-slate">{title}</h4>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
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

function formatSearchCriteria(searchCriteria: SearchCriteria | null) {
  if (!searchCriteria || Object.keys(searchCriteria).length === 0) {
    return [];
  }

  return Object.entries(searchCriteria).map(([key, value]) => `${formatCriteriaLabel(key)}: ${Array.isArray(value) ? value.join(", ") : value}`);
}

function formatCriteriaLabel(key: string) {
  return key.replaceAll(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
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
    <aside className="rounded-2xl border border-outline-soft bg-surface-lowest p-6 xl:sticky xl:top-8 xl:self-start">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-earth">Chat Copilot shell</p>
      <h2 className="mt-3 font-serif text-2xl font-semibold text-slate">Constrained Intelligence Layer</h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        The Copilot can help create Search Requests and navigate Matches later. It cannot modify Candidate Records, edit Search Criteria manually, send outreach, or persist Talent Pools.
      </p>
      <div className="mt-5 space-y-3">
        {session.copilotTranscript.map((message, index) => (
          <p key={`${message.speaker}-${index}`} className="rounded-xl bg-surface-low p-4 text-sm leading-6 text-muted">
            <span className="font-semibold text-slate">{message.speaker === "copilot" ? "Copilot" : "Recruiter"}: </span>
            {message.text}
          </p>
        ))}
      </div>
      <button className="mt-5 w-full rounded-lg border border-outline-soft px-4 py-3 text-sm font-semibold text-muted" disabled>
        Voice Copilot is not active in this slice
      </button>
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
