"use client";

/**
 * Booking or moving a site visit. Two decisions, in the order a person makes
 * them: which day, then which time. The day strip carries how many slots are
 * left, so a full day is obvious before it is opened, and every slot states
 * plainly whether it can be had. Anything further out than the strip comes from
 * the calendar beside it.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarCheck, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalShell } from "@/components/leads/contacts/ui";
import {
  SLOTS,
  addDaysISO,
  dateBlock,
  fmtVisitDate,
  freeSlotCount,
  slotStates,
  todayISO,
  type SlotState,
} from "@/lib/lead-pipeline";
import { CalendarTrigger, VisitCalendar } from "./visit-calendar";

const DAYS_AHEAD = 14;

/** The first day in the strip that can actually take a booking, so the modal
 * never opens on a day with nothing left. */
function firstOpenDay(today: string, leadId: string): string {
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = addDaysISO(today, i);
    if (!dateBlock(d, leadId)) return d;
  }
  return today;
}

export function ScheduleVisitModal({
  leadId,
  leadName,
  subtitle,
  current,
  onClose,
  onConfirm,
}: {
  leadId: string;
  leadName: string;
  /** A line of context, e.g. the configuration and budget the agent captured. */
  subtitle?: string;
  /** The booking being moved, if this is a reschedule. */
  current?: { date: string; slot: string } | null;
  onClose: () => void;
  onConfirm: (date: string, slot: string) => void;
}) {
  const today = todayISO();

  // Open on the current booking if there is one, otherwise the first day that
  // has anything left.
  const [date, setDate] = useState(() => current?.date ?? firstOpenDay(today, leadId));
  const [slot, setSlot] = useState<string | null>(current?.slot ?? null);
  const [calendarAt, setCalendarAt] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  function closeCalendar() {
    setCalendarAt(null);
    // Focus goes back where it came from, so the calendar does not leave the
    // keyboard stranded at the top of the document.
    triggerRef.current?.focus();
  }

  // A day chosen from the calendar can sit well down the strip. Bring it into
  // view, or the quick picks look like nothing is selected.
  useEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.querySelector<HTMLElement>('[data-active="true"]');
    if (!strip || !chip) return;
    strip.scrollTo({
      left: chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [date]);

  // The next two weeks, plus whatever was picked from the calendar if it fell
  // outside them. A chosen day that the strip cannot show would leave the quick
  // picks looking like nothing is selected.
  const days = useMemo(() => {
    const dates = Array.from({ length: DAYS_AHEAD }, (_, i) => addDaysISO(today, i));
    if (!dates.includes(date)) dates.push(date);
    return dates
      .sort()
      .map((d) => ({ date: d, free: freeSlotCount(d, leadId) }));
  }, [today, leadId, date]);

  const states = useMemo(() => slotStates(date, leadId), [date, leadId]);
  const anyFree = SLOTS.some((s) => states[s.id] === "free" || states[s.id] === "yours");
  const nextOpen = days.find((d) => d.date !== date && d.free > 0);

  // Changing the day drops a selection that is not available there. Derived
  // rather than cleared in an effect, so there is never a render where an
  // unavailable slot still looks chosen.
  const picked = slot && (states[slot] === "free" || states[slot] === "yours") ? slot : null;

  const unchanged = !!current && current.date === date && current.slot === picked;
  const ok = !!picked && !unchanged;

  return (
    <ModalShell
      title={current ? "Move Site Visit" : "Schedule Site Visit"}
      onClose={onClose}
      width="max-w-lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!ok}
            onClick={() => picked && onConfirm(date, picked)}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
              ok
                ? "bg-brand-blue hover:bg-brand-blue-hover text-white active:scale-[0.98]"
                : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
            )}
          >
            <CalendarCheck className="size-4" />
            {current ? "Move Visit" : "Confirm Visit"}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="bg-brand-orange/10 text-brand-orange grid size-10 shrink-0 place-items-center rounded-xl">
          <CalendarCheck className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-ink truncate text-sm font-bold">{leadName}</p>
          <p className="text-ink-muted truncate text-xs">{subtitle || "Confirm a day and time that suits them."}</p>
        </div>
      </div>

      {/* day */}
      <div className="mt-5 mb-2 flex items-center justify-between gap-3">
        <p className="text-ink text-sm font-semibold">Pick a day</p>
        <CalendarTrigger ref={triggerRef} open={!!calendarAt} onOpen={setCalendarAt} />
      </div>
      {/* relative so a chip's offsetLeft is measured against this scroller */}
      <div ref={stripRef} className="relative -mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5">
        {days.map(({ date: d, free }) => {
          const active = d === date;
          // A day already gone reads as "Passed", not "Full". The strip can hold
          // one when a visit that has been and gone is being moved.
          const block = dateBlock(d, leadId);
          const full = block !== null;
          return (
            <button
              key={d}
              type="button"
              disabled={full}
              data-active={active}
              onClick={() => setDate(d)}
              className={cn(
                // Wide enough for the longest label a date can produce, so a day
                // late in the strip does not wrap onto two lines.
                "flex w-[94px] shrink-0 flex-col items-center gap-0.5 rounded-xl border px-1.5 py-2 text-center whitespace-nowrap outline-none transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40",
                full
                  ? "cursor-not-allowed border-black/[0.06] bg-black/[0.02]"
                  : active
                    ? "border-accent-blue bg-accent-blue/[0.07] active:scale-[0.98]"
                    : "border-black/[0.1] bg-white hover:border-black/25 active:scale-[0.98]"
              )}
            >
              <span className={cn("text-xs font-bold", full ? "text-ink-muted/50" : "text-ink")}>
                {fmtVisitDate(d)}
              </span>
              <span className={cn("text-[10px] font-medium", full ? "text-ink-muted/50" : free <= 2 ? "text-brand-orange" : "text-ink-muted")}>
                {block === "past" ? "Passed" : block ? "Full" : `${free} free`}
              </span>
            </button>
          );
        })}
      </div>

      {/* time */}
      <div className="mt-5 flex items-baseline justify-between">
        <p className="text-ink text-sm font-semibold">Pick a time</p>
        <p className="text-ink-muted text-xs">{fmtVisitDate(date)}</p>
      </div>

      {anyFree ? (
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SLOTS.map((s) => (
            <SlotButton
              key={s.id}
              label={s.label}
              state={states[s.id]}
              selected={picked === s.id}
              onSelect={() => setSlot(s.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-2 rounded-xl border border-dashed border-black/15 px-4 py-6 text-center">
          <Clock className="text-ink-muted/40 mx-auto size-6" />
          <p className="text-ink mt-2 text-sm font-semibold">Nothing left on {fmtVisitDate(date)}</p>
          <p className="text-ink-muted mt-1 text-xs">Every slot is either taken or has passed.</p>
          {nextOpen && (
            <button
              type="button"
              onClick={() => setDate(nextOpen.date)}
              className="text-accent-blue mt-3 text-xs font-semibold hover:underline"
            >
              Try {fmtVisitDate(nextOpen.date)} ({nextOpen.free} free)
            </button>
          )}
        </div>
      )}

      <div className="text-ink-muted mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
        <Legend className="bg-accent-blue" label="Available" />
        <Legend className="bg-ink-muted/30" label="Taken or passed" />
        {current && <Legend className="bg-brand-orange" label="Current booking" />}
      </div>

      {calendarAt && (
        <VisitCalendar
          value={date}
          leadId={leadId}
          anchor={calendarAt}
          onPick={(d) => {
            setDate(d);
            closeCalendar();
          }}
          onClose={closeCalendar}
        />
      )}
    </ModalShell>
  );
}

function SlotButton({
  label,
  state,
  selected,
  onSelect,
}: {
  label: string;
  state: SlotState;
  selected: boolean;
  onSelect: () => void;
}) {
  const open = state === "free" || state === "yours";
  return (
    <button
      type="button"
      disabled={!open}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative flex h-[52px] flex-col items-start justify-center rounded-xl border px-3 text-left outline-none transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        !open
          ? "cursor-not-allowed border-black/[0.08] bg-black/[0.03]"
          : selected
            ? "border-accent-blue bg-accent-blue/[0.08] active:scale-[0.98]"
            : state === "yours"
              ? "border-brand-orange/50 bg-brand-orange/[0.06] hover:border-brand-orange active:scale-[0.98]"
              : "border-black/[0.12] bg-white hover:border-accent-blue/50 active:scale-[0.98]"
      )}
    >
      <span className={cn("text-xs font-semibold", open ? "text-ink" : "text-ink-muted/60")}>{label}</span>
      <span
        className={cn(
          "text-[10px] font-medium",
          state === "past"
            ? "text-ink-muted/50"
            : state === "taken"
              ? "text-ink-muted/60"
              : state === "yours"
                ? "text-brand-orange"
                : "text-ink-muted"
        )}
      >
        {state === "past" ? "Passed" : state === "taken" ? "Taken" : state === "yours" ? "Current booking" : "Available"}
      </span>
      {selected && (
        <span className="bg-accent-blue absolute top-2 right-2 grid size-4 place-items-center rounded-full text-white">
          <Check className="size-2.5" strokeWidth={3.5} />
        </span>
      )}
    </button>
  );
}

/** A filled dot, not an outlined square: an outline at this size reads as an
 * unchecked checkbox rather than a colour key. */
function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} aria-hidden />
      {label}
    </span>
  );
}
