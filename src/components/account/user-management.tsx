"use client";

/**
 * User Management: invite people into the organization, give each of them a
 * role, and manage the team against the seats on the plan.
 *
 * Design mode, no backend: everything is held in lib/team.ts (localStorage).
 * The workspace starts empty on purpose, so the first invitation is the first
 * thing you do; sending it also brings in the rest of the sample team.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, UserRoundX, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/leads/contacts/ui";
import { assignedCountFor, releaseMemberLeads } from "@/lib/lead-distribution";
import { ListFooter } from "@/components/layout/list-footer";
import {
  PLAN,
  ROLE_META,
  ROLE_ORDER,
  STATUS_META,
  STATUS_ORDER,
  TEAM_CHANGED_EVENT,
  cancelInvite,
  changeRole,
  displayStatus,
  inviteLink,
  inviteMember,
  isPendingInvite,
  listMembers,
  listRemovedMembers,
  removeMember,
  resendInvite,
  restoreMember,
  seatUsage,
  seedTeamIfNeeded,
  setMemberActive,
  type Member,
  type MemberRole,
} from "@/lib/team";
import { ChangeRoleModal } from "./change-role-modal";
import { InviteMemberModal, SeatLimitModal, type SentInvite } from "./invite-member-modal";
import { MemberDetailModal } from "./member-detail-modal";
import { MemberTable } from "./member-table";
import { RemovedMembers } from "./removed-members";
import { TeamEmptyState } from "./team-empty-state";
import { TeamStats } from "./team-stats";
import { INPUT } from "./team-ui";

/** Removing someone has two consequences worth spelling out: the seat, and the
 * leads they were holding. */
function removeMessage(member: Member | null, leads: number): string {
  const seat = `They lose access to this organization straight away. Their seat goes back to your ${PLAN.name} plan, and you can restore them from Removed Members.`;
  if (leads === 0) return seat;
  const name = member?.name.split(" ")[0] ?? "They";
  return `${name} is holding ${leads} ${leads === 1 ? "lead" : "leads"}, which go back to the team and are shared out again. ${seat}`;
}

const ROLE_OPTIONS = [{ value: "all", label: "All Roles" }, ...ROLE_ORDER.map((r) => ({ value: r, label: ROLE_META[r].name }))];
const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].name })),
];

type View = "team" | "removed";

