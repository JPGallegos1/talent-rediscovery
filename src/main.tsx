import { createRoute, createRootRoute, createRouter, Link, Outlet, RouterProvider } from "@tanstack/react-router";
import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type AppSession = {
  talentPoolFileName: string | null;
  candidateRecordCount: number;
  searchRequest: string;
  searchCriteria: string[];
  shortlistCount: number;
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
  searchRequest: "",
  searchCriteria: [],
  shortlistCount: 0,
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
  const { session } = useAppSession();

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
          <MetricCard label="Matches returned" value={String(session.shortlistCount)} />
        </section>

        <section className="rounded-2xl border border-outline-soft bg-surface-lowest p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-earth">Search Request</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-slate">Ready when Candidate Records exist</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            The Copilot can draft recruiter intent, but Talent Rediscovery should only run a Search Request after an explicit recruiter action.
          </p>
          <div className="mt-5 rounded-xl border border-dashed border-outline-soft bg-surface-low p-4 text-sm leading-6 text-muted">
            No Search Request has been run in this in-memory session.
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <InfoPanel title="Interpreted Search Criteria" emptyText="Search Criteria will appear here as read-only information after a Search Request runs." />
          <InfoPanel title="Current Shortlist" emptyText="No Matches yet. Load a Talent Pool File and explicitly run a Search Request." />
        </section>
      </section>

      <CopilotPanel />
    </div>
  );
}

function TalentPoolRoute() {
  const { session } = useAppSession();

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
            <h2 className="font-serif text-2xl font-semibold text-slate">Talent Pool File upload shell</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              The upload interaction is reserved for the next vertical slice. No ATS import, Notion import, sync, export, or persistence is active here.
            </p>
          </div>
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

function MatchDetailRoute() {
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

function InfoPanel({ title, emptyText }: { title: string; emptyText: string }) {
  return (
    <section className="rounded-2xl border border-outline-soft bg-surface-lowest p-6">
      <h2 className="font-serif text-2xl font-semibold text-slate">{title}</h2>
      <p className="mt-4 rounded-lg bg-surface-low px-3 py-3 text-sm leading-6 text-muted">{emptyText}</p>
    </section>
  );
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
