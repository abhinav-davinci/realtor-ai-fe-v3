"use client";

/**
 * The four counters above the member table. Total is the whole team; the other
 * three are its subsets, so Active + Inactive + Pending always equals Total.
 */
import { Clock, Timer, UserRoundCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN, type SeatUsage } from "@/lib/team";

export interface TeamCounts {
  total: number;
  pending: number;
  active: number;
  inactive: number;
}

export function TeamStats({ counts, seats }: { counts: TeamCounts; seats: SeatUsage }) {
  const full = seats.remaining === 0;
  const tiles = [
    {
      icon: Users,
      tint: "text-accent-blue",
      value: counts.total,
      label: "Total Members",
      note: (
        <span className={cn("text-[11px] font-semibold tabular-nums", full ? "text-brand-orange" : "text-ink-muted")}>
          {seats.used} / {PLAN.seats} seats
        </span>
      ),
    },
    { icon: Timer, tint: "text-brand-orange", value: counts.pending, label: "Pending Invitations" },
    { icon: UserRoundCheck, tint: "text-brand-green", value: counts.active, label: "Active Members", dot: "bg-brand-green" },
    { icon: Clock, tint: "text-ink-muted", value: counts.inactive, label: "Inactive Members", dot: "bg-ink-muted/50" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map(({ icon: Icon, tint, value, label, note, dot }, i) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 motion-safe:opacity-0 motion-safe:animate-[fade-in-up_320ms_ease-out_both]"
          style={{ animationDelay: `${i * 45}ms` }}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-sm">
            <Icon className={cn("size-[18px]", tint)} strokeWidth={1.75} />
          </span>
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-ink text-lg leading-none font-bold tabular-nums">{value}</span>
            <span className="text-ink-muted inline-flex items-center gap-1.5 text-xs font-medium">
              {dot && <span className={cn("size-1.5 rounded-full", dot)} aria-hidden />}
              {label}
            </span>
            {note}
          </div>
        </div>
      ))}
    </div>
  );
}
