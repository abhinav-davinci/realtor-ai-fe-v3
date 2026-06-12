/**
 * AI Team. Agent templates, voice catalog, and a tiny localStorage store for
 * agents the user has built. Entirely client-side (design mode, no backend),
 * mirroring the pattern in lib/bulk-upload.ts.
 */
import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  Crown,
  MessageSquareHeart,
  PhoneCall,
  Sparkles,
  Wallet,
  Wand2,
} from "lucide-react";

export type Channel = "voice" | "chat";

export type TemplateId =
  | "lead-qualifier"
  | "receptionist"
  | "site-visit"
  | "feedback"
  | "payment"
  | "custom";

/* ------------------------------ voice catalog ----------------------------- */

export interface VoiceOption {
  id: string;
  name: string;
  gender: "female" | "male";
  tagline: string;
  langs: string[];
  /** hex used for the orb gradient + chips */
  color: string;
}

export const VOICES: VoiceOption[] = [
  { id: "priya", name: "Priya", gender: "female", tagline: "Warm & reassuring", langs: ["English", "Hindi"], color: "#ef8e2b" },
  { id: "aarav", name: "Aarav", gender: "male", tagline: "Calm & professional", langs: ["English", "Hindi"], color: "#2f6bed" },
  { id: "meera", name: "Meera", gender: "female", tagline: "Friendly & upbeat", langs: ["English", "Hindi", "Marathi"], color: "#1c9e57" },
  { id: "kabir", name: "Kabir", gender: "male", tagline: "Composed & empathetic", langs: ["English", "Hindi"], color: "#6d3bf5" },
  { id: "saanvi", name: "Saanvi", gender: "female", tagline: "Clear & precise", langs: ["English", "Hindi"], color: "#16b8c4" },
  { id: "rohan", name: "Rohan", gender: "male", tagline: "Energetic & persuasive", langs: ["English", "Hinglish"], color: "#e23b58" },
];

export const voiceById = (id: string) => VOICES.find((v) => v.id === id) ?? VOICES[0];

/* -------------------------- options for the builder ----------------------- */

export const LANGUAGES = ["English", "Hindi", "Hinglish", "Marathi", "Tamil", "Telugu", "Bengali", "Gujarati", "Kannada"];

export const TONES = ["Warm", "Professional", "Friendly", "Energetic", "Concise", "Empathetic", "Persuasive"];

/** Lead fields an agent can be told to capture during a conversation. */
export const LEAD_FIELDS = [
  "Budget",
  "Preferred location",
  "Configuration (BHK)",
  "Purpose (end-use / investment)",
  "Possession timeline",
  "Home-loan requirement",
  "Move-in date",
  "Preferred call-back time",
];

/** Guardrails. Toggleable rules that keep the agent on-brand and compliant. */
export const GUARDRAILS = [
  "Never quote a final closing price, share the price band only",
  "Always mention the project is RERA-registered when asked",
  "Don't promise discounts or freebies",
  "Politely deflect questions about competitor projects",
  "Hand off to a human for legal or payment disputes",
];

/** A single FAQ the agent can answer: the question buyers ask and the answer. */
export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Common real-estate questions, with a starter answer to edit. Tapping one adds
 * it to the agent's FAQs so users don't start from a blank box.
 */
export const FAQ_SUGGESTIONS: FaqItem[] = [
  { q: "Is the project RERA-registered?", a: "Yes, our project is RERA-registered. I can share the registration number and approved plan." },
  { q: "When is possession?", a: "Possession is expected by [month and year]. Please update this for your project." },
  { q: "Do you help with home loans?", a: "Yes, we have tie-ups with leading banks for up to 90% financing and can help check your eligibility." },
  { q: "What amenities are included?", a: "The project includes [clubhouse, gym, pool, landscaped gardens, and 24x7 security]. Please update this list." },
  { q: "Is there a maintenance charge?", a: "Yes, a monthly maintenance charge applies. Please add the per sq ft rate for your project." },
  { q: "What configurations are available?", a: "We have [2 and 3BHK] homes. Please update the configurations and sizes for your project." },
  { q: "What is the price range?", a: "Homes range from [price band]. I share the band, not a final closing price." },
  { q: "Are there any ongoing offers?", a: "Please add your current offer here, or leave this for the sales team to discuss." },
];

