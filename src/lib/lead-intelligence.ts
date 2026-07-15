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

/** Where a lead first reached us. The org connects these channels; every lead
 * carries one so builders can see which platforms actually bring business. */
export type LeadSource =
  | "whatsapp"
  | "website"
  | "voice"
  | "instagram"
  | "facebook"
  | "youtube"
  | "upload";

export interface ScoredLead extends Lead {
  /** The agent template that produced this lead (for cross-linking). */
  templateId: TemplateId;
  agentRole: string;
  /** 0–100, deterministic. */
  score: number;
  tier: Tier;
  status: LeadStatus;
  /** Origin platform (deterministic, design mode). */
  source: LeadSource;
  /** Set when the lead was created by promoting an AI calling outcome. */
  promotedFromAiCall?: boolean;
  /** Epoch ms the lead was promoted (drives the "new leads" banner + sort). */
  promotedAt?: number;
  /** Who is working the lead: the AI agent (default) or a human after take-over. */
  owner?: "ai" | "human";
  /** Epoch ms a human took the lead over. */
  handoffAt?: number;
  /** How the lead reached us, first-touch first (comment to DM to qualified). */
  journey: JourneyStep[];
  /** The score explained: each flow factor and the points it added. Sums to score. */
  scoreBreakdown: ScoreFactor[];
}

/* --------------------------------- tiers ---------------------------------- */

