/**
 * Team: the people in the realtor's organization (design mode, localStorage) —
 * the admin invites employees, gives each an Admin or User role, and manages
 * them against the seat limit on the plan. Separate from lib/contacts.ts (the
 * customer book) and lib/lead-intelligence.ts (captured leads).
 *
 * The signed-in owner is deliberately NOT a member row. Members are the people
 * you invited, which is what makes the empty state true and what makes "10 seats,
 * up to 10 team members" mean ten invitees. CURRENT_USER below is the owner.
 *
 * DEVELOPER NOTE: this whole module is client-side. To wire it to a backend,
 * replace the readers/writers with an org members service:
 *   GET    /api/v1/orgs/{org_id}/members
 *   POST   /api/v1/orgs/{org_id}/invitations      { name, email, role }
 *   POST   /api/v1/orgs/{org_id}/invitations/{id}/resend
 *   PATCH  /api/v1/orgs/{org_id}/members/{id}     { role | status }
 *   DELETE /api/v1/orgs/{org_id}/members/{id}
 * Seat limits come from the org's plan; the invite call is the one that must
 * enforce them server-side (the client check here is a courtesy, not a gate).
 *
 * Deliberately dependency-free: lib/contacts.ts pulls in the whole lead seed
 * chain (lead-intelligence -> conversations -> agents), which the top bar and
 * the account pages have no business loading.
 */

/* --------------------------------- model ---------------------------------- */

export type MemberRole = "admin" | "user";

/** Stored status. "expired" is not stored: it's derived from an invite's age. */
export type MemberStatus = "active" | "inactive" | "invited" | "removed";

/** What the UI shows, once an ageing invitation is taken into account. */
export type DisplayStatus = "active" | "inactive" | "pending" | "expired";

export interface Member {
  /** Stable for the life of the member. This is the assignee key the lead
   * handoff in lib/lead-promotion.ts will point at, so it must never be
   * re-derived from a mutable field like email. */
  id: string;
  name: string;
  email: string;
  /** Null until they accept and fill in their own profile ("Not added"). */
  phone: string | null;
  role: MemberRole;
  status: MemberStatus;
  invitedAt: number;
  /** Epoch ms they accepted, or null while the invitation is outstanding. */
  joinedAt: number | null;
  lastActiveAt: number | null;
  removedAt: number | null;
  /** Display name of whoever removed them (shown in the Removed Members table). */
  removedBy: string | null;
}

/** The signed-in account owner. One place for "who am I", so the lead-assignment
 * work and the reduced User views can both read it. The session (lib/auth.tsx)
 * only carries an org and a role string, never a person. */
export const CURRENT_USER = {
  name: "Sayali Gujarathi",
  email: "sayali@realtoros.in",
  initials: "SG",
  role: "Super Admin",
} as const;

/** Workspace label in the account bar. Swap for the org name once orgs are
 * named in the backend (lib/auth.tsx exposes orgName). */
export const WORKSPACE_NAME = "RealtorOS";

/** An invitation is good for a week, which is what the success dialog promises. */
export const INVITE_TTL_DAYS = 7;

/* --------------------------------- viewer --------------------------------- */

export type ViewerRole = "super-admin" | "admin" | "user";

/** Who is looking at the app right now. */
export interface Viewer {
  /** OWNER_ID for the account holder, otherwise the member's id. */
  id: string;
  name: string;
  email: string;
  initials: string;
  role: ViewerRole;
  /** True when the owner is looking through a member's eyes. */
  impersonating: boolean;
}

export const OWNER_ID = "owner";

/**
 * What a role is allowed to do. Admins run the organization; Users work the
 * leads they are given and nothing else. This mirrors ROLE_PERMISSIONS above,
 * which is the copy the same rules are explained with, so the two must agree.
 */
export type Capability =
  | "team.manage"
  | "billing.view"
  | "leads.viewAll"
  | "leads.distribute"
  | "contacts.manage"
  | "campaigns.run"
  | "content.manage"
  | "agents.manage"
  | "workflows.manage";

