"use client";

/**
 * A former member's record, and the way to give them their access back. Restore
 * needs a free seat, so the modal says up front when there isn't one instead of
 * failing on the click.
 */
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalShell } from "@/components/leads/contacts/ui";
import { ROLE_META, fmtDay, memberInitials, type Member } from "@/lib/team";
import { MemberAvatar, RolePill } from "./team-ui";

export function MemberDetailModal({
  member,
  seatsRemaining,
  onClose,
  onRestore,
}: {
  member: Member;
  seatsRemaining: number;
  onClose: () => void;
  onRestore: () => void;
}) {
  const canRestore = seatsRemaining > 0;

  return (
    <ModalShell
      title="Member Details"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onRestore}
            disabled={!canRestore}
            title={canRestore ? undefined : "No seats left on your plan"}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
              canRestore
                ? "bg-brand-blue hover:bg-brand-blue-hover text-white active:scale-[0.98]"
                : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
            )}
          >
            <RotateCcw className="size-4" /> Restore Access
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <MemberAvatar initials={memberInitials(member)} className="size-12 text-sm" />
        <div className="min-w-0">
          <p className="text-ink truncate text-base font-bold">{member.name}</p>
          <p className="text-ink-muted truncate text-sm">{member.email}</p>
        </div>
      </div>

      <dl className="mt-5 divide-y divide-black/[0.06] rounded-xl border border-black/[0.07] bg-black/[0.015] px-4">
        <Row label="Role">
          <RolePill role={member.role} />
        </Row>
        <Row label="Access Level">{ROLE_META[member.role].access}</Row>
        <Row label="Contact">{member.phone ?? <span className="text-ink-muted/60">Not added</span>}</Row>
        <Row label="Joined">{member.joinedAt ? fmtDay(member.joinedAt) : "Never accepted the invitation"}</Row>
        <Row label="Removed By">{member.removedBy ?? "—"}</Row>
        <Row label="Removed On">
          <span className="font-medium text-red-500">{member.removedAt ? fmtDay(member.removedAt) : "—"}</span>
        </Row>
      </dl>

      {!canRestore && (
        <p className="text-brand-orange bg-brand-orange/[0.07] mt-4 rounded-lg px-3 py-2.5 text-xs leading-relaxed">
          Every seat on your plan is in use. Remove someone else or upgrade before restoring {member.name}.
        </p>
      )}
    </ModalShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-ink-muted shrink-0 text-xs font-medium">{label}</dt>
      <dd className="text-ink min-w-0 truncate text-right text-sm">{children}</dd>
    </div>
  );
}
