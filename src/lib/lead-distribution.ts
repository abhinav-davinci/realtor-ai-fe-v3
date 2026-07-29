/**
 * Lead distribution: every warm-and-above lead gets an owner on the team,
 * automatically, so nothing sits unworked. Design mode, localStorage.
 *
 * The rule is a round robin that corrects itself. Rather than keeping a cursor
 * (which drifts the moment someone is deactivated or added), each lead goes to
 * whoever currently holds the fewest, ties broken by a stable pool order. On an
 * empty board that deals leads out one each in turn, exactly like a plain round
 * robin; on an uneven board it closes the gap instead of widening it.
 *
 * Assignment is deliberately NOT the same thing as take-over. The assignee is
 * who is responsible; `owner` in lib/lead-promotion.ts is who is driving right
 * now. A lead can belong to Priya while the AI keeps nurturing it, until she
 * takes over and the AI stands down.
 *
 * DEVELOPER NOTE: to wire this to a backend, assignment belongs on lead
 * creation server-side (a webhook on the lead service), so a lead that arrives
 * at 2am has an owner before anyone opens the app:
 *   POST /api/v1/orgs/{org_id}/leads/{lead_id}/assign   { member_id }
 *   GET  /api/v1/orgs/{org_id}/leads?assignee={member_id}
 * The pool and the rule come from an org-level distribution setting.
 */
import { listActiveMembers, type Member } from "@/lib/team";
import type { ScoredLead } from "@/lib/lead-intelligence";

/* --------------------------------- model ---------------------------------- */

export interface Assignment {
  memberId: string;
  /** Epoch ms the lead was handed to them. */
  at: number;
}

export type AssignmentMap = Record<string, Assignment>;

export interface DistributionResult {
  /** How many leads were given an owner by this pass. */
  assigned: number;
  /** memberId -> how many they picked up in this pass. */
  byMember: Record<string, number>;
}

/* --------------------------------- store ---------------------------------- */

const ASSIGNMENTS_KEY = "tt_lead_assignments";

export function readAssignments(): AssignmentMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    return raw ? (JSON.parse(raw) as AssignmentMap) : {};
  } catch {
    return {};
  }
}

function writeAssignments(all: AssignmentMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(all));
  } catch {
    /* quota or unavailable; ignore in design mode */
  }
}

/** Overlay used by the merged lead read, alongside the take-over overlay. */
export function applyAssignment(lead: ScoredLead, overlay: AssignmentMap): ScoredLead {
  const a = overlay[lead.id];
  return a ? { ...lead, assigneeId: a.memberId, assignedAt: a.at } : lead;
}

/* ---------------------------------- pool ---------------------------------- */

/**
 * Who leads can go to. Everyone who has accepted and is still active, in a
 * stable order so ties always break the same way. At this team size both roles
 * sell, so admins are in the pool too; narrowing it to `m.role === "user"` is
 * the one-line change if that stops being true.
 */
export function distributionPool(): Member[] {
  return listActiveMembers().slice().sort((a, b) => a.id.localeCompare(b.id));
}

/* ------------------------------- distribution ----------------------------- */

/** Current load per member id, counted from the leads passed in. */
export function loadByMember(leads: ScoredLead[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of leads) {
    if (l.assigneeId) counts[l.assigneeId] = (counts[l.assigneeId] ?? 0) + 1;
  }
  return counts;
}

/**
 * Give every unassigned lead an owner. Idempotent: a lead that already has one
 * keeps it, so this is safe to run on every mount and after every call run.
 * Returns what changed, for the post-run digest.
 */
export function distributeUnassigned(leads: ScoredLead[]): DistributionResult {
  const empty: DistributionResult = { assigned: 0, byMember: {} };
  if (typeof window === "undefined") return empty;

  const pool = distributionPool();
  if (pool.length === 0) return empty;

  const pending = leads.filter((l) => !l.assigneeId);
  if (pending.length === 0) return empty;

  const assignments = readAssignments();
  const counts = loadByMember(leads);
  // Everyone in the pool starts in the running, including anyone at zero.
  for (const m of pool) counts[m.id] = counts[m.id] ?? 0;

  const byMember: Record<string, number> = {};
  const now = Date.now();

  // Oldest first, so a backlog is dealt out in the order it arrived.
  const queue = pending
    .slice()
    .sort((a, b) => (a.promotedAt ?? 0) - (b.promotedAt ?? 0) || a.id.localeCompare(b.id));

  for (const lead of queue) {
    // Fewest leads wins; pool order breaks ties, so the result is deterministic.
    let pick = pool[0];
    for (const m of pool) {
      if (counts[m.id] < counts[pick.id]) pick = m;
    }
    assignments[lead.id] = { memberId: pick.id, at: now };
    counts[pick.id] += 1;
    byMember[pick.id] = (byMember[pick.id] ?? 0) + 1;
  }

  writeAssignments(assignments);
  return { assigned: queue.length, byMember };
}

