/**
 * Pure model for a live auto-call run (no React, no JSX). The run is a set of
 * calls, each with a fixed weighted-random outcome chosen up front; the whole
 * timeline is derived from a single `elapsed` clock so it can be paused,
 * stopped, and resumed deterministically. Shared by the context/provider (which
 * owns the clock), the modal, and the floating tracker.
 */
import type { ScoredLead } from "@/lib/lead-intelligence";

export type CallState = "queued" | "dialing" | "ringing" | "connected" | "done";
export type CallOutcome =
  | "qualified"
  | "interested"
  | "callback"
  | "not-interested"
  | "no-answer"
  | "voicemail"
  | "busy";

export interface Call {
  key: string;
  lead: ScoredLead;
  startOffset: number;
  ring: number;
  talk: number;
  answered: boolean;
  outcome: CallOutcome;
}

export const TICK = 100;
const STAGGER = 1100;
const DIAL_MS = 600;

function weighted<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of items) if ((r -= w) <= 0) return v;
  return items[0][0];
}

export function buildCalls(leads: ScoredLead[]): Call[] {
  return leads.map((lead, i) => {
    const answered = Math.random() < 0.62;
    const outcome: CallOutcome = answered
      ? weighted<CallOutcome>([["qualified", 30], ["interested", 30], ["callback", 20], ["not-interested", 20]])
      : weighted<CallOutcome>([["no-answer", 55], ["voicemail", 30], ["busy", 15]]);
    return {
      key: `${lead.id}-${i}`,
      lead,
      startOffset: i * STAGGER,
      ring: 800 + Math.floor(Math.random() * 900),
      talk: answered ? 1500 + Math.floor(Math.random() * 2200) : 0,
      answered,
      outcome,
    };
  });
}

export function callState(c: Call, elapsed: number): CallState {
  const local = elapsed - c.startOffset;
  if (local < 0) return "queued";
  if (local < DIAL_MS) return "dialing";
  if (local < DIAL_MS + c.ring) return "ringing";
  if (c.answered && local < DIAL_MS + c.ring + c.talk) return "connected";
  return "done";
}

export const callEnd = (c: Call) => c.startOffset + DIAL_MS + c.ring + c.talk;
export const runDuration = (calls: Call[]) => calls.reduce((m, c) => Math.max(m, callEnd(c)), 0);

export interface RunCounts {
  total: number;
  dialled: number;
  connected: number;
  missed: number;
  active: number;
  qualified: number;
  resolved: number;
  rate: number | null;
}

export function summarize(calls: Call[], elapsed: number): RunCounts {
  const states = calls.map((c) => callState(c, elapsed));
  const connected = states.filter((s, i) => s === "connected" || (s === "done" && calls[i].answered)).length;
  const missed = calls.filter((c, i) => states[i] === "done" && !c.answered).length;
  const active = states.filter((s) => s === "dialing" || s === "ringing").length;
  const dialled = connected + missed + active;
  const qualified = calls.filter((c, i) => states[i] === "done" && c.outcome === "qualified").length;
  const resolved = states.filter((s) => s === "done").length;
  const rate = resolved > 0 ? Math.round((connected / Math.max(connected + missed, 1)) * 100) : null;
  return { total: calls.length, dialled, connected, missed, active, qualified, resolved, rate };
}