/* ------------------------------- templates -------------------------------- */

export interface AgentTemplate {
  id: TemplateId;
  name: string;
  role: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** two-stop gradient for the orb / card accent */
  gradient: [string, string];
  handles: string[];
  greeting: string;
  collects: string[];
  channels: Channel[];
  voiceId: string;
  tone: string[];
  popular?: boolean;
}

export const TEMPLATES: AgentTemplate[] = [
  {
    id: "lead-qualifier",
    name: "Priya",
    role: "Lead Qualifier",
    tagline: "Turns enquiries into booked site visits",
    description:
      "Replies to new enquiries from portals, ads, and your website right away. Qualifies the lead and books a visit before it goes cold.",
    icon: Sparkles,
    gradient: ["#ef8e2b", "#e23b58"],
    handles: [
      "Replies to leads from property portals and ads right away",
      "Captures budget, location, BHK, purpose, and timeline",
      "Checks if they need a home loan and pre-qualifies them",
      "Books a site visit and adds it to your calendar",
    ],
    greeting:
      "Hi, this is {name} from {company}. I saw you were interested in our project. Can I ask a couple of quick questions to help you better?",
    collects: ["Budget", "Preferred location", "Configuration (BHK)", "Purpose (end-use / investment)", "Possession timeline", "Home-loan requirement"],
    channels: ["voice", "chat"],
    voiceId: "priya",
    tone: ["Warm", "Persuasive"],
    popular: true,
  },
  {
    id: "receptionist",
    name: "Aarav",
    role: "Front-Desk Receptionist",
    tagline: "Answer every call, day and night",
    description:
      "A 24x7 front desk that answers every call, handles project FAQs, and routes or notes down the caller so nothing slips away.",
    icon: PhoneCall,
    gradient: ["#2f6bed", "#16b8c4"],
    handles: [
      "Answers inbound calls 24x7, even after hours",
      "Handles FAQs: price band, RERA, amenities, availability, location",
      "Routes to the right sales person or project",
      "Captures caller name and number for follow-up",
    ],
    greeting:
      "Namaste, thank you for calling {company}. I'm {name}. How can I help you today?",
    collects: ["Preferred location", "Configuration (BHK)", "Preferred call-back time"],
    channels: ["voice", "chat"],
    voiceId: "aarav",
    tone: ["Professional", "Warm"],
  },
  {
    id: "site-visit",
    name: "Meera",
    role: "Site-Visit Scheduler",
    tagline: "Cut no-shows with timely reminders",
    description:
      "Books, confirms, reminds, and reschedules site visits. Shares the location pin so more booked visits actually turn up.",
    icon: CalendarCheck,
    gradient: ["#1c9e57", "#16b8c4"],
    handles: [
      "Finds a slot and books the site visit",
      "Sends confirmation + Google Maps location pin",
      "Reminds the day before and morning-of",
      "Reschedules instantly when plans change",
    ],
    greeting:
      "Hi, it's {name} from {company}. I'd like to set up your visit to our project. What day works best for you?",
    collects: ["Preferred location", "Move-in date", "Preferred call-back time"],
    channels: ["voice", "chat"],
    voiceId: "meera",
    tone: ["Friendly", "Energetic"],
  },
  {
    id: "feedback",
    name: "Kabir",
    role: "Feedback & Follow-up",
    tagline: "Nurture every lead after the visit",
    description:
      "Calls after a site visit to collect feedback, rate interest (hot, warm, or cold), handle objections, and bring cold leads back.",
    icon: MessageSquareHeart,
    gradient: ["#6d3bf5", "#2f6bed"],
    handles: [
      "Collects post-visit feedback while it's fresh",
      "Scores interest as hot / warm / cold",
      "Handles objections (price, location, possession)",
      "Re-engages dormant leads with the right nudge",
    ],
    greeting:
      "Hello, this is {name} from {company}. Thanks for visiting us. I'd like to hear your honest thoughts on the project.",
    collects: ["Purpose (end-use / investment)", "Possession timeline"],
    channels: ["voice", "chat"],
    voiceId: "kabir",
    tone: ["Empathetic", "Concise"],
  },
  {
    id: "payment",
    name: "Saanvi",
    role: "Payment & Booking",
    tagline: "Keep payments and follow-ups on track",
    description:
      "Follows up on token and booking amounts, reminds about EMIs and payment milestones, and chases pending loan documents, politely.",
    icon: Wallet,
    gradient: ["#16b8c4", "#1c9e57"],
    handles: [
      "Token and booking amount reminders",
      "Construction milestone and EMI reminders",
      "Chases pending KYC and loan documents",
      "Answers payment plan and schedule questions",
    ],
    greeting:
      "Hi, this is {name} from {company}. I have a quick update on your booking. Is now a good time?",
    collects: ["Preferred call-back time"],
    channels: ["voice", "chat"],
    voiceId: "saanvi",
    tone: ["Professional", "Empathetic"],
  },
];