const ADMIN_CAPABILITIES: Capability[] = [
  "team.manage",
  "billing.view",
  "leads.viewAll",
  "leads.distribute",
  "contacts.manage",
  "campaigns.run",
  "content.manage",
  "agents.manage",
  "workflows.manage",
];

/** A User has none of the organization-level capabilities. What they get is
 * their own assigned leads, which is not a capability but a scope. */
const CAPABILITIES: Record<ViewerRole, Capability[]> = {
  "super-admin": ADMIN_CAPABILITIES,
  admin: ADMIN_CAPABILITIES,
  user: [],
};

export function can(viewer: Viewer, capability: Capability): boolean {
  return CAPABILITIES[viewer.role].includes(capability);
}

export const OWNER_VIEWER: Viewer = {
  id: OWNER_ID,
  name: CURRENT_USER.name,
  email: CURRENT_USER.email,
  initials: CURRENT_USER.initials,
  role: "super-admin",
  impersonating: false,
};

const VIEW_AS_KEY = "tt_view_as";

/** Fired when the viewer switches, so the whole shell re-reads its permissions. */
export const VIEW_CHANGED_EVENT = "tt-view-changed";
export function notifyViewChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(VIEW_CHANGED_EVENT));
}

/**
 * Design-mode impersonation. There is no real auth here, so the only way to show
 * what a team member sees is to let the owner borrow their view. A real build
 * would take the viewer from the session instead, and this whole switch goes
 * away with it.
 */
export function setViewAs(memberId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (memberId) localStorage.setItem(VIEW_AS_KEY, memberId);
    else localStorage.removeItem(VIEW_AS_KEY);
    notifyViewChanged();
  } catch {
    /* ignore */
  }
}

export function currentViewer(): Viewer {
  if (typeof window === "undefined") return OWNER_VIEWER;
  let id: string | null = null;
  try {
    id = localStorage.getItem(VIEW_AS_KEY);
  } catch {
    return OWNER_VIEWER;
  }
  if (!id) return OWNER_VIEWER;
  const member = memberById(id);
  // A member who has since been removed or deactivated cannot be viewed as.
  if (!member || member.status !== "active") return OWNER_VIEWER;
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    initials: initialsOf(member.name),
    role: member.role === "admin" ? "admin" : "user",
    impersonating: true,
  };
}

const DAY = 86_400_000;

/* ---------------------------------- plan ---------------------------------- */

export const PLAN = { name: "Pro", seats: 10 } as const;

export interface SeatUsage {
  used: number;
  total: number;
  remaining: number;
}

/** Every member who still holds a place in the org uses a seat, including an
 * outstanding invitation (the seat is reserved for them) and someone who has
 * been deactivated. Removing a member gives the seat back. */
export function seatUsage(members?: Member[]): SeatUsage {
  const used = (members ?? listMembers()).length;
  return { used, total: PLAN.seats, remaining: Math.max(0, PLAN.seats - used) };
}

/* -------------------------------- presentation ---------------------------- */

/** Single source of truth for role presentation, mirroring TIER_META in
 * lib/lead-intelligence.ts: name, pill classes, and the access-level sentence
 * the table and the invite cards both show. */
export const ROLE_META: Record<MemberRole, { name: string; badge: string; access: string; blurb: string }> = {
  admin: {
    name: "Admin",
    badge: "bg-violet-50 text-violet-600",
    access: "Full organizational control",
    blurb: "Full organizational control",
  },
  user: {
    name: "User",
    badge: "bg-accent-blue/10 text-accent-blue",
    access: "Access features based on assigned permissions",
    blurb: "Access features based on assigned permissions.",
  },
};

export const ROLE_ORDER: MemberRole[] = ["admin", "user"];

/** What each role can do. Rendered as the invite-modal cards and the
 * "Understand User Roles" section, so the copy lives in exactly one place. */
