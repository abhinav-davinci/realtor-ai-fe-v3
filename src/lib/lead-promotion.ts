/**
 * Lead promotion: turn a finished AI-calling run's positive outcomes into leads
 * in Lead Intelligence (design mode, localStorage). A call that reached someone
 * with intent (qualified / interested / callback) becomes a scored lead with a
 * synthesized transcript, so the team can read the conversation and take it over.
 *
 * Lead Intelligence itself is derived from static seed data (lib/conversations
 * + lib/lead-intelligence); this module adds a thin client-side layer of
 * promoted leads merged on top, plus a per-lead "handoff" overlay for the
 * lightweight human take-over. The real backend contract is untouched.
 */
import type { Call, CallOutcome } from "@/components/leads/auto-call-run";
import type { Conversation, ConvTurn, OutcomeTone } from "@/lib/conversations";
import {
  breakdownFromKeys,
  buildScoreBreakdown,
  listScoredLeads,
  scoreFromBreakdown,
  tierForScore,
  type FactorKey,
  type LeadStatus,
  type ScoredLead,
} from "@/lib/lead-intelligence";

/** The call outcomes that earn a place in the pipeline. */
const POSITIVE: CallOutcome[] = ["qualified", "interested", "callback"];
type PositiveOutcome = "qualified" | "interested" | "callback";

const PROMOTED_KEY = "tt_promoted_leads";
const HANDOFF_KEY = "tt_lead_handoffs";
const ACK_KEY = "tt_promoted_ack";

/** Fired after promoted leads or handoffs change, so an open leads page re-reads
 * without subscribing to the auto-call ticking clock. */
export const LEADS_CHANGED_EVENT = "tt-leads-changed";
function notifyLeadsChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(LEADS_CHANGED_EVENT));
}

/* ------------------------------ phone matching ---------------------------- */

/** Last 10 digits — the cross-store identity for a person (contacts normalise to
 * 10 digits, seed leads keep the country code; comparing the tail unifies them). */
function phoneKey(l: { phone?: string; id: string }): string {
  const d = (l.phone ?? "").replace(/\D/g, "");
  return d ? d.slice(-10) : l.id;
}

/* ------------------------------ promoted store ---------------------------- */

/** Backfill fields added after a lead was first stored (design-mode migration),
 * so leads promoted before this version still render the breakdown and journey.
 * When the breakdown is derived (not stored), the score and tier are recomputed
 * from it so the number and the factor chips always agree. */
function migratePromoted(l: ScoredLead): ScoredLead {
  if (l.scoreBreakdown?.length && l.journey?.length) return l;
  const derived = !l.scoreBreakdown?.length;
  const scoreBreakdown = derived ? buildScoreBreakdown(l) : l.scoreBreakdown;
  const score = derived ? scoreFromBreakdown(scoreBreakdown) : l.score;
  const tier = derived ? tierForScore(score) : l.tier;
  const journey =
    l.journey ?? [{ channel: "voice" as const, kind: "call" as const, when: l.when, note: `AI call: ${l.outcome}` }];
  return { ...l, scoreBreakdown, score, tier, journey };
}

export function listPromotedLeads(): ScoredLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROMOTED_KEY);
    const all = raw ? (JSON.parse(raw) as ScoredLead[]) : [];
    // newest first
    return all.map(migratePromoted).sort((a, b) => (b.promotedAt ?? 0) - (a.promotedAt ?? 0));
  } catch {
    return [];
  }
}
function writePromoted(all: ScoredLead[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROMOTED_KEY, JSON.stringify(all));
  } catch {
    /* quota / unavailable: ignore in design mode */
  }
}

/* --------------------------- transcript synthesis ------------------------- */

interface OutcomeShape {
  outcome: string;
  tone: OutcomeTone;
  status: LeadStatus;
  /** The flow factors this outcome meets; the score is their sum. */
  factors: FactorKey[];
  summary: string;
  captured: { label: string; value: string }[];
}

