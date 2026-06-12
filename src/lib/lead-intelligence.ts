/**
 * Lead Intelligence: the org-wide rollup of every lead the AI agents have
 * captured, enriched with a score, tier, lifecycle status, and category. Built
 * on top of the per-template conversation data in lib/conversations.ts (design
 * mode, no backend). Scores are deterministic (hash-derived, no Math.random) so
 * the list is stable across renders and reloads.
 */
import {
  ALL_TEMPLATE_IDS,
  conversationsFor,
  leadsFromConversations,
  matchesQuery,
  type Lead,
} from "@/lib/conversations";
import { templateById, type TemplateId } from "@/lib/agents";

export type Tier = "hot" | "warm" | "light" | "casual";
export type LeadStatus = "new" | "contacted" | "retry" | "unreachable";
export type LeadCategory = "Buyer" | "Investor" | "Tenant" | "Site visit" | "Payment" | "General";

export interface ScoredLead extends Lead {
  /** The agent template that produced this lead (for category + cross-linking). */
  templateId: TemplateId;
  agentRole: string;
  /** 0–100, deterministic. */
  score: number;
  tier: Tier;
  status: LeadStatus;
  category: LeadCategory;
}

/* --------------------------------- tiers ---------------------------------- */

export function tierForScore(score: number): Tier {
  if (score >= 60) return "hot";
  if (score >= 50) return "warm";
  if (score >= 35) return "light";
  return "casual";
}

/** Single source of truth for tier presentation (label + token classes), so the
 * tier badge and the score number always agree. */
export const TIER_META: Record<Tier, { label: string; badge: string; score: string }> = {
  hot: { label: "HOT", badge: "bg-red-50 text-red-500", score: "text-red-500" },
  warm: { label: "WARM", badge: "bg-brand-orange/10 text-brand-orange", score: "text-brand-orange" },
  light: { label: "LIGHT", badge: "bg-accent-blue/10 text-accent-blue", score: "text-accent-blue" },
  casual: { label: "CASUAL", badge: "bg-black/[0.05] text-ink-muted", score: "text-ink-muted" },
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

const CATEGORY_BY_TEMPLATE: Record<TemplateId, LeadCategory> = {
  "lead-qualifier": "Buyer",
  receptionist: "General",
  "site-visit": "Site visit",
  feedback: "Buyer",
  payment: "Payment",
  custom: "General",
};

function categoryFor(lead: Lead, templateId: TemplateId): LeadCategory {
  const invests = lead.captured.some((c) => /invest/i.test(c.value));
  if (invests) return "Investor";
  return CATEGORY_BY_TEMPLATE[templateId] ?? "General";
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
      category: categoryFor(lead, templateId),
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
  category: LeadCategory | "all";
  channel: ChannelFilter;
  minScore: number | null;
  maxScore: number | null;
  query: string;
  templateId?: TemplateId | null;
}

export function filterLeads(leads: ScoredLead[], f: LeadFilters): ScoredLead[] {
  return leads.filter((l) => {
    if (f.tab !== "all" && l.status !== f.tab) return false;
    if (f.category !== "all" && l.category !== f.category) return false;
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

export function leadCategories(leads: ScoredLead[]): LeadCategory[] {
  const set = new Set<LeadCategory>();
  for (const l of leads) set.add(l.category);
  return [...set];
}

export function intelligenceStats(leads: ScoredLead[]) {
  return {
    total: leads.length,
    hot: leads.filter((l) => l.tier === "hot").length,
    fresh: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
  };
}
