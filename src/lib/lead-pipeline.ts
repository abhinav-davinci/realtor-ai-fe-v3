/**
 * The rep's own workflow on top of a lead: which stage it sits in, the notes
 * they have taken, the site visit they have booked, and an append-only record of
 * everything that happened to it. Design mode, localStorage.
 *
 * Distribution (lib/lead-distribution.ts) decides WHOSE lead it is. This decides
 * WHERE that lead has got to. The two are separate on purpose: reassigning a
 * lead must not lose its history, and moving it through stages must not change
 * who owns it.
 *
 * DEVELOPER NOTE: client-side only. To wire it up, this is a per-lead pipeline
 * resource plus a bookings resource, and the slot availability has to be a
 * server read because two reps can pick the same slot at the same moment:
 *   PATCH /api/v1/orgs/{org_id}/leads/{lead_id}/stage      { stage, reason? }
 *   POST  /api/v1/orgs/{org_id}/leads/{lead_id}/notes      { text }
 *   GET   /api/v1/orgs/{org_id}/site-visits?date=          -> taken slots
 *   POST  /api/v1/orgs/{org_id}/site-visits                { lead_id, date, slot }
 *   PATCH /api/v1/orgs/{org_id}/site-visits/{id}           { date, slot } | { status }
 * The booking POST is the one that must reject a slot that went in the meantime.
 */

/* --------------------------------- stages --------------------------------- */

export type Stage = "qualified" | "site-visit" | "won" | "lost";

export const STAGE_ORDER: Stage[] = ["qualified", "site-visit", "won", "lost"];

/** One place for how a stage looks and reads, so the board, the cards and the
 * history can never disagree about it. */
export const STAGE_META: Record<
  Stage,
  { name: string; short: string; dot: string; tint: string; text: string; ring: string; blurb: string }
> = {
  qualified: {
    name: "Qualified Lead",
    short: "Qualified",
    dot: "bg-accent-blue",
    tint: "bg-accent-blue/10",
    text: "text-accent-blue",
    ring: "ring-accent-blue/30",
    blurb: "Assigned to you and worth a call.",
  },
  "site-visit": {
    name: "Site Visit",
    short: "Site visit",
    dot: "bg-brand-orange",
    tint: "bg-brand-orange/10",
    text: "text-brand-orange",
    ring: "ring-brand-orange/30",
    blurb: "A visit is booked. Confirm the day before.",
  },
  won: {
    name: "Close Win",
    short: "Won",
    dot: "bg-brand-green",
    tint: "bg-brand-green/10",
    text: "text-brand-green",
    ring: "ring-brand-green/30",
    blurb: "Booked. Nice work.",
  },
  lost: {
    name: "Close Loss",
    short: "Lost",
    dot: "bg-red-500",
    tint: "bg-red-50",
    text: "text-red-600",
    ring: "ring-red-300",
    blurb: "Not going ahead. The reason is worth recording.",
  },
};

/** Why a lead did not go ahead. Asked for on the way into Close Loss, because a
 * lost lead with no reason teaches the team nothing. */
export const LOSS_REASONS = [
  "Budget did not match",
  "Timeline moved out",
  "Location did not suit",
  "Bought elsewhere",
  "Could not reach them",
  "Not serious",
] as const;
export type LossReason = (typeof LOSS_REASONS)[number];

/* ---------------------------------- slots --------------------------------- */

export interface Slot {
  id: string;
  label: string;
  /** Hour the slot starts, for hiding slots that have already passed today. */
  hour: number;
}

/** Viewing hours, with the early afternoon left out. */
export const SLOTS: Slot[] = [
  { id: "s09", label: "9:00 - 10:00 AM", hour: 9 },
  { id: "s10", label: "10:00 - 11:00 AM", hour: 10 },
  { id: "s11", label: "11:00 AM - 12:00 PM", hour: 11 },
  { id: "s12", label: "12:00 - 1:00 PM", hour: 12 },
  { id: "s15", label: "3:00 - 4:00 PM", hour: 15 },
  { id: "s16", label: "4:00 - 5:00 PM", hour: 16 },
  { id: "s17", label: "5:00 - 6:00 PM", hour: 17 },
];

export const slotById = (id: string) => SLOTS.find((s) => s.id === id) ?? null;

/* ---------------------------------- model --------------------------------- */

export type HistoryKind =
  | "assigned"
  | "moved"
  | "note"
  | "visit-booked"
  | "visit-moved"
  | "visit-cancelled";

