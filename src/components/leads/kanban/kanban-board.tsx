"use client";

/**
 * The rep's board: every lead assigned to them, as a card, in one of four
 * stages. Cards drag between columns in either direction.
 *
 * Drag is hand-rolled on pointer events because there is no drag library in this
 * repo and pulling one in for four columns would be the larger cost. It follows
 * the gesture rules that matter: a movement threshold so a click is still a
 * click, pointer capture so the drag survives leaving the card, a single active
 * pointer so a second finger cannot hijack it, and the card tracking the pointer
 * directly rather than through a spring, because a card being dragged should sit
 * under the finger exactly.
 *
 * Drag is never the only way. Every card has a move menu, so the board is fully
 * operable from the keyboard.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  CalendarCheck,
  CalendarX,
  Check,
  ChevronRight,
  GripVertical,
  Inbox,
  MoveRight,
  Phone,
  StickyNote,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/leads/contacts/ui";
import { LEADS_CHANGED_EVENT, listDistributedLeads } from "@/lib/lead-promotion";
import { TIER_META, type ScoredLead } from "@/lib/lead-intelligence";
import { AssigneeChip } from "@/components/leads/lead-row";
import { useViewer } from "@/lib/use-viewer";
import {
  LOSS_REASONS,
  PIPELINE_CHANGED_EVENT,
  STAGE_META,
  STAGE_ORDER,
  entriesFor,
  fmtSince,
  fmtVisitDate,
  isStale,
  moveStage,
  scheduleVisit,
  slotById,
  todayISO,
  type PipelineEntry,
  type Stage,
} from "@/lib/lead-pipeline";
import { ScheduleVisitModal } from "../site-visits/schedule-visit-modal";
import { LeadHistoryModal } from "./lead-history-modal";
import { NoteModal } from "./note-modal";

/** How far the pointer has to travel before this counts as a drag not a click. */
const DRAG_THRESHOLD = 6;

interface Card {
  lead: ScoredLead;
  entry: PipelineEntry;
}

interface DragState {
  leadId: string;
  from: Stage;
  pointerId: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  active: boolean;
  over: Stage | null;
  /** The card's box when the drag began, so the floating copy matches its size
   * and can be positioned in viewport coordinates. */
  rect: { x: number; y: number; w: number; h: number };
}

