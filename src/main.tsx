import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatAddToolOutputFunction, type ChatOnToolCallCallback, type UIMessage } from "ai";
import { createRoute, createRootRoute, createRouter, Link, Outlet, RouterProvider, useNavigate } from "@tanstack/react-router";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createSearchRequest, importCsvTalentPool, listCandidateNotes } from "./api-client.js";
import { useAppStore, type ComparisonReport, type CopilotErrorState } from "./app-store.js";
import { createSearchRequestFailureOutput } from "./copilot-tool-output.js";
import type { CandidateRecord } from "./csv-candidate-records.js";
import { canDraftMessageFromSuggestedNextAction, draftMessageFromMatch } from "./message-draft.js";
import type { SearchCriteria } from "./search-criteria.js";
import { buildShortlist, type Match } from "./shortlist-matches.js";
import { toCompactShortlistContext } from "./intelligence-layer.js";
import "./styles.css";

type CopilotErrorPayload = {
  error?: {
    category?: unknown;
    message?: unknown;
  };
};

class CopilotApiError extends Error {
  state: CopilotErrorState;

  constructor(state: CopilotErrorState) {
    super(state.message);
    this.name = "CopilotApiError";
    this.state = state;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCopilotApiError(error: unknown): error is CopilotApiError {
  return error instanceof CopilotApiError;
}

function getUiMessageText(message: { parts: unknown[] }): string {
  return message.parts
    .map(formatUiMessagePart)
    .filter(Boolean)
    .join("");
}

function formatUiMessagePart(part: unknown): string {
  if (!isObject(part) || typeof part.type !== "string") {
    return "";
  }

  if (part.type === "text" && typeof part.text === "string") {
    return part.text;
  }

  return "";
}

function getToolPartValue(part: unknown, key: "input" | "output"): Record<string, unknown> | null {
  if (!isObject(part) || !isObject(part[key])) {
    return null;
  }

  return part[key];
}

function getCreateSearchRequestActivity(part: unknown) {
  if (!isObject(part) || part.type !== "tool-createSearchRequest") {
    return null;
  }

  const output = getToolPartValue(part, "output");
  const input = getToolPartValue(part, "input");
  const searchRequest = typeof output?.searchRequest === "string"
    ? output.searchRequest
    : typeof input?.searchRequest === "string"
      ? input.searchRequest
      : "";

  if (!searchRequest) {
    return null;
  }

  const matchCount = typeof output?.matchCount === "number" ? output.matchCount : null;
  const applied = output?.applied === true;
  const isComplete = !!output;

  return {
    searchRequest,
    matchCount,
    applied,
    isComplete,
  };
}

function getMessageActivities(message: { parts: unknown[] }) {
  return message.parts.map(getCreateSearchRequestActivity).filter((activity) => activity !== null);
}

function getComparisonReportActivity(part: unknown) {
  if (!isObject(part) || part.type !== "tool-compareMatches") {
    return null;
  }

  const output = getToolPartValue(part, "output");

  if (output?.compared !== true || output?.comparisonReportAvailable !== true) {
    return null;
  }

  return {
    comparisonRoute: typeof output.comparisonRoute === "string" ? output.comparisonRoute : "/to-compare",
    ctaLabel: typeof output.ctaLabel === "string" ? output.ctaLabel : "Open detailed comparison",
  };
}

function getComparisonReportActivities(message: { parts: unknown[] }) {
  return message.parts.map(getComparisonReportActivity).filter((activity) => activity !== null);
}

function getInputString(input: unknown, key: string) {
  if (!isObject(input)) {
    return "";
  }

  const value = input[key];

  return typeof value === "string" ? value.trim() : "";
}

function getInputStringArray(input: unknown, key: string) {
  if (!isObject(input) || !Array.isArray(input[key])) {
    return [];
  }

  return input[key]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

function getMatchSummary(match: Match) {
  return {
    matchId: getMatchId(match),
    candidateRecordLabel: getCandidateRecordLabel(match),
    currentRole: match.candidateRecord.canonicalFields.currentRole || "Not provided",
    strength: match.strength,
  };
}

function getAvailableMatchSummaries(shortlist: Match[]) {
  return shortlist.map(getMatchSummary);
}

function getMatchExplanation(match: Match) {
  return {
    ...getMatchSummary(match),
    reasons: match.reasons,
    evidence: match.evidence.map((item) => ({
      label: item.label,
      value: item.value,
      matched: item.matched,
    })),
    gaps: match.gaps,
    risks: match.risks,
    suggestedNextAction: match.suggestedNextAction,
  };
}

function buildComparisonReport(matches: Match[], searchRequest: string): ComparisonReport {
  const evidenceByMatch = matches.map((match) => new Set(match.evidence.map((item) => `${item.label}: ${item.matched}`)));
  const sharedEvidence = matches[0].evidence
    .map((item) => `${item.label}: ${item.matched}`)
    .filter((item) => evidenceByMatch.every((items) => items.has(item)));

  return {
    searchRequest,
    comparedMatchIds: matches.map(getMatchId),
    sharedEvidence,
    matches: matches.map((match) => ({
      ...getMatchExplanation(match),
      differentiators: match.evidence
        .map((item) => `${item.label}: ${item.matched}`)
        .filter((item) => !sharedEvidence.includes(item)),
    })),
  };
}

function classifyCopilotError(error: unknown): CopilotErrorState {
  if (isCopilotApiError(error)) {
    return error.state;
  }

  return {
    kind: "offline",
    message: "Copilot is unreachable. Check that the Intelligence Layer server is running, then retry.",
  };
}

async function parseCopilotErrorResponse(response: Response): Promise<CopilotErrorState> {
  const payload = (await response.clone().json().catch(() => null)) as CopilotErrorPayload | null;
  const errorObject = payload?.error;
  const category = isObject(errorObject) ? errorObject.category : undefined;
  const safeMessage = typeof payload?.error?.message === "string" ? payload.error.message : undefined;

  if (category === "validation_error" || (response.status >= 400 && response.status < 500)) {
    return {
      kind: "client",
      status: response.status,
      message: safeMessage || "Copilot could not process that request. Try rephrasing and sending again.",
    };
  }

  return {
    kind: "server",
    status: response.status,
    message: safeMessage || "Copilot is temporarily unavailable. Retry in a few moments.",
  };
}

function RootLayout() {
  return (
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
  const candidateRecordCount = useAppStore((state) => state.candidateRecordCount);
  const shortlist = useAppStore((state) => state.shortlist);
  const copilotError = useAppStore((state) => state.copilotError);
  const setCopilotError = useAppStore((state) => state.setCopilotError);
  const selectMatch = useAppStore((state) => state.selectMatch);
  const hasTalentPool = candidateRecordCount > 0;
  const clearCopilotError = () => setCopilotError(null);

  useEffect(() => {
    selectMatch(null);
  }, [selectMatch]);

  let workspace: ReactNode;

  if (copilotError?.kind === "server") {
    workspace = <CopilotServerErrorHomeView error={copilotError} onRetry={clearCopilotError} />;
  } else if (!hasTalentPool) {
    workspace = <EmptyHomeView />;
  } else if (shortlist.length > 0) {
    workspace = <ShortlistHomeView />;
  } else {
    workspace = <DataReadyHomeView />;
  }

  return (
    <HomeShell>
      {workspace}
      <CopilotPanel mode={hasTalentPool ? "active" : "empty"} copilotError={copilotError} onCopilotError={setCopilotError} onClearCopilotError={clearCopilotError} />
    </HomeShell>
  );
}

function HomeShell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col xl:flex-row">{children}</div>;
}

function EmptyHomeView() {
  return (
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
  );
}

function DataReadyHomeView() {
  const candidateRecordCount = useAppStore((state) => state.candidateRecordCount);
  const talentPoolFileName = useAppStore((state) => state.talentPoolFileName);

  return (
      <section className="flex flex-1 flex-col overflow-y-auto px-0 lg:px-10">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
          <div className="relative overflow-hidden rounded-xl border border-outline-soft/20 bg-surface-lowest p-8 text-center shadow-stitch-card">
            <div className="flex flex-col items-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-secondary-soft text-secondary-strong shadow-inner">
                <span className="material-symbols-outlined text-[32px]">database</span>
              </div>
              <h3 className="font-serif text-[40px] font-bold leading-10 tracking-[-0.02em] text-slate">
                {candidateRecordCount}
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
              <p className="mt-1 font-serif text-2xl font-semibold text-slate">{candidateRecordCount}</p>
            </div>
            <div className="rounded-lg border border-outline-soft/10 bg-surface-low p-4">
              <span className="material-symbols-outlined mb-2 text-earth">folder_open</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">File</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate">{talentPoolFileName || "CSV upload"}</p>
            </div>
            <div className="rounded-lg border border-outline-soft/10 bg-surface-low p-4">
              <span className="material-symbols-outlined mb-2 text-earth">history</span>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Session</p>
              <p className="mt-1 text-sm font-semibold text-slate">In-memory only</p>
            </div>
          </div>
        </div>
      </section>
  );
}

function ShortlistHomeView() {
  const searchRequest = useAppStore((state) => state.searchRequest);
  const searchCriteria = useAppStore((state) => state.searchCriteria);
  const shortlist = useAppStore((state) => state.shortlist);

  return (
      <section className="flex-1 space-y-6 overflow-y-auto px-0 lg:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-earth">Shortlist</p>
            <h2 className="mt-2 font-serif text-[32px] font-semibold leading-10 tracking-[-0.01em] text-slate">
              Evidence-grounded Matches
            </h2>
            <p className="mt-2 text-base leading-7 text-muted">
              Search Request: <span className="font-semibold text-slate">{searchRequest}</span>
            </p>
          </div>
          <span className="w-fit rounded-full bg-surface-high px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {shortlist.length} {shortlist.length === 1 ? "Match" : "Matches"} returned
          </span>
        </div>

        <SearchCriteriaSummary searchCriteria={searchCriteria} />

        <div className="space-y-4">
          {shortlist.map((match, index) => (
            <ShortlistMatchCard key={getMatchId(match)} match={match} index={index} />
          ))}
        </div>
      </section>
  );
}

function SearchCriteriaSummary({ searchCriteria }: { searchCriteria: SearchCriteria | null }) {
  if (!searchCriteria) {
    return null;
  }

  const criteria = [
    ...(searchCriteria.skills?.length ? [{ label: "Skills", value: searchCriteria.skills.join(", ") }] : []),
    ...(searchCriteria.seniority ? [{ label: "Seniority", value: searchCriteria.seniority }] : []),
    ...(searchCriteria.location?.length ? [{ label: "Location", value: searchCriteria.location.join(", ") }] : []),
    ...(searchCriteria.industry?.length ? [{ label: "Industry", value: searchCriteria.industry.join(", ") }] : []),
    ...(searchCriteria.languageLevel ? [{ label: "Language", value: searchCriteria.languageLevel }] : []),
    ...(searchCriteria.availability ? [{ label: "Availability", value: searchCriteria.availability }] : []),
  ];

  if (criteria.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-outline-soft/20 bg-surface-lowest p-5 shadow-stitch-card">
      <div className="mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-earth">tune</span>
        <h3 className="font-serif text-xl font-semibold text-slate">Interpreted Search Criteria</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {criteria.map((item) => (
          <span key={item.label} className="rounded bg-slate-soft px-3 py-1 text-xs font-semibold text-slate">
            {item.label}: {item.value}
          </span>
        ))}
      </div>
    </section>
  );
}

function ShortlistMatchCard({ match, index }: { match: Match; index: number }) {
  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: getMatchId(match) }}
      className="block rounded-xl border border-outline-soft/20 bg-surface-lowest p-6 shadow-stitch-card transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-earth">Match {index + 1}</p>
          <h3 className="mt-1 font-serif text-xl font-semibold text-slate">{getCandidateRecordLabel(match)}</h3>
          <p className="mt-1 text-sm leading-6 text-muted">{match.candidateRecord.canonicalFields.currentRole || "Role not provided"}</p>
        </div>
        <span className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${getStrengthClass(match.strength)}`}>
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          {match.strength}
        </span>
      </div>

      <div className="mt-5 grid gap-4 border-t border-outline-soft/10 pt-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Evidence</p>
          <ul className="space-y-2 text-sm leading-6 text-ink">
            {match.reasons.slice(0, 3).map((reason) => (
              <li key={reason} className="flex items-start gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-evidence" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Gaps and risks</p>
          <ul className="space-y-2 text-sm leading-6 text-muted">
            {[...match.gaps.slice(0, 1), ...match.risks.slice(0, 1)].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-earth" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-surface-low px-4 py-3 text-sm font-semibold leading-6 text-slate">
        Suggested Next Action: {match.suggestedNextAction}
      </p>
    </Link>
  );
}

function getCandidateId(record: CandidateRecord) {
  return "candidateId" in record && typeof record.candidateId === "string" ? record.candidateId : "";
}

function getStrengthClass(strength: Match["strength"]) {
  if (strength === "Strong") {
    return "bg-evidence-soft text-evidence";
  }

  if (strength === "Possible") {
    return "bg-secondary-soft text-secondary-strong";
  }

  return "bg-risk-soft text-risk";
}

function CopilotServerErrorHomeView({ error, onRetry }: { error: CopilotErrorState; onRetry: () => void }) {
  return (
      <section className="relative flex min-h-[calc(100vh-8rem)] flex-1 items-center justify-center overflow-hidden px-6 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]">
          <span className="material-symbols-outlined text-[42vw] font-light">database</span>
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="mb-8 inline-flex size-24 items-center justify-center rounded-full border border-risk/20 bg-risk-soft/40 text-risk">
            <span className="material-symbols-outlined text-[56px]">cloud_off</span>
          </div>
          <h2 className="font-serif text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-slate">Copilot is temporarily unavailable</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-muted">
            The Intelligence Layer returned a server-side error, so Copilot chat is paused. Your in-memory Talent Pool, Search Criteria, Matches, and Shortlist remain unchanged.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-slate-strong px-8 py-3 text-sm font-bold text-white transition hover:bg-slate" onClick={onRetry}>
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Retry Copilot
            </button>
            <Link to="/talent-pool" className="rounded-lg border border-outline-soft px-8 py-3 text-sm font-bold text-slate transition hover:bg-surface-high">
              Review Talent Pool
            </Link>
          </div>
          <div className="mx-auto mt-12 max-w-md border-t border-outline-soft/30 pt-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-soft">Technical details</p>
            <div className="mt-3 rounded-lg border border-outline-soft/20 bg-surface-high/40 p-4 font-mono text-[11px] leading-5 text-muted">
              <div>Category: server_error</div>
              <div>Status: {error.status || "5xx"}</div>
              <div>Client action: Retry after a moment.</div>
            </div>
          </div>
        </div>
      </section>
  );
}

function TalentPoolRoute() {
  const candidateRecords = useAppStore((state) => state.candidateRecords);
  const talentPoolFileName = useAppStore((state) => state.talentPoolFileName);
  const loadTalentPool = useAppStore((state) => state.loadTalentPool);
  const clearTalentPool = useAppStore((state) => state.clearTalentPool);
  const selectMatch = useAppStore((state) => state.selectMatch);
  const [uploadStatus, setUploadStatus] = useState("Upload a CSV Talent Pool File to start.");
  const [uploadError, setUploadError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    selectMatch(null);
  }, [selectMatch]);

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
      const result = await importCsvTalentPool({ fileName: file.name, csvText });
      loadTalentPool({ talentPoolFileName: file.name, candidateRecords: result.candidateRecords });
      setUploadStatus(`Imported ${result.imported.candidateRecordCount} Candidate Records from ${file.name}.`);
      setUploadError(false);
    } catch (error) {
      clearTalentPool();
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

      <CandidateRecordTable records={candidateRecords} uploadFileName={talentPoolFileName} />
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

function formatSourceLabel(source: unknown) {
  const sourceText = normalizeSourceValue(source);

  if (!sourceText) {
    return <span className="text-xs italic text-muted-soft">Unknown source</span>;
  }

  const cleanSource = sourceText
    .replace(/greenhouse\s*api/i, "CSV Upload")
    .replace(/linkedin\s*scrape/i, "CSV Upload")
    .replace(/api/i, "CSV Upload")
    .trim();

  return <span className="text-xs font-medium text-slate">{cleanSource}</span>;
}

function normalizeSourceValue(source: unknown): string {
  if (typeof source === "string") {
    return source.trim();
  }

  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return "";
  }

  const sourceRecord = source as Record<string, unknown>;
  const preferredValue = ["label", "name", "source", "origin", "pipeline", "fileName", "type"]
    .map((key) => sourceRecord[key])
    .find((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (preferredValue) {
    return preferredValue.trim();
  }

  return Object.entries(sourceRecord)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => `${key}: ${(value as string).trim()}`)
    .join(" / ");
}

function MatchDetailRoute() {
  const { matchId } = matchRoute.useParams();
  const shortlist = useAppStore((state) => state.shortlist);
  const searchRequest = useAppStore((state) => state.searchRequest);
  const draftText = useAppStore((state) => state.messageDraftsByMatchId[matchId] || "");
  const setMessageDraft = useAppStore((state) => state.setMessageDraft);
  const selectMatch = useAppStore((state) => state.selectMatch);
  const match = shortlist.find((candidateMatch) => getMatchId(candidateMatch) === matchId);

  useEffect(() => {
    selectMatch(matchId);

    return () => selectMatch(null);
  }, [matchId, selectMatch]);

  if (match) {
    const isDraftable = canDraftMessageFromSuggestedNextAction(match.suggestedNextAction);

    function handleCreateDraft() {
      if (!match) {
        return;
      }

      try {
        setMessageDraft(matchId, draftMessageFromMatch({ ...match, searchRequest }));
      } catch {
        return;
      }
    }

    return (
      <section>
        <div className="mb-6 flex items-center gap-2 text-sm text-muted">
          <Link to="/" className="flex items-center gap-1 text-muted transition hover:text-slate">
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            {searchRequest || "Search Request"}
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
                      onChange={(event) => setMessageDraft(matchId, event.target.value)}
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

function ComparisonReportRoute() {
  const comparisonReport = useAppStore((state) => state.comparisonReport);

  if (!comparisonReport) {
    return (
      <section className="rounded-xl border border-outline-soft/20 bg-surface-lowest p-8 text-center shadow-stitch-card">
        <span className="material-symbols-outlined mb-4 text-[48px] text-slate/40">compare_arrows</span>
        <h2 className="font-serif text-2xl font-semibold text-slate">No comparison report is available for this session</h2>
        <p className="mx-auto mt-2 max-w-xl text-base leading-7 text-muted">
          Detailed Match comparison reports are stored only in browser memory. Load a Talent Pool File, run a Search Request, and ask Copilot to compare at least two current Match IDs.
        </p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-slate-strong px-4 py-3 text-sm font-bold text-white transition hover:bg-slate">
          Return to Home
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-outline-soft/20 bg-surface-lowest p-6 shadow-stitch-card lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-earth">Session-scoped comparison</p>
          <h2 className="mt-2 font-serif text-[32px] font-semibold leading-10 tracking-[-0.01em] text-slate">Detailed Match comparison</h2>
          <p className="mt-2 max-w-3xl text-base leading-7 text-muted">
            Search Request: <span className="font-semibold text-slate">{comparisonReport.searchRequest || "Current Search Request"}</span>
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Compared Match IDs: <span className="font-semibold text-slate">{comparisonReport.comparedMatchIds.join(", ")}</span>
          </p>
        </div>
        <Link to="/" className="inline-flex w-fit items-center gap-2 rounded-lg border border-outline-soft px-4 py-3 text-sm font-bold text-slate transition hover:bg-surface-high">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Return to Shortlist
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {comparisonReport.matches.map((match) => (
          <section key={match.matchId} className="rounded-xl border border-outline-soft/20 bg-surface-lowest p-5 shadow-stitch-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-earth">{match.matchId}</p>
                <h3 className="mt-1 font-serif text-xl font-semibold text-slate">{match.candidateRecordLabel}</h3>
                <p className="mt-1 text-sm leading-6 text-muted">{match.currentRole}</p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${getStrengthClass(match.strength)}`}>
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {match.strength}
              </span>
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-outline-soft/20 bg-surface-lowest p-6 shadow-stitch-card">
        <h3 className="font-serif text-xl font-semibold text-slate">
          <span className="material-symbols-outlined mr-2 align-middle text-earth">hub</span>
          Shared Evidence
        </h3>
        {comparisonReport.sharedEvidence.length > 0 ? (
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-ink md:grid-cols-2">
            {comparisonReport.sharedEvidence.map((item) => (
              <li key={item} className="rounded-lg bg-evidence-soft px-4 py-3 text-evidence">{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-muted">No shared evidence was found across all compared Matches. Review differentiators below.</p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {comparisonReport.matches.map((match) => (
          <section key={`${match.matchId}-details`} className="space-y-5 rounded-xl border border-outline-soft/20 bg-surface-lowest p-6 shadow-stitch-card">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-earth">Match detail</p>
              <h3 className="mt-1 font-serif text-2xl font-semibold text-slate">{match.candidateRecordLabel}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{match.matchId} · {match.currentRole}</p>
            </div>

            <ComparisonList title="Reasons" icon="insights" items={match.reasons} tone="evidence" />
            <ComparisonList title="Differentiators" icon="difference" items={match.differentiators.length > 0 ? match.differentiators : ["No unique evidence differentiators beyond the shared evidence."]} tone="slate" />

            <div>
              <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <span className="material-symbols-outlined text-[16px]">history</span>
                Candidate Record Evidence
              </h4>
              <div className="space-y-3">
                {match.evidence.map((item) => (
                  <div key={`${match.matchId}-${item.label}-${item.matched}`} className="rounded-lg border border-outline-soft/10 bg-surface-low p-4">
                    <p className="text-sm font-semibold text-slate">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted">{item.value}</p>
                    <span className="mt-2 inline-flex rounded bg-evidence-soft px-2 py-0.5 text-[10px] font-semibold text-evidence">{item.matched}</span>
                  </div>
                ))}
              </div>
            </div>

            <ComparisonList title="Gaps" icon="help" items={match.gaps} tone="secondary" />
            <ComparisonList title="Risks" icon="warning" items={match.risks} tone="risk" />

            <p className="rounded-lg bg-surface-high px-4 py-3 text-sm font-semibold leading-6 text-slate">
              Suggested Next Action: {match.suggestedNextAction}
            </p>
          </section>
        ))}
      </div>
    </section>
  );
}

function ComparisonList({ title, icon, items, tone }: { title: string; icon: string; items: string[]; tone: "evidence" | "risk" | "secondary" | "slate" }) {
  const dotClass = {
    evidence: "bg-evidence",
    risk: "bg-risk",
    secondary: "bg-secondary-strong",
    slate: "bg-slate",
  }[tone];

  return (
    <div>
      <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
        {title}
      </h4>
      <ul className="space-y-2 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className={`mt-2 size-1.5 shrink-0 rounded-full ${dotClass}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function getMatchId(match: Match) {
  return `row-${match.candidateRecord.rowNumber}`;
}

function getCandidateRecordLabel(match: Match) {
  return match.candidateRecord.canonicalFields.name || `Candidate Record ${match.candidateRecord.rowNumber}`;
}

function CopilotErrorMessage({ error, onRetry }: { error: CopilotErrorState; onRetry: () => void }) {
  if (error.kind === "client") {
    return (
      <div className="flex max-w-[90%] gap-3">
        <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border border-risk/20 bg-risk-soft text-risk">
          <span className="material-symbols-outlined text-[15px]">error</span>
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-risk/10 bg-risk-soft p-4 text-sm leading-6 text-risk shadow-sm">
          <p className="font-semibold">I couldn't process that Copilot request.</p>
          <p className="mt-1 opacity-90">
            {error.message} Try rephrasing it as a clear Search Request, for example: <span className="rounded border border-risk/10 bg-white/35 px-1 py-0.5 font-mono text-[12px]">Senior React profiles with fintech experience</span>
          </p>
        </div>
      </div>
    );
  }

  if (error.kind === "offline") {
    return (
      <div className="rounded-lg border border-outline-soft/30 bg-surface-high px-4 py-3 text-sm leading-6 text-muted shadow-sm" role="alert">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined shrink-0 text-[20px] text-secondary-strong">wifi_off</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate">Copilot is offline. Reconnecting...</p>
            <p className="mt-1">{error.message}</p>
          </div>
          <button type="button" className="shrink-0 text-xs font-bold uppercase tracking-[0.12em] text-slate hover:underline" onClick={onRetry}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-risk/20 bg-risk-soft/40 px-4 py-4 text-sm leading-6 text-risk shadow-sm" role="alert">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined shrink-0 text-[20px]">warning</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Intelligence Layer unavailable</p>
          <p className="mt-1 text-ink">{error.message}</p>
          <div className="mt-3 flex items-center justify-between border-t border-risk/10 pt-3">
            <span className="text-xs font-semibold text-risk/80">Status {error.status || "5xx"}</span>
            <button type="button" className="text-sm font-bold text-risk hover:underline" onClick={onRetry}>
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CopilotActivityCard({ activity }: { activity: NonNullable<ReturnType<typeof getCreateSearchRequestActivity>> }) {
  const matchSummary = activity.isComplete
    ? activity.applied && typeof activity.matchCount === "number" && activity.matchCount > 0
      ? `${activity.matchCount} evidence-grounded Match${activity.matchCount === 1 ? "" : "es"} returned in the Shortlist.`
      : "No evidence-grounded Matches were returned for this Search Request."
    : "Evaluating Candidate Records against the interpreted Search Criteria.";

  return (
    <div className="max-w-[92%] rounded-xl border border-outline-soft/20 bg-surface-high/50 px-4 py-3 text-sm leading-6 text-muted shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate">
        <span className={`material-symbols-outlined text-[16px] ${activity.isComplete ? "text-evidence" : "animate-pulse text-earth"}`}>
          {activity.isComplete ? "check_circle" : "hourglass_top"}
        </span>
        Intelligence Layer activity
      </div>
      <div className="space-y-1">
        <p>
          Created Search Request: <span className="font-semibold text-slate">{activity.searchRequest}</span>
        </p>
        <p>{matchSummary}</p>
      </div>
    </div>
  );
}

function CopilotComparisonReportActivityCard({ activity }: { activity: NonNullable<ReturnType<typeof getComparisonReportActivity>> }) {
  return (
    <div className="max-w-[92%] rounded-xl border border-outline-soft/20 bg-surface-high/50 px-4 py-3 text-sm leading-6 text-muted shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate">
        <span className="material-symbols-outlined text-[16px] text-evidence">compare_arrows</span>
        Detailed comparison ready
      </div>
      <p>The report is stored in this browser-memory session only.</p>
      <Link to="/to-compare" className="mt-3 inline-flex rounded-lg bg-slate-strong px-3 py-2 text-xs font-bold text-white transition hover:bg-slate">
        {activity.ctaLabel}
      </Link>
    </div>
  );
}

function CopilotPanel({
  mode,
  copilotError,
  onCopilotError,
  onClearCopilotError,
}: {
  mode: "empty" | "active";
  copilotError: CopilotErrorState | null;
  onCopilotError: (error: CopilotErrorState) => void;
  onClearCopilotError: () => void;
}) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const input = useAppStore((state) => state.copilotInput);
  const setInput = useAppStore((state) => state.setCopilotInput);
  const setStoredMessages = useAppStore((state) => state.setCopilotMessages);
  const initialMessagesRef = useRef(useAppStore.getState().copilotMessages);
  const addToolOutputRef = useRef<ChatAddToolOutputFunction<UIMessage> | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (input, init) => {
          let response: Response;

          try {
            response = await fetch(input, init);
          } catch {
            throw new CopilotApiError({
              kind: "offline",
              message: "Copilot is unreachable. Check that the Intelligence Layer server is running, then retry.",
            });
          }

          if (!response.ok) {
            throw new CopilotApiError(await parseCopilotErrorResponse(response));
          }

          return response;
        },
        body: () => {
          const s = useAppStore.getState();
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

  const handleToolCall: ChatOnToolCallCallback<UIMessage> = async ({ toolCall }) => {
    const current = useAppStore.getState();
    const outputToolCall = (output: Record<string, unknown>) => {
      void addToolOutputRef.current?.({
        tool: toolCall.toolName,
        toolCallId: toolCall.toolCallId,
        output,
      });
    };

    if (toolCall.toolName === "createSearchRequest") {
      const searchRequest = getInputString(toolCall.input, "searchRequest");
      if (!searchRequest) return;

      let persisted: Awaited<ReturnType<typeof createSearchRequest>>;
      let candidateNotes: Awaited<ReturnType<typeof listCandidateNotes>>["candidateNotes"] = [];

      try {
        persisted = await createSearchRequest({ searchRequest });
        const candidateIds = current.candidateRecords
          .map((record) => getCandidateId(record))
          .filter((candidateId): candidateId is string => !!candidateId);
        candidateNotes = candidateIds.length > 0 ? (await listCandidateNotes(candidateIds)).candidateNotes : [];
      } catch (error) {
        outputToolCall(createSearchRequestFailureOutput(error));
        onCopilotError({
          kind: "server",
          message: error instanceof Error ? error.message : "The Search Request or Candidate Notes could not be loaded.",
        });
        return;
      }

      const searchCriteria = persisted.searchRequest.searchCriteria;
      const shortlist = current.candidateRecords.length > 0
        ? buildShortlist(current.candidateRecords, searchCriteria, { candidateNotes })
        : [];
      const matchCount = shortlist.length;

      current.applySearchRequest({ searchRequest, searchCriteria, shortlist });

      outputToolCall({
        applied: matchCount > 0,
        searchRequest,
        searchCriteria,
        matchCount,
        availableMatches: getAvailableMatchSummaries(shortlist),
      });
      return;
    }

    if (toolCall.toolName === "showCurrentCriteria") {
      outputToolCall({
        hasCriteria: !!current.searchCriteria,
        searchRequest: current.searchRequest || null,
        searchCriteria: current.searchCriteria,
        readOnly: true,
        guidance: current.searchCriteria
          ? "Search Criteria are read-only. Revise the Search Request if the interpretation is wrong."
          : "No Search Criteria have been interpreted yet. Submit a Search Request to create them.",
      });
      return;
    }

    if (toolCall.toolName === "explainMatch") {
      const matchId = getInputString(toolCall.input, "matchId");
      const match = current.shortlist.find((candidateMatch) => getMatchId(candidateMatch) === matchId);

      outputToolCall(match
        ? { found: true, explanation: getMatchExplanation(match) }
        : {
            found: false,
            requestedMatchId: matchId || null,
            availableMatches: getAvailableMatchSummaries(current.shortlist),
            guidance: "Use a Match ID from the current Shortlist. Do not fabricate unavailable Matches.",
          });
      return;
    }

    if (toolCall.toolName === "navigateToMatch") {
      const matchId = getInputString(toolCall.input, "matchId");
      const match = current.shortlist.find((candidateMatch) => getMatchId(candidateMatch) === matchId);

      if (!match) {
        outputToolCall({
          navigated: false,
          requestedMatchId: matchId || null,
          availableMatches: getAvailableMatchSummaries(current.shortlist),
          guidance: "That Match is not available in the current in-memory Shortlist.",
        });
        return;
      }

      current.selectMatch(matchId);
      void navigate({ to: "/matches/$matchId", params: { matchId } });
      outputToolCall({ navigated: true, match: getMatchSummary(match), sessionScoped: true });
      return;
    }

    if (toolCall.toolName === "requestMessageDraft") {
      const matchId = getInputString(toolCall.input, "matchId");
      const match = current.shortlist.find((candidateMatch) => getMatchId(candidateMatch) === matchId);

      if (!match) {
        outputToolCall({
          draftCreated: false,
          requestedMatchId: matchId || null,
          availableMatches: getAvailableMatchSummaries(current.shortlist),
          guidance: "Message drafts are only available for Matches in the current Shortlist.",
        });
        return;
      }

      if (!canDraftMessageFromSuggestedNextAction(match.suggestedNextAction)) {
        outputToolCall({
          draftCreated: false,
          match: getMatchSummary(match),
          suggestedNextAction: match.suggestedNextAction,
          guidance: "Editable drafts are unavailable unless the Suggested Next Action supports contact or recontact.",
        });
        return;
      }

      const draftText = draftMessageFromMatch({ ...match, searchRequest: current.searchRequest });
      current.setMessageDraft(matchId, draftText);
      outputToolCall({
        draftCreated: true,
        match: getMatchSummary(match),
        draftText,
        guidance: "Draft stored in the current browser-memory session for recruiter review. Talent Rediscovery never sends outreach automatically.",
      });
      return;
    }

    if (toolCall.toolName === "compareMatches") {
      const requestedMatchIds = uniqueValues(getInputStringArray(toolCall.input, "matchIds"));
      const matches = requestedMatchIds
        .map((matchId) => current.shortlist.find((candidateMatch) => getMatchId(candidateMatch) === matchId))
        .filter((match): match is Match => !!match);
      const validMatchIds = matches.map(getMatchId);
      const unavailableMatchIds = requestedMatchIds.filter((matchId) => !validMatchIds.includes(matchId));

      if (matches.length < 2) {
        current.setComparisonReport(null);
        outputToolCall({
          compared: false,
          requestedMatchIds,
          validMatchIds,
          unavailableMatchIds,
          availableMatches: getAvailableMatchSummaries(current.shortlist),
          guidance: "Select at least two valid Match IDs from the current Shortlist to compare.",
        });
        return;
      }

      const comparisonReport = buildComparisonReport(matches, current.searchRequest);
      current.setComparisonReport(comparisonReport);
      outputToolCall({
        compared: true,
        requestedMatchIds,
        unavailableMatchIds,
        comparison: comparisonReport,
        comparisonReportAvailable: true,
        comparisonRoute: "/to-compare",
        ctaLabel: "Open detailed comparison",
        guidance: "Ask whether the recruiter wants the detailed report and offer the CTA. The report is session-scoped and not persisted.",
      });
    }
  };

  const { messages, sendMessage, status, addToolOutput } = useChat({
    messages: initialMessagesRef.current,
    transport,
    onError: (chatError) => onCopilotError(classifyCopilotError(chatError)),
    onToolCall: handleToolCall,
  });
  addToolOutputRef.current = addToolOutput;

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    onClearCopilotError();
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

  useEffect(() => {
    setStoredMessages(messages);
  }, [messages, setStoredMessages]);

  const isProcessing = status === "streaming" || status === "submitted";
  const visibleCopilotError = copilotError;
  const disablesComposer = isProcessing || visibleCopilotError?.kind === "offline" || visibleCopilotError?.kind === "server";
  const composerPlaceholder =
    isProcessing
      ? "Copilot is analyzing the Talent Pool..."
      : visibleCopilotError?.kind === "offline"
      ? "Waiting for connection..."
      : visibleCopilotError?.kind === "server"
        ? "Copilot is temporarily unavailable..."
        : visibleCopilotError?.kind === "client"
          ? "Type a revised request..."
          : "Describe the role you're looking for...";
  const copilotPanelClassName = "mt-6 flex w-full flex-col overflow-hidden rounded-xl border border-outline-soft/20 bg-surface-low shadow-stitch-panel xl:sticky xl:top-0 xl:mt-0 xl:ml-6 xl:h-[calc(100vh-8rem)] xl:max-h-[calc(100vh-8rem)] xl:w-[380px] xl:shrink-0 xl:self-start";

  if (mode === "empty") {
    return (
      <aside className={copilotPanelClassName}>
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
    <aside className={copilotPanelClassName}>
      <div className="flex items-center justify-between border-b border-outline-soft/10 bg-surface/50 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-2 text-slate">
          <div className="flex size-10 items-center justify-center rounded-full bg-earth-soft text-earth">
            <span className="material-symbols-outlined fill text-[20px]">psychology</span>
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold">Copilot</h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${isProcessing ? "bg-evidence" : visibleCopilotError ? "bg-risk" : "bg-muted-soft"}`} />
              <span className="text-xs font-semibold text-muted">
                {isProcessing ? "Analyzing" : visibleCopilotError?.kind === "offline" ? "Offline" : visibleCopilotError ? "Needs attention" : "Ready"}
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
                I'm ready to help you rediscover talent. Describe the profile you need and I'll draft a Search Request for your Talent Pool.
              </div>
            </div>
          </div>
        ) : (
          messages.filter((m) => m.role === "user" || m.role === "assistant").map((message) => {
            const isUser = message.role === "user";
            const text = getUiMessageText(message);
            const activities = isUser ? [] : getMessageActivities(message);
            const comparisonActivities = isUser ? [] : getComparisonReportActivities(message);
            if (!text && activities.length === 0 && comparisonActivities.length === 0) return null;
            return (
              <div key={message.id} className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-muted">
                  {isUser ? "You" : "Copilot"}
                </span>
                {text ? (
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm whitespace-pre-wrap ${
                      isUser
                        ? "rounded-tr-sm bg-slate text-white"
                        : "rounded-tl-sm border border-outline-soft/20 bg-surface-lowest text-ink"
                    }`}
                  >
                    {text}
                  </div>
                ) : null}
                {activities.map((activity, index) => (
                  <CopilotActivityCard key={`${message.id}-activity-${index}`} activity={activity} />
                ))}
                {comparisonActivities.map((activity, index) => (
                  <CopilotComparisonReportActivityCard key={`${message.id}-comparison-${index}`} activity={activity} />
                ))}
              </div>
            );
          })
        )}

        {isProcessing ? (
          <div className="space-y-3 rounded-lg bg-surface-high/50 px-4 py-3 text-sm leading-6 text-muted">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined shrink-0 animate-pulse text-[16px]">psychology</span>
              <span>Copilot is analyzing the Talent Pool.</span>
            </div>
            <div className="grid gap-2 text-xs font-semibold text-muted-soft">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-evidence">check_circle</span>
                Reading the current Search Request context
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-pulse text-[14px] text-earth">hourglass_top</span>
                Preparing allowed Intelligence Layer actions
              </span>
            </div>
          </div>
        ) : null}

        {visibleCopilotError ? <CopilotErrorMessage error={visibleCopilotError} onRetry={onClearCopilotError} /> : null}

        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-outline-soft/10 bg-surface px-5 py-4">
        <div className="flex items-center rounded-xl border border-outline-soft/30 bg-surface-lowest shadow-sm transition-all focus-within:border-slate focus-within:ring-1 focus-within:ring-slate/20">
          <textarea
            className="custom-scrollbar w-full resize-none border-none bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-muted-soft"
            placeholder={composerPlaceholder}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disablesComposer}
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
              disabled={disablesComposer || !input.trim()}
              onClick={handleSend}
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
        <p className="mt-2 px-1 text-xs text-muted-soft">
          {isProcessing
            ? "Copilot is analyzing the Talent Pool. The composer will reopen when this response completes."
            : visibleCopilotError?.kind === "offline"
              ? "Chat is read-only until the Intelligence Layer reconnects."
              : visibleCopilotError?.kind === "server"
                ? "Retry Copilot before sending another message."
                : visibleCopilotError?.kind === "client"
                  ? "Revise the request and send again."
                  : "Enter to send, Shift+Enter for new line"}
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

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/to-compare",
  component: ComparisonReportRoute,
});

const routeTree = rootRoute.addChildren([indexRoute, talentPoolRoute, matchRoute, compareRoute]);
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