export interface HistoryEvent {
  id: string;
  kind: HistoryKind;
  at: number;
  /** Stage moves carry both ends so the timeline can read "Qualified to Won". */
  from?: Stage;
  to?: Stage;
  /** Visit events carry the slot they refer to. */
  date?: string;
  slot?: string;
  /** A note's text, or a loss reason. */
  text?: string;
}

export interface Note {
  id: string;
  text: string;
  at: number;
}

export type VisitStatus = "scheduled" | "cancelled" | "done";

export interface SiteVisit {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  slot: string;
  status: VisitStatus;
  bookedAt: number;
}

export interface PipelineEntry {
  leadId: string;
  stage: Stage;
  /** Epoch ms the lead entered its current stage, for the "sitting here" read. */
  stageSince: number;
  notes: Note[];
  history: HistoryEvent[];
  visit: SiteVisit | null;
  lossReason?: string;
}

/* --------------------------------- store ---------------------------------- */

const KEY = "tt_lead_pipeline";

export const PIPELINE_CHANGED_EVENT = "tt-pipeline-changed";
export function notifyPipelineChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PIPELINE_CHANGED_EVENT));
}

type PipelineMap = Record<string, PipelineEntry>;

function readAll(): PipelineMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PipelineMap) : {};
  } catch {
    return {};
  }
}
function writeAll(all: PipelineMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* quota or unavailable; ignore in design mode */
  }
}

