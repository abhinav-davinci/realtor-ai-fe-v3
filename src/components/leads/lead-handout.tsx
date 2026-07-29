"use client";

/**
 * The moment a calling run's new leads are shared out across the team.
 *
 * Distribution is automatic, so without this it happens in silence and the
 * admin has to go and check. What is worth showing is not who got what (that
 * is the Lead Distribution board's job, and tying a celebration to per-member
 * identity breaks as the team grows) but that one batch was divided into fair
 * shares with nothing left over.
 *
 * So it is drawn as a single slim measure that wipes in already divided, with
 * each share's width carrying its count. Then the graphic lifts away. A
 * celebration that leaves shapes sitting on the screen afterwards is just
 * clutter, and a row of blocks that outstays the motion reads as a loading
 * skeleton. What remains is the confirmation line, which is the part with
 * lasting value.
 *
 * A run finishes a couple of times a day at most, which is the "rare" budget
 * where a little delight is affordable. Transform, opacity and clip-path only,
 * on CSS keyframes so it runs off the main thread while the completion moment
 * is busy writing to localStorage. Reduced motion skips the graphic entirely
 * and shows the confirmation on its own.
 */
import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DistributionResult } from "@/lib/lead-distribution";

const EASE_OUT = "cubic-bezier(0.23,1,0.32,1)";
/** Slim on purpose: a heavy bar reads as a placeholder, a fine one as a measure. */
const GAP = 3;
const WIPE = 620;
const WIPE_AT = 120;
const TEXT_AT = 460;
/** Long enough to be read, short enough not to sit there. */
const CLEAR_AT = 1250;
/** Past this many people the shares get too fine to read, so they merge. */
const MAX_SHARES = 14;

export function LeadHandout({ result }: { result: DistributionResult }) {
  const counts = Object.values(result.byMember).sort((a, b) => b - a);
  if (counts.length === 0) return null;

  const shares = counts.slice(0, MAX_SHARES);
  const total = shares.reduce((sum, n) => sum + n, 0);
  const people = counts.length;

  return (
    <div className="lead-handout border-accent-blue/20 bg-accent-blue/[0.04] rounded-xl border px-5 py-4">
      {/* The measure. Fixed height, so when it clears the space it leaves reads
          as spacing rather than a hole. */}
      <div className="h-2" aria-hidden>
        <div
          className="h-full motion-safe:animate-[measure-clear_380ms_ease-out_var(--clear)_both]"
          style={{ "--clear": `${CLEAR_AT}ms` } as CSSProperties}
        >
          <div
            className="flex h-full motion-safe:animate-[measure-wipe_var(--wipe)_var(--ease)_var(--at)_both]"
            style={
              {
                gap: `${GAP}px`,
                "--wipe": `${WIPE}ms`,
                "--ease": EASE_OUT,
                "--at": `${WIPE_AT}ms`,
              } as CSSProperties
            }
          >
            {shares.map((count, i) => (
              <span
                key={i}
                className="from-accent-blue to-accent-blue/75 relative block h-full overflow-hidden rounded-full bg-gradient-to-b shadow-[0_1px_4px_rgba(47,107,237,0.28)]"
                style={{ flexBasis: `${(count / total) * 100}%`, minWidth: 10 }}
              >
                {/* a light passing along the measure, share by share */}
                <span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/55 to-transparent motion-safe:animate-[shimmer_1.1s_ease-in-out_var(--at)_both]"
                  style={{ "--at": `${WIPE_AT + 260 + i * 70}ms` } as CSSProperties}
                />
              </span>
            ))}
          </div>
        </div>
      </div>

      <p
        className="text-ink mt-3 flex items-center justify-center gap-1.5 text-center text-sm font-bold motion-safe:opacity-0 motion-safe:animate-[fade-in-up_320ms_var(--ease)_var(--at)_both]"
        style={{ "--ease": EASE_OUT, "--at": `${TEXT_AT}ms` } as CSSProperties}
      >
        <span className="bg-accent-blue grid size-4 shrink-0 place-items-center rounded-full text-white">
          <Check className="size-2.5" strokeWidth={3.5} />
        </span>
        {result.assigned} {result.assigned === 1 ? "lead" : "leads"} shared evenly across {people}{" "}
        {people === 1 ? "person" : "people"}
      </p>
      <p
        className="text-ink-muted mt-1 text-center text-xs motion-safe:opacity-0 motion-safe:animate-[fade-in-up_320ms_var(--ease)_var(--at)_both]"
        style={{ "--ease": EASE_OUT, "--at": `${TEXT_AT + 70}ms` } as CSSProperties}
      >
        Every one went to whoever was holding the fewest. They can start calling now.
      </p>
    </div>
  );
}

/** The same fact, without the show: for places you glance at often. */
export function LeadHandoutLine({ result, className }: { result: DistributionResult; className?: string }) {
  const counts = Object.values(result.byMember).sort((a, b) => b - a);
  if (counts.length === 0) return null;

  const shares = counts.slice(0, 8);
  const total = shares.reduce((sum, n) => sum + n, 0);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex h-1.5 w-20 shrink-0 items-stretch gap-[2px]" aria-hidden>
        {shares.map((count, i) => (
          <span key={i} className="bg-accent-blue/70 rounded-full" style={{ flexBasis: `${(count / total) * 100}%` }} />
        ))}
      </span>
      <span className="text-ink-muted text-xs">
        Shared across {counts.length} {counts.length === 1 ? "person" : "people"}
      </span>
    </div>
  );
}
