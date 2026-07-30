"use client";

/**
 * What to do next with a lead you have just called: get them to the site.
 *
 * This replaced the old "Take over" and "Call lead" buttons. Take over was a
 * leftover from when a lead was either the AI's or a nameless human's, which
 * assignment made redundant; Call lead did nothing. Booking the visit is the
 * actual next step in the job, so it is what the header offers.
 */
import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, CalendarClock, CalendarX, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/leads/contacts/ui";
import { takeOverLead } from "@/lib/lead-promotion";
import {
  PIPELINE_CHANGED_EVENT,
  cancelVisit,
  entryFor,
  fmtVisitDate,
  scheduleVisit,
  slotById,
  type PipelineEntry,
} from "@/lib/lead-pipeline";
import type { ScoredLead } from "@/lib/lead-intelligence";
import { ScheduleVisitModal } from "./schedule-visit-modal";

export function SiteVisitModule({ lead }: { lead: ScoredLead }) {
  const [entry, setEntry] = useState<PipelineEntry | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const reload = useCallback(() => setEntry(entryFor(lead.id, lead.assignedAt)), [lead.id, lead.assignedAt]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    reload();
    window.addEventListener(PIPELINE_CHANGED_EVENT, reload);
    return () => window.removeEventListener(PIPELINE_CHANGED_EVENT, reload);
  }, [reload]);

  // Nothing to render until the store has been read, or the booked state would
  // flash as unbooked first.
  if (!entry) return <div className="h-px w-full" aria-hidden />;

  const visit = entry.visit;
  const booked = visit?.status === "scheduled";
  const slot = visit ? slotById(visit.slot) : null;
  // A budget and configuration line, when the agent captured them.
  const context = lead.captured?.slice(0, 2).map((c) => c.value).join(" · ");

  return (
    <div className="w-full border-t border-black/[0.06] pt-3">
      {booked && visit ? (
        <div className="border-brand-orange/25 bg-brand-orange/[0.05] flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-2.5">
          <span className="bg-brand-orange/15 text-brand-orange grid size-9 shrink-0 place-items-center rounded-lg">
            <CalendarCheck className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-ink text-sm font-bold">
              Site visit {fmtVisitDate(visit.date)}
              {slot && <span className="text-ink-muted font-medium">, {slot.label}</span>}
            </p>
            <p className="text-ink-muted text-xs">Confirm with them the day before so it does not slip.</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setScheduling(true)}
              className="text-ink inline-flex h-9 items-center gap-1.5 rounded-lg border border-black/15 bg-white px-2.5 text-xs font-semibold outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.97]"
            >
              <Pencil className="text-accent-blue size-3.5" /> Move
            </button>
            <button
              type="button"
              onClick={() => setCancelling(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-600 outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400/40 active:scale-[0.97]"
            >
              <CalendarX className="size-3.5" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-2.5",
            visit?.status === "cancelled"
              ? "border-red-200 bg-red-50/50"
              : "border-black/[0.08] bg-black/[0.015]"
          )}
        >
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-lg",
              visit?.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-accent-blue/10 text-accent-blue"
            )}
          >
            <CalendarClock className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-ink text-sm font-bold">
              {visit?.status === "cancelled" ? "Visit was cancelled" : "No site visit yet"}
            </p>
            <p className="text-ink-muted text-xs">
              {visit?.status === "cancelled"
                ? "Book another slot while they are still warm."
                : "Called them already? Lock in a day and time."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScheduling(true)}
            className="bg-brand-blue hover:bg-brand-blue-hover inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-white outline-none transition-[background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.97]"
          >
            <CalendarCheck className="size-4" />
            {visit?.status === "cancelled" ? "Rebook Visit" : "Schedule Site Visit"}
          </button>
        </div>
      )}

      {scheduling && (
        <ScheduleVisitModal
          leadId={lead.id}
          leadName={lead.name}
          subtitle={context}
          current={booked && visit ? { date: visit.date, slot: visit.slot } : null}
          onClose={() => setScheduling(false)}
          onConfirm={(date, slotId) => {
            scheduleVisit(lead.id, date, slotId);
            // A booked visit means a person is driving this lead now, which is
            // what take-over used to record by hand.
            takeOverLead(lead.id);
            setScheduling(false);
            reload();
          }}
        />
      )}

      <ConfirmDialog
        open={cancelling}
        title="Cancel this site visit?"
        message={`The slot goes back for someone else to book. ${lead.name} stays in your Site Visit stage so you remember to rebook.`}
        confirmLabel="Cancel Visit"
        onConfirm={() => {
          cancelVisit(lead.id);
          setCancelling(false);
          reload();
        }}
        onCancel={() => setCancelling(false)}
      />
    </div>
  );
}