export const ROLE_PERMISSIONS: Record<MemberRole, string[]> = {
  admin: [
    "Invite users to the organization",
    "Invite admins",
    "Remove users and admins",
    "Create and manage listings",
    "Configure workflows",
    "Create and manage templates",
    "View organization-wide telemetry and performance metrics",
    "Manage lead assignment visibility",
    "Manage site visit requests",
    "Request data on Data Terminal",
  ],
  user: [
    "View telemetry and performance data",
    "Access leads assigned to them",
    "View and manage AI Voice leads assigned to them",
    "View and manage AI Chat leads assigned to them",
    "Confirm or update site visit statuses",
    "View site visit requests assigned to them",
    "View all the data on Data Terminal",
    "Download any document (Index and Agreement) on Data Terminal",
  ],
};

/** Status presentation. `tone` feeds the shared StatusPill in outreach-shared. */
export const STATUS_META: Record<
  DisplayStatus,
  { name: string; tone: "good" | "warm" | "cold" | "neutral" }
> = {
  active: { name: "Active", tone: "good" },
  inactive: { name: "Inactive", tone: "neutral" },
  pending: { name: "Pending", tone: "warm" },
  expired: { name: "Expired", tone: "cold" },
};

export const STATUS_ORDER: DisplayStatus[] = ["active", "pending", "expired", "inactive"];

/* -------------------------------- helpers --------------------------------- */

/** An outstanding invitation older than the TTL reads as Expired. Deriving it
 * means the state changes on its own, the way a real invitation does. */
export function displayStatus(m: Member, now = Date.now()): DisplayStatus {
  if (m.status === "invited") {
    return now - m.invitedAt > INVITE_TTL_DAYS * DAY ? "expired" : "pending";
  }
  return m.status === "inactive" ? "inactive" : "active";
}

export const isPendingInvite = (s: DisplayStatus) => s === "pending" || s === "expired";

/** Up to two initials from a name, e.g. "Anjali Patel" -> "AP". */
export function initialsOf(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

export function memberInitials(m: Member): string {
  return initialsOf(m.name || m.email);
}

/** "10 min ago" / "5 days ago" / "24 Jun 2026" past a fortnight. */
export function fmtRelative(ms: number | null, now = Date.now()): string {
  if (ms === null) return "Never";
  const diff = Math.max(0, now - ms);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days <= 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  return fmtDay(ms);
}

/** "24 Jun 2026" — the Removed Date format. */
export function fmtDay(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** What the Last Active column shows: an outstanding invitation reports when it
 * was sent, everyone else reports when they were last seen. */
export function lastActiveLabel(m: Member, now = Date.now()): string {
  return isPendingInvite(displayStatus(m, now)) ? `Sent ${fmtRelative(m.invitedAt, now)}` : fmtRelative(m.lastActiveAt, now);
}

export const normEmail = (s: string) => s.trim().toLowerCase();

/** Good enough for a form: something@something.tld with no spaces. */
export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
}

/* --------------------------------- store ---------------------------------- */

const TEAM_KEY = "tt_team";
const TEAM_SEEDED_KEY = "tt_team_seeded";

/** Fired after any write so every open surface re-reads. The mutators below do
 * NOT fire it themselves, matching CONTACTS_CHANGED_EVENT in lib/contacts.ts. */
export const TEAM_CHANGED_EVENT = "tt-team-changed";
export function notifyTeamChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(TEAM_CHANGED_EVENT));
}

function readAll(): Member[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    return raw ? (JSON.parse(raw) as Member[]) : [];
  } catch {
    return [];
  }
}
function writeAll(all: Member[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TEAM_KEY, JSON.stringify(all));
  } catch {
    /* quota or unavailable; ignore in design mode */
  }
}

/** Everyone who still holds a seat, newest first. */
export function listMembers(): Member[] {
  return readAll().filter((m) => m.status !== "removed");
}

/** Who can be given work: accepted and not deactivated. Keeping this rule in the
 * store means the lead-assignment step and every picker agree on it. */
export function listActiveMembers(): Member[] {
  return listMembers().filter((m) => m.status === "active");
}

