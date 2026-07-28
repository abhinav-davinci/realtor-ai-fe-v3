"use client";

/**
 * What you see before anyone is on the team: the invite prompt, then a short
 * course on what the two roles actually mean, so the role choice in the invite
 * modal is an informed one rather than a guess.
 */
import { Lightbulb, Lock, Plus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleInfoCards } from "./role-cards";

const ASSURANCES = ["Secure", "Role based access", "Activity tracking", "Audit logs"];

export function TeamEmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <>
      <div
        className="grid place-items-center rounded-2xl border border-dashed border-black/[0.14] px-6 py-14 text-center motion-safe:opacity-0 motion-safe:animate-[fade-in-up_320ms_ease-out_both]"
      >
        <TeamIllustration />

        <h2 className="text-ink mt-5 text-lg font-bold">No Team Members Yet</h2>
        <p className="text-ink-muted mx-auto mt-1.5 max-w-lg text-sm leading-relaxed">
          Start by inviting your first team member. Assign roles based on responsibilities and collaborate securely
          within your organization.
        </p>

        <Button
          onClick={onInvite}
          className="bg-brand-blue hover:bg-brand-blue-hover mt-5 h-11 rounded-lg px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out active:scale-[0.98]"
        >
          <Plus className="size-4" /> Invite Member
        </Button>

        <p className="text-ink-muted/70 mt-4 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-xs">
          <Lock className="size-3.5" />
          {ASSURANCES.map((a, i) => (
            <span key={a} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="bg-ink-muted/40 size-1 rounded-full" aria-hidden />}
              {a}
            </span>
          ))}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-ink text-base font-bold">Understand User Roles</h2>
        <p className="text-ink-muted mt-1 text-sm">Assign roles based on responsibilities and access needs.</p>
        <div className="mt-4">
          <RoleInfoCards />
        </div>
      </section>

      <p className="text-ink-muted mt-6 flex items-start gap-2.5 text-xs leading-relaxed">
        <span className="bg-accent-blue/10 text-accent-blue grid size-7 shrink-0 place-items-center rounded-full">
          <Lightbulb className="size-3.5" />
        </span>
        <span className="pt-1.5">
          <span className="text-ink font-semibold">Pro Tip:</span> You can always change roles, resend invitations, or
          remove members from the team list once they are added.
        </span>
      </p>
    </>
  );
}

/** A muted team mark with an open question over it: nobody here yet. */
function TeamIllustration() {
  return (
    <span className="relative grid size-24 place-items-center" aria-hidden>
      <span className="absolute inset-0 rounded-full bg-black/[0.03]" />
      <UsersRound className="text-ink-muted/25 relative size-12" strokeWidth={1.5} />
      <span className="text-ink-muted/50 absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-black/[0.05] text-sm font-bold">
        ?
      </span>
    </span>
  );
}