let seq = 0;
const eventId = () => `ev-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/** A lead that has never been touched is a qualified lead: it reached Lead
 * Intelligence, which is warm and above, and it has an owner. */
function blank(leadId: string, at: number): PipelineEntry {
  return {
    leadId,
    stage: "qualified",
    stageSince: at,
    notes: [],
    history: [{ id: eventId(), kind: "assigned", at, to: "qualified" }],
    visit: null,
  };
}

/** The entry for a lead, created on first read so a card always has a history. */
export function entryFor(leadId: string, assignedAt?: number): PipelineEntry {
  const all = readAll();
  const found = all[leadId];
  if (found) return found;
  return blank(leadId, assignedAt ?? Date.now());
}

/** Entries for a set of leads, materialising any that do not exist yet. Used by
 * the board so every assigned lead shows up as a card. */
export function entriesFor(leads: { id: string; assignedAt?: number }[]): Record<string, PipelineEntry> {
  const all = readAll();
  let created = false;
  for (const l of leads) {
    if (!all[l.id]) {
      all[l.id] = blank(l.id, l.assignedAt ?? Date.now());
      created = true;
    }
  }
  if (created) writeAll(all);
  return all;
}

function save(entry: PipelineEntry): void {
  const all = readAll();
  all[entry.leadId] = entry;
  writeAll(all);
}

/* -------------------------------- mutations ------------------------------- */

/** Move a lead to another stage. Returns the updated entry, or null if it was
 * already there (so callers can skip the celebration on a no-op drop). */
export function moveStage(leadId: string, to: Stage, reason?: string): PipelineEntry | null {
  const entry = entryFor(leadId);
  if (entry.stage === to) return null;
  const at = Date.now();
  const next: PipelineEntry = {
    ...entry,
    stage: to,
    stageSince: at,
    lossReason: to === "lost" ? reason : undefined,
    history: [
      ...entry.history,
      { id: eventId(), kind: "moved", at, from: entry.stage, to, text: to === "lost" ? reason : undefined },
    ],
  };
  save(next);
  notifyPipelineChanged();
  return next;
}

export function addNote(leadId: string, text: string): PipelineEntry {
  const entry = entryFor(leadId);
  const at = Date.now();
  const trimmed = text.trim();
  const next: PipelineEntry = {
    ...entry,
    notes: [{ id: eventId(), text: trimmed, at }, ...entry.notes],
    history: [...entry.history, { id: eventId(), kind: "note", at, text: trimmed }],
  };
  save(next);
  notifyPipelineChanged();
  return next;
}

export function deleteNote(leadId: string, noteId: string): void {
  const entry = entryFor(leadId);
  save({ ...entry, notes: entry.notes.filter((n) => n.id !== noteId) });
  notifyPipelineChanged();
}

/**
 * Book or move a site visit. Booking one also moves the lead into the Site Visit
 * stage, because those are the same fact and asking the rep to do both would be
 * busywork.
 */
export function scheduleVisit(leadId: string, date: string, slot: string): PipelineEntry {
  const entry = entryFor(leadId);
  const at = Date.now();
  const rebooking = entry.visit?.status === "scheduled";
  const next: PipelineEntry = {
    ...entry,
    stage: "site-visit",
    stageSince: entry.stage === "site-visit" ? entry.stageSince : at,
    visit: { date, slot, status: "scheduled", bookedAt: at },
    history: [
      ...entry.history,
      ...(entry.stage === "site-visit"
        ? []
        : [{ id: eventId(), kind: "moved" as HistoryKind, at, from: entry.stage, to: "site-visit" as Stage }]),
      { id: eventId(), kind: rebooking ? "visit-moved" : "visit-booked", at, date, slot },
    ],
  };
  save(next);
  notifyPipelineChanged();
  return next;
}

/** Cancel a visit. The lead stays in Site Visit: it did not stop being a lead,
 * and dropping it back would hide that a visit was ever arranged. The card shows
 * that it needs rebooking instead. */
export function cancelVisit(leadId: string): PipelineEntry {
  const entry = entryFor(leadId);
  const at = Date.now();
  const next: PipelineEntry = {
    ...entry,
    visit: entry.visit ? { ...entry.visit, status: "cancelled" } : null,
    history: [
      ...entry.history,
      { id: eventId(), kind: "visit-cancelled", at, date: entry.visit?.date, slot: entry.visit?.slot },
    ],
  };
  save(next);
  notifyPipelineChanged();
  return next;
}

/* ------------------------------ availability ------------------------------ */

export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function fmtVisitDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const today = todayISO();
  if (iso === today) return "Today";
  if (iso === addDaysISO(today, 1)) return "Tomorrow";
  return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** Slots the rest of the org already has someone at. Derived from the date so it
 * is stable across reloads without needing to be stored, which keeps the "some
 * slots are gone" state honest without inventing other people's bookings. */
function heldElsewhere(date: string): Set<string> {
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) | 0;
  const held = new Set<string>();
  const count = Math.abs(h) % 3; // 0 to 2 slots
  for (let i = 0; i < count; i++) {
    held.add(SLOTS[Math.abs(h >> (i * 5)) % SLOTS.length].id);
  }
  return held;
}

export type SlotState = "free" | "taken" | "past" | "yours";

/**
 * What every slot on a date looks like right now. "yours" is the slot the lead
 * being rescheduled already holds, so it reads as kept rather than blocked.
 */
export function slotStates(date: string, forLeadId?: string): Record<string, SlotState> {
  const all = readAll();
  const held = heldElsewhere(date);
  const now = new Date();
  const isToday = date === todayISO();

  const takenByOthers = new Set<string>();
  let mine: string | null = null;
  for (const entry of Object.values(all)) {
    const v = entry.visit;
    if (!v || v.status !== "scheduled" || v.date !== date) continue;
    if (entry.leadId === forLeadId) mine = v.slot;
    else takenByOthers.add(v.slot);
  }

  const out: Record<string, SlotState> = {};
  for (const s of SLOTS) {
    if (isToday && s.hour <= now.getHours()) out[s.id] = "past";
    else if (mine === s.id) out[s.id] = "yours";
    else if (takenByOthers.has(s.id) || held.has(s.id)) out[s.id] = "taken";
    else out[s.id] = "free";
  }
  return out;
}

export function freeSlotCount(date: string, forLeadId?: string): number {
  return Object.values(slotStates(date, forLeadId)).filter((s) => s === "free" || s === "yours").length;
}

/* --------------------------------- reads ---------------------------------- */

/** Every lead with a live booking, soonest first. Drives My Site Visits. */
export function listScheduledVisits(): PipelineEntry[] {
  return Object.values(readAll())
    .filter((e) => e.visit?.status === "scheduled")
    .sort((a, b) => {
      const ad = `${a.visit!.date}-${slotById(a.visit!.slot)?.hour ?? 0}`;
      const bd = `${b.visit!.date}-${slotById(b.visit!.slot)?.hour ?? 0}`;
      return ad.localeCompare(bd);
    });
}

/** Visits that were called off and never rebooked: the thing most likely to be
 * forgotten, so My Site Visits surfaces them separately. */
export function listCancelledVisits(): PipelineEntry[] {
  return Object.values(readAll()).filter((e) => e.visit?.status === "cancelled");
}

const DAY = 86_400_000;

/** A lead sitting untouched in Qualified for this long is worth flagging on the
 * board. Assignment without follow-through is worse than no assignment. */
export const STALE_DAYS = 3;
export function isStale(entry: PipelineEntry, now = Date.now()): boolean {
  return entry.stage === "qualified" && now - entry.stageSince > STALE_DAYS * DAY;
}

export function fmtStamp(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** "2 days", "4 hours", "just now" - how long something has been sitting. */
export function fmtSince(ms: number, now = Date.now()): string {
  const diff = Math.max(0, now - ms);
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return mins < 1 ? "just now" : `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