/** Former members, most recently removed first. */
export function listRemovedMembers(): Member[] {
  return readAll()
    .filter((m) => m.status === "removed")
    .sort((a, b) => (b.removedAt ?? 0) - (a.removedAt ?? 0));
}

export function memberById(id: string): Member | null {
  return readAll().find((m) => m.id === id) ?? null;
}

/** Display name for a member id, safe for ids that no longer resolve. Anything
 * holding a member id (an assigned lead, an audit row) should render through
 * this so a removed person degrades to a label instead of a blank cell. */
export function memberLabel(id: string | null | undefined): string {
  if (!id) return "Unassigned";
  return memberById(id)?.name ?? "Removed user";
}

function save(m: Member): void {
  const all = readAll();
  const i = all.findIndex((x) => x.id === m.id);
  if (i >= 0) all[i] = m;
  else all.unshift(m);
  writeAll(all);
}

/** Update one member by id. Returns the updated record, or null if it is gone. */
function patch(id: string, fields: Partial<Member>): Member | null {
  const existing = memberById(id);
  if (!existing) return null;
  const updated = { ...existing, ...fields };
  save(updated);
  notifyTeamChanged();
  return updated;
}

export type InviteResult =
  | { ok: true; member: Member }
  | { ok: false; reason: "duplicate" | "no-seats" | "invalid-email" };

/** Send an invitation. New members go to the front so the person you just added
 * is the first row you see. */
export function inviteMember(input: { name: string; email: string; role: MemberRole }): InviteResult {
  const email = normEmail(input.email);
  if (!isValidEmail(email)) return { ok: false, reason: "invalid-email" };
  if (listMembers().some((m) => normEmail(m.email) === email)) return { ok: false, reason: "duplicate" };
  if (seatUsage().remaining < 1) return { ok: false, reason: "no-seats" };

  const now = Date.now();
  const member: Member = {
    id: `tm-${now}-${Math.floor(now % 1000)}`,
    name: input.name.trim() || email,
    email,
    phone: null,
    role: input.role,
    status: "invited",
    invitedAt: now,
    joinedAt: null,
    lastActiveAt: null,
    removedAt: null,
    removedBy: null,
  };
  save(member);
  notifyTeamChanged();
  return { ok: true, member };
}

/** Restart the 7-day clock on an outstanding or expired invitation. */
export function resendInvite(id: string): Member | null {
  return patch(id, { invitedAt: Date.now(), status: "invited" });
}

export function changeRole(id: string, role: MemberRole): Member | null {
  return patch(id, { role });
}

/** Deactivate or reactivate. Both keep the seat. */
export function setMemberActive(id: string, active: boolean): Member | null {
  return patch(id, { status: active ? "active" : "inactive", lastActiveAt: active ? Date.now() : memberById(id)?.lastActiveAt ?? null });
}

/** Remove a member. They keep their record (so Removed Members can show who did
 * it and when) but give the seat back. */
export function removeMember(id: string, by: string = CURRENT_USER.name): Member | null {
  return patch(id, { status: "removed", removedAt: Date.now(), removedBy: by });
}

/** Put a former member back, if there is a seat for them. */
export function restoreMember(id: string): Member | null {
  if (seatUsage().remaining < 1) return null;
  const existing = memberById(id);
  if (!existing) return null;
  // Someone who never accepted goes back to an outstanding invitation; everyone
  // else comes back active.
  const wasInvite = existing.joinedAt === null;
  return patch(id, {
    status: wasInvite ? "invited" : "active",
    invitedAt: wasInvite ? Date.now() : existing.invitedAt,
    removedAt: null,
    removedBy: null,
  });
}

/** Cancel an outstanding invitation outright (no Removed Members record: they
 * never joined, so there is nothing to keep). */
export function cancelInvite(id: string): void {
  writeAll(readAll().filter((m) => m.id !== id));
  notifyTeamChanged();
}

/** The link an admin can share instead of waiting for the email. Design mode
 * only: a real one is signed and issued by the backend. */
