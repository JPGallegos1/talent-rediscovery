import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type ChatAddToolOutputFunction, type ChatOnToolCallCallback, type UIMessage } from "ai";
import { createRoute, createRootRoute, createRouter, Link, Outlet, RouterProvider, useRouter } from "@tanstack/react-router";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { createRoot } from "react-dom/client";
import { parseCsvTalentPool, type CandidateRecord } from "./csv-candidate-records.js";
import { canDraftMessageFromSuggestedNextAction, draftMessageFromMatch } from "./message-draft.js";
import { interpretSearchCriteria, type SearchCriteria } from "./search-criteria.js";
import { buildShortlist, type Match } from "./shortlist-matches.js";
import { toCompactShortlistContext } from "./intelligence-layer.js";
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
  const { session } = useAppSession();
  const hasTalentPool = session.candidateRecordCount > 0;
  const hasSearchRequest = !!session.searchRequest;

  if (!hasTalentPool) {
    return <EmptyHomeView />;
  }

  if (!hasSearchRequest) {
    return <DataReadyHomeView />;
  }

  return <ActiveHomeView />;
}

function EmptyHomeView() {
  const { session } = useAppSession();

  return (
    <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
      <section className="flex flex-1 flex-col px-0 lg:px-10">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-surface-low p-5 shadow-stitch-card">
              <span className="material-symbols-outlined text-[40px] text-earth">database_off</span>
            </div>
            <h2 className="font-serif text-[40px] font-bold leading-10 tracking-[-0.02em] text-slate">
              Your Talent Pool is Empty
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-7 text-muted">
              Upload your existing Candidate Records as a CSV to unlock evidence-grounded matching and semantic search through your Talent Pool.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              to="/talent-pool"
              className="inline-flex items-center gap-3 rounded-xl bg-slate-strong px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-slate hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
              <span className="text-base">Upload Talent Pool (CSV)</span>
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold text-muted-soft">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Your data is processed in-memory only and remains strictly confidential.</span>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-xl border border-outline-soft/10 bg-surface-lowest p-6 shadow-stitch-card">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 size-24 rounded-bl-full bg-surface-variant/20" />
              <div className="relative z-10 mb-4 flex size-10 items-center justify-center rounded-full bg-surface text-lg font-bold text-slate">
                1
              </div>
              <h3 className="relative z-10 font-serif text-xl font-semibold text-slate">Upload Data</h3>
              <p className="relative z-10 mt-2 text-sm leading-6 text-muted">
                Securely import your historical candidate CSV. Fields are mapped automatically.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-outline-soft/10 bg-surface-lowest p-6 shadow-stitch-card">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 size-24 rounded-bl-full bg-surface-variant/20" />
              <div className="relative z-10 mb-4 flex size-10 items-center justify-center rounded-full bg-surface text-lg font-bold text-slate">
                2
              </div>
              <h3 className="relative z-10 font-serif text-xl font-semibold text-slate">Describe Need</h3>
              <p className="relative z-10 mt-2 text-sm leading-6 text-muted">
                Describe the role, required skills, and background using natural language.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-outline-soft/10 bg-surface-lowest p-6 shadow-stitch-card">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 size-24 rounded-bl-full bg-surface-variant/20" />
              <div className="relative z-10 mb-4 flex size-10 items-center justify-center rounded-full bg-surface text-lg font-bold text-slate">
                3
              </div>
              <h3 className="relative z-10 font-serif text-xl font-semibold text-slate">Review Matches</h3>
              <p className="relative z-10 mt-2 text-sm leading-6 text-muted">
                Get a ranked Shortlist of Matches with evidence-based reasoning for each one.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-6 border-t border-outline-soft/10 pt-6">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate">
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              Learn about Talent Rediscovery
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold text-slate">
              <span className="material-symbols-outlined text-[18px]">policy</span>
              Privacy & Security
            </span>
          </div>
        </div>
      </section>

      <CopilotPanel mode="empty" />
    </div>
  );
}

