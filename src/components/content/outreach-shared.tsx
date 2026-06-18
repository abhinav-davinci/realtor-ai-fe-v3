"use client";

/**
 * Small presentational atoms shared across the Outreach shell, inbox, and the
 * secondary tab panels. Kept here (not in the shell) so none of those files
 * import each other in a cycle.
 */
import { cn } from "@/lib/utils";
import type { PlatformKey } from "@/lib/outreach";
import { FacebookGlyph, InstagramGlyph, WhatsappGlyph } from "./brand-glyphs";

/** Strong ease-out used for every entrance / slide in this feature. */
export const EASE_OUT = "cubic-bezier(0.23,1,0.32,1)";

const GLYPHS: Record<PlatformKey, React.ComponentType<{ className?: string }>> = {
  whatsapp: WhatsappGlyph,
  facebook: FacebookGlyph,
  instagram: InstagramGlyph,
};

export function PlatformGlyph({ platform, className }: { platform: PlatformKey; className?: string }) {
  const Glyph = GLYPHS[platform];
  return <Glyph className={className} />;
}

/**
 * Round monogram avatar with an optional presence dot. Tinted with the
 * accent-blue token (the same neutral tone the lead UI uses for initials).
 */
export function Monogram({
  initials,
  online,
  className,
}: {
  initials: string;
  online?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center", className)}>
      <span className="bg-accent-blue/10 text-accent-blue grid size-full place-items-center rounded-full text-xs font-semibold">
        {initials}
      </span>
      {online !== undefined && (
        <span
          className={cn(
            "absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-white",
            online ? "bg-brand-green" : "bg-ink-muted/40"
          )}
        />
      )}
    </span>
  );
}

export type PillTone = "good" | "warm" | "cold" | "info" | "neutral";

const PILL_TONES: Record<PillTone, string> = {
  good: "bg-brand-green/10 text-brand-green",
  warm: "bg-brand-orange/10 text-brand-orange",
  cold: "bg-red-50 text-red-500",
  info: "bg-accent-blue/10 text-accent-blue",
  neutral: "bg-black/[0.05] text-ink-muted",
};

export function StatusPill({
  tone,
  children,
  dot,
  className,
}: {
  tone: PillTone;
  children: React.ReactNode;
  /** Show a leading status dot in the tone color. */
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        PILL_TONES[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Indian-formatted integer, e.g. 1840 -> "1,840". */
export function inr(n: number): string {
  return n.toLocaleString("en-IN");
}
