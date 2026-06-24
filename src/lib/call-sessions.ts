/**
 * Call sessions: a persisted log of every finished AI calling run (design mode,
 * localStorage). The run engine itself is ephemeral, so AutoCallProvider records
 * a CallSession here on completion (both Lead-Intelligence auto-calls and
 * Contacts campaigns). Each session is a self-contained snapshot — per-call
 * names/outcomes are copied in, so it survives later contact/list edits.
 *
 * Credits are a mock: demo call durations are compressed for the animation, so
 * we synthesize a believable per-connected-call duration (deterministic) and
 * bill per connected minute plus a small dial fee.
 */
import { callState, type Call, type CallOutcome } from "@/components/leads/auto-call-run";
import type { LeadSource, Tier } from "@/lib/lead-intelligence";

export type SourceKind = "list" | "tier" | "upload" | "lead-filter" | "selected";
export type RunKind = "leads" | "contacts";
export type SessionStatus = "completed" | "stopped";

export interface OutcomeCounts {
  qualified: number;
  interested: number;
  callback: number;
  notInterested: number;
  noAnswer: number;
  voicemail: number;
  busy: number;
}

export interface SessionCall {
  name: string;
  phone: string;
  tier: Tier;
  source: LeadSource;
  /** True only when the call fully connected (talked). */
  answered: boolean;
  outcome: CallOutcome;
  /** False = the call never ran (queued when the run ended) → "Not called". */
  ran: boolean;
  durationSec: number;
  creditsUsed: number;
}

export interface CallSession {
  id: string;
  name: string;
  kind: RunKind;
  sourceKind: SourceKind;
  sourceLabel: string;
  agentName: string;
  agentGradient: [string, string];
  startedAt: number;
  durationMs: number;
  status: SessionStatus;
  total: number;
  /** Calls that actually ran (denominator for connect rate). */
  dialled: number;
  connected: number;
  missed: number;
  notCalled: number;
  counts: OutcomeCounts;
  creditsUsed: number;
  talkSec: number;
  calls: SessionCall[];
}

/* -------------------------------- credits --------------------------------- */

export const CREDITS_PER_MINUTE = 4;
export const DIAL_ATTEMPT_COST = 1;
const DEFAULT_ALLOWANCE = 5000;

/** djb2-ish hash → stable pseudo-randomness (same idiom as lead-promotion). */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
/** Integer finalizer (murmur-style) — decorrelates sequential seeds, so keys like
 * "name-0".."name-9" don't produce consecutive values. */
function mix(x: number): number {
  let h = x >>> 0;
  h ^= h >>> 16;
  h = (h * 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = (h * 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/** Believable talk length for a connected call: 60–360s, stable across reloads. */
function durationSecFor(key: string): number {
  return 60 + (mix(hash(key)) % 301);
}
function creditsForConnected(durationSec: number): number {
  return Math.ceil(durationSec / 60) * CREDITS_PER_MINUTE;
}

/* --------------------------------- store ---------------------------------- */

const SESSIONS_KEY = "tt_call_sessions";
const SEEDED_KEY = "tt_call_sessions_seeded";
const ALLOWANCE_KEY = "tt_call_credits_allowance";
const MAX_SESSIONS = 50;
const MAX_CALLS = 200;

export const CALL_SESSIONS_CHANGED_EVENT = "tt-call-sessions-changed";
export function notifyCallSessionsChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CALL_SESSIONS_CHANGED_EVENT));
}

export function listCallSessions(): CallSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    const all = raw ? (JSON.parse(raw) as CallSession[]) : [];
    return all.sort((a, b) => b.startedAt - a.startedAt);
  } catch {
    return [];
  }
}
export function getCallSession(id: string): CallSession | null {
  return listCallSessions().find((s) => s.id === id) ?? null;
}
function writeSessions(all: CallSession[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = all
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, MAX_SESSIONS)
      .map((s) => (s.calls.length > MAX_CALLS ? { ...s, calls: s.calls.slice(0, MAX_CALLS) } : s));
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota / unavailable: ignore in design mode */
  }
}
export function deleteCallSession(id: string): void {
  writeSessions(listCallSessions().filter((s) => s.id !== id));
  notifyCallSessionsChanged();
}

/* ------------------------------- aggregation ------------------------------ */

const EMPTY_COUNTS = (): OutcomeCounts => ({
  qualified: 0,
  interested: 0,
  callback: 0,
  notInterested: 0,
  noAnswer: 0,
  voicemail: 0,
  busy: 0,
});

const OUTCOME_KEY: Record<CallOutcome, keyof OutcomeCounts> = {
  qualified: "qualified",
  interested: "interested",
  callback: "callback",
  "not-interested": "notInterested",
  "no-answer": "noAnswer",
  voicemail: "voicemail",
  busy: "busy",
};

interface Aggregate {
  total: number;
  dialled: number;
  connected: number;
  missed: number;
  notCalled: number;
  counts: OutcomeCounts;
  creditsUsed: number;
  talkSec: number;
}