export const CUSTOM_TEMPLATE: AgentTemplate = {
  id: "custom",
  name: "New Agent",
  role: "Custom Agent",
  tagline: "Start from a blank slate",
  description: "Build an agent for any workflow. You choose the voice, personality, knowledge, and what it does.",
  icon: Wand2,
  gradient: ["#2f6bed", "#6d3bf5"],
  handles: ["Define your own purpose", "Pick voice and personality", "Add your knowledge", "Deploy to voice or web chat"],
  greeting: "Hi! I'm your assistant from {company}. How can I help you today?",
  collects: [],
  channels: ["voice", "chat"],
  voiceId: "aarav",
  tone: ["Professional"],
};

export const templateById = (id: string): AgentTemplate =>
  TEMPLATES.find((t) => t.id === id) ?? CUSTOM_TEMPLATE;

/**
 * The Super Agent's premium visual + builder defaults. A Super Agent is not a
 * real TemplateId (it's stored as templateId "custom" + kind "super"); this only
 * feeds the orb/card visuals and the builder's starting values.
 */
export const SUPER_TEMPLATE: Omit<AgentTemplate, "id"> & { id: "super" } = {
  id: "super",
  name: "Aria",
  role: "Super Agent",
  tagline: "One master agent for your whole lead lifecycle",
  description:
    "Your master AI. It learns from your specialist agents and your knowledge base to qualify, answer, schedule, follow up, and handle payments, all in one.",
  icon: Crown,
  gradient: ["#7c3aed", "#22d3ee"],
  handles: [
    "Learns from the specialists you've deployed",
    "Qualifies, answers, schedules, and follows up in one flow",
    "Knows your projects, pricing, and FAQs",
    "One voice and one widget across your whole site",
  ],
  greeting:
    "Hi, this is {name} from {company}. I can help with anything, from project details to booking a visit. What are you looking for?",
  collects: ["Budget", "Preferred location", "Configuration (BHK)", "Possession timeline"],
  channels: ["voice", "chat"],
  voiceId: "priya",
  tone: ["Warm", "Professional", "Persuasive"],
};

/** The five lifecycle skills a Super Agent can master, one per specialist template. */
export const LIFECYCLE_SKILLS: { template: TemplateId; label: string }[] = [
  { template: "lead-qualifier", label: "Qualify leads" },
  { template: "receptionist", label: "Answer calls" },
  { template: "site-visit", label: "Book site visits" },
  { template: "feedback", label: "Collect feedback" },
  { template: "payment", label: "Track payments" },
];

/* ------------------------------ saved agents ------------------------------ */

export interface KnowledgeState {
  companyProfile: boolean;
  projects: string[];
  docs: string[];
  faqs: FaqItem[];
  website: string;
}

