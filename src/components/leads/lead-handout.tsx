"use client";

/**
 * The moment a calling run's new leads are shared out across the team.
 *
 * Distribution is automatic, so without this it happens in silence and the
 * admin has to go and check. The animation exists to EXPLAIN, not to decorate,
 * and the thing worth explaining is not who got what: it is that one batch was
 * split into fair shares with nothing left over. So the batch is a block, the
 * shares are blocks, and their widths carry the counts. An even split is then
 * self-evident at a glance, with no names, no faces, and nothing to look up.
 *
 * A run finishes a couple of times a day at most, which is the "rare" budget
 * where a little delight is affordable. Everything is transform and opacity on
 * CSS keyframes (off the main thread, and the completion moment is already busy
 * writing to localStorage). Reduced motion keeps the shares and drops the split.
 */
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { DistributionResult } from "@/lib/lead-distribution";

/** Gap between shares, in px. Also how far each one starts collapsed inward. */
const GAP = 8;
/** Opening from the middle outward, per step away from centre. */
const STAGGER = 55;
const START = 220;
const OPEN = 520;
const EASE_OUT = "cubic-bezier(0.23,1,0.32,1)";
/** Past this many people the bars get too thin to read, so they merge. */
const MAX_SHARES = 12;

export function LeadHandout({ result }: { result: DistributionResult }) {
  const counts = Object.values(result.byMember).sort((a, b) => b - a);
  if (counts.length === 0) return null;

  const shares = counts.length <= MAX_SHARES ? counts : counts.slice(0, MAX_SHARES);
  const total = shares.reduce((sum, n) => sum + n, 0);
  const mid = (shares.length - 1) / 2;
  // The last share to arrive sets when the copy is allowed to resolve.
  const settled = START + Math.ceil(mid) * STAGGER + OPEN;

  return (
    <div className="lead-handout border-accent-blue/25 bg-accent-blue/[0.05] overflow-hidden rounded-xl border px-5 pt-5 pb-4">
      {/* the batch, before it is split */}
      <div className="flex justify-center">
        <span
          className="bg-accent-blue inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm motion-safe:animate-[success-pop_420ms_cubic-bezier(0.23,1,0.32,1)_both]"
          aria-hidden
        >
          <span className="tabular-nums">{result.assigned}</span>
          {result.assigned === 1 ? "new lead" : "new leads"}
        </span>
      </div>

      {/* split into one share per person, width carrying the count */}
      <div className="relative mt-4">
        <div
          className="flex origin-center items-end justify-center motion-safe:animate-[share-spread_var(--open)_var(--ease)_var(--delay)_both]"
          style={
            {
              gap: `${GAP}px`,
              "--open": `${OPEN}ms`,
              "--ease": EASE_OUT,
              "--delay": `${START}ms`,
            } as CSSProperties
          }
        >
          {shares.map((count, i) => {
            const step = Math.abs(i - mid);
            const delay = START + step * STAGGER;
            return (
              <span
                key={i}
                className="relative block h-9 origin-bottom overflow-hidden rounded-md motion-safe:opacity-0 motion-safe:animate-[share-open_var(--open)_var(--ease)_var(--delay)_both]"
                style={
                  {
                    // Proportional to the share, with a floor so one lead still reads.
                    flexBasis: `${(count / total) * 100}%`,
                    minWidth: 26,
                    "--open": `${OPEN}ms`,
                    "--ease": EASE_OUT,
                    "--delay": `${delay}ms`,
                  } as CSSProperties
                }
              >
                <span className="bg-accent-blue/85 absolute inset-0 rounded-md" />
                {/* a brightening as it lands, then it settles back */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-md bg-white/35 opacity-0 motion-safe:animate-[share-settle_380ms_ease-out_var(--delay)_both]"
                  style={{ "--delay": `${delay + OPEN * 0.6}ms` } as CSSProperties}
                />
              </span>
            );
          })}
        </div>

        {/* the line they come to rest on */}
        <span
          aria-hidden
          className="bg-accent-blue/25 mt-1.5 block h-px w-full origin-center motion-safe:animate-[share-line_var(--open)_var(--ease)_var(--delay)_both]"
          style={{ "--open": `${OPEN}ms`, "--ease": EASE_OUT, "--delay": `${START}ms` } as CSSProperties}
        />
      </div>

      <p
        className="text-ink mt-3.5 text-center text-sm font-bold motion-safe:opacity-0 motion-safe:animate-[fade-in-up_320ms_var(--ease)_var(--delay)_both]"
        style={{ "--ease": EASE_OUT, "--delay": `${settled - 120}ms` } as CSSProperties}
      >
        Shared evenly across {counts.length} {counts.length === 1 ? "person" : "people"}
      </p>
      <p
        className="text-ink-muted mt-0.5 text-center text-xs motion-safe:opacity-0 motion-safe:animate-[fade-in-up_320ms_var(--ease)_var(--delay)_both]"
        style={{ "--ease": EASE_OUT, "--delay": `${settled - 60}ms` } as CSSProperties}
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
      <span className="flex h-1.5 w-20 shrink-0 items-stretch gap-0.5" aria-hidden>
        {shares.map((count, i) => (
          <span
            key={i}
            className="bg-accent-blue/70 rounded-full"
            style={{ flexBasis: `${(count / total) * 100}%` }}
          />
        ))}
      </span>
      <span className="text-ink-muted text-xs">
        Shared across {counts.length} {counts.length === 1 ? "person" : "people"}
      </span>
    </div>
  );
}