function aggregate(calls: SessionCall[]): Aggregate {
  const counts = EMPTY_COUNTS();
  let dialled = 0;
  let connected = 0;
  let creditsUsed = 0;
  let talkSec = 0;
  for (const c of calls) {
    creditsUsed += c.creditsUsed;
    if (!c.ran) continue;
    dialled++;
    if (c.answered) {
      connected++;
      talkSec += c.durationSec;
    }
    counts[OUTCOME_KEY[c.outcome]]++;
  }
  return {
    total: calls.length,
    dialled,
    connected,
    missed: dialled - connected,
    notCalled: calls.length - dialled,
    counts,
    creditsUsed,
    talkSec,
  };
}

/* --------------------------- record a finished run ------------------------ */

export interface RecordArgs {
  calls: Call[];
  elapsedMs: number;
  stopped: boolean;
  startedAt: number;
  kind: RunKind;
  sessionName?: string;
  sourceLabel?: string;
  sourceKind?: SourceKind;
  agentName: string;
  agentGradient: [string, string];
}

function callToSession(c: Call, elapsedMs: number): SessionCall {
  const state = callState(c, elapsedMs);
  const ran = state !== "queued";
  const connected = state === "done" && c.answered;
  // Only fully-connected calls count as answered; a dial cut off mid-ring (or a
  // done-unanswered call) is a missed attempt.
  const outcome: CallOutcome = state === "done" ? c.outcome : "no-answer";
  const durationSec = connected ? durationSecFor(c.key) : 0;
  const creditsUsed = !ran ? 0 : connected ? creditsForConnected(durationSec) : DIAL_ATTEMPT_COST;
  return {
    name: c.lead.name,
    phone: c.lead.phone ?? "",
    tier: c.lead.tier,
    source: c.lead.source,
    answered: connected,
    outcome,
    ran,
    durationSec,
    creditsUsed,
  };
}

