"use client";

/**
 * The team roster. One row per member, with the action that matters most for
 * their state up front (change their role, or chase an invitation that has not
 * been accepted) and the rest behind the row menu.
 */
import { Check, Copy, ListFilter, MoreVertical, Pencil, Phone, RotateCw, UserRoundX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  ROLE_META,
  displayStatus,
  isPendingInvite,
  lastActiveLabel,
  memberInitials,
  type Member,
} from "@/lib/team";
import { MemberAvatar, MemberStatusPill, RolePill } from "./team-ui";

export interface MemberRowActions {
  onChangeRole: (m: Member) => void;
  onResend: (m: Member) => void;
  onCopyLink: (m: Member) => void;
  onToggleActive: (m: Member) => void;
  onRemove: (m: Member) => void;
  onCancelInvite: (m: Member) => void;
}

const ITEM = "text-ink focus:bg-accent-blue/[0.07] focus:text-ink gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium [&_svg]:text-ink-muted";
const TH = "px-4 py-3 font-medium whitespace-nowrap";

export function MemberTable({
  members,
  now,
  highlightId,
  resentId,
  roleFilter,
  statusFilter,
  roleOptions,
  statusOptions,
  onRoleFilter,
  onStatusFilter,
  actions,
}: {
  members: Member[];
  now: number;
  /** The member just invited, tinted briefly so they are easy to spot. */
  highlightId: string | null;
  /** The member whose invitation was just resent, for the inline confirmation. */
  resentId: string | null;
  roleFilter: string;
  statusFilter: string;
  roleOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  onRoleFilter: (v: string) => void;
  onStatusFilter: (v: string) => void;
  actions: MemberRowActions;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/[0.08] bg-white">
      <table className="w-full min-w-[1080px] border-collapse text-sm">
        <thead>
          <tr className="text-ink-muted border-b border-black/[0.06] bg-black/[0.02] text-left text-xs">
            <th className={TH}>Name</th>
            <th className={TH}>Email</th>
            <th className={TH}>Contact</th>
            <th className={TH}>
              <ColumnFilter label="Role" value={roleFilter} options={roleOptions} onChange={onRoleFilter} />
            </th>
            <th className={TH}>Access Level</th>
            <th className={TH}>
              <ColumnFilter label="Status" value={statusFilter} options={statusOptions} onChange={onStatusFilter} />
            </th>
            <th className={TH}>Last Active</th>
            <th className={cn(TH, "text-right")}>Action</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const status = displayStatus(m, now);
            const pending = isPendingInvite(status);
            const highlighted = m.id === highlightId;
            return (
              <tr
                key={m.id}
                className={cn(
                  "border-b border-black/[0.04] transition-colors duration-700 ease-out last:border-0",
                  highlighted ? "bg-accent-blue/[0.07]" : "hover:bg-black/[0.02]"
                )}
              >
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
                <td className="text-ink-muted px-4 py-2.5 whitespace-nowrap">
                  {m.phone ? (
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Phone className="text-ink-muted/60 size-3.5" />
                      {m.phone}
                    </span>
                  ) : (
                    <span className="text-ink-muted/50">Not added</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <RolePill role={m.role} />
                </td>
                <td className="text-ink-muted px-4 py-2.5">
                  <span className="block max-w-[220px] truncate" title={ROLE_META[m.role].access}>
                    {ROLE_META[m.role].access}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <MemberStatusPill status={status} />
                </td>
                <td className="text-ink-muted px-4 py-2.5 text-xs whitespace-nowrap">{lastActiveLabel(m, now)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    {pending ? (
                      <button
                        type="button"
                        onClick={() => actions.onResend(m)}
                        className="bg-brand-blue hover:bg-brand-blue-hover inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold whitespace-nowrap text-white outline-none transition-[background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.97]"
                      >
                        <RotateCw className={cn("size-3.5", m.id === resentId && "motion-safe:animate-spin")} />
                        {m.id === resentId ? "Invitation sent" : "Resend Invitation"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => actions.onChangeRole(m)}
                        className="text-ink inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/15 px-2.5 text-xs font-semibold whitespace-nowrap outline-none transition-[border-color,background-color,transform] duration-150 ease-out hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.97]"
                      >
                        <Pencil className="text-accent-blue size-3.5" />
                        Change Role
                      </button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`More actions for ${m.name}`}
                        className="text-ink-muted hover:text-ink grid size-8 shrink-0 place-items-center rounded-lg outline-none transition-colors hover:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-accent-blue/40"
                      >
                        <MoreVertical className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" sideOffset={6} className="w-52 rounded-xl p-1.5 duration-150 ease-out">
                        {pending ? (
                          <>
                            <DropdownMenuItem className={ITEM} onClick={() => actions.onResend(m)}>
                              <RotateCw /> Resend Invitation
                            </DropdownMenuItem>
                            <DropdownMenuItem className={ITEM} onClick={() => actions.onCopyLink(m)}>
                              <Copy /> Copy Invite Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="mx-0 my-1.5" />
                            <DropdownMenuItem
                              variant="destructive"
                              className="gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium"
                              onClick={() => actions.onCancelInvite(m)}
                            >
                              <UserRoundX /> Cancel Invitation
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem className={ITEM} onClick={() => actions.onChangeRole(m)}>
                              <Pencil /> Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem className={ITEM} onClick={() => actions.onToggleActive(m)}>
                              <RotateCw /> {m.status === "active" ? "Deactivate" : "Reactivate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="mx-0 my-1.5" />
                            <DropdownMenuItem
                              variant="destructive"
                              className="gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium"
                              onClick={() => actions.onRemove(m)}
                            >
                              <UserRoundX /> Remove Member
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Column header that doubles as a filter. Only the two enum columns carry one:
 * filtering a free-text column would just repeat the search field. Built on the
 * menu primitive because it portals, so the popup escapes the table's
 * horizontal scroll container instead of being clipped by it. */
export function ColumnFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const active = value !== "all";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Filter by ${label}`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40",
          active ? "text-accent-blue" : "hover:text-ink"
        )}
      >
        {label}
        <ListFilter className={cn("size-3.5", active ? "text-accent-blue" : "text-ink-muted/60")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-44 rounded-xl p-1.5 duration-150 ease-out">
        {options.map((o) => (
          <DropdownMenuItem key={o.value} className={cn(ITEM, "justify-between")} onClick={() => onChange(o.value)}>
            <span className={o.value === value ? "text-ink font-semibold" : "text-ink-muted"}>{o.label}</span>
            {o.value === value && <Check className="text-accent-blue" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
