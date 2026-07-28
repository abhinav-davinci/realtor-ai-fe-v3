"use client";

/**
 * Small presentational atoms for the account screens, mirroring the proven
 * Contacts patterns (copied locally so Account stays self-contained, the same
 * way components/leads/contacts/ui.tsx did).
 */
import { Crown, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_META, STATUS_META, type DisplayStatus, type MemberRole } from "@/lib/team";

export const EASE = "cubic-bezier(0.23,1,0.32,1)";
export const INPUT =
  "text-ink placeholder:text-ink-muted/55 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none transition-colors";

/* -------------------------------- avatar ---------------------------------- */

/** Initials avatar for a member. Status has its own column, so the avatar stays
 * plain rather than carrying a second status signal. */
export function MemberAvatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={cn(
        "bg-accent-blue/10 text-accent-blue grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
        className
      )}
    >
      {initials}
    </span>
  );
}

/* --------------------------------- pills ---------------------------------- */

export function RolePill({ role, className }: { role: MemberRole; className?: string }) {
  const meta = ROLE_META[role];
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", meta.badge, className)}>
      {meta.name}
    </span>
  );
}

const TONES: Record<"good" | "warm" | "cold" | "neutral", string> = {
  good: "bg-brand-green/10 text-brand-green",
  warm: "bg-brand-orange/10 text-brand-orange",
  cold: "bg-red-50 text-red-500",
  neutral: "bg-black/[0.05] text-ink-muted",
};

export function MemberStatusPill({ status, className }: { status: DisplayStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        TONES[meta.tone],
        className
      )}
    >
      {meta.name}
    </span>
  );
}

/* ------------------------------- role glyph ------------------------------- */

/** The crown / person mark that runs alongside a role everywhere it appears. */
export function RoleGlyph({ role, className }: { role: MemberRole; className?: string }) {
  const Icon = role === "admin" ? Crown : UserRound;
  return (
    <span className={cn("text-ink-muted grid size-8 shrink-0 place-items-center rounded-full bg-black/[0.05]", className)}>
      <Icon className="size-4" strokeWidth={1.75} />
    </span>
  );
}