export function recordSession(args: RecordArgs): CallSession {
  const calls = args.calls.map((c) => callToSession(c, args.elapsedMs));
  const agg = aggregate(calls);
  const date = new Date(args.startedAt);
  const session: CallSession = {
    id: `cs-${args.startedAt}-${(hash(String(args.startedAt)) % 9000) + 1000}`,
    name: args.sessionName?.trim() || `${args.kind === "leads" ? "Auto-call leads" : "AI calling"} · ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    kind: args.kind,
    sourceKind: args.sourceKind ?? (args.kind === "leads" ? "lead-filter" : "list"),
    sourceLabel: args.sourceLabel?.trim() || (args.kind === "leads" ? "Lead filters" : "Contacts"),
    agentName: args.agentName,
    agentGradient: args.agentGradient,
    startedAt: args.startedAt,
    durationMs: args.elapsedMs,
    status: args.stopped ? "stopped" : "completed",
    ...agg,
    calls,
  };
  const all = listCallSessions().filter((s) => s.id !== session.id);
  writeSessions([session, ...all]);
  notifyCallSessionsChanged();
  return session;
}

/* --------------------------------- credits -------------------------------- */

export interface CreditsSummary {
  used: number;
  allowance: number;
  remaining: number;
}
function readAllowance(): number {
  if (typeof window === "undefined") return DEFAULT_ALLOWANCE;
  try {
    const raw = localStorage.getItem(ALLOWANCE_KEY);
    return raw ? Number(raw) : DEFAULT_ALLOWANCE;
  } catch {
    return DEFAULT_ALLOWANCE;
  }
}
export function creditsSummary(): CreditsSummary {
  const allowance = readAllowance();
  const used = listCallSessions().reduce((s, x) => s + x.creditsUsed, 0);
  return { used, allowance, remaining: Math.max(0, allowance - used) };
}
export function formatCredits(n: number): string {
  return n.toLocaleString("en-IN");
}

/* ------------------------------- formatting ------------------------------- */

export function relativeTime(ms: number, now: number): string {
  const diff = now - ms;
  const min = Math.round(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day} days ago`;
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
export function fmtDateTime(ms: number): string {
  return new Date(ms).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
export function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

/* ----------------------------------- seed --------------------------------- */

const DAY = 86_400_000;
const SEED_NAMES = [
  "Aarti Sharma", "Rohit Jadhav", "Imran Khan", "Priya Nair", "Sneha Patil", "Karan Singh",
  "Meena Iyer", "Vikram Joshi", "Neha Reddy", "Sameer Gupta", "Anjali Verma", "Deepak Rao",
  "Lata Kulkarni", "Faisal Ahmed", "Ritu Bansal", "Arjun Desai", "Nikhil Rao", "Divya Shah",
  "Manish Gupta", "Farah Khan", "Sanjay Kapoor", "Pooja Mehta", "Rahul Verma", "Kiran Rao",
  "Tara Singh",
];
const SEED_TIERS: Tier[] = ["very-hot", "hot", "warm", "light", "casual"];
const SEED_SOURCES: LeadSource[] = ["whatsapp", "website", "voice", "instagram", "facebook"];

const ANSWERED_OUTCOMES: CallOutcome[] = ["qualified", "interested", "callback", "not-interested"];
const MISSED_OUTCOMES: CallOutcome[] = ["no-answer", "voicemail", "busy"];

interface SeedSpec {
  name: string;
  kind: RunKind;
  sourceKind: SourceKind;
  sourceLabel: string;
  agentName: string;
  agentGradient: [string, string];
  daysAgo: number;
  total: number;
  dialled: number; // ≤ total; total-dialled = "not called"
  connectRate: number; // 0..1 among dialled
}

function seedCalls(spec: SeedSpec): SessionCall[] {
  const out: SessionCall[] = [];
  for (let i = 0; i < spec.total; i++) {
    const seed = hash(`${spec.name}|${i}`);
    const tier = SEED_TIERS[mix(seed) % SEED_TIERS.length];
    const source = SEED_SOURCES[mix(seed ^ 0x9e3779b9) % SEED_SOURCES.length];
    const name = SEED_NAMES[mix(seed ^ 0x1234567) % SEED_NAMES.length];
    const p10 = String(9000000000 + (mix(seed ^ 0x00abcdef) % 999999999));
    const phone = `+91 ${p10.slice(0, 5)} ${p10.slice(5, 10)}`;
    const base = { name, phone, tier, source };
    if (i >= spec.dialled) {
      out.push({ ...base, answered: false, outcome: "no-answer", ran: false, durationSec: 0, creditsUsed: 0 });
      continue;
    }
    const connected = (mix(seed ^ 0x55aa55aa) % 1000) / 1000 < spec.connectRate;
    if (connected) {
      const outcome = ANSWERED_OUTCOMES[mix(seed ^ 0x33333333) % ANSWERED_OUTCOMES.length];
      const durationSec = durationSecFor(`${spec.name}|${i}`);
      out.push({ ...base, answered: true, outcome, ran: true, durationSec, creditsUsed: creditsForConnected(durationSec) });
    } else {
      const outcome = MISSED_OUTCOMES[mix(seed ^ 0x33333333) % MISSED_OUTCOMES.length];
      out.push({ ...base, answered: false, outcome, ran: true, durationSec: 0, creditsUsed: DIAL_ATTEMPT_COST });
    }
  }
  return out;
}

function seedSession(spec: SeedSpec, now: number): CallSession {
  const calls = seedCalls(spec);
  const agg = aggregate(calls);
  const startedAt = now - spec.daysAgo * DAY;
  return {
    id: `cs-seed-${spec.daysAgo}-${hash(spec.name) % 9999}`,
    name: spec.name,
    kind: spec.kind,
    sourceKind: spec.sourceKind,
    sourceLabel: spec.sourceLabel,
    agentName: spec.agentName,
    agentGradient: spec.agentGradient,
    startedAt,
    durationMs: spec.dialled * 9000,
    status: spec.dialled < spec.total ? "stopped" : "completed",
    ...agg,
    calls,
  };
}

const PRIYA: [string, string] = ["#ef8e2b", "#e23b58"];
const AARAV: [string, string] = ["#2f6bed", "#16b8c4"];

const SEED_SPECS: SeedSpec[] = [
  { name: "Hot buyers nurture", kind: "contacts", sourceKind: "list", sourceLabel: "Hot buyers", agentName: "Priya", agentGradient: PRIYA, daysAgo: 2, total: 18, dialled: 18, connectRate: 0.66 },
  { name: "Auto-call · Hot+ leads", kind: "leads", sourceKind: "lead-filter", sourceLabel: "Hot+ · New leads", agentName: "Priya", agentGradient: PRIYA, daysAgo: 4, total: 10, dialled: 10, connectRate: 0.6 },
  { name: "Diwali outreach", kind: "contacts", sourceKind: "upload", sourceLabel: "Diwali outreach", agentName: "Aarav", agentGradient: AARAV, daysAgo: 6, total: 25, dialled: 9, connectRate: 0.55 },
  { name: "Re-engage cold contacts", kind: "contacts", sourceKind: "tier", sourceLabel: "Casual, Light", agentName: "Aarav", agentGradient: AARAV, daysAgo: 9, total: 12, dialled: 12, connectRate: 0.25 },
];

export function seedCallSessionsIfNeeded(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(SEEDED_KEY)) return;
    const now = Date.now();
    const sessions = SEED_SPECS.map((s) => seedSession(s, now));
    writeSessions([...listCallSessions(), ...sessions]);
    if (!localStorage.getItem(ALLOWANCE_KEY)) localStorage.setItem(ALLOWANCE_KEY, String(DEFAULT_ALLOWANCE));
    localStorage.setItem(SEEDED_KEY, "1");
  } catch {
    /* ignore */
  }
}
