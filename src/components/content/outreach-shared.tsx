"use client";

/**
 * Small presentational atoms shared across the Outreach shell, inbox, and the
 * secondary tab panels. Kept here (not in the shell) so none of those files
 * import each other in a cycle.
 */
import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";
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

/**
 * Centered confirmation dialog for destructive actions. Backdrop fades in, the
 * card pops from center (reuses the `modal-pop` keyframe). Escape and a backdrop
 * click cancel; focus lands on Cancel so a stray Enter never deletes.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="bg-ink/40 absolute inset-0"
        style={{ animation: `fade-in 150ms ${EASE_OUT} both` }}
        onClick={onCancel}
        aria-hidden
      />
      <div className="modal-pop relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl shadow-black/25">
        <div className="flex gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-500">
            <TriangleAlert className="size-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id="confirm-dialog-title" className="text-ink text-base font-bold">
              {title}
            </h2>
            <p className="text-ink-muted mt-1 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-colors outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition-[background-color,transform] outline-none hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-red-400/50 active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
