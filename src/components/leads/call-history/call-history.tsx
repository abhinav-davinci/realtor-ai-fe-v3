"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, PhoneCall, Search, Sparkles, TrendingUp, Trophy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentOrb } from "@/components/ai-team/agent-ui";
import { FilterSelect } from "@/components/leads/contacts/ui";
import {
  CALL_SESSIONS_CHANGED_EVENT,
  creditsSummary,
  formatCredits,
  listCallSessions,
  relativeTime,
  seedCallSessionsIfNeeded,
  type CallSession,
  type CreditsSummary,
} from "@/lib/call-sessions";
import { connectRate, OutcomeBar, SourceKindChip, StatusBadge } from "./call-history-ui";

type KindFilter = "all" | "leads" | "contacts";
type StatusFilter = "all" | "completed" | "stopped";
type Sort = "recent" | "rate" | "credits";

export function CallHistory() {
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [credits, setCredits] = useState<CreditsSummary>({ used: 0, allowance: 0, remaining: 0 });
  const [ready, setReady] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const load = () => {
      setSessions(listCallSessions());
      setCredits(creditsSummary());
    };
    seedCallSessionsIfNeeded();
    /* eslint-disable react-hooks/set-state-in-effect */
    load();
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    window.addEventListener(CALL_SESSIONS_CHANGED_EVENT, load);
    return () => window.removeEventListener(CALL_SESSIONS_CHANGED_EVENT, load);
  }, []);

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [toppedUp, setToppedUp] = useState(false);

  const totals = useMemo(() => {
    const dialled = sessions.reduce((s, x) => s + x.dialled, 0);
    const connected = sessions.reduce((s, x) => s + x.connected, 0);
    const qualified = sessions.reduce((s, x) => s + x.counts.qualified, 0);
    return { dialled, connected, qualified };
  }, [sessions]);

  // Insights: best connect rate (≥3 dialled) and the agent with the most qualified.
  const insights = useMemo(() => {
    const eligible = sessions.filter((s) => s.dialled >= 3);
    const bestRate = eligible.length
      ? [...eligible].sort((a, b) => b.connected / b.dialled - a.connected / a.dialled)[0]
      : null;
    const byAgent = new Map<string, number>();
    sessions.forEach((s) => byAgent.set(s.agentName, (byAgent.get(s.agentName) ?? 0) + s.counts.qualified));
    const topAgent = [...byAgent.entries()].sort((a, b) => b[1] - a[1])[0];
    return { bestRate, topAgent: topAgent && topAgent[1] > 0 ? topAgent : null };
  }, [sessions]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = sessions.filter((s) => {
      if (kind !== "all" && s.kind !== kind) return false;
      if (status !== "all" && s.status !== status) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.sourceLabel.toLowerCase().includes(q) || s.agentName.toLowerCase().includes(q);
    });
    if (sort === "rate") list = [...list].sort((a, b) => (b.dialled ? b.connected / b.dialled : 0) - (a.dialled ? a.connected / a.dialled : 0));
    else if (sort === "credits") list = [...list].sort((a, b) => b.creditsUsed - a.creditsUsed);
    return list;
  }, [sessions, query, kind, status, sort]);

  const filtersOn = query.trim() !== "" || kind !== "all" || status !== "all";

  if (!ready) return <div className="h-full" aria-hidden />;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* header */}
        <header>
          <h1 className="text-ink text-2xl font-bold tracking-tight">AI Call History</h1>
          <p className="text-ink-muted mt-1 text-sm">Every AI calling session, with outcomes, sources, and credits used.</p>
        </header>

        {sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* KPI strip */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              <Kpi label="Sessions" value={sessions.length} />
              <Kpi label="Contacts called" value={formatCredits(totals.dialled)} />
              <Kpi label="Connect rate" value={connectRate(totals.connected, totals.dialled)} accent="green" />
              <Kpi label="Qualified" value={totals.qualified} accent="green" />
              {/* credits */}
              <div className="rounded-2xl border border-black/[0.07] bg-white p-3.5">
                <div className="flex items-center gap-1.5">
                  <Wallet className="text-accent-blue size-3.5" />
                  <p className="text-ink-muted text-xs font-medium">Credits</p>
                </div>
                <p className="text-ink mt-1 text-xl font-bold tabular-nums">{formatCredits(credits.used)}<span className="text-ink-muted/60 text-sm font-medium"> used</span></p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-ink-muted text-[11px] tabular-nums">{formatCredits(credits.remaining)} left</p>
                  <button
                    type="button"
                    onClick={() => setToppedUp(true)}
                    className="text-accent-blue text-[11px] font-semibold hover:underline"
                  >
                    {toppedUp ? "Coming soon" : "Top up"}
                  </button>
                </div>
              </div>
            </div>

            {/* insights */}
            {(insights.bestRate || insights.topAgent) && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-black/[0.07] bg-gradient-to-r from-accent-blue/[0.05] to-transparent px-4 py-3">
                {insights.bestRate && (
                  <span className="text-ink-muted inline-flex items-center gap-1.5 text-sm">
                    <TrendingUp className="text-brand-green size-4" />
                    Best connect rate:{" "}
                    <span className="text-ink font-semibold">{insights.bestRate.sourceLabel}</span>
                    <span className="text-brand-green font-semibold">{connectRate(insights.bestRate.connected, insights.bestRate.dialled)}</span>
                  </span>
                )}
                {insights.topAgent && (
                  <span className="text-ink-muted inline-flex items-center gap-1.5 text-sm">
                    <Trophy className="text-gold size-4" />
                    Top agent: <span className="text-ink font-semibold">{insights.topAgent[0]}</span>
                    <span className="text-ink-muted">({insights.topAgent[1]} qualified)</span>
                  </span>
                )}
              </div>
            )}

            {/* toolbar */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="text-ink-muted/60 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search session, source, or agent"
                  className="text-ink placeholder:text-ink-muted/55 focus:border-accent-blue/50 h-9 w-full rounded-lg border border-black/15 bg-white pr-3 pl-9 text-sm outline-none transition-colors"
                />
              </div>
              <FilterSelect label="Type" value={kind} options={[{ value: "all", label: "All types" }, { value: "contacts", label: "Contacts" }, { value: "leads", label: "Leads" }]} onChange={(v) => setKind(v as KindFilter)} />
              <FilterSelect label="Status" value={status} options={[{ value: "all", label: "All status" }, { value: "completed", label: "Completed" }, { value: "stopped", label: "Stopped" }]} onChange={(v) => setStatus(v as StatusFilter)} />
              <FilterSelect label="Sort" value={sort} options={[{ value: "recent", label: "Most recent" }, { value: "rate", label: "Connect rate" }, { value: "credits", label: "Credits used" }]} onChange={(v) => setSort(v as Sort)} />
            </div>

            {/* sessions */}
            {visible.length > 0 ? (
              <div className="mt-4 space-y-2.5">
                {visible.map((s, i) => (
                  <SessionRow key={s.id} session={s} now={now} index={i} />
                ))}
              </div>
            ) : (
              <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-black/12 py-14 text-center">
                <p className="text-ink text-sm font-semibold">No sessions match</p>
                <p className="text-ink-muted mt-1 text-xs">Try a different search or clear the filters.</p>
                {filtersOn && (
                  <button type="button" onClick={() => { setQuery(""); setKind("all"); setStatus("all"); }} className="text-accent-blue mt-3 text-xs font-semibold hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- sub-pieces ------------------------------ */

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: "green" }) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-3.5">
      <p className="text-ink-muted text-xs font-medium">{label}</p>
      <p className={cn("mt-1 text-xl font-bold tabular-nums", accent === "green" ? "text-brand-green" : "text-ink")}>{value}</p>
    </div>
  );
}

function SessionRow({ session: s, now, index }: { session: CallSession; now: number; index: number }) {
  return (
    <Link
      href={`/leads/call-history/${s.id}`}
      className="group hover:border-accent-blue/30 hover:bg-accent-blue/[0.02] flex items-center gap-3.5 rounded-2xl border border-black/[0.08] bg-white p-3.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
      style={{ animation: `fade-in-up 240ms cubic-bezier(0.23,1,0.32,1) ${Math.min(index, 8) * 45}ms both` }}
    >
      <AgentOrb colors={s.agentGradient} size={40} icon={PhoneCall} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-ink truncate text-sm font-semibold">{s.name}</p>
          <StatusBadge status={s.status} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <SourceKindChip kind={s.sourceKind} label={s.sourceLabel} />
          <span className="text-ink-muted text-xs">{s.agentName}</span>
          <span className="text-ink-muted/70 text-xs">· {relativeTime(s.startedAt, now)}</span>
        </div>
        <div className="mt-2 max-w-md">
          <OutcomeBar connected={s.connected} missed={s.missed} notCalled={s.notCalled} total={s.total} />
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-4 sm:flex">
        <Metric label="Dialled" value={s.dialled} />
        <Metric label="Connected" value={s.connected} tone="green" />
        <Metric label="Qualified" value={s.counts.qualified} tone="green" />
        <Metric label="Credits" value={formatCredits(s.creditsUsed)} />
      </div>
      <ChevronRight className="text-ink-muted/50 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "green" }) {
  return (
    <div className="text-center">
      <p className={cn("text-base font-bold tabular-nums", tone === "green" ? "text-brand-green" : "text-ink")}>{value}</p>
      <p className="text-ink-muted/70 text-[10px]">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-black/12 bg-white px-6 py-16 text-center" style={{ animation: "fade-in-up 240ms cubic-bezier(0.23,1,0.32,1) both" }}>
      <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl">
        <Sparkles className="size-7" />
      </span>
      <h2 className="text-ink mt-4 text-lg font-bold">No AI calls yet</h2>
      <p className="text-ink-muted mx-auto mt-1.5 max-w-md text-sm leading-relaxed">
        When your AI agent runs a calling session, it shows up here with full metrics, outcomes, and credits used. Start one to see it tracked.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Link href="/leads/contacts">
          <Button className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-4 text-sm font-semibold text-white">
            <PhoneCall className="size-4" /> Call contacts
          </Button>
        </Link>
        <Link href="/leads/intelligence">
          <Button variant="outline" className="text-ink h-10 rounded-lg border-black/15 px-4 text-sm font-semibold">
            Auto-call leads
          </Button>
        </Link>
      </div>
    </div>
  );
}