export function UserManagement() {
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [removed, setRemoved] = useState<Member[]>([]);
  // Frozen once so relative times stay stable across re-renders.
  const [now] = useState(() => Date.now());

  const [view, setView] = useState<View>("team");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);

  const [inviting, setInviting] = useState(false);
  const [seatLimit, setSeatLimit] = useState(false);
  const [roleTarget, setRoleTarget] = useState<Member | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Member | null>(null);
  const [detail, setDetail] = useState<Member | null>(null);

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [resentId, setResentId] = useState<string | null>(null);

  // How many leads the person being removed is holding, so the confirmation can
  // say where they will go instead of leaving it as a surprise.
  const removeLeadCount = useMemo(
    () => (removeTarget ? assignedCountFor(removeTarget.id) : 0),
    [removeTarget]
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);

  const reload = useCallback(() => {
    setMembers(listMembers());
    setRemoved(listRemovedMembers());
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    reload();
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [reload]);

  useEffect(() => {
    window.addEventListener(TEAM_CHANGED_EVENT, reload);
    return () => window.removeEventListener(TEAM_CHANGED_EVENT, reload);
  }, [reload]);

  // The row of a member you just invited stays tinted for a moment.
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 1800);
    return () => clearTimeout(t);
  }, [highlightId]);

  // "Resend Invitation" confirms itself in place; there is no toast in this app.
  useEffect(() => {
    if (!resentId) return;
    const t = setTimeout(() => setResentId(null), 2000);
    return () => clearTimeout(t);
  }, [resentId]);

  /* ------------------------------ navigation ------------------------------ */

  const scroller = () => rootRef.current?.closest<HTMLElement>("[data-account-scroll]") ?? null;

  const openRemoved = useCallback(() => {
    savedScroll.current = scroller()?.scrollTop ?? 0;
    setPage(1);
    setView("removed");
    requestAnimationFrame(() => scroller()?.scrollTo({ top: 0 }));
  }, []);

  const backToTeam = useCallback(() => {
    setPage(1);
    setView("team");
    requestAnimationFrame(() => scroller()?.scrollTo({ top: savedScroll.current }));
  }, []);

  // Escape leaves the Removed Members view, the same as the back control.
  useEffect(() => {
    if (view !== "removed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !detail) backToTeam();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [view, detail, backToTeam]);

  /* -------------------------------- derived ------------------------------- */

  const seats = useMemo(() => seatUsage(members), [members]);

  const counts = useMemo(() => {
    let pending = 0;
    let active = 0;
    let inactive = 0;
    for (const m of members) {
      const s = displayStatus(m, now);
      if (isPendingInvite(s)) pending++;
      else if (s === "inactive") inactive++;
      else active++;
    }
    return { total: members.length, pending, active, inactive };
  }, [members, now]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (statusFilter !== "all" && displayStatus(m, now) !== statusFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone ?? "").replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      );
    });
  }, [members, query, roleFilter, statusFilter, now]);

  const filtersOn = query.trim() !== "" || roleFilter !== "all" || statusFilter !== "all";

  const source = view === "removed" ? removed : filtered;
  const totalPages = Math.max(1, Math.ceil(source.length / rows));
  const safePage = Math.min(page, totalPages);
  const pageItems = source.slice((safePage - 1) * rows, safePage * rows);

  /* -------------------------------- actions ------------------------------- */

  function openInvite() {
    if (seatUsage().remaining < 1) setSeatLimit(true);
    else setInviting(true);
  }

  function send(input: SentInvite): string | null {
    const res = inviteMember(input);
    if (!res.ok) {
      if (res.reason === "duplicate") return "Someone with this email is already on your team.";
      if (res.reason === "no-seats") return "Every seat on your plan is in use.";
      return "Enter a valid email address.";
    }
    // The first invitation also brings in the rest of the sample team, so the
    // full screen is one action away from the empty state.
    seedTeamIfNeeded();
    reload();
    setHighlightId(res.member.id);
    setPage(1);
    return null;
  }

  const actions = {
    onChangeRole: (m: Member) => setRoleTarget(m),
    onResend: (m: Member) => {
      resendInvite(m.id);
      setResentId(m.id);
      reload();
    },
    onCopyLink: (m: Member) => {
      void navigator.clipboard?.writeText(inviteLink(m));
    },
    onToggleActive: (m: Member) => {
      const activating = m.status !== "active";
      setMemberActive(m.id, activating);
      // A deactivated member is out of the distribution pool, so their leads go
      // back in the queue rather than sitting with someone who cannot work them.
      // The next visit to Leads deals them out again.
      if (!activating) releaseMemberLeads(m.id);
      reload();
    },
    onRemove: (m: Member) => setRemoveTarget(m),
    onCancelInvite: (m: Member) => setCancelTarget(m),
  };

  /* --------------------------------- render ------------------------------- */

  if (!ready) return <div className="h-full" aria-hidden />;

  const hasTeam = members.length > 0;

  return (
    // A flex column that fills the scroll area, so the list footer sits at the
    // bottom even when there are only a couple of rows.
    <div ref={rootRef} className="flex min-h-full flex-col">
      {view === "removed" ? (
        <RemovedMembers
          members={pageItems}
          page={safePage}
          rows={rows}
          total={removed.length}
          onPageChange={setPage}
          onRowsChange={(r) => {
            setRows(r);
            setPage(1);
          }}
          onBack={backToTeam}
          onAdd={openInvite}
          onView={setDetail}
        />
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-ink text-2xl font-bold tracking-tight">User Management</h1>
                <p className="text-ink-muted mt-1 text-sm">Manage team members, assign roles and control access.</p>
              </div>
              {hasTeam && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openRemoved}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-red-200 px-3.5 text-sm font-semibold text-red-600 outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400/40 active:scale-[0.98]"
                  >
                    <UserRoundX className="size-4" /> Removed Members
                    {removed.length > 0 && (
                      <span className="rounded-full bg-red-100 px-1.5 text-xs tabular-nums">{removed.length}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={openInvite}
                    className="bg-brand-blue hover:bg-brand-blue-hover inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white outline-none transition-[background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
                  >
                    <Plus className="size-4" /> Add Member
                  </button>
                </div>
              )}
            </header>

            {!hasTeam ? (
              <div className="mt-6">
                <TeamEmptyState onInvite={openInvite} />
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <TeamStats counts={counts} seats={seats} />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
                    <Search className="text-ink-muted/60 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search name, email, or number"
                      aria-label="Search team members"
                      className={cn(INPUT, "h-9 pl-9")}
                    />
                  </div>
                  {filtersOn && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setRoleFilter("all");
                        setStatusFilter("all");
                        setPage(1);
                      }}
                      className="text-accent-blue hover:bg-accent-blue/[0.08] h-9 rounded-lg px-2.5 text-sm font-semibold transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  {pageItems.length > 0 ? (
                    <MemberTable
                      members={pageItems}
                      now={now}
                      highlightId={highlightId}
                      resentId={resentId}
                      roleFilter={roleFilter}
                      statusFilter={statusFilter}
                      roleOptions={ROLE_OPTIONS}
                      statusOptions={STATUS_OPTIONS}
                      onRoleFilter={(v) => {
                        setRoleFilter(v);
                        setPage(1);
                      }}
                      onStatusFilter={(v) => {
                        setStatusFilter(v);
                        setPage(1);
                      }}
                      actions={actions}
                    />
                  ) : (
                    <div
                      className="grid place-items-center rounded-2xl border border-dashed border-black/[0.14] px-6 py-14 text-center"
                      style={{ animation: "fade-in-up 240ms cubic-bezier(0.23,1,0.32,1) both" }}
                    >
                      <span className="text-ink-muted/40 grid size-14 place-items-center rounded-2xl bg-black/[0.03]">
                        <Users className="size-7" />
                      </span>
                      <h2 className="text-ink mt-4 text-lg font-bold">No members match</h2>
                      <p className="text-ink-muted mt-1.5 text-sm">Try a different search or clear the filters.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setRoleFilter("all");
                          setStatusFilter("all");
                          setPage(1);
                        }}
                        className="text-ink mt-5 h-9 rounded-lg border border-black/15 px-3.5 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out hover:bg-black/[0.04] active:scale-[0.98]"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {hasTeam && pageItems.length > 0 && (
            <ListFooter
              showing={pageItems.length}
              total={source.length}
              noun={source.length === 1 ? "member" : "members"}
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              rows={rows}
              onRowsChange={(r) => {
                setRows(r);
                setPage(1);
              }}
            />
          )}
        </div>
      )}

      {/* ------------------------------- modals ------------------------------ */}

      {inviting && (
        <InviteMemberModal
          seatsRemaining={seats.remaining}
          onClose={() => setInviting(false)}
          onSend={send}
          onDone={() => setInviting(false)}
        />
      )}

      {seatLimit && (
        <SeatLimitModal
          used={seats.used}
          total={PLAN.seats}
          planName={PLAN.name}
          onClose={() => setSeatLimit(false)}
          onRemoveMember={() => {
            setSeatLimit(false);
            if (view === "removed") backToTeam();
          }}
        />
      )}

      {roleTarget && (
        <ChangeRoleModal
          member={roleTarget}
          onClose={() => setRoleTarget(null)}
          onSave={(role: MemberRole) => {
            changeRole(roleTarget.id, role);
            setRoleTarget(null);
            reload();
          }}
        />
      )}

      {detail && (
        <MemberDetailModal
          member={detail}
          seatsRemaining={seats.remaining}
          onClose={() => setDetail(null)}
          onRestore={() => {
            restoreMember(detail.id);
            setDetail(null);
            reload();
          }}
        />
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title={`Remove ${removeTarget?.name ?? "this member"}?`}
        message={removeMessage(removeTarget, removeLeadCount)}
        confirmLabel="Remove"
        onConfirm={() => {
          if (removeTarget) {
            removeMember(removeTarget.id);
            // Whatever they were holding goes back to the team.
            releaseMemberLeads(removeTarget.id);
          }
          setRemoveTarget(null);
          reload();
        }}
        onCancel={() => setRemoveTarget(null)}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this invitation?"
        message={`${cancelTarget?.name ?? "This person"} will not be able to join with the link they were sent. The seat goes back to your plan.`}
        confirmLabel="Cancel Invitation"
        onConfirm={() => {
          if (cancelTarget) cancelInvite(cancelTarget.id);
          setCancelTarget(null);
          reload();
        }}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
