"use client";

/**
 * Small presentational atoms for the Contacts module, mirroring the proven
 * Outreach contacts patterns (copied locally so Leads stays self-contained).
 */
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Minus, Plus, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTACT_TAGS, contactTierMeta, type ContactTier } from "@/lib/contacts";

export const EASE = "cubic-bezier(0.23,1,0.32,1)";
export const INPUT =
  "text-ink placeholder:text-ink-muted/55 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none transition-colors";

/* ------------------------------- monogram --------------------------------- */

export function Monogram({ initials, tier, className }: { initials: string; tier?: ContactTier; className?: string }) {
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center", className)}>
      <span className="bg-accent-blue/10 text-accent-blue grid size-full place-items-center rounded-full text-xs font-semibold">
        {initials}
      </span>
      {tier && (
        <span className={cn("absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-white", contactTierMeta(tier).dot)} />
      )}
    </span>
  );
}

/* -------------------------------- checkbox -------------------------------- */

export function CheckBox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        checked || indeterminate ? "bg-accent-blue border-accent-blue text-white" : "border-black/25 bg-white hover:border-black/40"
      )}
    >
      {indeterminate ? <Minus className="size-3" strokeWidth={3} /> : checked ? <Check className="size-3" strokeWidth={3} /> : null}
    </button>
  );
}

/** Presentational checkbox (no button) for when the whole row is the control. */
export function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors",
        checked ? "bg-accent-blue border-accent-blue text-white" : "border-black/25 bg-white"
      )}
    >
      {checked ? <Check className="size-3" strokeWidth={3} /> : null}
    </span>
  );
}

/* ------------------------------- tier badge ------------------------------- */

export function TierBadge({ tier }: { tier: ContactTier }) {
  const m = contactTierMeta(tier);
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", m.badge)}>{m.name}</span>
  );
}

/* ------------------------------- tag editor ------------------------------- */

export function TagEditor({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState("");
  const suggestions = CONTACT_TAGS.filter((t) => !value.includes(t));

  function add(tag: string) {
    const t = tag.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
  }

  return (
    <div>
      <div className="focus-within:border-accent-blue/50 flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-black/15 bg-white p-2 transition-colors">
        {value.map((t) => (
          <span
            key={t}
            className="bg-accent-blue/10 text-accent-blue inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2 text-xs font-medium"
            style={{ animation: `scale-in 140ms ${EASE} both` }}
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              aria-label={`Remove ${t}`}
              className="hover:bg-accent-blue/20 grid size-4 place-items-center rounded-full transition-colors"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && input.trim()) {
              e.preventDefault();
              add(input);
            } else if (e.key === "Backspace" && !input && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={value.length ? "" : "Type a tag and press Enter"}
          className="text-ink placeholder:text-ink-muted/55 min-w-[120px] flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-ink-muted/70 text-[11px]">Suggested:</span>
          {suggestions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => add(t)}
              className="text-ink-muted hover:border-accent-blue/40 hover:text-accent-blue inline-flex items-center gap-0.5 rounded-full border border-black/12 px-2 py-0.5 text-[11px] font-medium transition-colors active:scale-95"
            >
              <Plus className="size-2.5" />
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- list chip ------------------------------- */

const LIST_TINT: Record<string, string> = {
  "accent-blue": "bg-accent-blue/10 text-accent-blue",
  "brand-green": "bg-brand-green/10 text-brand-green",
  "brand-orange": "bg-brand-orange/10 text-brand-orange",
  gold: "bg-gold/25 text-gold-foreground",
  red: "bg-red-50 text-red-600",
};
export function listTint(color: string): string {
  return LIST_TINT[color] ?? "bg-black/[0.05] text-ink-muted";
}

export function ListChip({ name, color, onRemove }: { name: string; color: string; onRemove?: () => void }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", listTint(color))}>
      {name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove from ${name}`} className="grid size-3.5 place-items-center rounded-full hover:bg-black/10">
          <X className="size-2.5" />
        </button>
      )}
    </span>
  );
}

/* ------------------------------ filter select ----------------------------- */

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  const isAll = value === "all" || value.startsWith("All");
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Filter by ${label}`}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40",
          isAll ? "text-ink-muted border-black/12 bg-white hover:border-black/25" : "border-accent-blue/40 bg-accent-blue/[0.06] text-ink"
        )}
      >
        {current?.label ?? label}
        <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="listbox"
            className="absolute left-0 z-40 mt-2 max-h-72 min-w-[200px] overflow-y-auto rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
            style={{ animation: `scale-in 160ms ${EASE} both`, transformOrigin: "top left" }}
          >
            {options.map((o) => {
              const selected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="hover:bg-accent-blue/[0.06] flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none"
                >
                  <span className={cn("truncate", selected ? "text-ink font-medium" : "text-ink-muted")}>{o.label}</span>
                  {selected && <Check className="text-accent-blue size-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ modal shell ------------------------------- */

/** Centered modal scaffold (backdrop + popping card + Escape to close). */
export function ModalShell({
  title,
  onClose,
  children,
  footer,
  width = "max-w-md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-ink/40 absolute inset-0" style={{ animation: `fade-in 150ms ${EASE} both` }} onClick={onClose} aria-hidden />
      <div className={cn("modal-pop relative flex max-h-[90vh] w-full flex-col rounded-2xl bg-white shadow-2xl shadow-black/25", width)}>
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3.5">
          <h2 className="text-ink text-base font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted hover:bg-black/[0.05] hover:text-ink grid size-8 place-items-center rounded-lg transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2.5 border-t border-black/[0.06] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* ----------------------------- confirm dialog ----------------------------- */

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="cd-title">
      <div className="bg-ink/40 absolute inset-0" style={{ animation: `fade-in 150ms ${EASE} both` }} onClick={onCancel} aria-hidden />
      <div className="modal-pop relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl shadow-black/25">
        <div className="flex gap-3.5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red-50 text-red-500">
            <TriangleAlert className="size-5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id="cd-title" className="text-ink text-base font-bold">{title}</h2>
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
            Cancel
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