/**
 * Deal the whole board again from scratch. Distribution self-corrects for new
 * leads but never moves old ones, so somebody who joins today stays behind for
 * a long time; this is how a manager evens that out in one go.
 *
 * Leads someone has already taken over stay with them. Those are being worked
 * right now, and moving a lead out from under the person on the phone with it
 * would be worse than an uneven board.
 */
export function redistributeAll(leads: ScoredLead[]): DistributionResult {
  if (typeof window === "undefined") return { assigned: 0, byMember: {} };

  const keep = new Set(leads.filter((l) => l.owner === "human" && l.assigneeId).map((l) => l.id));
  const current = readAssignments();
  const next: AssignmentMap = {};
  for (const [leadId, a] of Object.entries(current)) {
    if (keep.has(leadId)) next[leadId] = a;
  }
  writeAssignments(next);

  // Everything not kept looks unassigned again, so the usual pass deals it out.
  const cleared = leads.map((l) =>
    keep.has(l.id) ? l : { ...l, assigneeId: undefined, assignedAt: undefined }
  );
  return distributeUnassigned(cleared);
}

/** How many leads a redistribute would leave where they are. */
export function heldByPeopleCount(leads: ScoredLead[]): number {
  return leads.filter((l) => l.owner === "human" && l.assigneeId).length;
}

/**
 * Hand back everything a member was holding, so it can be dealt out again.
 * Called when someone is removed or deactivated: without this their leads would
 * keep pointing at somebody who can no longer work them.
 */
export function releaseMemberLeads(memberId: string): number {
  if (typeof window === "undefined") return 0;
  const all = readAssignments();
  let released = 0;
  for (const [leadId, a] of Object.entries(all)) {
    if (a.memberId === memberId) {
      delete all[leadId];
      released++;
    }
  }
  if (released > 0) writeAssignments(all);
  return released;
}

/** How many leads a member is holding, straight from the store. */
export function assignedCountFor(memberId: string): number {
  return Object.values(readAssignments()).filter((a) => a.memberId === memberId).length;
}

/* -------------------------------- workload -------------------------------- */

export interface MemberWorkload {
  member: Member;
  total: number;
  /** Hot and very hot: the ones that need calling today. */
  hot: number;
  /** Taken over from the AI by a person. */
  workedOn: number;
  /** Epoch ms of their most recent hand-out, or null. */
  lastAssignedAt: number | null;
}

export interface DistributionSummary {
  pool: Member[];
  workloads: MemberWorkload[];
  assigned: number;
  unassigned: number;
  total: number;
}

/** The read behind the Lead Distribution screen. */
export function distributionSummary(leads: ScoredLead[]): DistributionSummary {
  const pool = distributionPool();
  const byId = new Map(pool.map((m) => [m.id, m] as const));

  const workloads: MemberWorkload[] = pool.map((member) => ({
    member,
    total: 0,
    hot: 0,
    workedOn: 0,
    lastAssignedAt: null,
  }));
  const index = new Map(workloads.map((w) => [w.member.id, w] as const));

  let assigned = 0;
  for (const l of leads) {
    if (!l.assigneeId || !byId.has(l.assigneeId)) continue;
    const w = index.get(l.assigneeId);
    if (!w) continue;
    assigned++;
    w.total++;
    if (l.tier === "hot" || l.tier === "very-hot") w.hot++;
    if (l.owner === "human") w.workedOn++;
    if (l.assignedAt && (w.lastAssignedAt === null || l.assignedAt > w.lastAssignedAt)) {
      w.lastAssignedAt = l.assignedAt;
    }
  }

  return {
    pool,
    workloads: workloads.sort((a, b) => b.total - a.total || a.member.name.localeCompare(b.member.name)),
    assigned,
    unassigned: leads.length - assigned,
    total: leads.length,
  };
}