export interface AgentConfig {
  id: string;
  templateId: TemplateId;
  name: string;
  role: string;
  voiceId: string;
  languages: string[];
  tone: string[];
  greeting: string;
  channels: Channel[];
  alwaysOn: boolean;
  escalateTo: string;
  collects: string[];
  guardrails: string[];
  knowledge: KnowledgeState;
  /** Website chat widget install state. Defaults to "pending" when unset. */
  widgetStatus?: "pending" | "requested" | "live";
  /** Set on the singleton Super Agent (the master that learns from specialists). */
  kind?: "super";
  /** For a Super Agent: the specialist agents it learned from. */
  sourceAgentIds?: string[];
  createdAt: number;
}

const STORE_KEY = "tt_agents";

export function listAgents(): AgentConfig[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const agents = JSON.parse(raw) as AgentConfig[];
    // Migrate agents saved before FAQs held content (faqs was a count).
    for (const a of agents) {
      if (a.knowledge && !Array.isArray(a.knowledge.faqs)) a.knowledge.faqs = [];
    }
    return agents;
  } catch {
    return [];
  }
}

export function getAgent(id: string): AgentConfig | null {
  return listAgents().find((a) => a.id === id) ?? null;
}

export function saveAgent(agent: AgentConfig) {
  const all = listAgents().filter((a) => a.id !== agent.id);
  all.unshift(agent);
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function deleteAgent(id: string) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(listAgents().filter((a) => a.id !== id)));
  } catch {
    /* ignore */
  }
}

/* ------------------------------ super agent ------------------------------- */

export function isSuperAgent(a: { kind?: string }): boolean {
  return a.kind === "super";
}

/** The single Super Agent (the master), or null. */
export function getSuperAgent(): AgentConfig | null {
  return listAgents().find((a) => a.kind === "super") ?? null;
}

/** Visual + defaults for an agent: the Super Agent's premium look, else its template. */
export function agentVisual(a: AgentConfig): Omit<AgentTemplate, "id"> & { id: string } {
  return isSuperAgent(a) ? SUPER_TEMPLATE : templateById(a.templateId);
}

/** Skills a set of source agents cover (by template), in lifecycle order. */
export function coveredSkills(sources: AgentConfig[]): TemplateId[] {
  const set = new Set(sources.map((a) => a.templateId));
  return LIFECYCLE_SKILLS.map((s) => s.template).filter((t) => set.has(t));
}

/* ------------------------- knowledge aggregation -------------------------- */

const emptyKnowledge = (): KnowledgeState => ({ companyProfile: false, projects: [], docs: [], faqs: [], website: "" });
const faqKey = (f: FaqItem) => f.q.trim().toLowerCase();
const uniq = (xs: string[]) => [...new Set(xs)];

export function mergeKnowledge(a: KnowledgeState, b: KnowledgeState): KnowledgeState {
  const faqs = [...a.faqs];
  const seen = new Set(a.faqs.map(faqKey));
  for (const f of b.faqs) {
    if (f.q.trim() && !seen.has(faqKey(f))) {
      seen.add(faqKey(f));
      faqs.push(f);
    }
  }
  return {
    companyProfile: a.companyProfile || b.companyProfile,
    projects: uniq([...a.projects, ...b.projects]),
    docs: uniq([...a.docs, ...b.docs]),
    faqs,
    website: a.website.trim() || b.website.trim() || "",
  };
}

/** Knowledge in `merged` but not in `base` (recovers a Super Agent's manual extras on edit). */
export function subtractKnowledge(merged: KnowledgeState, base: KnowledgeState): KnowledgeState {
  const baseFaqs = new Set(base.faqs.map(faqKey));
  const baseWebsite = base.website.trim();
  const mergedWebsite = merged.website.trim();
  return {
    companyProfile: merged.companyProfile && !base.companyProfile,
    projects: merged.projects.filter((p) => !base.projects.includes(p)),
    docs: merged.docs.filter((d) => !base.docs.includes(d)),
    faqs: merged.faqs.filter((f) => !baseFaqs.has(faqKey(f))),
    website: mergedWebsite && mergedWebsite !== baseWebsite ? merged.website : "",
  };
}

