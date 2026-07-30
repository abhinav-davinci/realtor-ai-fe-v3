"use client";

/**
 * A lead's whole story, opened by clicking its card: who they are, what the
 * agent captured, and every single thing that has happened since, in order and
 * stamped. This is the "how did we get here" answer, which is the question a rep
 * has when picking a lead back up after a few days.
 */
import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarX,
  CalendarClock,
  MoveRight,
  Phone,
  Sparkles,
  StickyNote,
  UserRoundCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalShell } from "@/components/leads/contacts/ui";
import { SOURCE_META, TIER_META, type ScoredLead } from "@/lib/lead-intelligence";
import {
  PIPELINE_CHANGED_EVENT,
  STAGE_META,
  entryFor,
  fmtStamp,
  fmtVisitDate,
  slotById,
  type HistoryEvent,
  type PipelineEntry,
} from "@/lib/lead-pipeline";

export function LeadHistoryModal({
  lead,
  onClose,
  onAddNote,
  onSchedule,
}: {
  lead: ScoredLead;
  onClose: () => void;
  onAddNote: () => void;
  onSchedule: () => void;
}) {
  const [entry, setEntry] = useState<PipelineEntry | null>(null);

  useEffect(() => {
    const load = () => setEntry(entryFor(lead.id, lead.assignedAt));
    load();
    window.addEventListener(PIPELINE_CHANGED_EVENT, load);
    return () => window.removeEventListener(PIPELINE_CHANGED_EVENT, load);
  }, [lead.id, lead.assignedAt]);

  const tier = TIER_META[lead.tier];
  const stage = entry ? STAGE_META[entry.stage] : null;
  // Newest first: the last thing that happened is the thing you need.
  const events = entry ? [...entry.history].sort((a, b) => b.at - a.at) : [];

  return (
    <ModalShell
      title={lead.name}
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <button
            type="button"
            onClick={onAddNote}
            className="text-ink inline-flex h-10 items-center gap-1.5 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
          >
            <StickyNote className="size-4" /> Add Note
          </button>
          <button
            type="button"
            onClick={onSchedule}
            className="bg-brand-blue hover:bg-brand-blue-hover inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
          >
            <CalendarCheck className="size-4" />
            {entry?.visit?.status === "scheduled" ? "Move Visit" : "Schedule Visit"}
          </button>
        </>
      }
    >
      {/* who */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl text-lg font-bold tabular-nums", tier.badge)}>
          {lead.score}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", tier.badge)}>{tier.name}</span>
            {stage && (
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", stage.tint, stage.text)}>
                {stage.name}
              </span>
            )}
            <span className="text-ink-muted text-xs">{SOURCE_META[lead.source].label}</span>
          </div>
          <p className="text-ink-muted mt-1 flex flex-wrap items-center gap-x-3 text-xs">
            {lead.phone && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Phone className="size-3.5" />
                {lead.phone}
              </span>
            )}
            <span>via {lead.agentRole}</span>
          </p>
        </div>
      </div>

      {/* the booking, if there is one */}
      {entry?.visit && (
        <div
          className={cn(
            "mt-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5",
            entry.visit.status === "scheduled"
              ? "border-brand-orange/25 bg-brand-orange/[0.05]"
              : "border-red-200 bg-red-50/50"
          )}
        >
          {entry.visit.status === "scheduled" ? (
            <CalendarCheck className="text-brand-orange size-4 shrink-0" />
          ) : (
            <CalendarX className="size-4 shrink-0 text-red-500" />
          )}
          <p className="text-ink text-xs font-semibold">
            {entry.visit.status === "scheduled" ? "Site visit " : "Cancelled visit was "}
            {fmtVisitDate(entry.visit.date)}
            {slotById(entry.visit.slot) && `, ${slotById(entry.visit.slot)!.label}`}
          </p>
        </div>
      )}

      {/* what the agent got out of them */}
      {lead.captured && lead.captured.length > 0 && (
        <div className="mt-4">
          <p className="text-ink-muted mb-2 text-xs font-semibold">What the agent captured</p>
          <div className="flex flex-wrap gap-1.5">
            {lead.captured.map((c) => (
              <span key={c.label} className="bg-tag text-tag-foreground rounded-full px-2.5 py-1 text-[11px] font-medium">
                {c.label}: <span className="text-ink font-semibold">{c.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* the timeline */}
      <div className="mt-5">
        <p className="text-ink-muted mb-2.5 text-xs font-semibold">Timeline</p>
        <ol className="relative space-y-3 pl-6">
          <span className="absolute top-1.5 bottom-1.5 left-[11px] w-px bg-black/[0.08]" aria-hidden />
          {events.map((e, i) => (
            <li
              key={e.id}
              className="relative motion-safe:opacity-0 motion-safe:animate-[fade-in-up_260ms_ease-out_both]"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <EventRow event={e} />
            </li>
          ))}
        </ol>
      </div>
    </ModalShell>
  );
}

function EventRow({ event }: { event: HistoryEvent }) {
  const { icon: Icon, tint, title, detail } = describe(event);
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={cn(
          "ring-surface absolute -left-6 grid size-[22px] shrink-0 place-items-center rounded-full ring-4",
          tint
        )}
      >
        <Icon className="size-3" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ink text-sm font-semibold">{title}</p>
        {detail && <p className="text-ink-muted mt-0.5 text-xs leading-relaxed">{detail}</p>}
        <p className="text-ink-muted/60 mt-0.5 text-[11px] tabular-nums">{fmtStamp(event.at)}</p>
      </div>
    </div>
  );
}

/** One place that turns a stored event into words, so the timeline reads like
 * sentences rather than a log dump. */
function describe(e: HistoryEvent): {
  icon: typeof Sparkles;
  tint: string;
  title: string;
  detail?: string;
} {
  switch (e.kind) {
    case "assigned":
      return {
        icon: UserRoundCheck,
        tint: "bg-accent-blue/15 text-accent-blue",
        title: "Added to your board",
        detail: "Shared out automatically as a qualified lead.",
      };
    case "moved": {
      const from = e.from ? STAGE_META[e.from].name : "";
      const to = e.to ? STAGE_META[e.to].name : "";
      return {
        icon: MoveRight,
        tint: e.to ? `${STAGE_META[e.to].tint} ${STAGE_META[e.to].text}` : "bg-black/[0.06] text-ink-muted",
        title: `Moved to ${to}`,
        detail: e.text ? `From ${from}. Reason: ${e.text}` : `From ${from}.`,
      };
    }
    case "note":
      return {
        icon: StickyNote,
        tint: "bg-gold/40 text-gold-foreground",
        title: "Note added",
        detail: e.text,
      };
    case "visit-booked":
      return {
        icon: CalendarCheck,
        tint: "bg-brand-orange/15 text-brand-orange",
        title: "Site visit booked",
        detail: `${fmtVisitDate(e.date ?? "")}${e.slot && slotById(e.slot) ? `, ${slotById(e.slot)!.label}` : ""}`,
      };
    case "visit-moved":
      return {
        icon: CalendarClock,
        tint: "bg-brand-orange/15 text-brand-orange",
        title: "Site visit moved",
        detail: `Now ${fmtVisitDate(e.date ?? "")}${e.slot && slotById(e.slot) ? `, ${slotById(e.slot)!.label}` : ""}`,
      };
    case "visit-cancelled":
      return {
        icon: CalendarX,
        tint: "bg-red-100 text-red-600",
        title: "Site visit cancelled",
        detail: e.date
          ? `Was ${fmtVisitDate(e.date)}${e.slot && slotById(e.slot) ? `, ${slotById(e.slot)!.label}` : ""}. The slot went back.`
          : undefined,
      };
  }
}
