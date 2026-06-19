"use client";

/**
 * Small presentational atoms shared across the Outreach shell, inbox, and the
 * secondary tab panels. Kept here (not in the shell) so none of those files
 * import each other in a cycle.
 */
import { useEffect, useRef } from "react";
import {
  BatteryFull,
  CheckCheck,
  ChevronLeft,
  ExternalLink,
  Image as ImageIcon,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Reply,
  Signal,
  Smile,
  TriangleAlert,
  Video,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformKey, TemplateButtonKind } from "@/lib/outreach";
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

/* ------------------------- whatsapp phone preview ------------------------- */

/** Reserved variables, with sample values used to render a realistic preview. */
export const VARIABLES = [
  { label: "First Name", token: "{{first_name}}", sample: "Ketan" },
  { label: "Last Name", token: "{{last_name}}", sample: "Mehta" },
  { label: "Full Name", token: "{{full_name}}", sample: "Ketan Mehta" },
  { label: "Contact Name", token: "{{contact_name}}", sample: "Ketan" },
  { label: "Project", token: "{{project}}", sample: "Skyline Vista" },
  { label: "Price", token: "{{price}}", sample: "₹1.25 Cr" },
];

/** Replace reserved variables with sample values so a preview reads like a real chat. */
export function renderVars(text: string): string {
  let out = text;
  for (const v of VARIABLES) out = out.split(v.token).join(v.sample);
  return out;
}

const PREVIEW_BTN_ICON: Record<TemplateButtonKind, React.ComponentType<{ className?: string }>> = {
  url: ExternalLink,
  call: Phone,
  reply: Reply,
  copy: Reply,
};

export interface PreviewButton {
  label: string;
  kind: TemplateButtonKind;
}

/**
 * Hyperrealistic WhatsApp phone mockup, shared by the template composer and the
 * broadcast review. Sized to fill the focused-editor height. Pass the message
 * parts; reserved variables are substituted with sample values.
 */
export function PhonePreview({
  media = null,
  mediaUrl = null,
  header = "",
  body,
  footer = "",
  buttons = [],
  title = "Skyline Realty",
  subtitle = "online",
}: {
  media?: "image" | "video" | null;
  mediaUrl?: string | null;
  header?: string;
  body: string;
  footer?: string;
  buttons?: PreviewButton[];
  title?: string;
  subtitle?: string;
}) {
  const empty = !header.trim() && !body.trim() && !media;
  const named = buttons.filter((b) => b.label.trim());

  return (
    <div className="relative mx-auto w-[320px]">
      {/* hardware side buttons */}
      <span aria-hidden className="bg-ink/70 absolute -left-[2px] top-[120px] h-7 w-[3px] rounded-l" />
      <span aria-hidden className="bg-ink/70 absolute -left-[2px] top-[164px] h-12 w-[3px] rounded-l" />
      <span aria-hidden className="bg-ink/70 absolute -right-[2px] top-[140px] h-16 w-[3px] rounded-r" />

      <div className="bg-ink rounded-[2.9rem] p-2.5 shadow-2xl shadow-black/30 ring-1 ring-white/10">
        <div
          className="bg-wa-paper relative flex flex-col overflow-hidden rounded-[2.4rem]"
          style={{ height: "min(640px, calc(100dvh - 15rem))", minHeight: 460 }}
        >
          {/* dynamic island */}
          <div className="absolute top-2 left-1/2 z-20 h-[22px] w-24 -translate-x-1/2 rounded-full bg-black" />

          {/* status bar */}
          <div className="bg-wa-header flex shrink-0 items-center justify-between px-5 pt-2.5 pb-1 text-[11px] font-medium text-white/95">
            <span className="tabular-nums">9:41</span>
            <span className="flex items-center gap-1.5">
              <Signal className="size-3" />
              <Wifi className="size-3" />
              <BatteryFull className="size-3.5" />
            </span>
          </div>

          {/* chat header */}
          <div className="bg-wa-header flex shrink-0 items-center gap-2.5 px-3 pt-1 pb-3 text-white">
            <ChevronLeft className="size-5 shrink-0 opacity-90" />
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15">
              <WhatsappGlyph className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm leading-tight font-semibold">{title}</p>
              <p className="text-[11px] text-white/75">{subtitle}</p>
            </div>
            <Video className="size-[18px] shrink-0 opacity-90" />
            <Phone className="size-[17px] shrink-0 opacity-90" />
            <MoreVertical className="size-[18px] shrink-0 opacity-90" />
          </div>

          {/* chat body */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3.5 py-4">
            <div className="bg-gold/40 text-gold-foreground mx-auto mb-1 max-w-[88%] rounded-md px-2.5 py-1.5 text-center text-[10px] leading-snug shadow-sm">
              Messages are end-to-end encrypted. No one outside this chat can read them.
            </div>
            {empty ? (
              <div className="text-ink-muted max-w-[85%] rounded-xl rounded-tl-sm bg-white/80 px-3 py-2 text-[13px] shadow-sm">
                Your message will appear here...
                <span className="text-ink-muted/50 mt-1 block text-right text-[10px]">12:30</span>
              </div>
            ) : (
              <div className="max-w-[86%]">
                <div className="relative rounded-xl rounded-tl-sm bg-white p-1.5 shadow-sm">
                  {media &&
                    (media === "image" && mediaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl} alt="" className="mb-1.5 h-36 w-full rounded-lg object-cover" />
                    ) : (
                      <div className="text-ink-muted/40 mb-1.5 grid h-36 place-items-center rounded-lg bg-gradient-to-br from-black/[0.07] to-black/[0.03]">
                        {media === "video" ? <Video className="size-8" /> : <ImageIcon className="size-8" />}
                      </div>
                    ))}
                  <div className="px-1.5 pb-0.5">
                    {header.trim() && <p className="text-ink text-[13px] leading-snug font-bold">{renderVars(header)}</p>}
                    {body.trim() && (
                      <p className="text-ink/90 mt-0.5 text-[13px] leading-snug whitespace-pre-wrap">{renderVars(body)}</p>
                    )}
                    {footer.trim() && <p className="text-ink-muted/70 mt-1.5 text-[11px]">{renderVars(footer)}</p>}
                    <p className="text-ink-muted/60 mt-1 flex items-center justify-end gap-1 text-[10px]">
                      12:30
                      <CheckCheck className="text-accent-blue size-3" />
                    </p>
                  </div>
                </div>

                {named.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {named.map((b, i) => {
                      const Icon = PREVIEW_BTN_ICON[b.kind];
                      return (
                        <div
                          key={`${b.label}-${i}`}
                          className="text-accent-blue flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-[13px] font-medium shadow-sm"
                        >
                          <Icon className="size-3.5" />
                          {b.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* compose bar */}
          <div className="bg-wa-paper flex shrink-0 items-center gap-2 px-2.5 pt-1 pb-3">
            <div className="flex h-10 flex-1 items-center gap-2 rounded-full bg-white px-3 shadow-sm">
              <Smile className="text-ink-muted/60 size-4.5 shrink-0" />
              <span className="text-ink-muted/50 flex-1 truncate text-[13px]">Message</span>
              <Paperclip className="text-ink-muted/60 size-4 shrink-0" />
            </div>
            <span className="bg-wa-header grid size-10 shrink-0 place-items-center rounded-full text-white shadow-sm">
              <Mic className="size-4.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
