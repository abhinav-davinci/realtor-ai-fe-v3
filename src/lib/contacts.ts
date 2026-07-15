/**
 * Contacts: the realtor's own master contact book (design mode, localStorage) —
 * the single source of truth they populate by Excel/AI upload or manual add,
 * organise into custom lists, and call with an AI voice agent. Separate from the
 * AI-captured leads in lib/lead-intelligence.ts.
 *
 * A contact carries a lead-classification `tier` (the same 5 tiers as leads) plus
 * a "new" state until first contacted. Custom lists store member ids (a Spotify
 * playlist owns its songs), so editing a contact in the master auto-reflects in
 * every list it sits in. When a calling session finishes, outcomes are written
 * back here via applyCallOutcomes, which the lists then mirror for free.
 */
import { buildCalls, type Call } from "@/components/leads/auto-call-run";
import { breakdownFromKeys, TIER_META, TIER_ORDER, type ScoredLead, type Tier } from "@/lib/lead-intelligence";

/* --------------------------------- model ---------------------------------- */

export type ContactTier = Tier | "new";

export interface Contact {
  /** ct-<digits>, phone-normalized — the dedupe key. */
  id: string;
  name: string;
  initials: string;
  phone: string;
  tags: string[];
  /** Lead-classification tier; "new" until the contact is first reached. */
  tier: ContactTier;
  /** How they entered the book: "Manual" | "Upload" | "Import". */
  source: string;
  /** Epoch ms of the last AI call that reached them, or null (Never). */
  lastContacted: number | null;
  addedAt: number;
}

export interface ContactList {
  id: string;
  name: string;
  /** A token-based accent (one of LIST_COLORS) for the list chip. */
  color: string;
  contactIds: string[];
  createdAt: number;
}

/** Real-estate tag presets shown as suggestions in the tag editor. */
export const CONTACT_TAGS = [
  "Buyer",
  "Seller",
  "Tenant",
  "Landlord",
  "Investor",
  "NRI",
  "Premium",
  "Site visit",
  "Loan needed",
  "Follow-up",
  "Do not call",
];

/** Accent tokens custom lists rotate through (text/bg via inline maps in the UI). */
export const LIST_COLORS = ["accent-blue", "brand-green", "brand-orange", "gold", "red"] as const;

/* -------------------------------- helpers --------------------------------- */

export function initialsOf(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

/** Digits only, drop leading zeros, keep the last 10 (Indian numbers). */
export function normPhone(s: string): string {
  return s.replace(/\D/g, "").replace(/^0+/, "").slice(-10);
}
export const contactIdFor = (phone: string) => `ct-${normPhone(phone)}`;

export function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const NEW_META = { name: "New", badge: "bg-black/[0.05] text-ink-muted", score: "text-ink-muted", dot: "bg-ink-muted/40" };
export function contactTierMeta(t: ContactTier) {
  return t === "new" ? NEW_META : TIER_META[t];
}

/** Tier rank for "moved up" detection (lower index = hotter). "new" is coldest. */
export function tierRank(t: ContactTier): number {
  return t === "new" ? TIER_ORDER.length : TIER_ORDER.indexOf(t);
}

/* --------------------------------- store ---------------------------------- */

const CONTACTS_KEY = "tt_contacts";
const CONTACTS_SEEDED_KEY = "tt_contacts_seeded";
const LISTS_KEY = "tt_contact_lists";

/** Fired after a background write the UI can't otherwise observe (e.g. a calling
 * run finishing and syncing outcomes back). The hub re-reads on this so an open
 * page reflects changes without subscribing to the auto-call ticking clock. */
export const CONTACTS_CHANGED_EVENT = "tt-contacts-changed";
export function notifyContactsChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CONTACTS_CHANGED_EVENT));
}

export function listContacts(): Contact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    return raw ? (JSON.parse(raw) as Contact[]) : [];
  } catch {
    return [];
  }
}
function writeContacts(all: Contact[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(all));
  } catch {
    /* quota or unavailable; ignore in design mode */
  }
}
export function getContact(id: string): Contact | null {
  return listContacts().find((c) => c.id === id) ?? null;
}
/** Add or update a contact (matched by id). New contacts go to the front. */
export function saveContact(c: Contact): void {
  const all = listContacts();
  const i = all.findIndex((x) => x.id === c.id);
  if (i >= 0) all[i] = c;
  else all.unshift(c);
  writeContacts(all);
}
export function deleteContacts(ids: string[]): void {
  const set = new Set(ids);
  writeContacts(listContacts().filter((c) => !set.has(c.id)));
  // also drop them from every list so memberships never dangle
  listContactLists().forEach((l) => {
    if (l.contactIds.some((id) => set.has(id))) {
      saveContactList({ ...l, contactIds: l.contactIds.filter((id) => !set.has(id)) });
    }
  });
}
/** Merge contacts in by phone: existing get their tags unioned, new are added.
 * Returns counts for the upload summary. */
