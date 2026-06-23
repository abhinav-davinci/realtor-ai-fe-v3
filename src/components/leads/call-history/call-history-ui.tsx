"use client";

/** Local presentational atoms for AI Call History (kept self-contained, mirroring
 * the live auto-call modal's outcome chips and stacked bar). */
import {
  Check,
  CheckCircle2,
  Gauge,
  ListChecks,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Radar,
  SquareDashed,
  ThumbsDown,
  Upload,
  Voicemail,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CallOutcome } from "@/components/leads/auto-call-run";
import type { SessionStatus, SourceKind } from "@/lib/call-sessions";

export const OUTCOME_META: Record<CallOutcome, { label: string; chip: string; icon: LucideIcon }> = {
  qualified: { label: "Qualified", chip: "bg-brand-green/10 text-brand-green", icon: CheckCircle2 },
  interested: { label: "Interested", chip: "bg-accent-blue/10 text-accent-blue", icon: Check },
  callback: { label: "Callback", chip: "bg-brand-orange/10 text-brand-orange", icon: PhoneOutgoing },
  "not-interested": { label: "Not interested", chip: "bg-black/[0.05] text-ink-muted", icon: ThumbsDown },
  "no-answer": { label: "No answer", chip: "bg-black/[0.04] text-ink-muted", icon: PhoneMissed },
  voicemail: { label: "Voicemail", chip: "bg-black/[0.04] text-ink-muted", icon: Voicemail },
  busy: { label: "Busy", chip: "bg-black/[0.04] text-ink-muted", icon: PhoneOff },
};

export const SOURCE_KIND_META: Record<SourceKind, { label: string; icon: LucideIcon }> = {
  list: { label: "List", icon: ListChecks },
  tier: { label: "By intent", icon: Gauge },
  upload: { label: "Upload", icon: Upload },
  "lead-filter": { label: "Lead filter", icon: Radar },
};

export function OutcomeChip({ outcome, className }: { outcome: CallOutcome; className?: string }) {
  const m = OUTCOME_META[outcome];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", m.chip, className)}>
      <Icon className="size-3" />
      {m.label}
    </span>
  );
}

export function SourceKindChip({ kind, label }: { kind: SourceKind; label: string }) {
  const m = SOURCE_KIND_META[kind];
  const Icon = m.icon;
  return (
    <span className="text-ink-muted inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium">
      <Icon className="size-3.5" />
      <span className="text-ink truncate">{label}</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: SessionStatus }) {
  if (status === "stopped") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
        <SquareDashed className="size-3" /> Stopped
      </span>
    );
  }
  return (
    <span className="bg-brand-green/10 text-brand-green inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
      <Check className="size-3" /> Completed
    </span>
  );
}

/** Stacked connected / missed / not-called bar (mirrors the live run modal). */
export function OutcomeBar({
  connected,
  missed,
  notCalled,
  total,
  className,
}: {
  connected: number;
  missed: number;
  notCalled: number;
  total: number;
  className?: string;
}) {
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div className={cn("flex h-2 w-full overflow-hidden rounded-full bg-black/[0.06]", className)}>
      <div className="bg-brand-green" style={{ width: `${pct(connected)}%` }} />
      <div className="bg-ink-muted/30" style={{ width: `${pct(missed)}%` }} />
      <div className="bg-black/[0.06]" style={{ width: `${pct(notCalled)}%` }} />
    </div>
  );
}

export function StatTile({ label, value, tone }: { label: string; value: string | number; tone?: "green" | "muted" }) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-black/[0.015] px-3 py-2 text-center">
      <p className={cn("text-lg font-bold tabular-nums", tone === "green" ? "text-brand-green" : tone === "muted" ? "text-ink-muted" : "text-ink")}>
        {value}
      </p>
      <p className="text-ink-muted text-[11px]">{label}</p>
    </div>
  );
}

/** Connect rate as a percentage (dialled is the denominator), or "—" when none ran. */
export function connectRate(connected: number, dialled: number): string {
  return dialled > 0 ? `${Math.round((connected / dialled) * 100)}%` : "—";
}