export function aggregateKnowledge(agents: AgentConfig[]): KnowledgeState {
  return agents.reduce((acc, a) => mergeKnowledge(acc, a.knowledge), emptyKnowledge());
}

export const aggregateCollects = (agents: AgentConfig[]) => uniq(agents.flatMap((a) => a.collects));
export const aggregateChannels = (agents: AgentConfig[]): Channel[] =>
  uniq(agents.flatMap((a) => a.channels)) as Channel[];
export const aggregateTone = (agents: AgentConfig[]) => uniq(agents.flatMap((a) => a.tone)).slice(0, 3);
export const aggregateGuardrails = (agents: AgentConfig[]) => uniq(agents.flatMap((a) => a.guardrails));

/* --------------------------- super re-sync -------------------------------- */

/** A Super Agent's source agents that still exist. */
export function superSources(agent: AgentConfig): AgentConfig[] {
  return (agent.sourceAgentIds ?? []).map(getAgent).filter((a): a is AgentConfig => !!a);
}

/** The live aggregate knowledge of a Super Agent's current source agents. */
export function superInherited(agent: AgentConfig): KnowledgeState {
  return aggregateKnowledge(superSources(agent));
}

/** True if a source was removed or its knowledge changed since the snapshot was taken. */
export function isSuperOutOfDate(agent: AgentConfig): boolean {
  const ids = agent.sourceAgentIds ?? [];
  if (ids.length === 0) return false;
  const live = superSources(agent);
  if (live.length !== ids.length) return true; // a source was deleted
  const extra = subtractKnowledge(aggregateKnowledge(live), agent.knowledge);
  return (
    extra.companyProfile ||
    extra.projects.length > 0 ||
    extra.docs.length > 0 ||
    extra.faqs.length > 0 ||
    extra.website.trim().length > 0
  );
}

/** Re-merge a Super Agent's snapshot from its current sources, keeping manual extras. */
export function resyncSuper(agent: AgentConfig): AgentConfig {
  const inherited = superInherited(agent);
  const manual = subtractKnowledge(agent.knowledge, inherited);
  const updated: AgentConfig = {
    ...agent,
    sourceAgentIds: superSources(agent).map((a) => a.id), // drop any removed sources
    knowledge: mergeKnowledge(inherited, manual),
  };
  saveAgent(updated);
  return updated;
}

/* --------------------------- readiness scoring ---------------------------- */

/**
 * Agent Readiness, 0 to 100. Deliberately weights the *knowledge base* at ~60%
 * of the total so the meter visibly teaches users that adding their projects,
 * docs, and FAQs is what makes the agent capable.
 */
export interface ReadinessBreakdown {
  score: number;
  knowledgePoints: number;
  label: string;
  tone: "weak" | "ok" | "strong";
}

export function readiness(a: {
  voiceId?: string;
  tone: string[];
  languages: string[];
  greeting: string;
  channels: Channel[];
  knowledge: KnowledgeState;
}): ReadinessBreakdown {
  let base = 0;
  if (a.voiceId) base += 10;
  if (a.tone.length) base += 8;
  if (a.languages.length) base += 7;
  if (a.greeting.trim()) base += 5;
  if (a.channels.length) base += 10; // max 40 without any knowledge

  let k = 0;
  if (a.knowledge.companyProfile) k += 15;
  k += Math.min(a.knowledge.projects.length, 4) * 5; // up to 20
  k += Math.min(a.knowledge.docs.length, 2) * 5; // up to 10
  // Only FAQs with both a question and an answer count.
  const completeFaqs = a.knowledge.faqs.filter((f) => f.q.trim() && f.a.trim()).length;
  k += Math.min(completeFaqs, 2) * 5; // up to 10
  if (a.knowledge.website.trim()) k += 5; // up to 60

  const score = Math.min(100, base + k);
  const tone = score < 45 ? "weak" : score < 75 ? "ok" : "strong";
  const label =
    score < 45 ? "Basic, add knowledge" : score < 75 ? "Capable" : score < 95 ? "Sharp" : "Expert";
  return { score, knowledgePoints: k, label, tone };
}
