"use client";

/**
 * Changing someone's role. Same cards as the invite modal, so the choice looks
 * and reads the same wherever it is made, plus a line spelling out what the
 * change actually grants.
 */
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalShell } from "@/components/leads/contacts/ui";
import { ROLE_META, type Member, type MemberRole } from "@/lib/team";
import { RoleChooser } from "./role-cards";
import { RolePill } from "./team-ui";
import { EASE } from "./team-ui";

export function ChangeRoleModal({
  member,
  onClose,
  onSave,
}: {
  member: Member;
  onClose: () => void;
  onSave: (role: MemberRole) => void;
}) {
  const [role, setRole] = useState<MemberRole>(member.role);
  const changed = role !== member.role;

  return (
    <ModalShell
      title="Change Role"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(role)}
            disabled={!changed}
            className={cn(
              "h-10 rounded-lg px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
              changed
                ? "bg-brand-blue hover:bg-brand-blue-hover text-white active:scale-[0.98]"
                : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
            )}
          >
            Save Role
          </button>
        </>
      }
    >
      <p className="text-ink-muted text-sm">
        Choose what <span className="text-ink font-semibold">{member.name}</span> can do in this workspace.
      </p>

      <div className="mt-4">
        <RoleChooser value={role} onChange={setRole} label="Role" />
      </div>

      {changed && (
        <div
          className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-black/[0.07] bg-black/[0.015] px-3.5 py-2.5 text-xs"
          style={{ animation: `fade-in-up 200ms ${EASE} both` }}
        >
          <RolePill role={member.role} className="opacity-60" />
          <ArrowRight className="text-ink-muted size-3.5" />
          <RolePill role={role} />
          <span className="text-ink-muted">{ROLE_META[role].access}</span>
        </div>
      )}
    </ModalShell>
  );
}