const OUTCOME_SHAPE: Record<PositiveOutcome, OutcomeShape> = {
  qualified: {
    outcome: "Qualified on call",
    tone: "good",
    status: "contacted",
    factors: ["budget", "timeline", "site-visit", "response", "intent"],
    summary: "Qualified on the call: budget and configuration fit, site visit set.",
    captured: [
      { label: "Budget", value: "₹1.8 Cr" },
      { label: "Configuration", value: "3BHK" },
      { label: "Timeline", value: "This weekend" },
      { label: "Next step", value: "Site visit" },
    ],
  },
  interested: {
    outcome: "Interested",
    tone: "good",
    status: "new",
    factors: ["budget", "response", "intent"],
    summary: "Interested after the call, wants pricing and floor plans.",
    captured: [
      { label: "Budget", value: "Around ₹90 L" },
      { label: "Configuration", value: "2BHK" },
      { label: "Intent", value: "Interested" },
    ],
  },
  callback: {
    outcome: "Callback requested",
    tone: "warm",
    status: "retry",
    factors: ["callback", "response", "intent"],
    summary: "Asked for a callback to discuss further, warm intent.",
    captured: [{ label: "Intent", value: "Callback" }],
  },
};

function transcriptFor(first: string, outcome: PositiveOutcome, agent: string): ConvTurn[] {
  if (outcome === "qualified")
    return [
      { who: "agent", text: `Hi ${first}, this is ${agent} calling about our project. Do you have a quick minute?` },
      { who: "customer", text: "Yes, go ahead." },
      { who: "agent", text: "Great. Are you looking at a 2 or 3BHK, and what budget works for you?" },
      { who: "customer", text: "A 3BHK, around 1.8 crore." },
      { who: "agent", text: "That fits our Phase 2 homes well. They're RERA-registered. Shall I block a site visit this weekend?" },
      { who: "customer", text: "Yes, Saturday works." },
      { who: "agent", text: "Done. I'll send the location and details on WhatsApp, and our sales head will confirm shortly." },
    ];
  if (outcome === "interested")
    return [
      { who: "agent", text: `Hi ${first}, ${agent} here from the sales team. Is now a good time to talk about the project?` },
      { who: "customer", text: "Sure, tell me more." },
      { who: "agent", text: "We have 2 and 3BHK homes, RERA-registered, with flexible payment plans. What are you looking for?" },
      { who: "customer", text: "Probably a 2BHK. Can you share the price and floor plan?" },
      { who: "agent", text: "Of course, I'll WhatsApp you the price list and floor plans now. Would you like to visit this week?" },
      { who: "customer", text: "Let me go through the details first, but I'm interested." },
    ];
  return [
    { who: "agent", text: `Hi ${first}, this is ${agent} calling about your enquiry. Is this a good time?` },
    { who: "customer", text: "I'm a bit busy right now." },
    { who: "agent", text: "No problem at all. When would be a better time to call you back?" },
    { who: "customer", text: "Maybe tomorrow evening." },
    { who: "agent", text: "Perfect, I'll call you tomorrow evening and share the project details. Thank you." },
  ];
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function buildConversation(lead: ScoredLead, outcome: PositiveOutcome, agent: string, now: number): Conversation {
  const shape = OUTCOME_SHAPE[outcome];
  const seed = hash(lead.id + outcome);
  const mins = 1 + (seed % 3);
  const secs = 10 + (seed % 50);
  return {
    id: `pl-conv-${phoneKey(lead)}-${now}`,
    channel: "voice",
    customer: lead.name,
    phone: lead.phone,
    when: "Just now",
    meta: `${mins}m ${String(secs).padStart(2, "0")}s`,
    outcome: shape.outcome,
    tone: shape.tone,
    summary: shape.summary,
    captured: shape.captured,
    transcript: transcriptFor(lead.name.split(/\s+/)[0], outcome, agent),
  };
}

/* ----------------------------- promote a run ------------------------------ */

export interface PromotionResult {
  /** How many leads were created or refreshed. */
  added: number;
  leads: ScoredLead[];
}

/** Build leads from a finished run's positive-outcome calls and merge them into
 * the promoted store (upsert by phone, so re-calling someone updates, never
 * duplicates). `agentName` voices the synthesized transcript. */
export function promoteCallsToLeads(calls: Call[], agentName: string): PromotionResult {
  const winners = calls.filter((c) => c.answered && POSITIVE.includes(c.outcome));
  if (winners.length === 0) return { added: 0, leads: [] };

  const now = Date.now();
  const store = listPromotedLeads();
  const byId = new Map(store.map((l) => [l.id, l] as const));
  const made: ScoredLead[] = [];

  winners.forEach((call, i) => {
    const outcome = call.outcome as PositiveOutcome;
    const shape = OUTCOME_SHAPE[outcome];
    const base = call.lead;
    const id = `pl-${phoneKey(base)}`;
    const conv = buildConversation(base, outcome, agentName, now + i);
    const scoreBreakdown = breakdownFromKeys(shape.factors);
    const score = scoreFromBreakdown(scoreBreakdown);
    const lead: ScoredLead = {
      id,
      name: base.name,
      phone: base.phone,
      conversations: [conv],
      hasCall: true,
      hasChat: false,
      when: "Just now",
      outcome: shape.outcome,
      tone: shape.tone,
      summary: shape.summary,
      captured: shape.captured,
      templateId: base.templateId,
      agentRole: agentName,
      score,
      tier: tierForScore(score),
      status: shape.status,
      source: "voice",
      promotedFromAiCall: true,
      promotedAt: now + i,
      journey: [{ channel: "voice", kind: "call", when: "Just now", note: `AI call: ${shape.outcome}` }],
      scoreBreakdown,
    };
    byId.set(id, lead);
    made.push(lead);
  });

  writePromoted([...byId.values()]);
  notifyLeadsChanged();
  return { added: made.length, leads: made };
}

/** How many positive-outcome calls a run would promote (for the completion CTA). */
export function promotableCount(calls: Call[]): number {
  return calls.filter((c) => c.answered && POSITIVE.includes(c.outcome)).length;
}

/* ------------------------------ handoff overlay --------------------------- */

interface Handoff {
  owner: "human";
  at: number;
}
function readHandoffs(): Record<string, Handoff> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(HANDOFF_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Handoff>) : {};
  } catch {
    return {};
  }
}
/** Assign a lead to a human (lightweight take-over): flips owner + status. */
export function takeOverLead(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const all = readHandoffs();
    all[id] = { owner: "human", at: Date.now() };
    localStorage.setItem(HANDOFF_KEY, JSON.stringify(all));
    notifyLeadsChanged();
  } catch {
    /* ignore */
  }
}
export function isHandedOff(id: string): boolean {
  return !!readHandoffs()[id];
}

