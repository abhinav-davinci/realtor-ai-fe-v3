"use client";

/**
 * Former members. A record of who lost access, when, and who did it, with the
 * way back to the team always in reach at the top.
 */
import { ArrowLeft, Eye, Plus, UserRoundX } from "lucide-react";
import { ListFooter } from "@/components/layout/list-footer";
import { fmtDay, memberInitials, type Member } from "@/lib/team";
import { MemberAvatar, RolePill } from "./team-ui";

const TH = "px-4 py-3 font-medium whitespace-nowrap";

export function RemovedMembers({
  members,
  page,
  rows,
  total,
  onPageChange,
  onRowsChange,
  onBack,
  onAdd,
  onView,
}: {
  members: Member[];
  page: number;
  rows: number;
  total: number;
  onPageChange: (p: number) => void;
  onRowsChange: (r: number) => void;
  onBack: () => void;
  onAdd: () => void;
  onView: (m: Member) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / rows));

  return (
    <div className="flex flex-1 flex-col">
      {/* Sticky so the way back never scrolls out of reach. */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/85 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to team"
            className="group text-ink-muted hover:text-ink hover:bg-black/[0.05] grid size-9 shrink-0 place-items-center rounded-lg outline-none transition-[background-color,color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.97]"
          >
            <ArrowLeft className="size-5 transition-transform duration-150 ease-out motion-safe:group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-ink text-2xl font-bold tracking-tight">Removed Members</h1>
            <p className="text-ink-muted mt-0.5 text-sm">People who no longer have access to this organization.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="bg-brand-blue hover:bg-brand-blue-hover inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white outline-none transition-[background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
        >
          <Plus className="size-4" /> Add Member
        </button>
      </header>

      <div className="flex-1 px-4 pb-6 sm:px-6 lg:px-8">
        {total === 0 ? (
          <div
            className="grid place-items-center rounded-2xl border border-dashed border-black/[0.14] px-6 py-16 text-center"
            style={{ animation: "fade-in-up 240ms cubic-bezier(0.23,1,0.32,1) both" }}
          >
            <span className="text-ink-muted/40 grid size-14 place-items-center rounded-2xl bg-black/[0.03]">
              <UserRoundX className="size-7" />
            </span>
            <h2 className="text-ink mt-4 text-lg font-bold">No one has been removed</h2>
            <p className="text-ink-muted mx-auto mt-1.5 max-w-sm text-sm leading-relaxed">
              When you remove a member, they appear here with who removed them and when, and their seat goes back to
              the plan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-black/[0.08] bg-white">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="text-ink-muted border-b border-black/[0.06] bg-black/[0.02] text-left text-xs">
                  <th className={TH}>Name</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Contact</th>
                  <th className={TH}>Role</th>
                  <th className={TH}>Removed By</th>
                  <th className={TH}>Removed Date</th>
                  <th className={`${TH} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-black/[0.04] transition-colors last:border-0 hover:bg-black/[0.02]">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <MemberAvatar initials={memberInitials(m)} />
                        <span className="text-ink truncate font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="text-ink-muted px-4 py-2.5">
                      <span className="block max-w-[200px] truncate" title={m.email}>
                        {m.email}
                      </span>
                    </td>
                    <td className="text-ink-muted px-4 py-2.5 whitespace-nowrap tabular-nums">
                      {m.phone ?? <span className="text-ink-muted/50">Not added</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <RolePill role={m.role} />
                    </td>
                    <td className="text-ink-muted px-4 py-2.5 whitespace-nowrap">{m.removedBy ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-medium whitespace-nowrap text-red-500">
                      {m.removedAt ? fmtDay(m.removedAt) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => onView(m)}
                          className="text-ink inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/15 px-2.5 text-xs font-semibold whitespace-nowrap outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.97]"
                        >
                          <Eye className="text-accent-blue size-3.5" /> View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 0 && (
        <ListFooter
          showing={members.length}
          total={total}
          noun={total === 1 ? "removed member" : "removed members"}
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          rows={rows}
          onRowsChange={onRowsChange}
        />
      )}
    </div>
  );
}