export function tierForScore(score: number): Tier {
  if (score >= 85) return "very-hot";
  if (score >= HOT_THRESHOLD) return "hot"; // 70 = the flow's Hot line
  if (score >= 50) return "warm";
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

/* --------------------------------- sources -------------------------------- */

export const SOURCE_ORDER: LeadSource[] = [
  "whatsapp",
  "website",
  "voice",
  "instagram",
  "facebook",
  "youtube",
  "upload",
];

/** Presentation for each source: label, a chart colour, and the tinted chip
 * classes (same soft-tint pattern as TIER_META). The chart `color` is a single
 * data-viz hue per platform so the donut segments stay distinguishable. */
export const SOURCE_META: Record<
  LeadSource,
  { label: string; short: string; color: string; tintBg: string; tintText: string }
> = {
  whatsapp: { label: "WhatsApp", short: "WhatsApp", color: "#22c55e", tintBg: "bg-green-50", tintText: "text-green-600" },
  website: { label: "Website chat", short: "Website", color: "#2f6bed", tintBg: "bg-blue-50", tintText: "text-blue-600" },
  voice: { label: "AI Voice Call", short: "AI Calling", color: "#7c3aed", tintBg: "bg-violet-50", tintText: "text-violet-600" },
  instagram: { label: "Instagram", short: "Instagram", color: "#ec4899", tintBg: "bg-pink-50", tintText: "text-pink-600" },
  facebook: { label: "Facebook", short: "Facebook", color: "#4f46e5", tintBg: "bg-indigo-50", tintText: "text-indigo-600" },
  youtube: { label: "YouTube", short: "YouTube", color: "#ef4444", tintBg: "bg-red-50", tintText: "text-red-600" },
  upload: { label: "Uploaded list", short: "Uploaded", color: "#64748b", tintBg: "bg-slate-100", tintText: "text-slate-600" },
};

/** Org-wide lead inflow by platform (design mode: stable, realistic volumes so
 * the chart and KPIs read like a live account). `qualified`/`hot` drive the
 * quality view; `trend` is the % change vs the previous period. */
const SOURCE_STATS: Record<LeadSource, { leads: number; qualified: number; hot: number; trend: number }> = {
  whatsapp: { leads: 432, qualified: 168, hot: 96, trend: 18.6 },
  website: { leads: 368, qualified: 132, hot: 74, trend: 12.4 },
  voice: { leads: 342, qualified: 150, hot: 88, trend: 22.1 },
  instagram: { leads: 296, qualified: 84, hot: 52, trend: 31.5 },
  facebook: { leads: 228, qualified: 70, hot: 40, trend: 8.2 },
  youtube: { leads: 184, qualified: 44, hot: 24, trend: -4.1 },
  upload: { leads: 134, qualified: 58, hot: 30, trend: 5.3 },
};

export interface SourceStat {
  source: LeadSource;
  leads: number;
  qualified: number;
  hot: number;
  trend: number;
  /** Fraction of all leads (0–1). */
  share: number;
  /** Fraction of this platform's leads that qualified (0–1). */
  qualifiedRate: number;
}

/** Per-platform breakdown, sorted by volume (largest first). */
export function sourceBreakdown(): SourceStat[] {
  const total = SOURCE_ORDER.reduce((sum, k) => sum + SOURCE_STATS[k].leads, 0);
  return SOURCE_ORDER.map((source) => {
    const st = SOURCE_STATS[source];
    return { source, ...st, share: st.leads / total, qualifiedRate: st.qualified / st.leads };
  }).sort((a, b) => b.leads - a.leads);
}

/** The platform that turns the most of its leads into qualified ones. */
export function bestConvertingSource(): SourceStat {
  return sourceBreakdown().reduce((best, s) => (s.qualifiedRate > best.qualifiedRate ? s : best));
}

/** Headline numbers for the KPI strip, derived from the platform stats. */
export function leadSummary() {
  const total = SOURCE_ORDER.reduce((sum, k) => sum + SOURCE_STATS[k].leads, 0);
  const qualified = SOURCE_ORDER.reduce((sum, k) => sum + SOURCE_STATS[k].qualified, 0);
  const veryHot = SOURCE_ORDER.reduce((sum, k) => sum + SOURCE_STATS[k].hot, 0);
  return {
    total,
    qualified,
    veryHot,
    avgIntent: 78,
    trends: { total: 18.6, qualified: 15.7, veryHot: 12.1, avgIntent: 6 },
  };
}

/* ------------------------------ enrichment -------------------------------- */

/** djb2-style hash → stable pseudo-random, same convention as waveform()/AgentOrb. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/* -------------------------------- scoring --------------------------------- */

export type FactorKey = "budget" | "timeline" | "site-visit" | "callback" | "response" | "intent";

export interface ScoreFactor {
  key: FactorKey;
  label: string;
  points: number;
  met: boolean;
}

/** The lead-scoring factors, straight from the WhatsApp and Meta hot-lead flows.
 * The points and the Hot line are the source of truth: a lead's score is the sum
 * of the factors it meets, capped at 100. Ordered by weight for display. */
export const SCORE_FACTORS: { key: FactorKey; points: number; label: string; hint: string }[] = [
  { key: "budget", points: 30, label: "Budget", hint: "Shared their budget" },
  { key: "timeline", points: 30, label: "Timeline", hint: "Said when they want to move or finalise" },
  { key: "site-visit", points: 25, label: "Site visit", hint: "Agreed to a visit or a booking step" },
  { key: "callback", points: 20, label: "Callback", hint: "Asked us to call back" },
  { key: "response", points: 15, label: "Responded", hint: "Replied and stayed in the conversation" },
  { key: "intent", points: 10, label: "Clear intent", hint: "Showed clear buy or rent intent" },
];

/** The score at which a lead is Hot (from the flows). */
export const HOT_THRESHOLD = 70;

/** Recover the flow's six factors from a lead's captured details, outcome and
 * tone. The bot (or the AI call) is what actually captures these; here we read
 * them off the same fields the transcript surfaces, so the score is explainable. */
export function buildScoreBreakdown(lead: Lead): ScoreFactor[] {
  const text = `${lead.outcome} ${lead.summary}`.toLowerCase();
  const labels = lead.captured.map((c) => c.label.toLowerCase());
  const values = lead.captured.map((c) => c.value.toLowerCase());
  const has = (re: RegExp) => labels.some((l) => re.test(l)) || values.some((v) => re.test(v)) || re.test(text);
  const negative = /out of budget|beyond|below range|not interested|wrong (city|area)/.test(text);

  const met: Record<FactorKey, boolean> = {
    budget: !negative && (has(/budget|rent/) || /₹|crore|lakh|\bcr\b|investor|token/.test(text)),
    timeline: has(/timeline|move[- ]?in|possession|finalise|this (week|month)|next (week|month)|months?/),
    "site-visit": has(/visit|booked|token|routed to sales|connect(?:ed)? (?:you )?to sales/),
    callback: has(/callback|call back|reschedul|call you (?:back|monday|tomorrow)/),
    response: lead.conversations.some((c) => c.transcript.some((t) => t.who === "customer")),
    intent: !negative && (has(/intent|interest|purpose|investment/) || lead.tone === "good" || lead.tone === "warm"),
  };

  return SCORE_FACTORS.map((f) => ({ key: f.key, label: f.label, points: f.points, met: met[f.key] }));
}

/** The score is simply the sum of the met factors, capped at 100. */
export function scoreFromBreakdown(factors: ScoreFactor[]): number {
  return Math.min(100, factors.filter((f) => f.met).reduce((sum, f) => sum + f.points, 0));
}

/** Build a breakdown from a fixed set of met factors (for synthesized leads). */
export function breakdownFromKeys(keys: FactorKey[]): ScoreFactor[] {
  const set = new Set(keys);
  return SCORE_FACTORS.map((f) => ({ key: f.key, label: f.label, points: f.points, met: set.has(f.key) }));
}

/* ---------------------------- capture / journey --------------------------- */

export type CaptureKind =
  | "comment"
  | "story-reply"
  | "dm"
  | "form"
  | "call"
  | "chat"
  | "ad-click"
  | "auto-reply";

export interface JourneyStep {
  channel: LeadSource;
  kind: CaptureKind;
  when: string;
  note: string;
}

/** The standard capture journey for a source. Social starts public (a comment or
 * story), gets an auto-reply, then moves to a 1:1 DM; YouTube funnels out to
 * WhatsApp; voice and website are direct. Mirrors the hot-lead flows. */
function journeyFor(source: LeadSource, ctx: string, when: string): JourneyStep[] {
  switch (source) {
    case "whatsapp":
      return [
        { channel: "whatsapp", kind: "dm", when, note: `Messaged on WhatsApp about ${ctx}` },
        { channel: "whatsapp", kind: "dm", when, note: "Bot captured budget and timeline" },
      ];
    case "instagram":
      return [
        { channel: "instagram", kind: "comment", when, note: `Commented on the ${ctx}` },
        { channel: "instagram", kind: "auto-reply", when, note: "Auto-reply moved the chat to a DM" },
        { channel: "instagram", kind: "dm", when, note: "Qualified in the Instagram DM" },
      ];
    case "facebook":
      return [
        { channel: "facebook", kind: "comment", when, note: `Commented on the ${ctx}` },
        { channel: "facebook", kind: "auto-reply", when, note: "Auto-reply sent a Messenger DM" },
        { channel: "facebook", kind: "dm", when, note: "Qualified in Messenger" },
      ];
    case "youtube":
      return [
        { channel: "youtube", kind: "comment", when, note: `Commented on the ${ctx}` },
        { channel: "youtube", kind: "auto-reply", when, note: "Replied with the WhatsApp link" },
        { channel: "whatsapp", kind: "dm", when, note: "Continued on WhatsApp and qualified" },
      ];
    case "website":
      return [{ channel: "website", kind: "chat", when, note: `Started a website chat about ${ctx}` }];
    case "upload":
      return [{ channel: "upload", kind: "form", when, note: "Imported from an uploaded list" }];
    case "voice":
    default:
      return [{ channel: "voice", kind: "call", when, note: `AI call about ${ctx}` }];
  }
}

/** Curated origin per seed lead (design mode), so the source mix and journeys
 * read like a real account instead of a random hash. Keyed by name; anything not
 * listed falls back to a deterministic source from its channels. */
const LEAD_CAPTURE: Record<string, { source: LeadSource; ctx: string }> = {
  "Aarti Sharma": { source: "whatsapp", ctx: "Baner 3BHK homes" },
  "Karan Singh": { source: "whatsapp", ctx: "amenities post" },
  "Suresh Menon": { source: "whatsapp", ctx: "booking update" },
  "Neha Reddy": { source: "instagram", ctx: "site-visit reel" },
  "Deepak Rao": { source: "instagram", ctx: "project walkthrough reel" },
  "Meena Iyer": { source: "instagram", ctx: "3BHK story" },
  "Imran Khan": { source: "facebook", ctx: "investment offer ad" },
  "Anjali Verma": { source: "facebook", ctx: "project launch post" },
  "Ritu Bansal": { source: "facebook", ctx: "booking post" },
  "Priya Nair": { source: "youtube", ctx: "3BHK tour video" },
  "Faisal Ahmed": { source: "youtube", ctx: "project comparison video" },
  "Vikram Joshi": { source: "voice", ctx: "the project" },
  "Sameer Gupta": { source: "voice", ctx: "the site visit" },
  "Lata Kulkarni": { source: "voice", ctx: "the visit feedback" },
  "Arjun Desai": { source: "voice", ctx: "the payment reminder" },
  "Rohan Mehta": { source: "website", ctx: "Kharadi homes" },
  "Sneha Patil": { source: "website", ctx: "the 2BHK brochure" },
};

/** Origin source + capture journey for a lead (curated, with a safe fallback). */
function captureForLead(lead: Lead): { source: LeadSource; journey: JourneyStep[] } {
  const curated = LEAD_CAPTURE[lead.name];
  const when = lead.when;
  if (curated) return { source: curated.source, journey: journeyFor(curated.source, curated.ctx, when) };
  if (/website|widget/i.test(lead.name)) return { source: "website", journey: journeyFor("website", "the website", when) };
  const source: LeadSource = lead.hasCall && !lead.hasChat ? "voice" : "website";
  return { source, journey: journeyFor(source, "your project", when) };
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
    const scoreBreakdown = buildScoreBreakdown(lead);
    const score = scoreFromBreakdown(scoreBreakdown);
    const { source, journey } = captureForLead(lead);
    return {
      ...lead,
      templateId,
      agentRole: templateById(templateId).role,
      score,
      tier: tierForScore(score),
      status: statusFor(lead),
      source,
      journey,
      scoreBreakdown,
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
  source: LeadSource | "all";
  minScore: number | null;
  maxScore: number | null;
  query: string;
  templateId?: TemplateId | null;
}

export function filterLeads(leads: ScoredLead[], f: LeadFilters): ScoredLead[] {
  return leads.filter((l) => {
    if (f.tab !== "all" && l.status !== f.tab) return false;
    if (f.tier !== "all" && l.tier !== f.tier) return false;
    if (f.source !== "all" && l.source !== f.source) return false;
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

/** How many of the given leads came from each source (for the filter chips). */
export function sourceCounts(leads: ScoredLead[]): Record<LeadSource, number> {
  const counts = Object.fromEntries(SOURCE_ORDER.map((s) => [s, 0])) as Record<LeadSource, number>;
  for (const l of leads) counts[l.source]++;
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
