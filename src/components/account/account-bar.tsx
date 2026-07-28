"use client";

/**
 * Where the plan stands, above every account page. The workspace name and your
 * role live in the Settings sidebar header, so this strip only answers the one
 * question the account pages keep raising: how many seats are left.
 */
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN, TEAM_CHANGED_EVENT, listMembers, seatUsage, type SeatUsage } from "@/lib/team";

/** Server and first client render both show the no-members copy, so the seat
 * numbers can never cause a hydration mismatch. */
const EMPTY: SeatUsage = { used: 0, total: PLAN.seats, remaining: PLAN.seats };

export function PlanStrip() {
  const [seats, setSeats] = useState<SeatUsage>(EMPTY);

  const reload = useCallback(() => setSeats(seatUsage(listMembers())), []);

  useEffect(() => {
    // Hydrating from localStorage after mount is the point: the server cannot
    // know the seat count, so the first client render must match the server's.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    reload();
    window.addEventListener(TEAM_CHANGED_EVENT, reload);
    return () => window.removeEventListener(TEAM_CHANGED_EVENT, reload);
  }, [reload]);

  const full = seats.remaining === 0 && seats.used > 0;

  return (
    <div className="flex shrink-0 justify-end border-b border-black/[0.06] bg-white px-4 py-2.5 sm:px-6 lg:px-8">
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border px-3 py-1.5 text-xs transition-colors duration-200 ease-out",
          full ? "border-red-200 bg-red-50/70" : "border-brand-orange/25 bg-brand-orange/[0.07]"
        )}
      >
        <Sparkles className={cn("size-3.5 shrink-0", full ? "text-red-500" : "text-brand-orange")} />
        <span className="text-ink font-semibold">
          Your Plan: <span className={full ? "text-red-600" : "text-brand-orange"}>{PLAN.name}</span>
        </span>
        <span className="text-ink-muted/40" aria-hidden>
          |
        </span>
        {seats.used === 0 ? (
          <span className="text-ink-muted">
            {PLAN.seats} Seats &bull; Up to {PLAN.seats} team members
          </span>
        ) : (
          <span className="text-ink-muted tabular-nums">
            {PLAN.seats} Seats &middot; {seats.used} Used &middot;{" "}
            <span className={cn("font-semibold", full ? "text-red-600" : "text-ink")}>{seats.remaining} Remaining</span>
          </span>
        )}
        <span className="text-ink-muted/40" aria-hidden>
          |
        </span>
        <button
          type="button"
          className={cn(
            "group inline-flex items-center gap-1 rounded font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40",
            full ? "text-red-600 hover:text-red-700" : "text-brand-orange hover:text-brand-orange-hover"
          )}
        >
          {seats.used === 0 ? "View Plan Details" : "Upgrade Now"}
          <ArrowRight className="size-3.5 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
