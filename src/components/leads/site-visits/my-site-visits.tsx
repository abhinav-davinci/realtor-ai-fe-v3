"use client";

/**
 * Every site visit the rep has booked, soonest first. Grouped by when rather
 * than listed flat, because "what am I doing today" is the only question this
 * screen gets asked.
 *
 * Visits that were called off and never rebooked get their own block at the top.
 * They are the easiest thing in the whole workflow to forget, and a cancelled
 * visit sitting silently in a list is a lost lead.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarClock, CalendarX, Clock, Pencil, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/leads/contacts/ui";
import { LEADS_CHANGED_EVENT, listDistributedLeads } from "@/lib/lead-promotion";
import { TIER_META, type ScoredLead } from "@/lib/lead-intelligence";
import { AssigneeChip } from "@/components/leads/lead-row";
import { useViewer } from "@/lib/use-viewer";
import {
  PIPELINE_CHANGED_EVENT,
  addDaysISO,
  cancelVisit,
  entriesFor,
  fmtVisitDate,
  scheduleVisit,
  slotById,
  todayISO,
  type PipelineEntry,
} from "@/lib/lead-pipeline";
import { ScheduleVisitModal } from "./schedule-visit-modal";

interface Row {
  lead: ScoredLead;
  entry: PipelineEntry;
}

export function MySiteVisits() {
  const viewer = useViewer();
  const [ready, setReady] = useState(false);
  const [leads, setLeads] = useState<ScoredLead[]>([]);
  const [entries, setEntries] = useState<Record<string, PipelineEntry>>({});
  const [moving, setMoving] = useState<Row | null>(null);
  const [cancelling, setCancelling] = useState<Row | null>(null);

  // Primitives in the deps, not the viewer object: a callback rebuilt on every
  // render would re-fire the effect below forever.
  const viewerId = viewer.id;
  const seesAll = viewer.can("leads.viewAll");
  const reload = useCallback(() => {
    const all = listDistributedLeads();
    const mine = seesAll ? all : all.filter((l) => l.assigneeId === viewerId);
    setLeads(mine);
    setEntries(entriesFor(mine.map((l) => ({ id: l.id, assignedAt: l.assignedAt }))));
  }, [seesAll, viewerId]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    reload();
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    window.addEventListener(PIPELINE_CHANGED_EVENT, reload);
    window.addEventListener(LEADS_CHANGED_EVENT, reload);
    return () => {
      window.removeEventListener(PIPELINE_CHANGED_EVENT, reload);
      window.removeEventListener(LEADS_CHANGED_EVENT, reload);
    };
  }, [reload]);

  const { groups, needsRebooking, total } = useMemo(() => {
    const rows: Row[] = leads
      .map((lead) => ({ lead, entry: entries[lead.id] }))
      .filter((r): r is Row => !!r.entry);

    const scheduled = rows
      .filter((r) => r.entry.visit?.status === "scheduled")
      .sort((a, b) => {
        const ka = `${a.entry.visit!.date}|${String(slotById(a.entry.visit!.slot)?.hour ?? 0).padStart(2, "0")}`;
        const kb = `${b.entry.visit!.date}|${String(slotById(b.entry.visit!.slot)?.hour ?? 0).padStart(2, "0")}`;
        return ka.localeCompare(kb);
      });

    const today = todayISO();
    const weekEnd = addDaysISO(today, 7);
    const buckets: { key: string; label: string; rows: Row[] }[] = [
      { key: "today", label: "Today", rows: [] },
      { key: "tomorrow", label: "Tomorrow", rows: [] },
      { key: "week", label: "Later this week", rows: [] },
      { key: "later", label: "Further out", rows: [] },
      { key: "past", label: "Needs an outcome", rows: [] },
    ];
    for (const r of scheduled) {
      const d = r.entry.visit!.date;
      if (d < today) buckets[4].rows.push(r);
      else if (d === today) buckets[0].rows.push(r);
      else if (d === addDaysISO(today, 1)) buckets[1].rows.push(r);
      else if (d < weekEnd) buckets[2].rows.push(r);
      else buckets[3].rows.push(r);
    }

    return {
      groups: buckets.filter((b) => b.rows.length > 0),
      needsRebooking: rows.filter((r) => r.entry.visit?.status === "cancelled"),
      total: scheduled.length,
    };
  }, [leads, entries]);

  // A cancelled visit still counts as work on this screen, so "nothing booked"
  // is only true when there is also nothing waiting to be rebooked.
  const subtitle =
    total > 0
      ? `${total} booked${seesAll ? " across the team" : ""}${groups[0]?.key === "today" ? `, ${groups[0].rows.length} today` : ""}`
      : needsRebooking.length > 0
        ? `${needsRebooking.length} to rebook`
        : "Nothing booked yet";

  if (!ready) return <div className="h-full" aria-hidden />;

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          {/* An admin is looking at the whole team's visits, so the possessive
              title would be a lie on that side. */}
          <h1 className="text-ink text-xl font-bold">{seesAll ? "Site Visits" : "My Site Visits"}</h1>
          <p className="text-ink-muted text-sm">{subtitle}</p>
        </div>
        {!seesAll && (
          <Link
            href="/leads/board"
            className="text-accent-blue group inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            Open my board
            <ArrowRight className="size-4 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
        {/* cancelled and not rebooked: the thing most likely to be dropped */}
        {needsRebooking.length > 0 && (
          <section
            className="mb-6 rounded-2xl border border-red-200 bg-red-50/50 p-4"
            style={{ animation: "fade-in-up 240ms cubic-bezier(0.23,1,0.32,1) both" }}
          >
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-red-100 text-red-600">
                <CalendarX className="size-4" />
              </span>
              <h2 className="text-ink text-sm font-bold">
                {needsRebooking.length} {needsRebooking.length === 1 ? "visit needs" : "visits need"} rebooking
              </h2>
            </div>
            <div className="mt-3 space-y-2">
              {needsRebooking.map((r) => (
                <VisitRow key={r.lead.id} row={r} onMove={() => setMoving(r)} onCancel={null} cancelled />
              ))}
            </div>
          </section>
        )}

        {total === 0 && needsRebooking.length === 0 ? (
          <EmptyVisits teamWide={seesAll} />
        ) : (
          <div className="space-y-6">
            {groups.map((g, gi) => (
              <section key={g.key}>
                <div className="mb-2.5 flex items-center gap-2">
                  <h2 className="text-ink text-sm font-bold">{g.label}</h2>
                  <span className="bg-black/[0.05] text-ink-muted rounded-full px-1.5 text-[11px] font-bold tabular-nums">
                    {g.rows.length}
                  </span>
                  {g.key === "past" && (
                    <span className="text-brand-orange text-xs font-medium">Mark these won or lost on your board</span>
                  )}
                </div>
                <div className="space-y-2">
                  {g.rows.map((r, i) => (
                    <div
                      key={r.lead.id}
                      className="motion-safe:opacity-0 motion-safe:animate-[fade-in-up_300ms_ease-out_both]"
                      style={{ animationDelay: `${gi * 60 + i * 40}ms` }}
                    >
                      <VisitRow row={r} onMove={() => setMoving(r)} onCancel={() => setCancelling(r)} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {moving && (
        <ScheduleVisitModal
          leadId={moving.lead.id}
          leadName={moving.lead.name}
          subtitle={moving.lead.captured?.slice(0, 2).map((c) => c.value).join(" · ")}
          current={
            moving.entry.visit?.status === "scheduled"
              ? { date: moving.entry.visit.date, slot: moving.entry.visit.slot }
              : null
          }
          onClose={() => setMoving(null)}
          onConfirm={(date, slot) => {
            scheduleVisit(moving.lead.id, date, slot);
            setMoving(null);
            reload();
          }}
        />
      )}

      <ConfirmDialog
        open={!!cancelling}
        title="Cancel this site visit?"
        message={`The slot goes back for someone else to book. ${cancelling?.lead.name ?? "This lead"} stays on your board so you remember to rebook.`}
        confirmLabel="Cancel Visit"
        onConfirm={() => {
          if (cancelling) cancelVisit(cancelling.lead.id);
          setCancelling(null);
          reload();
        }}
        onCancel={() => setCancelling(null)}
      />
    </div>
  );
}

function VisitRow({
  row,
  onMove,
  onCancel,
  cancelled,
}: {
  row: Row;
  onMove: () => void;
  onCancel: (() => void) | null;
  cancelled?: boolean;
}) {
  const { lead, entry } = row;
  const visit = entry.visit!;
  const slot = slotById(visit.slot);
  const tier = TIER_META[lead.tier];

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-black/[0.08] bg-white p-3.5">
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl",
          cancelled ? "bg-black/[0.04] text-ink-muted/60" : "bg-brand-orange/10 text-brand-orange"
        )}
      >
        {cancelled ? <CalendarX className="size-5" /> : <CalendarCheck className="size-5" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-ink truncate text-sm font-bold">{lead.name}</p>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", tier.badge)}>
            {tier.name}
          </span>
          <span className={cn("text-base font-bold tabular-nums", tier.score)}>{lead.score}</span>
          {/* Only renders for someone who sees the whole team, so a rep's own
              list stays free of their own name. */}
          <AssigneeChip id={lead.assigneeId} />
        </div>
        <p className="text-ink-muted mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          <span className={cn("inline-flex items-center gap-1", cancelled && "line-through")}>
            <Clock className="size-3.5" />
            {/* The strike-through says "cancelled" to the eye but not to a screen
                reader, so the state is spelled out for one and hidden from the other. */}
            {cancelled && <span className="sr-only">Cancelled, was </span>}
            {fmtVisitDate(visit.date)}
            {slot && `, ${slot.label}`}
          </span>
          {lead.phone && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Phone className="size-3.5" />
              {lead.phone}
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onMove}
          className="text-ink inline-flex h-9 items-center gap-1.5 rounded-lg border border-black/15 px-2.5 text-xs font-semibold outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.97]"
        >
          <Pencil className="text-accent-blue size-3.5" />
          {cancelled ? "Rebook" : "Move"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-xs font-semibold text-red-600 outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400/40 active:scale-[0.97]"
          >
            <CalendarX className="size-3.5" /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyVisits({ teamWide }: { teamWide: boolean }) {
  return (
    <div
      className="grid place-items-center rounded-2xl border border-dashed border-black/[0.14] px-6 py-16 text-center"
      style={{ animation: "fade-in-up 240ms cubic-bezier(0.23,1,0.32,1) both" }}
    >
      <span className="bg-brand-orange/10 text-brand-orange grid size-14 place-items-center rounded-2xl">
        <CalendarClock className="size-7" />
      </span>
      <h2 className="text-ink mt-4 text-lg font-bold">No visits booked yet</h2>
      <p className="text-ink-muted mx-auto mt-1.5 max-w-md text-sm leading-relaxed">
        {teamWide
          ? "Visits appear here as your team books them off the leads they were given."
          : "Call a lead from your list. Once they are keen, book the visit and it shows up here and on your board."}
      </p>
      {!teamWide && (
        <Link
          href="/leads/my-calls"
          className="bg-brand-blue hover:bg-brand-blue-hover mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out active:scale-[0.98]"
        >
          <Phone className="size-4" /> Go to my calling list
        </Link>
      )}
    </div>
  );
}