function DataReadyHomeView() {
  const { session } = useAppSession();

  return (
    <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
      <section className="flex flex-1 flex-col overflow-y-auto px-0 lg:px-10">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
          <div className="relative overflow-hidden rounded-xl border border-outline-soft/20 bg-surface-lowest p-8 text-center shadow-stitch-card">
            <div className="flex flex-col items-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-secondary-soft text-secondary-strong shadow-inner">
                <span className="material-symbols-outlined text-[32px]">database</span>
              </div>
              <h3 className="font-serif text-[40px] font-bold leading-10 tracking-[-0.02em] text-slate">
                {session.candidateRecordCount}
              </h3>
              <p className="mt-2 font-serif text-xl font-semibold text-muted">records ready to search</p>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted">
                Your Candidate Records have been parsed and normalized. Describe the profile you need using the Copilot on the right.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-outline-soft/10 bg-surface-low p-4">
              <span className="material-symbols-outlined mb-2 text-earth">auto_awesome</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Normalized</p>
              <p className="mt-1 font-serif text-2xl font-semibold text-slate">{session.candidateRecordCount}</p>
            </div>
            <div className="rounded-lg border border-outline-soft/10 bg-surface-low p-4">
              <span className="material-symbols-outlined mb-2 text-earth">folder_open</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">File</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate">{session.talentPoolFileName || "CSV upload"}</p>
            </div>
            <div className="rounded-lg border border-outline-soft/10 bg-surface-low p-4">
              <span className="material-symbols-outlined mb-2 text-earth">history</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Session</p>
              <p className="mt-1 text-sm font-semibold text-slate">In-memory only</p>
            </div>
          </div>
        </div>
      </section>

      <CopilotPanel mode="active" />
    </div>
  );
}