export function upsertMany(incoming: Omit<Contact, "id" | "initials" | "addedAt">[]): {
  added: number;
  merged: number;
} {
  const all = listContacts();
  const byId = new Map(all.map((c) => [c.id, c] as const));
  let added = 0;
  let merged = 0;
  const now = Date.now();
  for (const c of incoming) {
    const id = contactIdFor(c.phone);
    if (!id.replace("ct-", "")) continue; // no usable phone
    const existing = byId.get(id);
    if (existing) {
      const tags = Array.from(new Set([...existing.tags, ...c.tags]));
      const updated = { ...existing, name: existing.name || c.name, tags };
      byId.set(id, updated);
      merged++;
    } else {
      byId.set(id, {
        id,
        name: c.name || c.phone,
        initials: initialsOf(c.name || c.phone),
        phone: c.phone,
        tags: c.tags,
        tier: c.tier,
        source: c.source,
        lastContacted: c.lastContacted,
        addedAt: now,
      });
      added++;
    }
  }
  writeContacts(Array.from(byId.values()));
  return { added, merged };
}

/* ---------------------------------- lists --------------------------------- */

export function listContactLists(): ContactList[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LISTS_KEY);
    return raw ? (JSON.parse(raw) as ContactList[]) : [];
  } catch {
    return [];
  }
}
function writeLists(all: ContactList[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LISTS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
export function saveContactList(l: ContactList): void {
  const all = listContactLists();
  const i = all.findIndex((x) => x.id === l.id);
  if (i >= 0) all[i] = l;
  else all.unshift(l);
  writeLists(all);
}
export function deleteContactList(id: string): void {
  writeLists(listContactLists().filter((l) => l.id !== id));
}
export function addContactsToList(listId: string, ids: string[]): void {
  const l = listContactLists().find((x) => x.id === listId);
  if (!l) return;
  saveContactList({ ...l, contactIds: Array.from(new Set([...l.contactIds, ...ids])) });
}
export function removeContactsFromList(listId: string, ids: string[]): void {
  const l = listContactLists().find((x) => x.id === listId);
  if (!l) return;
  const set = new Set(ids);
  saveContactList({ ...l, contactIds: l.contactIds.filter((id) => !set.has(id)) });
}
/** The lists a contact currently belongs to (for the table's Lists column). */
export function listsForContact(id: string, lists: ContactList[]): ContactList[] {
  return lists.filter((l) => l.contactIds.includes(id));
}

/* ----------------------------- recently viewed ---------------------------- */

const LIST_RECENTS_KEY = "tt_contact_list_recents";

/** List ids the user has opened, most recent first (drives the quick chips). */
export function recentListIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LIST_RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
export function recordListView(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = [id, ...recentListIds().filter((x) => x !== id)].slice(0, 12);
    localStorage.setItem(LIST_RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/* ---------------------------- calling adapters ---------------------------- */

const TIER_SCORE: Record<Tier, number> = { "very-hot": 88, hot: 70, warm: 52, light: 37, casual: 15 };

/** Adapt a contact to the ScoredLead shape the auto-call engine + running UI
 * expect. "new" maps to "light" only for the in-call tier badge; the contact id
 * rides along on `id` so outcomes can be written back. */
export function contactToScoredLead(c: Contact): ScoredLead {
  const tier: Tier = c.tier === "new" ? "light" : c.tier;
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    conversations: [],
    hasCall: false,
    hasChat: false,
    when: "",
    outcome: "",
    tone: "neutral",
    summary: "",
    captured: [],
    templateId: "lead-qualifier",
    agentRole: "AI agent",
    score: TIER_SCORE[tier],
    tier,
    status: c.lastContacted ? "contacted" : "new",
    source: "upload",
    // A contact isn't in a conversation yet, so no factors are captured; the tier
    // is carried from its history. The journey and breakdown fill in once called.
    journey: [{ channel: "upload", kind: "form", when: "", note: "From your contacts" }],
    scoreBreakdown: breakdownFromKeys([]),
  };
}
export function buildCallsFromContacts(contacts: Contact[]): Call[] {
  return buildCalls(contacts.map(contactToScoredLead));
}

/** Where a connected call's outcome lands the contact's tier (missed = no change). */
function outcomeToTier(outcome: Call["outcome"]): Tier | null {
  switch (outcome) {
    case "qualified": return "very-hot";
    case "interested": return "hot";
    case "callback": return "warm";
    case "not-interested": return "casual";
    default: return null; // no-answer / voicemail / busy
  }
}

export interface CallSyncSummary {
  dialled: number;
  reached: number;
  updated: number;
  movedUp: number;
}

/** Write a finished run's outcomes back to the master book (lists mirror it for
 * free since they reference contacts by id). */
export function applyCallOutcomes(calls: Call[]): CallSyncSummary {
  const all = listContacts();
  const byId = new Map(all.map((c) => [c.id, c] as const));
  const now = Date.now();
  let reached = 0;
  let updated = 0;
  let movedUp = 0;
  for (const call of calls) {
    const contact = byId.get(call.lead.id);
    if (!contact || !call.answered) continue;
    reached++;
    const nextTier = outcomeToTier(call.outcome);
    const before = contact.tier;
    const next: Contact = {
      ...contact,
      tier: nextTier ?? (contact.tier === "new" ? "light" : contact.tier),
      lastContacted: now,
    };
    byId.set(contact.id, next);
    updated++;
    if (tierRank(next.tier) < tierRank(before)) movedUp++;
  }
  writeContacts(Array.from(byId.values()));
  notifyContactsChanged();
  return { dialled: calls.length, reached, updated, movedUp };
}

/* ---------------------------------- seed ---------------------------------- */

const DAY = 86_400_000;

interface SeedRow {
  name: string;
  phone: string;
  tier: ContactTier;
  tags: string[];
  source: string;
  daysAgo: number | null; // last contacted, or null = never
}

const SEED: SeedRow[] = [
  { name: "Aarti Sharma", phone: "+91 98231 55012", tier: "very-hot", tags: ["Buyer", "Premium"], source: "WhatsApp", daysAgo: 1 },
  { name: "Rohit Jadhav", phone: "+91 99700 41288", tier: "hot", tags: ["Buyer", "Loan needed"], source: "Manual", daysAgo: 2 },
  { name: "Imran Khan", phone: "+91 98190 27640", tier: "hot", tags: ["Investor"], source: "Import", daysAgo: 4 },
  { name: "Priya Nair", phone: "+91 98860 77245", tier: "warm", tags: ["Buyer"], source: "WhatsApp", daysAgo: 6 },
  { name: "Sneha Patil", phone: "+91 90110 33256", tier: "warm", tags: ["Tenant", "Follow-up"], source: "Manual", daysAgo: 9 },
  { name: "Karan Singh", phone: "+91 97020 88431", tier: "light", tags: ["Site visit"], source: "Import", daysAgo: 14 },
  { name: "Meena Iyer", phone: "+91 98450 12277", tier: "very-hot", tags: ["Buyer", "Premium"], source: "WhatsApp", daysAgo: 3 },
  { name: "Vikram Joshi", phone: "+91 99875 60412", tier: "warm", tags: ["Buyer", "Site visit"], source: "Manual", daysAgo: 11 },
  { name: "Neha Reddy", phone: "+91 90035 71190", tier: "light", tags: ["Tenant"], source: "Import", daysAgo: 21 },
  { name: "Sameer Gupta", phone: "+91 98998 44150", tier: "casual", tags: ["Investor"], source: "Manual", daysAgo: 30 },
  { name: "Anjali Verma", phone: "+91 97400 22863", tier: "new", tags: ["Buyer"], source: "Upload", daysAgo: null },
  { name: "Deepak Rao", phone: "+91 98800 19034", tier: "new", tags: ["NRI", "Investor"], source: "Upload", daysAgo: null },
  { name: "Lata Kulkarni", phone: "+91 99220 50871", tier: "new", tags: ["Seller"], source: "Upload", daysAgo: null },
  { name: "Faisal Ahmed", phone: "+91 90290 67713", tier: "new", tags: ["Buyer", "Loan needed"], source: "Upload", daysAgo: null },
  { name: "Ritu Bansal", phone: "+91 98215 30449", tier: "warm", tags: ["Landlord"], source: "Manual", daysAgo: 7 },
  { name: "Arjun Desai", phone: "+91 99016 78225", tier: "hot", tags: ["Buyer", "Premium"], source: "WhatsApp", daysAgo: 2 },
];

function seedContacts(now: number): Contact[] {
  return SEED.map((r, i) => ({
    id: contactIdFor(r.phone),
    name: r.name,
    initials: initialsOf(r.name),
    phone: r.phone,
    tags: r.tags,
    tier: r.tier,
    source: r.source,
    lastContacted: r.daysAgo == null ? null : now - r.daysAgo * DAY,
    addedAt: now - (i + 3) * DAY,
  }));
}

function seedLists(now: number, contacts: Contact[]): ContactList[] {
  const byTag = (tag: string) => contacts.filter((c) => c.tags.includes(tag)).map((c) => c.id);
  const byTier = (...t: ContactTier[]) => contacts.filter((c) => t.includes(c.tier)).map((c) => c.id);
  return [
    { id: "list-hot-buyers", name: "Hot buyers", color: "red", contactIds: byTier("very-hot", "hot"), createdAt: now - 8 * DAY },
    { id: "list-nri", name: "NRI investors", color: "accent-blue", contactIds: byTag("NRI").concat(byTag("Investor")), createdAt: now - 5 * DAY },
    { id: "list-site-visit", name: "Site-visit follow-ups", color: "brand-orange", contactIds: byTag("Site visit"), createdAt: now - 3 * DAY },
  ].map((l) => ({ ...l, contactIds: Array.from(new Set(l.contactIds)) }));
}

/** Seed the demo book + lists once (sentinel-tracked, so a user's own contacts
 * are never overwritten). */
export function seedContactsIfNeeded(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(CONTACTS_SEEDED_KEY)) return;
    const now = Date.now();
    const contacts = seedContacts(now);
    writeContacts([...listContacts(), ...contacts]);
    if (listContactLists().length === 0) writeLists(seedLists(now, contacts));
    localStorage.setItem(CONTACTS_SEEDED_KEY, "1");
  } catch {
    /* ignore */
  }
}
