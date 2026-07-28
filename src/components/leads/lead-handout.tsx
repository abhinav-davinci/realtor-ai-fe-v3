"use client";

/**
 * The moment a calling run's new leads are handed out to the team.
 *
 * Distribution is automatic, so without this it happens in silence and the
 * admin has to go and check. The animation exists to EXPLAIN, not to decorate:
 * leads visibly leave the agent and land on named people, which is the one
 * thing a static line of text cannot show.
 *
 * A run finishes a couple of times a day at most, so this sits in the "rare"
 * budget where a little delight is affordable. Everything is transform and
 * opacity on CSS keyframes (off the main thread, and the completion moment is
 * already busy writing to localStorage). Reduced motion keeps the people and
 * the counts and drops the flight.
 */
import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { initialsOf, memberById } from "@/lib/team";
import type { DistributionResult } from "@/lib/lead-distribution";

/* Layout is fixed so the flight path is arithmetic rather than a measurement:
   avatar pitch and drop are all the geometry a dot needs. */
const AVATAR = 44; // size-11
const GAP = 12; // gap-3
const PITCH = AVATAR + GAP;
const DROP = 72; // agent centre down to avatar centre
const MAX_FACES = 6;
const MAX_DOTS_EACH = 3;

/* Fast out of the agent, settling into the person. */
const TRAVEL = 560;
const TRAVEL_EASE = "cubic-bezier(0.32,0.72,0,1)";
const EASE_OUT = "cubic-bezier(0.23,1,0.32,1)";
const STAGGER = 70;
const START = 260; // let the faces arrive before anything is thrown at them