function ActiveHomeView() {
  const { session, setSession } = useAppSession();
  const [draftSearchRequest, setDraftSearchRequest] = useState(session.searchRequest);

  useEffect(() => {
    setDraftSearchRequest(session.searchRequest);
  }, [session.searchRequest]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchRequest = draftSearchRequest.trim() || session.searchRequest;
    if (!searchRequest) return;

    const searchCriteria = interpretSearchCriteria(searchRequest);
    const shortlist = buildShortlist(session.candidateRecords, searchCriteria);

    setSession((current) => ({
      ...current,
      searchRequest,
      searchCriteria,
      shortlist,
      selectedMatchId: null,
    }));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-serif text-[32px] font-semibold leading-10 tracking-[-0.01em] text-slate">
              Talent Discovery Workspace
            </h2>
            <p className="mt-2 text-base leading-7 text-muted">Draft intent, review criteria, and uncover evidence-grounded Matches.</p>
          </div>
          <span className="hidden rounded-full bg-surface-high px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted sm:inline-flex">
            {session.candidateRecordCount} Candidate Records
          </span>
        </div>

        <SearchRequestForm
          draftSearchRequest={draftSearchRequest}
          onDraftChange={setDraftSearchRequest}
          searchStatus="Refine your Search Request and re-run, or use the Copilot for follow-up."
          hasTalentPool={true}
          onSubmit={handleSearchSubmit}
        />

        <SearchCriteriaPanel searchCriteria={session.searchCriteria} searchRequest={session.searchRequest} />

        <ShortlistSection matches={session.shortlist} />
      </div>

      <CopilotPanel mode="active" />
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
  const [uploadStatus, setUploadStatus] = useState("Upload a CSV Talent Pool File to start.");
  const [uploadError, setUploadError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  async function handleTalentPoolFile(file: File | null) {
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

  async function handleTalentPoolFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const [file] = event.target.files ?? [];
    await handleTalentPoolFile(file ?? null);
  }

  async function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const [file] = event.dataTransfer.files ?? [];
    await handleTalentPoolFile(file ?? null);
  }

  return (
    <section className="space-y-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-earth">CSV-first intake</p>
        <h2 className="mt-2 font-serif text-[32px] font-semibold leading-10 tracking-[-0.01em] text-slate">
          Talent Pool Management
        </h2>
        <p className="mt-2 text-base leading-7 text-muted">Upload, view, and manage Candidate Records from CSV Talent Pool Files.</p>
      </header>

      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragOver
            ? "border-slate bg-slate-soft/20"
            : "border-outline-soft/40 bg-surface-lowest hover:bg-surface-low"
        }`}
        onDragOver={(event) => { event.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-secondary-soft text-secondary-strong">
          <span className="material-symbols-outlined text-3xl">cloud_upload</span>
        </div>
        <h3 className="font-serif text-xl font-semibold text-slate">Upload CSV Talent Pool File</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Drag and drop your Candidate Record file here, or click to browse. CSV only. No ATS import, Notion import, sync, or persistence in the MVP.
        </p>
        <input className="sr-only" type="file" accept=".csv,text/csv" onChange={handleTalentPoolFileChange} />
        <span className="mt-6 inline-flex cursor-pointer rounded-lg bg-slate-strong px-6 py-2 text-sm font-bold text-white transition hover:bg-slate">
          Select File
        </span>
        {uploadStatus ? (
          <p className={`mt-4 text-sm leading-6 ${uploadError ? "text-earth" : "text-muted"}`} aria-live="polite">
            {uploadStatus}
          </p>
        ) : null}
      </label>

      <CandidateRecordTable records={session.candidateRecords} uploadFileName={session.talentPoolFileName} />
    </section>
  );
}

function isCsvFile(file: File) {
  return file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv";
}

function CandidateRecordTable({ records, uploadFileName }: { records: CandidateRecord[]; uploadFileName: string | null }) {
  const columns = useMemo<ColumnDef<CandidateRecord>[]>(
    () => [
      { header: "Name", accessorFn: (record) => formatCell(record.canonicalFields.name) },
      { header: "Current Role", accessorFn: (record) => formatCell(record.canonicalFields.currentRole) },
      { header: "Location", accessorFn: (record) => formatCell(record.canonicalFields.location) },
      { header: "Exp. (Yrs)", accessorFn: (record) => formatCell(record.canonicalFields.yearsExperience) },
      {
        header: "Skills (Top)",
        id: "skills",
        cell: ({ row }) => formatSkillsChips(row.original.canonicalFields.skills.terms.slice(0, 3)),
      },
      {
        header: "Status / Warnings",
        id: "status",
        cell: ({ row }) => formatStatusBadge(row.original, records),
      },
      { header: "Source", accessorFn: (record) => formatSourceLabel(record.canonicalFields.source) },
    ],
    [records],
  );
  const table = useReactTable({ data: records, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <section className="overflow-hidden rounded-xl border border-outline-soft/20 bg-surface-lowest shadow-stitch-card">
      <div className="flex items-center justify-between border-b border-outline-soft/10 bg-surface px-6 py-4">
        <h3 className="font-serif text-xl font-semibold text-slate">Candidate Records</h3>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-outline/30 px-4 py-2 text-sm font-semibold text-muted transition hover:bg-surface-container-low"
            disabled
          >
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            Filter
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-outline/30 px-4 py-2 text-sm font-semibold text-muted transition hover:bg-surface-container-low"
            disabled
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-soft/20 bg-surface-container-low">
              {table.getFlatHeaders().map((header) => (
                <th key={header.id} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-soft/10 bg-surface-lowest">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-surface-container-low/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-4 text-sm text-muted">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted">
                  {uploadFileName
                    ? "No Candidate Records found in the uploaded file."
                    : "Upload a CSV Talent Pool File to view Candidate Records."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-outline-soft/10 bg-surface px-6 py-4">
        <span className="text-xs font-semibold text-muted">
          {uploadFileName
            ? `Showing all ${records.length} Candidate Records from ${uploadFileName}`
            : "No Talent Pool File loaded"}
        </span>
        <div className="flex gap-2">
          <button type="button" className="rounded border border-outline-soft/50 px-3 py-1 text-xs text-muted" disabled>Prev</button>
          <button type="button" className="rounded border border-outline-soft/50 px-3 py-1 text-xs text-muted" disabled>Next</button>
        </div>
      </div>
    </section>
  );
}

function formatCell(value: string | number) {
  return value ? String(value) : "\u2014";
}

function formatSkillsChips(skills: string[]) {
  if (skills.length === 0) {
    return <span className="text-xs italic text-muted-soft">None listed</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((skill) => (
        <span key={skill} className="rounded bg-surface-variant px-2 py-0.5 text-[10px] font-medium text-muted">
          {skill}
        </span>
      ))}
    </div>
  );
}

function getRecordStatus(record: CandidateRecord, records: CandidateRecord[]): { label: string; variant: "validated" | "duplicate" | "gap" | "unknown" } {
  const name = record.canonicalFields.name.trim().toLowerCase();

  if (name) {
    const duplicateRows = records.filter((candidateRecord) => candidateRecord.canonicalFields.name.trim().toLowerCase() === name);
    if (duplicateRows.length > 1) {
      return { label: "Duplicate Suspected", variant: "duplicate" };
    }
  }

  if (record.gaps.length > 0) {
    return { label: "Normalization Gap", variant: "gap" };
  }

  if (!name) {
    return { label: "Unknown", variant: "unknown" };
  }

  return { label: "Validated", variant: "validated" };
}

function formatStatusBadge(record: CandidateRecord, records: CandidateRecord[]) {
  const status = getRecordStatus(record, records);
  const styles = {
    validated: "bg-evidence-soft text-evidence",
    duplicate: "bg-risk-soft text-risk",
    gap: "bg-secondary-soft text-secondary-strong",
    unknown: "bg-surface-high text-muted",
  };
  const icons = {
    validated: "check_circle",
    duplicate: "error",
    gap: "sync_problem",
    unknown: "help_outline",
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status.variant]}`}>
      <span className="material-symbols-outlined text-[12px]">{icons[status.variant]}</span>
      {status.label}
    </span>
  );
}