function applyHandoff(l: ScoredLead, overlay: Record<string, Handoff>): ScoredLead {
  const h = overlay[l.id];
  return h ? { ...l, owner: "human", handoffAt: h.at, status: "contacted" } : l;
}

/* ------------------------------- merged read ------------------------------ */

/** Every lead for the table: promoted (newest first) on top of the seeded set,
 * deduped by phone, with the handoff overlay applied. Client-only (localStorage)
 * so callers load it in an effect, not during render. */
export function listAllScoredLeads(): ScoredLead[] {
  const promoted = listPromotedLeads();
  const overlay = readHandoffs();
  const seen = new Set(promoted.map(phoneKey));
  const statics = listScoredLeads().filter((l) => !seen.has(phoneKey(l)));
  return [...promoted, ...statics].map((l) => applyHandoff(l, overlay));
}

/* --------------------------- "new leads" banner --------------------------- */

/** Promoted leads the user hasn't acknowledged on the Lead Intelligence page. */
export function unseenPromotedCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const ack = Number(localStorage.getItem(ACK_KEY) ?? 0);
    return listPromotedLeads().filter((l) => (l.promotedAt ?? 0) > ack).length;
  } catch {
    return 0;
  }
}
export function acknowledgePromoted(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACK_KEY, String(Date.now()));
    notifyLeadsChanged();
  } catch {
    /* ignore */
  }
}
