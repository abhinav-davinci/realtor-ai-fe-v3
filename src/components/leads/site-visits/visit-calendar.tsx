"use client";

/**
 * A month at a time, for the visits that are not in the next few days. The day
 * strip stays the fast path; this is the escape hatch when someone says "the
 * Saturday after next".
 *
 * Every rule about what can be booked comes from `dateBlock()` in the store, so
 * a day that looks pickable here is pickable everywhere: nothing behind today,
 * nothing past the booking horizon, and nothing already full. A blocked day is
 * shown and explained rather than hidden, because a gap in a calendar reads as
 * a bug.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type Ref,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BOOKING_HORIZON_DAYS,
  addDaysISO,
  dateBlock,
  freeSlotCount,
  todayISO,
  type DateBlock,
} from "@/lib/lead-pipeline";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
/** Measured, not guessed: the panel is a fixed month grid, so its box is known
 * and the open direction can be decided before it is on screen. */
const PANEL_W = 292;
const PANEL_H = 320;

/* ------------------------------ date helpers ------------------------------ */

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m: m - 1, d };
};

/** First of the month an ISO date sits in, as a key we can compare and step. */
const monthKey = (s: string) => s.slice(0, 7);

function addMonths(key: string, n: number): string {
  const [y, m] = key.split("-").map(Number);
  const dt = new Date(y, m - 1 + n, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function longDate(s: string): string {
  const { y, m, d } = parse(s);
  return new Date(y, m, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** The cells of a month: leading blanks so the 1st lands on its weekday, then
 * the days. Trailing blanks are not needed, the grid just ends. */
function monthCells(key: string): (string | null)[] {
  const [y, m] = key.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const days = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= days; d++) cells.push(iso(y, m - 1, d));
  return cells;
}

/** The same day of the month in a new month, kept inside the bookable window and
 * inside the month's own length. */
function clampInto(month: string, from: string, first: string, last: string): string {
  const [y, m] = month.split("-").map(Number);
  const daysIn = new Date(y, m, 0).getDate();
  const target = `${month}-${String(Math.min(Number(from.slice(8)), daysIn)).padStart(2, "0")}`;
  return target < first ? first : target > last ? last : target;
}

const BLOCK_TEXT: Record<Exclude<DateBlock, null>, string> = {
  past: "in the past",
  full: "fully booked",
  beyond: "too far ahead",
};

/* -------------------------------- component ------------------------------- */

export function VisitCalendar({
  value,
  leadId,
  anchor,
  onPick,
  onClose,
}: {
  /** The day currently chosen, which the calendar opens on. */
  value: string;
  leadId?: string;
  /** The trigger's box, so the panel opens from it rather than the middle of the screen. */
  anchor: DOMRect;
  onPick: (date: string) => void;
  onClose: () => void;
}) {
  const today = todayISO();
  const last = addDaysISO(today, BOOKING_HORIZON_DAYS);

  const [month, setMonth] = useState(() => monthKey(value < today ? today : value));
  // The day the arrow keys are sitting on. Separate from the selection, because
  // moving across the grid should not book anything.
  // Clamped: a visit that has already been and gone can be moved, and the
  // keyboard should start somewhere it is allowed to be.
  const [cursor, setCursor] = useState(value < today ? today : value);
  const focusRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const cells = useMemo(() => monthCells(month), [month]);
  const anyScarce = useMemo(
    () => cells.some((d) => d !== null && !dateBlock(d, leadId) && freeSlotCount(d, leadId) <= 2),
    [cells, leadId]
  );
  const canGoBack = month > monthKey(today);
  const canGoNext = month < monthKey(last);

  // Escape belongs to the calendar while it is open, not to the modal behind it.
  // Captured so it runs before the modal's own document listener.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  // Focus follows the cursor so the grid can be driven entirely from the
  // keyboard, and takes it on open. It deliberately does not steal focus back
  // from the month arrows, or pressing one twice would need the mouse.
  useEffect(() => {
    const active = document.activeElement;
    const fromGrid = active instanceof HTMLElement && active.getAttribute("role") === "gridcell";
    const fromOutside = !panelRef.current?.contains(active);
    if (fromGrid || fromOutside) focusRef.current?.focus();
  }, [cursor, month]);

  function moveCursor(days: number) {
    const next = addDaysISO(cursor, days);
    if (next < today || next > last) return;
    setCursor(next);
    if (monthKey(next) !== month) setMonth(monthKey(next));
  }

  /** Change month, taking the cursor with it. Without this the keyboard would be
   * left pointing at a day that is no longer on screen, and the grid would have
   * nothing to focus. */
  function goMonth(delta: number) {
    if ((delta < 0 && !canGoBack) || (delta > 0 && !canGoNext)) return;
    const to = addMonths(month, delta);
    setMonth(to);
    setCursor(clampInto(to, cursor, today, last));
  }

  function onGridKey(e: ReactKeyboardEvent) {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in step) {
      e.preventDefault();
      moveCursor(step[e.key]);
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      goMonth(e.key === "PageUp" ? -1 : 1);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const weekday = new Date(parse(cursor).y, parse(cursor).m, parse(cursor).d).getDay();
      moveCursor(e.key === "Home" ? -weekday : 6 - weekday);
    }
  }

  // Opens downward unless it would run off the bottom, which is what happens on
  // a short window with the modal already filling it.
  const flipUp = anchor.bottom + 8 + PANEL_H > window.innerHeight;

  const panel = (
    <>
      <div className="fixed inset-0 z-[70]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Pick a date"
        className={cn(
          "fixed z-[71] w-[292px] rounded-2xl border border-black/[0.08] bg-white p-3 shadow-2xl shadow-black/20",
          // Grows out of the button rather than the middle of the screen. Kept in
          // a motion-safe variant so reduced motion gets the panel, not the pop.
          "motion-safe:animate-[scale-in_160ms_cubic-bezier(0.23,1,0.32,1)_both]"
        )}
        style={{
          left: Math.max(12, Math.min(anchor.right - PANEL_W, window.innerWidth - PANEL_W - 12)),
          top: flipUp ? Math.max(12, anchor.top - PANEL_H - 8) : anchor.bottom + 8,
          transformOrigin: flipUp ? "bottom right" : "top right",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-1">
          <MonthButton dir="prev" disabled={!canGoBack} onClick={() => goMonth(-1)} />
          <p className="text-ink text-sm font-bold" aria-live="polite">
            {monthLabel(month)}
          </p>
          <MonthButton dir="next" disabled={!canGoNext} onClick={() => goMonth(1)} />
        </div>

        <div className="text-ink-muted/70 mt-2 grid grid-cols-7 text-center text-[10px] font-bold">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="py-1">
              {d}
            </span>
          ))}
        </div>

        <div
          role="grid"
          aria-label={monthLabel(month)}
          onKeyDown={onGridKey}
          className="mt-0.5 grid grid-cols-7 gap-0.5 motion-safe:animate-[fade-in_140ms_ease-out]"
          key={month}
        >
          {cells.map((date, i) =>
            date === null ? (
              <span key={`b${i}`} aria-hidden />
            ) : (
              <DayCell
                key={date}
                date={date}
                selected={date === value}
                isToday={date === today}
                block={dateBlock(date, leadId)}
                free={freeSlotCount(date, leadId)}
                focusable={date === cursor}
                ref={date === cursor ? focusRef : undefined}
                onPick={() => {
                  setCursor(date);
                  onPick(date);
                }}
              />
            )
          )}
        </div>

        <div className="mt-2.5 flex items-center justify-between border-t border-black/[0.06] pt-2.5">
          {/* Only worth a key when there is something on screen wearing it. */}
          {anyScarce ? (
            <span className="text-ink-muted inline-flex items-center gap-1.5 text-[11px]">
              <span className="bg-brand-orange size-1.5 rounded-full" aria-hidden />
              Nearly full
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={() => {
              setMonth(monthKey(today));
              setCursor(today);
            }}
            className="text-accent-blue rounded text-[11px] font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent-blue/40"
          >
            Jump to today
          </button>
        </div>
      </div>
    </>
  );

  return typeof document === "undefined" ? null : createPortal(panel, document.body);
}

/* --------------------------------- pieces --------------------------------- */

function MonthButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous month" : "Next month"}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-lg outline-none transition-[background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        disabled
          ? "text-ink-muted/30 cursor-not-allowed"
          : "text-ink-muted hover:text-ink hover:bg-black/[0.05] active:scale-[0.94]"
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

function DayCell({
  ref,
  date,
  selected,
  isToday,
  block,
  free,
  focusable,
  onPick,
}: {
  ref?: Ref<HTMLButtonElement>;
  date: string;
  selected: boolean;
  isToday: boolean;
  block: DateBlock;
  free: number;
  focusable: boolean;
  onPick: () => void;
}) {
  const day = Number(date.slice(8));
  const blocked = block !== null;
  // Scarcity is worth a glance, so the last couple of slots get a dot. A full
  // day does not: it is already spelled out by being disabled.
  const scarce = !blocked && free <= 2;

  return (
    <button
      ref={ref}
      type="button"
      role="gridcell"
      // aria-disabled rather than disabled: a disabled button cannot hold focus,
      // and a grid the arrow keys fall out of the moment they cross a full day
      // is worse than one that lets you land there and says why.
      aria-disabled={blocked}
      tabIndex={focusable ? 0 : -1}
      aria-selected={selected}
      aria-label={
        blocked
          ? `${longDate(date)}, ${BLOCK_TEXT[block]}`
          : `${longDate(date)}, ${free} ${free === 1 ? "slot" : "slots"} free`
      }
      onClick={() => !blocked && onPick()}
      className={cn(
        "relative grid h-9 place-items-center rounded-lg text-xs font-semibold outline-none transition-[background-color,color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        blocked
          ? "text-ink-muted/30 cursor-not-allowed"
          : selected
            ? "bg-brand-blue text-white"
            : "text-ink hover:bg-accent-blue/10 active:scale-[0.94]",
        isToday && !selected && !blocked && "ring-accent-blue/40 ring-1 ring-inset"
      )}
    >
      {day}
      {scarce && !selected && (
        <span className="bg-brand-orange absolute bottom-1 size-1 rounded-full" aria-hidden />
      )}
    </button>
  );
}

/** The button that opens the calendar. Lives beside the day strip, so the quick
 * picks stay the obvious path and this is the way out of them. */
export function CalendarTrigger({
  ref,
  open,
  onOpen,
}: {
  ref: RefObject<HTMLButtonElement | null>;
  open: boolean;
  onOpen: (rect: DOMRect) => void;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => {
        const r = ref.current?.getBoundingClientRect();
        if (r) onOpen(r);
      }}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-xs font-semibold outline-none transition-[background-color,border-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.97]",
        open
          ? "border-accent-blue text-accent-blue bg-accent-blue/[0.07]"
          : "text-ink-muted hover:text-ink border-black/[0.12] hover:border-black/25"
      )}
    >
      <CalendarDays className="size-3.5" />
      Pick a date
    </button>
  );
}
