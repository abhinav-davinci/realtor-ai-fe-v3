"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock, PhoneCall, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentOrb } from "@/components/ai-team/agent-ui";
import { TIER_META } from "@/lib/lead-intelligence";
import { SourceIcon } from "@/components/leads/source-icons";
import { ConfirmDialog } from "@/components/leads/contacts/ui";
import {
  CALL_SESSIONS_CHANGED_EVENT,
  deleteCallSession,
  fmtDateTime,
  fmtDuration,
  formatCredits,
  getCallSession,
  type CallSession,
} from "@/lib/call-sessions";
import { connectRate, OutcomeBar, OutcomeChip, SourceKindChip, StatusBadge, StatTile } from "./call-history-ui";

const OUTCOME_ORDER = ["qualified", "interested", "callback", "notInterested", "noAnswer", "voicemail", "busy"] as const;
const OUTCOME_LABEL: Record<(typeof OUTCOME_ORDER)[number], string> = {
  qualified: "Qualified",
  interested: "Interested",
  callback: "Callback",
  notInterested: "Not interested",
  noAnswer: "No answer",
  voicemail: "Voicemail",
  busy: "Busy",
};

export function CallSessionDetail({ id }: { id: string }) {
  const router = useRouter();
  const [session, setSession] = useState<CallSession | null>(null);
  const [ready, setReady] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const load = () => setSession(getCallSession(id));
    /* eslint-disable react-hooks/set-state-in-effect */
    load();
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    window.addEventListener(CALL_SESSIONS_CHANGED_EVENT, load);
    return () => window.removeEventListener(CALL_SESSIONS_CHANGED_EVENT, load);
  }, [id]);

  if (!ready) return <div className="h-full" aria-hidden />;

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <Link href="/leads/call-history" className="text-accent-blue inline-flex items-center gap-1.5 text-sm font-semibold hover:underline">
          <ArrowLeft className="size-4" /> Back to call history
        </Link>
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-black/12 py-16 text-center">
          <p className="text-ink text-sm font-semibold">Session not found</p>
          <p className="text-ink-muted mt-1 text-xs">It may have been deleted.</p>
        </div>
      </div>
    );
  }

  const s = session;
  const talkMin = Math.round(s.talkSec / 60);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <Link href="/leads/call-history" className="text-ink-muted hover:text-ink inline-flex items-center gap-1.5 text-sm font-semibold">
          <ArrowLeft className="size-4" /> Back to call history
        </Link>

        {/* header */}
        <div className="mt-4 flex flex-wrap items-start gap-3.5 rounded-2xl border border-black/[0.08] bg-white p-4">
          <AgentOrb colors={s.agentGradient} size={48} icon={PhoneCall} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-ink text-lg font-bold">{s.name}</h1>
              <StatusBadge status={s.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-ink-muted text-xs">called</span>
              <SourceKindChip kind={s.sourceKind} label={s.sourceLabel} />
            </div>
            <p className="text-ink-muted mt-1.5 inline-flex items-center gap-1.5 text-xs">
              <Clock className="size-3.5" />
              {fmtDateTime(s.startedAt)} · by {s.agentName} · ran {fmtDuration(Math.round(s.durationMs / 1000))}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirm(true)}
            aria-label="Delete session"
            className="text-ink-muted hover:bg-red-50 hover:text-red-500 grid size-8 shrink-0 place-items-center rounded-lg transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        {/* primary metrics */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Dialled" value={s.dialled} />
          <StatTile label="Connected" value={s.connected} tone="green" />
          <StatTile label="Connect rate" value={connectRate(s.connected, s.dialled)} tone="green" />
          <StatTile label="Qualified" value={s.counts.qualified} tone="green" />
          <StatTile label="Credits" value={formatCredits(s.creditsUsed)} />
        </div>

        {/* bar + legend */}
        <div className="mt-3 rounded-2xl border border-black/[0.07] bg-white p-4">
          <OutcomeBar connected={s.connected} missed={s.missed} notCalled={s.notCalled} total={s.total} />
          <div className="text-ink-muted mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <Legend dot="bg-brand-green" label="Connected" n={s.connected} />
            <Legend dot="bg-ink-muted/30" label="Missed" n={s.missed} />
            {s.notCalled > 0 && <Legend dot="bg-black/[0.12]" label="Not called" n={s.notCalled} />}
            <span className="ml-auto inline-flex items-center gap-1.5">
              <Wallet className="size-3.5" /> {talkMin} min talked · {formatCredits(s.creditsUsed)} credits
            </span>
          </div>
        </div>

        {/* outcome breakdown */}
        <div className="mt-3 rounded-2xl border border-black/[0.07] bg-white p-4">
          <p className="text-ink mb-2.5 text-sm font-semibold">Outcomes</p>
          <div className="flex flex-wrap gap-1.5">
            {OUTCOME_ORDER.map((k) => (
              <span key={k} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", s.counts[k] > 0 ? "border-black/10 text-ink" : "border-black/[0.06] text-ink-muted/50")}>
                {OUTCOME_LABEL[k]}
                <span className="tabular-nums font-bold">{s.counts[k]}</span>
              </span>
            ))}
          </div>
        </div>

        {/* cross-links */}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={s.kind === "leads" ? "/leads/intelligence" : "/leads/contacts"}>
            <Button variant="outline" className="text-ink h-9 rounded-lg border-black/15 px-3.5 text-sm font-semibold">
              {s.kind === "leads" ? "View in Lead Intelligence" : "View in Contacts"} <ArrowUpRight className="size-4" />
            </Button>
          </Link>
        </div>

        {/* per-call table */}
        <div className="mt-4">
          <p className="text-ink mb-2 text-sm font-semibold">Calls ({s.total})</p>
          <div className="overflow-x-auto rounded-2xl border border-black/[0.08] bg-white">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="text-ink-muted border-b border-black/[0.06] text-left text-xs">
                  <th className="py-2.5 pr-3 pl-4 font-medium">Name</th>
                  <th className="py-2.5 pr-3 font-medium">Outcome</th>
                  <th className="py-2.5 pr-3 font-medium whitespace-nowrap">Duration</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Credits</th>
                </tr>
              </thead>
              <tbody>
                {s.calls.map((c, i) => (
                  <tr key={`${c.phone}-${i}`} className={cn("border-b border-black/[0.04] last:border-0", !c.ran && "opacity-55")}>
                    <td className="py-2.5 pr-3 pl-4">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 shrink-0 rounded-full", TIER_META[c.tier].dot)} />
                        <span className="text-ink truncate font-medium">{c.name}</span>
                        <SourceIcon source={c.source} className="size-3 shrink-0" />
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      {c.ran ? <OutcomeChip outcome={c.outcome} /> : <span className="text-ink-muted/60 text-xs font-medium">Not called</span>}
                    </td>
                    <td className="text-ink-muted py-2.5 pr-3 text-xs tabular-nums whitespace-nowrap">{c.durationSec > 0 ? fmtDuration(c.durationSec) : "—"}</td>
                    <td className="text-ink-muted py-2.5 pr-4 text-right text-xs tabular-nums">{c.ran ? formatCredits(c.creditsUsed) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Delete this session?"
        message="It will be removed from your call history. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { deleteCallSession(s.id); router.push("/leads/call-history"); }}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}

function Legend({ dot, label, n }: { dot: string; label: string; n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", dot)} /> {label} <span className="text-ink font-semibold tabular-nums">{n}</span>
    </span>
  );
}