export function KanbanBoard() {
  const viewer = useViewer();
  const [ready, setReady] = useState(false);
  const [leads, setLeads] = useState<ScoredLead[]>([]);
  const [entries, setEntries] = useState<Record<string, PipelineEntry>>({});

  const [drag, setDrag] = useState<DragState | null>(null);
  const [landed, setLanded] = useState<string | null>(null);
  const [flashed, setFlashed] = useState<Stage | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const [noteFor, setNoteFor] = useState<Card | null>(null);
  const [historyFor, setHistoryFor] = useState<Card | null>(null);
  const [scheduleFor, setScheduleFor] = useState<Card | null>(null);
  const [lossFor, setLossFor] = useState<{ card: Card; reason: string } | null>(null);
  const [confirmWin, setConfirmWin] = useState<Card | null>(null);

  const colRefs = useRef(new Map<Stage, HTMLElement>());

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

  // Clear the one-shot feedback so a card can be moved twice and animate twice.
  useEffect(() => {
    if (!landed) return;
    const t = setTimeout(() => setLanded(null), 400);
    return () => clearTimeout(t);
  }, [landed]);
  useEffect(() => {
    if (!flashed) return;
    const t = setTimeout(() => setFlashed(null), 600);
    return () => clearTimeout(t);
  }, [flashed]);
  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(false), 1400);
    return () => clearTimeout(t);
  }, [celebrate]);

  const cards = useMemo(
    () => leads.map((lead) => ({ lead, entry: entries[lead.id] })).filter((c): c is Card => !!c.entry),
    [leads, entries]
  );

  const draggedCard = drag ? (cards.find((c) => c.lead.id === drag.leadId) ?? null) : null;

  const byStage = useMemo(() => {
    const out: Record<Stage, Card[]> = { qualified: [], "site-visit": [], won: [], lost: [] };
    for (const c of cards) out[c.entry.stage].push(c);
    // Hottest first inside a column: the board should agree with the calling list.
    for (const s of STAGE_ORDER) out[s].sort((a, b) => b.lead.score - a.lead.score);
    return out;
  }, [cards]);

  /* ------------------------------- the move ------------------------------- */

  const commit = useCallback((leadId: string, to: Stage, reason?: string) => {
    const moved = moveStage(leadId, to, reason);
    if (!moved) return;
    setLanded(leadId);
    setFlashed(to);
    if (to === "won") setCelebrate(true);
    reload();
  }, [reload]);

  /** Close Loss asks why, and Site Visit wants a booking, so those two go through
   * a step instead of landing silently. */
  const requestMove = useCallback(
    (card: Card, to: Stage) => {
      if (card.entry.stage === to) return;
      if (to === "lost") {
        setLossFor({ card, reason: "" });
        return;
      }
      if (to === "site-visit" && card.entry.visit?.status !== "scheduled") {
        setScheduleFor(card);
        return;
      }
      if (to === "won") {
        setConfirmWin(card);
        return;
      }
      commit(card.lead.id, to);
    },
    [commit]
  );

  /* -------------------------------- dragging ------------------------------ */

  const stageAtPoint = (x: number, y: number): Stage | null => {
    for (const [stage, el] of colRefs.current) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return stage;
    }
    return null;
  };

  function onPointerDown(e: PointerEvent<HTMLDivElement>, card: Card) {
    // A press that began on one of the card's own controls belongs to that
    // control. Without this the card captures the pointer and then treats the
    // eventual pointerup as a click on itself, wherever it actually landed.
    // Same idiom as data-flow-interactive on the chat-flow canvas.
    if ((e.target as HTMLElement).closest("[data-card-action]")) return;
    // One pointer at a time: a second finger mid-drag would teleport the card.
    if (drag || e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    setDrag({
      leadId: card.lead.id,
      from: card.entry.stage,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
      active: false,
      over: card.entry.stage,
      rect: { x: r.left, y: r.top, w: r.width, h: r.height },
    });
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const active = drag.active || Math.hypot(dx, dy) > DRAG_THRESHOLD;
    setDrag({ ...drag, dx, dy, active, over: active ? stageAtPoint(e.clientX, e.clientY) : drag.over });
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>, card: Card) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { active, over } = drag;
    setDrag(null);
    if (!active) {
      // Never moved: it was a click, so open the lead.
      setHistoryFor(card);
      return;
    }
    if (over && over !== card.entry.stage) requestMove(card, over);
  }

  function onPointerCancel() {
    setDrag(null);
  }

  if (!ready) return <div className="h-full" aria-hidden />;

  const total = cards.length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          {/* An admin lands here with the whole team's leads, so the possessive
              title only belongs to a rep. */}
          <h1 className="text-ink text-xl font-bold">{seesAll ? "Team Board" : "My Board"}</h1>
          <p className="text-ink-muted text-sm">
            {total === 0
              ? seesAll
                ? "Nothing shared out yet"
                : "Nothing assigned to you yet"
              : `${total} ${total === 1 ? "lead" : "leads"} · drag a card to move it, or click it to read the history`}
          </p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-3">
            {STAGE_ORDER.map((s) => (
              <span key={s} className="text-ink-muted inline-flex items-center gap-1.5 text-xs">
                <span className={cn("size-2 rounded-full", STAGE_META[s].dot)} aria-hidden />
                <span className="text-ink font-bold tabular-nums">{byStage[s].length}</span>
                <span className="hidden sm:inline">{STAGE_META[s].short}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {total === 0 ? (
        <EmptyBoard />
      ) : (
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex h-full min-w-[900px] gap-3 px-4 py-4 sm:px-6 lg:px-8">
            {STAGE_ORDER.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                cards={byStage[stage]}
                dragging={drag?.active ? drag : null}
                flashed={flashed === stage}
                celebrate={stage === "won" && celebrate}
                registerRef={(el) => {
                  if (el) colRefs.current.set(stage, el);
                  else colRefs.current.delete(stage);
                }}
                landed={landed}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onNote={setNoteFor}
                onMove={requestMove}
              />
            ))}
          </div>
        </div>
      )}

      {/* The card in the air. Portalled to the body because a column scrolls its
          own content, which would otherwise clip the card the moment it left. */}
      {drag?.active && draggedCard && typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[60]"
            style={{
              left: drag.rect.x + drag.dx,
              top: drag.rect.y + drag.dy,
              width: drag.rect.w,
              transform: "scale(1.03) rotate(1.5deg)",
            }}
            aria-hidden
          >
            <GhostCard card={draggedCard} />
          </div>,
          document.body
        )}

      {/* ------------------------------- modals ------------------------------ */}

      {noteFor && <NoteModal leadId={noteFor.lead.id} leadName={noteFor.lead.name} onClose={() => setNoteFor(null)} />}

      {historyFor && (
        <LeadHistoryModal
          lead={historyFor.lead}
          onClose={() => setHistoryFor(null)}
          onAddNote={() => {
            const c = historyFor;
            setHistoryFor(null);
            setNoteFor(c);
          }}
          onSchedule={() => {
            const c = historyFor;
            setHistoryFor(null);
            setScheduleFor(c);
          }}
        />
      )}

      {scheduleFor && (
        <ScheduleVisitModal
          leadId={scheduleFor.lead.id}
          leadName={scheduleFor.lead.name}
          subtitle={scheduleFor.lead.captured?.slice(0, 2).map((c) => c.value).join(" · ")}
          current={
            scheduleFor.entry.visit?.status === "scheduled"
              ? { date: scheduleFor.entry.visit.date, slot: scheduleFor.entry.visit.slot }
              : null
          }
          onClose={() => setScheduleFor(null)}
          onConfirm={(date, slot) => {
            // Booking is also the move into Site Visit, so no second step.
            scheduleVisit(scheduleFor.lead.id, date, slot);
            setLanded(scheduleFor.lead.id);
            setFlashed("site-visit");
            setScheduleFor(null);
            reload();
          }}
        />
      )}

      {lossFor && (
        <LossReasonModal
          name={lossFor.card.lead.name}
          onClose={() => setLossFor(null)}
          onConfirm={(reason) => {
            commit(lossFor.card.lead.id, "lost", reason);
            setLossFor(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmWin}
        title={`Mark ${confirmWin?.lead.name ?? "this lead"} as won?`}
        message="This closes the lead out as a booking. You can still move it back if something changes."
        confirmLabel="Mark as Won"
        onConfirm={() => {
          if (confirmWin) commit(confirmWin.lead.id, "won");
          setConfirmWin(null);
        }}
        onCancel={() => setConfirmWin(null)}
      />
    </div>
  );
}

/* --------------------------------- column ---------------------------------- */

function Column({
  stage,
  cards,
  dragging,
  flashed,
  celebrate,
  registerRef,
  landed,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onNote,
  onMove,
}: {
  stage: Stage;
  cards: Card[];
  dragging: DragState | null;
  flashed: boolean;
  celebrate: boolean;
  registerRef: (el: HTMLElement | null) => void;
  landed: string | null;
  onPointerDown: (e: PointerEvent<HTMLDivElement>, card: Card) => void;
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>, card: Card) => void;
  onPointerCancel: () => void;
  onNote: (card: Card) => void;
  onMove: (card: Card, to: Stage) => void;
}) {
  const meta = STAGE_META[stage];
  // The column being hovered while a card from somewhere else is in the air.
  const receiving = !!dragging && dragging.over === stage && dragging.from !== stage;

  return (
    <section
      ref={registerRef}
      className={cn(
        "relative flex min-w-0 flex-1 flex-col rounded-2xl border transition-[border-color,background-color] duration-200 ease-out",
        receiving ? cn("border-transparent ring-2", meta.ring, meta.tint) : "border-black/[0.07] bg-black/[0.015]"
      )}
    >
      {/* the acknowledgement when a card lands here */}
      {flashed && (
        <span
          aria-hidden
          className={cn("kanban-flash pointer-events-none absolute inset-0 rounded-2xl opacity-0", meta.tint)}
          style={{ animation: "col-flash 600ms ease-out both" }}
        />
      )}

      <header className="relative flex items-center gap-2 px-3.5 pt-3.5 pb-2">
        <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} aria-hidden />
        <h2 className="text-ink truncate text-sm font-bold">{meta.name}</h2>
        <span className="bg-black/[0.06] text-ink-muted ml-auto shrink-0 rounded-full px-1.5 text-[11px] font-bold tabular-nums">
          {cards.length}
        </span>
        {celebrate && <WinBurst />}
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 pb-3">
        {cards.length === 0 ? (
          <div
            className={cn(
              "grid place-items-center rounded-xl border border-dashed px-3 py-8 text-center transition-colors duration-200",
              receiving ? cn("border-transparent", meta.text) : "border-black/[0.1]"
            )}
          >
            <p className={cn("text-xs font-medium", receiving ? meta.text : "text-ink-muted/70")}>
              {receiving ? "Drop to move here" : meta.blurb}
            </p>
          </div>
        ) : (
          cards.map((card) => (
            <LeadCard
              key={card.lead.id}
              card={card}
              drag={dragging?.leadId === card.lead.id ? dragging : null}
              landed={landed === card.lead.id}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
              onNote={onNote}
              onMove={onMove}
            />
          ))
        )}
        {receiving && cards.length > 0 && (
          <div
            className={cn("grid place-items-center rounded-xl border border-dashed py-4", meta.text)}
            style={{ animation: "fade-in-up 160ms ease-out both" }}
          >
            <p className={cn("text-xs font-semibold", meta.text)}>Drop to move here</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------- card ----------------------------------- */

function LeadCard({
  card,
  drag,
  landed,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onNote,
  onMove,
}: {
  card: Card;
  drag: DragState | null;
  landed: boolean;
  onPointerDown: (e: PointerEvent<HTMLDivElement>, card: Card) => void;
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>, card: Card) => void;
  onPointerCancel: () => void;
  onNote: (card: Card) => void;
  onMove: (card: Card, to: Stage) => void;
}) {
  const { lead, entry } = card;
  const tier = TIER_META[lead.tier];
  const lifted = !!drag?.active;
  const visit = entry.visit;
  const stale = isStale(entry);
  // A visit whose day has gone by is waiting on an outcome. The board says so in
  // the same words My Site Visits uses, so the two screens never disagree.
  const passed = visit?.status === "scheduled" && visit.date < todayISO();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${lead.name}, ${STAGE_META[entry.stage].name}`}
      onPointerDown={(e) => onPointerDown(e, card)}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => onPointerUp(e, card)}
      onPointerCancel={onPointerCancel}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPointerUp({ pointerId: -1 } as unknown as PointerEvent<HTMLDivElement>, card);
        }
      }}
      className={cn(
        "kanban-card group relative touch-none rounded-xl border p-3 text-left outline-none select-none",
        // While it is in the air the original stays put as a hollow placeholder,
        // so you can see both where it came from and where it is going.
        lifted
          ? "border-accent-blue/30 bg-accent-blue/[0.04] border-dashed opacity-60"
          : "cursor-grab border-black/[0.08] bg-white shadow-sm transition-[border-color,box-shadow,transform] duration-150 ease-out hover:border-black/20 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent-blue/40"
      )}
      style={landed && !lifted ? ({ animation: "card-land 300ms cubic-bezier(0.23,1,0.32,1) both" } as CSSProperties) : undefined}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="text-ink-muted/25 group-hover:text-ink-muted/50 mt-0.5 size-3.5 shrink-0 transition-colors" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-ink min-w-0 flex-1 truncate text-sm font-bold">{lead.name}</p>
            <span className={cn("shrink-0 text-sm font-bold tabular-nums", tier.score)}>{lead.score}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <p className="text-ink-muted flex min-w-0 flex-1 items-center gap-1 truncate text-[11px] tabular-nums">
              {lead.phone ? (
                <>
                  <Phone className="size-3 shrink-0" />
                  {lead.phone}
                </>
              ) : (
                lead.summary
              )}
            </p>
            {/* Renders only for someone who sees the whole team, so a rep's own
                board never repeats their name on every card. */}
            <AssigneeChip id={lead.assigneeId} />
          </div>
        </div>
        <MoveMenu card={card} onMove={onMove} />
      </div>

      {/* the two facts that change what you do next */}
      {(visit || stale) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {visit?.status === "scheduled" && !passed && (
            <span className="bg-brand-orange/10 text-brand-orange inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
              <CalendarCheck className="size-2.5" />
              {fmtVisitDate(visit.date)}
              {slotById(visit.slot) && `, ${slotById(visit.slot)!.label.split(" - ")[0]}`}
            </span>
          )}
          {passed && visit && (
            <span className="text-brand-orange bg-brand-orange/10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
              <TriangleAlert className="size-2.5" /> Visit passed, {fmtVisitDate(visit.date)}
            </span>
          )}
          {visit?.status === "cancelled" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
              <CalendarX className="size-2.5" /> Needs rebooking
            </span>
          )}
          {stale && (
            <span className="text-brand-orange bg-brand-orange/10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
              <TriangleAlert className="size-2.5" /> {fmtSince(entry.stageSince)} untouched
            </span>
          )}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-black/[0.05] pt-2">
        <button
          type="button"
          data-card-action
          onClick={() => onNote(card)}
          className="text-ink-muted hover:text-accent-blue inline-flex items-center gap-1 rounded text-[11px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
        >
          <StickyNote className="size-3" />
          {entry.notes.length > 0 ? `${entry.notes.length} note${entry.notes.length === 1 ? "" : "s"}` : "Add note"}
        </button>
        <span className="text-ink-muted/60 inline-flex items-center gap-0.5 text-[11px] font-medium">
          History <ChevronRight className="size-3" />
        </span>
      </div>
    </div>
  );
}

/** What you see under the pointer while dragging: the card's face, lifted. Kept
 * deliberately thin, because it is decoration for something the real card is
 * already holding open a place for. */
function GhostCard({ card }: { card: Card }) {
  const { lead, entry } = card;
  const tier = TIER_META[lead.tier];
  return (
    <div className="border-accent-blue/40 rounded-xl border bg-white p-3 shadow-2xl shadow-black/25">
      <div className="flex items-start gap-2">
        <GripVertical className="text-ink-muted/40 mt-0.5 size-3.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-ink min-w-0 flex-1 truncate text-sm font-bold">{lead.name}</p>
            <span className={cn("shrink-0 text-sm font-bold tabular-nums", tier.score)}>{lead.score}</span>
          </div>
          <p className="text-ink-muted mt-0.5 truncate text-[11px] tabular-nums">{lead.phone ?? lead.summary}</p>
        </div>
      </div>
      {entry.notes.length > 0 && (
        <p className="text-ink-muted mt-2 flex items-center gap-1 border-t border-black/[0.05] pt-2 text-[11px] font-semibold">
          <StickyNote className="size-3" /> {entry.notes.length} note{entry.notes.length === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

/** The keyboard and no-drag path. A board that can only be used by dragging is
 * a board half the people cannot use.
 *
 * Hand-rolled rather than the base-ui menu, matching the FilterSelect idiom used
 * elsewhere in this repo. The base-ui menu closes on pointerdown, which means
 * inside a card that reacts to pointer events the item unmounts before its click
 * lands: the move never fires and the card gets the click instead. A portal plus
 * a full-screen catcher keeps every event off the card, and escapes the column's
 * own scroll clipping at the same time.
 */
function MoveMenu({ card, onMove }: { card: Card; onMove: (card: Card, to: Stage) => void }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const targets = STAGE_ORDER.filter((s) => s !== card.entry.stage);

  useEffect(() => {
    if (!at) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAt(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [at]);

  function open() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setAt({ x: Math.min(r.right, window.innerWidth - 200), y: r.bottom + 6 });
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-card-action
        aria-label={`Move ${card.lead.name} to another stage`}
        aria-expanded={!!at}
        aria-haspopup="menu"
        onClick={open}
        className="text-ink-muted/50 hover:text-ink hover:bg-black/[0.05] -mt-0.5 -mr-0.5 grid size-6 shrink-0 place-items-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40"
      >
        <MoveRight className="size-3.5" />
      </button>

      {at && typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Marked because a React portal bubbles its synthetic events through
                the component tree, not the DOM tree: without this the card that
                renders this menu sees the clicks and captures the pointer. */}
            <div data-card-action className="fixed inset-0 z-[70]" onClick={() => setAt(null)} aria-hidden />
            <div
              data-card-action
              role="menu"
              aria-label="Move to"
              className="fixed z-[71] w-48 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1.5 shadow-lg shadow-black/[0.1]"
              style={{
                left: at.x,
                top: at.y,
                transform: "translateX(-100%)",
                animation: "scale-in 150ms cubic-bezier(0.23,1,0.32,1) both",
                transformOrigin: "top right",
              }}
            >
              <p className="text-ink-muted px-2 pt-0.5 pb-1 text-xs font-medium">Move to</p>
              {targets.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAt(null);
                    onMove(card, s);
                  }}
                  className="text-ink hover:bg-accent-blue/[0.07] flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40"
                >
                  <span className={cn("size-2 shrink-0 rounded-full", STAGE_META[s].dot)} aria-hidden />
                  {STAGE_META[s].name}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

/* -------------------------------- loss reason ------------------------------ */

function LossReasonModal({
  name,
  onClose,
  onConfirm,
}: {
  name: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Why was this lead lost">
      <div
        className="bg-ink/40 absolute inset-0"
        style={{ animation: "fade-in 150ms cubic-bezier(0.23,1,0.32,1) both" }}
        onClick={onClose}
        aria-hidden
      />
      <div className="modal-pop relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl shadow-black/25">
        <div className="flex gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-500">
            <TriangleAlert className="size-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-ink text-base font-bold">Why did {name} not go ahead?</h2>
            <p className="text-ink-muted mt-1 text-sm leading-relaxed">
              A lost lead with no reason teaches the team nothing. This shows up on the lead&apos;s timeline.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-1.5">
          {LOSS_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium outline-none transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.99]",
                reason === r
                  ? "border-accent-blue bg-accent-blue/[0.06] text-ink"
                  : "text-ink-muted border-black/[0.1] hover:border-black/25"
              )}
            >
              {r}
              {reason === r && (
                <span className="bg-accent-blue grid size-4 shrink-0 place-items-center rounded-full text-white">
                  <Check className="size-2.5" strokeWidth={3.5} />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none hover:bg-black/[0.04] active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!reason}
            onClick={() => onConfirm(reason)}
            className={cn(
              "h-10 rounded-lg px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none",
              reason
                ? "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]"
                : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
            )}
          >
            Mark as Lost
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- trimmings -------------------------------- */

const BURST = [
  { tx: -22, r: -80, color: "bg-brand-green" },
  { tx: -8, r: 40, color: "bg-brand-orange" },
  { tx: 10, r: -30, color: "bg-accent-blue" },
  { tx: 24, r: 90, color: "bg-brand-green" },
];

/** Closing a deal is the rarest and best thing that happens on this board, so it
 * gets the one piece of confetti in the whole workflow. */
function WinBurst() {
  return (
    <span className="pointer-events-none absolute top-4 right-6" aria-hidden>
      {BURST.map((b, i) => (
        <span
          key={i}
          className={cn(
            "absolute size-1.5 rounded-[2px] opacity-0 motion-safe:animate-[confetti-pop_1100ms_ease-out_forwards] motion-reduce:hidden",
            b.color
          )}
          style={
            {
              "--tx": `${b.tx}px`,
              "--peak-y": "-26px",
              "--fall-y": "44px",
              "--r": `${b.r}deg`,
              animationDelay: `${i * 60}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

function EmptyBoard() {
  return (
    <div className="grid flex-1 place-items-center p-8">
      <div
        className="grid max-w-md place-items-center text-center"
        style={{ animation: "fade-in-up 240ms cubic-bezier(0.23,1,0.32,1) both" }}
      >
        <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl">
          <Inbox className="size-7" />
        </span>
        <h2 className="text-ink mt-4 text-lg font-bold">Your board is empty</h2>
        <p className="text-ink-muted mx-auto mt-1.5 text-sm leading-relaxed">
          Leads land here the moment they are shared out to you. Each one starts as a qualified lead, and you move it
          along as you work it.
        </p>
      </div>
    </div>
  );
}
