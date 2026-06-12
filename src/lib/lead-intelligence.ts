/**
 * Lead Intelligence: the org-wide rollup of every lead the AI agents have
 * captured, enriched with a score, a temperature tier, and a lifecycle status.
 * Built on top of the per-template conversation data in lib/conversations.ts
 * (design mode, no backend). Scores are deterministic (hash-derived, no
 * Math.random) so the list is stable across renders and reloads.
 */
import {
  ALL_TEMPLATE_IDS,
  conversationsFor,
  leadsFromConversations,
  matchesQuery,
  type Lead,
} from "@/lib/conversations";
import { templateById, type TemplateId } from "@/lib/agents";

export type Tier = "very-hot" | "hot" | "warm" | "light" | "casual";
export type LeadStatus = "new" | "contacted" | "retry" | "unreachable";

export interface ScoredLead extends Lead {
  /** The agent template that produced this lead (for cross-linking). */
  templateId: TemplateId;
  agentRole: string;
  /** 0–100, deterministic. */
  score: number;
  tier: Tier;
  status: LeadStatus;
}

/* --------------------------------- tiers ---------------------------------- */

export function tierForScore(score: number): Tier {
  if (score >= 80) return "very-hot";
  if (score >= 60) return "hot";
  if (score >= 45) return "warm";
  if (score >= 30) return "light";
  return "casual";
}

export const TIER_ORDER: Tier[] = ["very-hot", "hot", "warm", "light", "casual"];

/** Single source of truth for tier presentation: a temperature ramp (red →
 * coral → amber → blue → grey). `name` is title-case; the badge renders it
 * uppercase. Score number and badge share the tint so they always agree. */
export const TIER_META: Record<Tier, { name: string; badge: string; score: string; dot: string }> = {
  "very-hot": { name: "Very Hot", badge: "bg-red-50 text-red-600", score: "text-red-600", dot: "bg-red-500" },
  hot: { name: "Hot", badge: "bg-orange-50 text-orange-600", score: "text-orange-600", dot: "bg-orange-500" },
  warm: { name: "Warm", badge: "bg-brand-orange/10 text-brand-orange", score: "text-brand-orange", dot: "bg-brand-orange" },
  light: { name: "Light", badge: "bg-accent-blue/10 text-accent-blue", score: "text-accent-blue", dot: "bg-accent-blue" },
  casual: { name: "Casual", badge: "bg-black/[0.05] text-ink-muted", score: "text-ink-muted", dot: "bg-ink-muted/40" },
};

/* ------------------------------ enrichment -------------------------------- */

/** djb2-style hash → stable pseudo-random, same convention as waveform()/AgentOrb. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Stable 0–100 score nudged by real signals so the list looks intentional. */
function scoreFor(lead: Lead): number {
  let s = 20 + (hash(lead.id) % 60); // 20..79 base spread
  if (lead.tone === "good") s += 18;
  else if (lead.tone === "warm") s += 8;
  else if (lead.tone === "cold") s -= 10;
  if (lead.hasCall && lead.hasChat) s += 6; // engaged on both channels
  s += Math.min(lead.captured.length, 4) * 2; // qualification detail
  return Math.max(0, Math.min(100, s));
}

/** Lifecycle status from the outcome text (with a hash split for the remainder). */
function statusFor(lead: Lead): LeadStatus {
  const o = lead.outcome.toLowerCase();
  if (/no answer|unreachable|out of budget/.test(o)) return "unreachable";
  if (/booked|confirmed|routed|hot lead|qualified|captured/.test(o)) return "contacted";
  if (/callback|reschedul|pending|needs time|docs|objection/.test(o)) return "retry";
  return hash(lead.id) % 3 === 0 ? "retry" : "new";
}

/* ------------------------------ aggregation ------------------------------- */

/** Every lead across every agent template, scored and classified. */
export function listScoredLeads(): ScoredLead[] {
  // Tag each conversation with its template and namespace its id, so two
  // unrelated solo leads that both use id "c1" don't merge across templates.
  const tagged = ALL_TEMPLATE_IDS.flatMap((tid) =>
    conversationsFor(tid).map((c) => ({ tid, conv: { ...c, id: `${tid}:${c.id}` } }))
  );
  const tidByConvId = new Map(tagged.map((t) => [t.conv.id, t.tid]));
  const leads = leadsFromConversations(tagged.map((t) => t.conv));

  return leads.map((lead) => {
    const templateId = tidByConvId.get(lead.conversations[0].id) ?? "custom";
    const score = scoreFor(lead);
    return {
      ...lead,
      templateId,
      agentRole: templateById(templateId).role,
      score,
      tier: tierForScore(score),
      status: statusFor(lead),
    };
  });
}

/* ------------------------------- filtering -------------------------------- */

export const LIFECYCLE_TABS = ["all", "new", "contacted", "retry", "unreachable"] as const;
export type LifecycleTab = (typeof LIFECYCLE_TABS)[number];

export const LIFECYCLE_LABEL: Record<LifecycleTab, string> = {
  all: "All",
  new: "New",
  contacted: "Contacted",
  retry: "Retry",
  unreachable: "Unreachable",
};

export type ChannelFilter = "both" | "calls" | "chats";

export interface LeadFilters {
  tab: LifecycleTab;
  tier: Tier | "all";
  channel: ChannelFilter;
  minScore: number | null;
  maxScore: number | null;
  query: string;
  templateId?: TemplateId | null;
}

export function filterLeads(leads: ScoredLead[], f: LeadFilters): ScoredLead[] {
  return leads.filter((l) => {
    if (f.tab !== "all" && l.status !== f.tab) return false;
    if (f.tier !== "all" && l.tier !== f.tier) return false;
    if (f.channel === "calls" && !l.hasCall) return false;
    if (f.channel === "chats" && !l.hasChat) return false;
    if (f.minScore != null && l.score < f.minScore) return false;
    if (f.maxScore != null && l.score > f.maxScore) return false;
    if (f.templateId && l.templateId !== f.templateId) return false;
    return matchesQuery(l, f.query);
  });
}

export function tabCounts(leads: ScoredLead[]): Record<LifecycleTab, number> {
  const counts: Record<LifecycleTab, number> = { all: leads.length, new: 0, contacted: 0, retry: 0, unreachable: 0 };
  for (const l of leads) counts[l.status]++;
  return counts;
}

export function intelligenceStats(leads: ScoredLead[]) {
  return {
    total: leads.length,
    hot: leads.filter((l) => l.tier === "very-hot" || l.tier === "hot").length,
    fresh: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
  };
}
