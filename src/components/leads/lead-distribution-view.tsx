"use client";

/**
 * Lead Distribution: where the leads went. Distribution is automatic, so this
 * screen is oversight rather than control. It answers the two questions a
 * manager actually has (is anything sitting unowned, and is the load even)
 * without asking them to hand out work themselves.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Radar, RefreshCw, Repeat2, TriangleAlert, UserRoundCheck, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/leads/contacts/ui";
import {
  distributionSummary,
  heldByPeopleCount,
  redistributeAll,
  type DistributionResult,
  type DistributionSummary,
} from "@/lib/lead-distribution";
import { LeadHandout } from "./lead-handout";
import { LEADS_CHANGED_EVENT, listDistributedLeads } from "@/lib/lead-promotion";
import { TEAM_CHANGED_EVENT, initialsOf } from "@/lib/team";
import type { ScoredLead } from "@/lib/lead-intelligence";

const EMPTY: DistributionSummary = { pool: [], workloads: [], assigned: 0, unassigned: 0, total: 0 };

export function LeadDistributionView() {
  const [ready, setReady] = useState(false);
  const [leads, setLeads] = useState<ScoredLead[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [replay, setReplay] = useState<DistributionResult | null>(null);
  const [replayKey, setReplayKey] = useState(0);

  const reload = useCallback(() => setLeads(listDistributedLeads()), []);

  useEffect(() => {
    // Leads live in localStorage, so the first read can only happen after mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    reload();
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    window.addEventListener(LEADS_CHANGED_EVENT, reload);
    window.addEventListener(TEAM_CHANGED_EVENT, reload);
    return () => {
      window.removeEventListener(LEADS_CHANGED_EVENT, reload);
      window.removeEventListener(TEAM_CHANGED_EVENT, reload);
    };
  }, [reload]);

  const summary = useMemo(() => (leads.length ? distributionSummary(leads) : EMPTY), [leads]);
  const busiest = summary.workloads[0]?.total ?? 0;
  const held = useMemo(() => heldByPeopleCount(leads), [leads]);

  function redistribute() {
    const result = redistributeAll(leads);
    setConfirming(false);
    setReplay(result.assigned > 0 ? result : null);
    // Remount the hand-out so its keyframes run again on a repeat click.
    setReplayKey((k) => k + 1);
    reload();
    window.dispatchEvent(new Event(LEADS_CHANGED_EVENT));
  }

  if (!ready) return <div className="h-full" aria-hidden />;

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-ink text-xl font-bold">Lead Distribution</h1>
          <p className="text-ink-muted text-sm">
            Every lead goes to whoever is holding the fewest, the moment it arrives.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {summary.pool.length > 0 && summary.total > 0 && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-ink inline-flex h-9 items-center gap-1.5 rounded-lg border border-black/15 px-3 text-sm font-semibold outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
            >
              <RefreshCw className="text-accent-blue size-4" /> Redistribute
            </button>
          )}
          <Link
            href="/leads/intelligence"
            className="text-accent-blue group inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            Open Lead Intelligence
            <ArrowRight className="size-4 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        {summary.pool.length === 0 ? (
          <EmptyPool />
        ) : (
          <>
            {/* The hand-out replayed in place, so the reshuffle is something you
                watch rather than a table that silently rearranges. */}
            {replay && (
              <div className="relative mb-5" style={{ animation: "fade-in-up 260ms cubic-bezier(0.23,1,0.32,1) both" }}>
                <LeadHandout key={replayKey} result={replay} />
                <button
                  type="button"
                  onClick={() => setReplay(null)}
                  aria-label="Dismiss"
                  className="text-ink-muted hover:bg-black/[0.06] hover:text-ink absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-lg transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* Unassigned leads first: that is the only number that means
                something is going unworked. */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Tile
                icon={TriangleAlert}
                tone={summary.unassigned > 0 ? "warn" : "ok"}
                value={summary.unassigned}
                label="Unassigned"
                note={summary.unassigned > 0 ? "Waiting for the next pass" : "Everything has an owner"}
              />
              <Tile icon={UserRoundCheck} tone="ok" value={summary.assigned} label="Assigned" note={`Across ${summary.pool.length} people`} />
              <Tile icon={Users} tone="info" value={summary.total} label="Leads in play" note="Warm and above" />
            </div>

            <h2 className="text-ink mt-7 text-base font-bold">Who is holding what</h2>
            <p className="text-ink-muted mt-1 text-sm">
              The bar is relative to the busiest person, so an uneven load is visible at a glance.
            </p>

            <div className="mt-4 space-y-2.5">
              {summary.workloads.map((w, i) => (
                <div
                  key={w.member.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-black/[0.08] bg-white p-3.5 motion-safe:opacity-0 motion-safe:animate-[fade-in-up_320ms_ease-out_both]"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="bg-accent-blue/10 text-accent-blue grid size-10 shrink-0 place-items-center rounded-full text-xs font-semibold">
                    {initialsOf(w.member.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate text-sm font-semibold">{w.member.name}</p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                      <div
                        className="bg-accent-blue h-full rounded-full transition-[width] duration-500 ease-out"
                        style={{ width: busiest > 0 ? `${Math.max(4, (w.total / busiest) * 100)}%` : "0%" }}
                      />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-xs">
                    <Metric value={w.total} label="leads" />
                    <Metric value={w.hot} label="hot" icon={Flame} tone="text-orange-600" />
                    <Metric value={w.workedOn} label="taken over" icon={Repeat2} tone="text-brand-green" />
                  </div>
                </div>
              ))}
            </div>

          </>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title="Deal every lead again?"
        message={
          held > 0
            ? `The board is shared out from scratch, so most people's lists will change. The ${held} ${held === 1 ? "lead someone has already taken over stays" : "leads someone has already taken over stay"} with them.`
            : "The board is shared out from scratch, so most people's lists will change. Anyone already working a lead keeps it."
        }
        confirmLabel="Redistribute"
        onConfirm={redistribute}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

function Tile({
  icon: Icon,
  value,
  label,
  note,
  tone,
}: {
  icon: typeof Users;
  value: number;
  label: string;
  note: string;
  tone: "ok" | "warn" | "info";
}) {
  const tint =
    tone === "warn"
      ? "bg-brand-orange/10 text-brand-orange"
      : tone === "ok"
        ? "bg-brand-green/10 text-brand-green"
        : "bg-accent-blue/10 text-accent-blue";
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-muted text-xs font-medium">{label}</span>
        <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", tint)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="text-ink mt-2.5 text-[26px] leading-none font-bold tabular-nums">{value}</p>
      <p className="text-ink-muted mt-1.5 text-xs">{note}</p>
    </div>
  );
}

function Metric({
  value,
  label,
  icon: Icon,
  tone,
}: {
  value: number;
  label: string;
  icon?: typeof Users;
  tone?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={cn("text-sm font-bold tabular-nums", tone ?? "text-ink")}>{value}</span>
      <span className="text-ink-muted inline-flex items-center gap-0.5">
        {Icon && <Icon className={cn("size-3", tone)} />}
        {label}
      </span>
    </span>
  );
}

function EmptyPool() {
  return (
    <div
      className="grid place-items-center rounded-2xl border border-dashed border-black/[0.14] px-6 py-16 text-center"
      style={{ animation: "fade-in-up 240ms cubic-bezier(0.23,1,0.32,1) both" }}
    >
      <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl">
        <Radar className="size-7" />
      </span>
      <h2 className="text-ink mt-4 text-lg font-bold">Nobody to share leads with yet</h2>
      <p className="text-ink-muted mx-auto mt-1.5 max-w-md text-sm leading-relaxed">
        Leads are shared out across your active team members. Invite someone and every new lead will land on a
        person automatically.
      </p>
      <Link
        href="/account/users"
        className="bg-brand-blue hover:bg-brand-blue-hover mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out active:scale-[0.98]"
      >
        <Users className="size-4" /> Go to User Management
      </Link>
    </div>
  );
}