export function LeadHandout({ result }: { result: DistributionResult }) {
  const rows = Object.entries(result.byMember)
    .map(([id, count]) => ({ member: memberById(id), count }))
    .filter((r): r is { member: NonNullable<ReturnType<typeof memberById>>; count: number } => !!r.member)
    .sort((a, b) => b.count - a.count);

  if (rows.length === 0) return null;

  const faces = rows.slice(0, MAX_FACES);
  const hidden = rows.length - faces.length;

  // Each dot's flight, laid out before render so delays and offsets agree.
  const dots: { key: string; tx: number; ty: number; delay: number }[] = [];
  faces.forEach((row, i) => {
    const tx = (i - (faces.length - 1) / 2) * PITCH;
    for (let n = 0; n < Math.min(row.count, MAX_DOTS_EACH); n++) {
      dots.push({ key: `${row.member.id}-${n}`, tx, ty: DROP, delay: START + i * STAGGER + n * 90 });
    }
  });
  // A face reacts when its first lead gets there.
  const landAt = (i: number) => START + i * STAGGER + TRAVEL;

  return (
    <div className="lead-handout border-accent-blue/25 bg-accent-blue/[0.05] overflow-hidden rounded-xl border px-4 pt-4 pb-3.5">
      <div className="relative grid place-items-center">
        {/* the agent, and the leads leaving it */}
        <span
          className="bg-accent-blue relative grid size-9 place-items-center rounded-full text-white shadow-sm motion-safe:animate-[success-pop_420ms_cubic-bezier(0.23,1,0.32,1)_both]"
          aria-hidden
        >
          <Sparkles className="size-4.5" />
          {dots.map((d) => (
            <span
              key={d.key}
              className="lead-dot bg-accent-blue absolute size-2 rounded-full opacity-0 shadow-[0_0_6px_rgba(47,107,237,0.5)] motion-safe:animate-[lead-fly_var(--dur)_var(--ease)_var(--delay)_both]"
              style={
                {
                  "--tx": `${d.tx}px`,
                  "--ty": `${d.ty}px`,
                  "--dur": `${TRAVEL}ms`,
                  "--ease": TRAVEL_EASE,
                  "--delay": `${d.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </span>

        {/* the people they landed on */}
        <div className="relative mt-[28px] flex items-start justify-center" style={{ gap: `${GAP}px` }}>
          {faces.map(({ member, count }, i) => (
            <div key={member.id} className="flex w-11 flex-col items-center">
              <span
                className="relative grid size-11 place-items-center motion-safe:opacity-0 motion-safe:animate-[fade-in-up_280ms_var(--ease)_var(--delay)_both]"
                style={{ "--ease": EASE_OUT, "--delay": `${i * 45}ms` } as CSSProperties}
              >
                {/* the ripple as the lead arrives */}
                <span
                  aria-hidden
                  className="border-accent-blue/40 absolute inset-0 rounded-full border-2 opacity-0 motion-safe:animate-[broadcast-ring_700ms_ease-out_var(--delay)_both] motion-reduce:hidden"
                  style={{ "--delay": `${landAt(i)}ms` } as CSSProperties}
                />
                <span
                  className="bg-accent-blue/15 text-accent-blue grid size-11 place-items-center rounded-full text-xs font-bold motion-safe:animate-[lead-land_340ms_ease-out_var(--delay)_both]"
                  style={{ "--delay": `${landAt(i)}ms` } as CSSProperties}
                  title={member.name}
                >
                  {initialsOf(member.name)}
                </span>
                <span
                  className="bg-accent-blue absolute -right-1 -bottom-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold text-white ring-2 ring-white motion-safe:opacity-0 motion-safe:animate-[success-pop_360ms_cubic-bezier(0.34,1.56,0.64,1)_var(--delay)_both]"
                  style={{ "--delay": `${landAt(i) + 40}ms` } as CSSProperties}
                >
                  {count}
                </span>
              </span>
              <span
                className="text-ink-muted mt-1.5 max-w-11 truncate text-[10px] font-medium motion-safe:opacity-0 motion-safe:animate-[fade-in-up_280ms_var(--ease)_var(--delay)_both]"
                style={{ "--ease": EASE_OUT, "--delay": `${landAt(i) + 60}ms` } as CSSProperties}
              >
                {member.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p
        className={cn(
          "text-ink mt-3 text-center text-sm font-bold",
          "motion-safe:opacity-0 motion-safe:animate-[fade-in-up_320ms_var(--ease)_var(--delay)_both]"
        )}
        style={{ "--ease": EASE_OUT, "--delay": `${landAt(faces.length - 1) + 120}ms` } as CSSProperties}
      >
        {result.assigned} {result.assigned === 1 ? "lead" : "leads"} shared across {rows.length}{" "}
        {rows.length === 1 ? "person" : "people"}
        {hidden > 0 && <span className="text-ink-muted font-medium"> (+{hidden} more)</span>}
      </p>
      <p
        className="text-ink-muted mt-0.5 text-center text-xs motion-safe:opacity-0 motion-safe:animate-[fade-in-up_320ms_var(--ease)_var(--delay)_both]"
        style={{ "--ease": EASE_OUT, "--delay": `${landAt(faces.length - 1) + 180}ms` } as CSSProperties}
      >
        Each one went to whoever was holding the fewest. They can start calling now.
      </p>
    </div>
  );
}

/** The same fact, without the show: for places you glance at often. */
export function LeadHandoutLine({ result, className }: { result: DistributionResult; className?: string }) {
  const rows = Object.entries(result.byMember)
    .map(([id, count]) => ({ member: memberById(id), count }))
    .filter((r) => r.member);
  if (rows.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex -space-x-1.5">
        {rows.slice(0, 4).map(({ member }) => (
          <span
            key={member!.id}
            title={member!.name}
            className="bg-accent-blue/15 text-accent-blue grid size-6 place-items-center rounded-full text-[9px] font-bold ring-2 ring-white"
          >
            {initialsOf(member!.name)}
          </span>
        ))}
      </div>
      <span className="text-ink-muted text-xs">
        Shared across {rows.length} {rows.length === 1 ? "person" : "people"}
      </span>
    </div>
  );
}