export function inviteLink(m: Member): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/login?invite=${m.id}`;
}

/* ---------------------------------- seed ---------------------------------- */

/** The rest of the team, added the first time an invitation is sent so the
 * designed empty state is what you land on and the full table is one action
 * away. Set to 0 to keep the workspace empty. */
const SEED_COUNT = 9;

interface SeedRow {
  name: string;
  email: string;
  phone: string;
  role: MemberRole;
  /** Stored status; "invited" with a stale invitedAt reads as Expired. */
  status: Exclude<MemberStatus, "removed">;
  /** Days ago they were last seen. */
  seenDaysAgo?: number;
  /** Minutes ago they were last seen (wins over seenDaysAgo). */
  seenMinsAgo?: number;
  /** Days ago the invitation went out. */
  invitedDaysAgo: number;
}

/** 6 active, 2 inactive, 1 invitation that has gone stale. With the first
 * invitation you send, that is 10 members on 10 seats: 6 active, 2 inactive,
 * 2 pending. */
const SEED: SeedRow[] = [
  { name: "Anjali Patel", email: "a.patel@realtoros.in", phone: "+91 98563 76325", role: "user", status: "active", seenMinsAgo: 10, invitedDaysAgo: 96 },
  { name: "Priya Rao", email: "p.rao@realtoros.in", phone: "+91 98211 40788", role: "admin", status: "active", seenMinsAgo: 12, invitedDaysAgo: 142 },
  { name: "Ketan Mehta", email: "k.mehta@realtoros.in", phone: "+91 90042 31877", role: "user", status: "inactive", seenDaysAgo: 5, invitedDaysAgo: 88 },
  { name: "Sana Khan", email: "s.khan@realtoros.in", phone: "+91 99873 20154", role: "user", status: "invited", invitedDaysAgo: 10 },
  { name: "Neha Sharma", email: "n.sharma@realtoros.in", phone: "+91 98765 41230", role: "admin", status: "active", seenMinsAgo: 24, invitedDaysAgo: 210 },
  { name: "Mohan Das", email: "m.das@realtoros.in", phone: "+91 93726 55401", role: "user", status: "active", seenDaysAgo: 1, invitedDaysAgo: 64 },
  { name: "Rohit Verma", email: "r.verma@realtoros.in", phone: "+91 97024 18866", role: "admin", status: "active", seenMinsAgo: 47, invitedDaysAgo: 178 },
  { name: "Kajal Khandge", email: "k.khandge@realtoros.in", phone: "+91 90495 27310", role: "user", status: "active", seenDaysAgo: 2, invitedDaysAgo: 51 },
  { name: "Abhinav Raj", email: "a.raj@realtoros.in", phone: "+91 98330 76192", role: "user", status: "inactive", seenDaysAgo: 9, invitedDaysAgo: 120 },
];

/** Add the rest of the team once. Safe to call repeatedly: the sentinel and the
 * email check both stop it from running twice. */
export function seedTeamIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(TEAM_SEEDED_KEY)) return;
  localStorage.setItem(TEAM_SEEDED_KEY, "1");
  if (SEED_COUNT < 1) return;

  const now = Date.now();
  const existing = new Set(readAll().map((m) => normEmail(m.email)));
  const rows = SEED.slice(0, SEED_COUNT)
    .filter((r) => !existing.has(normEmail(r.email)))
    .map((r, i) => {
      const invitedAt = now - r.invitedDaysAgo * DAY;
      const joined = r.status === "invited" ? null : invitedAt + DAY;
      const lastActiveAt =
        r.seenMinsAgo !== undefined
          ? now - r.seenMinsAgo * 60_000
          : r.seenDaysAgo !== undefined
            ? now - r.seenDaysAgo * DAY
            : null;
      return {
        id: `tm-seed-${i + 1}`,
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: r.role,
        status: r.status,
        invitedAt,
        joinedAt: joined,
        lastActiveAt,
        removedAt: null,
        removedBy: null,
      } satisfies Member;
    });

  writeAll([...readAll(), ...rows]);
  notifyTeamChanged();
}