function formatSourceLabel(source: string) {
  if (!source) {
    return <span className="text-xs italic text-muted-soft">Unknown source</span>;
  }

  const cleanSource = source
    .replace(/greenhouse\s*api/i, "CSV Upload")
    .replace(/linkedin\s*scrape/i, "CSV Upload")
    .replace(/api/i, "CSV Upload")
    .trim();

  return <span className="text-xs font-medium text-slate">{cleanSource}</span>;
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
      <section>
        <div className="mb-6 flex items-center gap-2 text-sm text-muted">
          <Link to="/" className="flex items-center gap-1 text-muted transition hover:text-slate">
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            {session.searchRequest || "Search Request"}
          </Link>
          <span>/</span>
          <span className="text-slate">Match Analysis</span>
        </div>

        <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-outline-soft/20 bg-surface-lowest p-6 shadow-stitch-card md:flex-row md:items-center">
          <div className="flex items-center gap-6">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-slate-soft text-[32px] font-bold text-slate shadow-sm">
              {getCandidateRecordLabel(match).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-serif text-[32px] font-semibold leading-10 tracking-[-0.01em] text-slate">{getCandidateRecordLabel(match)}</h2>
              <p className="mt-1 text-lg leading-7 text-muted">{match.candidateRecord.canonicalFields.currentRole || "Role not provided"}</p>
              <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-muted">
                {match.candidateRecord.canonicalFields.location ? (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {match.candidateRecord.canonicalFields.location}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  Session-scoped Match
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Match Assessment</p>
            <span className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg font-semibold shadow-sm ${
              match.strength === "Strong"
                ? "bg-evidence-soft text-evidence"
                : match.strength === "Possible"
                ? "bg-secondary-soft text-secondary-strong"
                : "bg-risk-soft text-risk"
            }`}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              {match.strength} Match
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="rounded-xl border border-outline-soft/20 bg-surface-lowest p-6 shadow-stitch-card">
              <h3 className="mb-4 font-serif text-xl font-semibold text-slate">
                <span className="material-symbols-outlined mr-2 align-middle text-slate">insights</span>
                Evidence of Fit
              </h3>
              <p className="mb-6 text-base leading-7 text-muted">
                Based on the Search Request, here is why this Candidate Record was surfaced as a Match.
              </p>
              <div className="space-y-4">
                {match.reasons.map((reason) => (
                  <div key={reason} className="flex items-start gap-4 rounded-lg bg-surface-container-low/50 p-4 transition-colors hover:bg-surface-container-low">
                    <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-evidence-soft text-evidence">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: "20px" }}>verified</span>
                    </div>
                    <div>
                      <p className="text-sm leading-6 text-ink">{reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-outline-soft/20 bg-surface-lowest p-6 shadow-stitch-card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-xl font-semibold text-slate">
                  <span className="material-symbols-outlined mr-2 align-middle text-slate">history</span>
                  Candidate Record Evidence
                </h3>
              </div>
              <div className="space-y-4">
                {match.evidence.map((item) => (
                  <div key={item.label} className="rounded-lg border border-outline-soft/10 bg-surface-low p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-muted">{item.value}</p>
                      </div>
                      <span className="shrink-0 rounded bg-evidence-soft px-2 py-0.5 text-[10px] font-semibold text-evidence">
                        {item.matched}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {match.gaps.length > 0 ? (
                <div className="mt-4 border-t border-outline-soft/10 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Information gaps</p>
                  <ul className="space-y-2 text-sm leading-6 text-muted">
                    {match.gaps.map((gap) => (
                      <li key={gap} className="flex items-start gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-secondary-strong" />
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <section className="rounded-xl border border-earth/10 bg-surface-bright p-6 shadow-sm">
              <h3 className="mb-4 font-serif text-xl font-semibold text-slate">
                <span className="material-symbols-outlined mr-2 align-middle text-earth-strong">balance</span>
                Considerations
              </h3>

              {match.risks.length > 0 ? (
                <div className="mb-4">
                  <h4 className="mb-3 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-earth-strong">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    Points to Validate
                  </h4>
                  <ul className="space-y-3 text-sm leading-6 text-muted">
                    {match.risks.map((risk) => (
                      <li key={risk} className="flex items-start gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-earth-strong" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <hr className="my-4 border-outline-soft/20" />

              <div>
                <h4 className="mb-3 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-secondary-strong">
                  <span className="material-symbols-outlined text-[16px]">help</span>
                  Missing Information
                </h4>
                {match.gaps.length > 0 ? (
                  <ul className="space-y-3 text-sm leading-6 text-muted">
                    {match.gaps.map((gap) => (
                      <li key={gap} className="flex items-start gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-secondary-strong" />
                        {gap}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-6 text-muted">No significant information gaps identified.</p>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-primary/10 bg-surface-lowest shadow-lg">
              <div className="border-b border-outline-soft/10 bg-surface-container-low px-6 py-4">
                <h3 className="font-serif text-xl font-semibold text-slate">
                  <span className="material-symbols-outlined mr-2 align-middle text-slate">forward_to_inbox</span>
                  Suggested Next Action
                </h3>
                <p className="mt-1 text-xs font-semibold text-muted">{match.suggestedNextAction}</p>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted" htmlFor="message-draft">
                    Editable Draft
                  </label>
                  {draftText ? (
                    <textarea
                      id="message-draft"
                      className="min-h-36 w-full resize-none rounded-lg border border-outline-soft/30 bg-surface-bright p-3 text-sm leading-6 text-ink outline-none transition focus:border-slate focus:ring-1 focus:ring-slate"
                      value={draftText}
                      onChange={(event) => setDraftText(event.target.value)}
                    />
                  ) : (
                    <button
                      type="button"
                      className="w-full rounded-lg bg-slate-strong px-4 py-3 text-sm font-bold text-white transition hover:bg-slate disabled:cursor-not-allowed disabled:bg-outline-soft"
                      disabled={!isDraftable}
                      onClick={handleCreateDraft}
                    >
                      Create editable draft
                    </button>
                  )}
                </div>
                <p className="text-xs leading-5 text-muted" aria-live="polite">
                  {draftText
                    ? "Editable draft created for recruiter review. It has not been sent."
                    : isDraftable
                    ? "Create an editable draft to review and customize before using."
                    : "Editable drafts are unavailable unless the Suggested Next Action is to contact or recontact."}
                </p>
                {draftText ? (
                  <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-muted">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Talent Rediscovery never sends outreach automatically.
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-outline-soft/20 bg-surface-lowest p-8 text-center shadow-stitch-card">
      <span className="material-symbols-outlined mb-4 text-[48px] text-slate/40">verified</span>
      <h2 className="font-serif text-2xl font-semibold text-slate">No Match is available for this session</h2>
      <p className="mx-auto mt-2 max-w-md text-base leading-7 text-muted">
        Match detail routes are not persistent deep links. Load a Talent Pool File and run a Search Request to create an ephemeral Shortlist before opening a Match.
      </p>
      <Link to="/" className="mt-6 inline-flex rounded-lg bg-slate-strong px-4 py-3 text-sm font-bold text-white transition hover:bg-slate">
        Return to Home
      </Link>
    </section>
  );
}

function getMatchId(match: Match) {
  return `row-${match.candidateRecord.rowNumber}`;
}

function getCandidateRecordLabel(match: Match) {
  return match.candidateRecord.canonicalFields.name || `Candidate Record ${match.candidateRecord.rowNumber}`;
}

function CopilotPanel({ mode }: { mode: "empty" | "active" }) {
  const { session, setSession } = useAppSession();
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const sessionRef = useRef(session);
  const addToolOutputRef = useRef<ChatAddToolOutputFunction<UIMessage> | null>(null);
  sessionRef.current = session;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => {
          const s = sessionRef.current;
          return {
            sessionContext: {
              searchRequest: s.searchRequest,
              searchCriteria: s.searchCriteria,
              shortlist: toCompactShortlistContext(s.shortlist),
              candidateRecordCount: s.candidateRecordCount,
              talentPoolFileName: s.talentPoolFileName,
              selectedMatchId: s.selectedMatchId,
            },
          };
        },
      }),
    [],
  );

  const handleToolCall: ChatOnToolCallCallback<UIMessage> = ({ toolCall }) => {
    if (toolCall.toolName !== "createSearchRequest") return;

    const input = toolCall.input as { searchRequest?: unknown };
    const searchRequest = typeof input.searchRequest === "string" ? input.searchRequest.trim() : "";
    if (!searchRequest) return;

    setSession((current) => {
      if (current.candidateRecords.length === 0) return current;

      const searchCriteria = interpretSearchCriteria(searchRequest);
      const shortlist = buildShortlist(current.candidateRecords, searchCriteria);

      return {
        ...current,
        searchRequest,
        searchCriteria,
        shortlist,
        selectedMatchId: null,
      };
    });

    void addToolOutputRef.current?.({
      tool: "createSearchRequest",
      toolCallId: toolCall.toolCallId,
      output: { applied: true },
    });
  };

  const { messages, sendMessage, status, error, addToolOutput } = useChat({ transport, onToolCall: handleToolCall });
  addToolOutputRef.current = addToolOutput;

  function getMessageText(message: { parts: unknown[] }): string {
    return (message.parts as { type: string; text?: string }[])
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("");
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isStreaming = status === "streaming" || status === "submitted";

  if (mode === "empty") {
    return (
      <aside className="mt-6 flex w-full flex-col overflow-hidden rounded-xl border border-outline-soft/20 bg-surface-low shadow-stitch-panel xl:mt-0 xl:ml-6 xl:w-[380px] xl:shrink-0">
        <div className="flex items-center justify-between border-b border-outline-soft/10 bg-surface/50 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2 text-slate">
            <div className="flex size-10 items-center justify-center rounded-full bg-earth-soft text-earth">
              <span className="material-symbols-outlined fill text-[20px]">psychology</span>
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold">Copilot</h3>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-evidence" />
                <span className="text-xs font-semibold text-muted">Waiting for data</span>
              </div>
            </div>
          </div>
          <button type="button" className="rounded-full p-2 text-muted-soft transition hover:bg-surface-variant/30 hover:text-slate" disabled aria-label="Copilot menu unavailable in MVP">
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto bg-surface px-5 py-4">
          <div className="flex max-w-[90%] gap-4">
            <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-earth-soft text-earth">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="rounded-2xl rounded-tl-sm border border-outline-soft/20 bg-surface-lowest p-4 text-sm leading-6 text-ink shadow-sm">
                Hello! I'm ready to help you rediscover talent. To get started, please upload your Talent Pool CSV file using the button above or in the sidebar.
              </div>
              <span className="ml-1 text-xs font-semibold text-muted-soft">Just now</span>
            </div>
          </div>
        </div>
        <div className="border-t border-outline-soft/10 bg-surface px-5 py-4">
          <div className="flex items-center rounded-xl border border-outline-soft/30 bg-surface-lowest shadow-sm opacity-60">
            <textarea className="custom-scrollbar w-full resize-none border-none bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-muted-soft" placeholder="Upload data to start chatting..." rows={2} disabled />
            <div className="flex shrink-0 items-center gap-1 pr-2 pb-2 self-end">
              <button type="button" className="flex size-8 items-center justify-center rounded-full text-muted-soft" disabled aria-label="Voice Copilot not active in this slice">
                <span className="material-symbols-outlined text-[20px]">mic</span>
              </button>
              <button type="button" className="flex size-8 items-center justify-center rounded-full bg-earth text-white" disabled aria-label="Send message">
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
          <p className="mt-2 px-1 text-xs text-muted-soft">Copilot requires a Talent Pool to function.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="mt-6 flex w-full flex-col overflow-hidden rounded-xl border border-outline-soft/20 bg-surface-low shadow-stitch-panel xl:mt-0 xl:ml-6 xl:w-[380px] xl:shrink-0">
      <div className="flex items-center justify-between border-b border-outline-soft/10 bg-surface/50 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-2 text-slate">
          <div className="flex size-10 items-center justify-center rounded-full bg-earth-soft text-earth">
            <span className="material-symbols-outlined fill text-[20px]">psychology</span>
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold">Copilot</h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${isStreaming ? "bg-evidence" : "bg-muted-soft"}`} />
              <span className="text-xs font-semibold text-muted">
                {isStreaming ? "Thinking" : error ? "Error" : "Ready"}
              </span>
            </div>
          </div>
        </div>
        <button type="button" className="rounded-full p-2 text-muted-soft transition hover:bg-surface-variant/30 hover:text-slate" disabled aria-label="Copilot menu unavailable in MVP">
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex max-w-[90%] gap-4">
            <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-earth-soft text-earth">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="rounded-2xl rounded-tl-sm border border-outline-soft/20 bg-surface-lowest p-4 text-sm leading-6 text-ink shadow-sm">
                I'm ready to help you rediscover talent. Describe the role you're looking for and I'll search your Talent Pool.
              </div>
            </div>
          </div>
        ) : (
          messages.filter((m) => m.role === "user" || m.role === "assistant").map((message) => {
            const isUser = message.role === "user";
            const text = getMessageText(message);
            if (!text) return null;
            return (
              <div key={message.id} className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  {isUser ? "You" : "Copilot"}
                </span>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm whitespace-pre-wrap ${
                    isUser
                      ? "rounded-tr-sm bg-slate text-white"
                      : "rounded-tl-sm border border-outline-soft/20 bg-surface-lowest text-ink"
                  }`}
                >
                  {text}
                </div>
              </div>
            );
          })
        )}

        {isStreaming ? (
          <div className="flex items-start gap-2 rounded-lg bg-surface-high/50 px-4 py-3 text-sm leading-6 text-muted">
            <span className="material-symbols-outlined shrink-0 animate-pulse text-[16px]">psychology</span>
            <span>Copilot is thinking...</span>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-risk-soft bg-risk-soft/50 px-4 py-3 text-sm leading-6 text-risk">
            <span className="material-symbols-outlined shrink-0 text-[16px]">error</span>
            <span>{error.message || "Connection error. Check that the server is running and OPENAI_API_KEY is set."}</span>
          </div>
        ) : null}

        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-outline-soft/10 bg-surface px-5 py-4">
        <div className="flex items-center rounded-xl border border-outline-soft/30 bg-surface-lowest shadow-sm transition-all focus-within:border-slate focus-within:ring-1 focus-within:ring-slate/20">
          <textarea
            className="custom-scrollbar w-full resize-none border-none bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-muted-soft"
            placeholder="Describe the role you're looking for..."
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
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
              className="flex size-8 items-center justify-center rounded-full bg-earth text-white shadow-sm transition hover:bg-earth-strong disabled:opacity-50"
              disabled={isStreaming || !input.trim()}
              onClick={handleSend}
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
        <p className="mt-2 px-1 text-xs text-muted-soft">
          {isStreaming ? "Copilot is responding..." : "Enter to send, Shift+Enter for new line"}
        </p>
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
