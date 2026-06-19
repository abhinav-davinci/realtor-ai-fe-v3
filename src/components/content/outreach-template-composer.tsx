"use client";

/**
 * New Template composer: a guided form on the left and a live WhatsApp phone
 * preview on the right that updates as you type. Design mode only; on save it
 * builds a WaTemplate and hands it back to the Templates panel (no backend).
 */
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Braces,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  FilePlus2,
  FileText,
  Image as ImageIcon,
  Images,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  Reply,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_LISTINGS } from "@/lib/mock-data";
import type { TemplateButton, TemplateButtonKind, WaTemplate } from "@/lib/outreach";
import { EASE_OUT, PlatformGlyph } from "./outreach-shared";

/* ------------------------------- constants -------------------------------- */

const CATEGORIES = ["Marketing", "Utility", "Authentication"] as const;
const LANGUAGES = ["English (US)", "English (UK)", "Hindi", "Marathi"];

type TypeValue = "Text" | "Image" | "Video" | "Document" | "Carousel";
const TYPES: { value: TypeValue; label: string; desc: string; icon: typeof MessageSquare; soon?: boolean }[] = [
  { value: "Text", label: "Text", desc: "Plain message", icon: MessageSquare },
  { value: "Image", label: "Image", desc: "JPG or PNG", icon: ImageIcon },
  { value: "Video", label: "Video", desc: "MP4 file", icon: Video },
  { value: "Document", label: "Document", desc: "PDF only", icon: FileText, soon: true },
  { value: "Carousel", label: "Carousel", desc: "Multi card", icon: Images, soon: true },
];

const VARIABLES = [
  { label: "First Name", token: "{{first_name}}", sample: "Ketan" },
  { label: "Last Name", token: "{{last_name}}", sample: "Mehta" },
  { label: "Full Name", token: "{{full_name}}", sample: "Ketan Mehta" },
  { label: "Contact Name", token: "{{contact_name}}", sample: "Ketan" },
  { label: "Project", token: "{{project}}", sample: "Skyline Vista" },
  { label: "Price", token: "{{price}}", sample: "₹1.25 Cr" },
];

const BUTTON_TYPES: {
  value: TemplateButtonKind;
  label: string;
  icon: typeof Phone;
  valueLabel?: string;
  placeholder?: string;
}[] = [
  { value: "url", label: "Visit Website", icon: ExternalLink, valueLabel: "Website URL", placeholder: "https://yoursite.com" },
  { value: "call", label: "Call Phone", icon: Phone, valueLabel: "Phone number", placeholder: "+91 98765 43210" },
  { value: "reply", label: "Quick Reply", icon: Reply },
];

interface DraftButton {
  id: string;
  kind: TemplateButtonKind;
  text: string;
  value: string;
}

/** Replace reserved variables with sample values so the preview reads like a real chat. */
function renderVars(text: string): string {
  let out = text;
  for (const v of VARIABLES) out = out.split(v.token).join(v.sample);
  return out;
}

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

/* -------------------------------- composer -------------------------------- */

export function TemplateComposer({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: (template: WaTemplate) => void;
}) {
  const [mode, setMode] = useState<"blank" | "listing">("blank");
  const [listingId, setListingId] = useState<string>(MOCK_LISTINGS[0]?.id ?? "");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Marketing");
  const [language, setLanguage] = useState<string>("English (US)");
  const [type, setType] = useState<TypeValue>("Text");
  const [header, setHeader] = useState("");
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [buttons, setButtons] = useState<DraftButton[]>([]);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const hasMedia = type !== "Text";
  const canSave = name.trim().length > 0 && body.trim().length > 0;

  // Pre-fill from a property when "From a property" mode is chosen.
  function applyListing(id: string) {
    const l = MOCK_LISTINGS.find((x) => x.id === id);
    if (!l) return;
    const bhk = l.bedrooms ? `${l.bedrooms} BHK` : "home";
    const where = [l.locality, l.city].filter(Boolean).join(", ");
    setHeader(`🏡 ${l.property_title ?? "New property"}`);
    setBody(
      `Hi {{first_name}}, ${l.property_title ?? "a new home"} in ${where || "your area"} is available now. ` +
        `${bhk}${l.price ? `, priced at ₹${l.price}` : ""}. Want me to send photos and the floor plan?`
    );
    if (!name.trim()) setName(slugify(l.property_title ?? "property_alert"));
  }

  function chooseMode(next: "blank" | "listing") {
    setMode(next);
    if (next === "listing") applyListing(listingId);
  }

  function insertToken(token: string) {
    const el = bodyRef.current;
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + token + body.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function addButton() {
    if (buttons.length >= 2) return;
    setButtons((b) => [...b, { id: `b${Date.now()}`, kind: "url", text: "", value: "" }]);
  }

  function onPickImage(file: File | undefined) {
    if (!file) return;
    setMediaUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }
  // Clean up the object URL on unmount.
  useEffect(() => () => {
    if (mediaUrl) URL.revokeObjectURL(mediaUrl);
  }, [mediaUrl]);

  function save() {
    if (!canSave) return;
    const tmplButtons: TemplateButton[] = buttons
      .filter((b) => b.text.trim())
      .map((b) => ({ label: b.text.trim(), kind: b.kind }));
    const slug = slugify(name) || "untitled_template";
    onSave({
      id: `t-${slug}-${body.length}`,
      name: slug,
      title: titleCase(slug),
      category: category as WaTemplate["category"],
      kind: tmplButtons.length > 0 ? "Interactive" : hasMedia ? "Media" : "Standard",
      language: language.replace(/\s*\(.*\)/, ""),
      status: "Pending",
      hasMedia,
      heading: header.trim() || undefined,
      body: body.trim(),
      buttons: tmplButtons,
      sent: 0,
      updated: "Just now",
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* top bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to templates"
            className="text-ink-muted hover:text-ink hover:bg-black/[0.05] grid size-9 place-items-center rounded-lg transition-colors active:scale-95"
          >
            <ArrowLeft className="size-4.5" />
          </button>
          <div>
            <h2 className="text-ink text-lg font-bold leading-tight">New Template</h2>
            <p className="text-ink-muted text-xs">Build a message once, send it to many.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!canSave}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-lg px-5 text-sm font-semibold transition-[background-color,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
            canSave
              ? "bg-brand-green hover:bg-brand-green-hover text-white active:scale-[0.98]"
              : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
          )}
        >
          <Check className="size-4" />
          Save Template
        </button>
      </div>

      {/* body: form + sticky preview */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto pt-5 pb-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ------------------------------ form ------------------------------ */}
        <div className="min-w-0 space-y-5">
          {/* creation mode */}
          <Section label="Start from">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ModeCard
                active={mode === "blank"}
                icon={FilePlus2}
                title="Blank template"
                desc="Start from scratch"
                onClick={() => chooseMode("blank")}
              />
              <ModeCard
                active={mode === "listing"}
                icon={Building2}
                title="From a property"
                desc="Pre-fill from a listing"
                onClick={() => chooseMode("listing")}
              />
            </div>
            {mode === "listing" && (
              <div className="mt-3" style={{ animation: `fade-in-up 220ms ${EASE_OUT} both` }}>
                <Picker
                  ariaLabel="Choose a property"
                  value={listingId}
                  options={MOCK_LISTINGS.map((l) => ({ value: l.id, label: l.property_title ?? "Untitled" }))}
                  onChange={(v) => {
                    setListingId(v);
                    applyListing(v);
                  }}
                />
              </div>
            )}
          </Section>

          {/* basics */}
          <Section label="Basics">
            <Field label="Template name" required hint={`${name.length}/60`}>
              <input
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. property_launch_alert"
                className={INPUT}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Category" required>
                <Picker
                  ariaLabel="Category"
                  value={category}
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  onChange={setCategory}
                />
              </Field>
              <Field label="Language" required>
                <Picker
                  ariaLabel="Language"
                  value={language}
                  options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                  onChange={setLanguage}
                />
              </Field>
            </div>
          </Section>

          {/* type */}
          <Section label="Template type">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {TYPES.map((t) => (
                <TypeCard
                  key={t.value}
                  active={type === t.value}
                  icon={t.icon}
                  label={t.label}
                  desc={t.desc}
                  soon={t.soon}
                  onClick={() => !t.soon && setType(t.value)}
                />
              ))}
            </div>
          </Section>

          {/* content */}
          <Section label="Content">
            {hasMedia ? (
              <Field label={`${type} header`}>
                <MediaDrop type={type} mediaUrl={mediaUrl} onPick={onPickImage} onClear={() => setMediaUrl(null)} />
              </Field>
            ) : (
              <Field label="Header" optional hint={`${header.length}/60`}>
                <input
                  value={header}
                  maxLength={60}
                  onChange={(e) => setHeader(e.target.value)}
                  placeholder="e.g. New property alert"
                  className={INPUT}
                />
              </Field>
            )}

            <Field label="Message body" required hint={`${body.length}/1024`}>
              <textarea
                ref={bodyRef}
                value={body}
                maxLength={1024}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Hi {{first_name}}, we have a property that fits what you are looking for..."
                className={cn(INPUT, "h-auto resize-y py-2.5 leading-relaxed")}
              />
              <div className="mt-2">
                <VariableMenu onInsert={insertToken} />
              </div>
            </Field>

            <Field label="Footer" optional hint={`${footer.length}/60`}>
              <input
                value={footer}
                maxLength={60}
                onChange={(e) => setFooter(e.target.value)}
                placeholder="e.g. Reply STOP to unsubscribe"
                className={INPUT}
              />
            </Field>
          </Section>

          {/* buttons */}
          <Section label="Action buttons" hint="Up to 2, optional">
            <div className="space-y-3">
              {buttons.map((b, i) => (
                <ButtonEditor
                  key={b.id}
                  index={i}
                  button={b}
                  onChange={(next) => setButtons((arr) => arr.map((x) => (x.id === b.id ? next : x)))}
                  onRemove={() => setButtons((arr) => arr.filter((x) => x.id !== b.id))}
                />
              ))}
              {buttons.length < 2 && (
                <button
                  type="button"
                  onClick={addButton}
                  className="text-ink hover:border-accent-blue/50 hover:text-accent-blue flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/15 py-2.5 text-sm font-medium transition-colors active:scale-[0.99]"
                >
                  <Plus className="size-4" />
                  Add Button
                </button>
              )}
            </div>
          </Section>
        </div>

        {/* ----------------------------- preview ---------------------------- */}
        <aside className="hidden lg:block">
          <div className="sticky top-0">
            <p className="text-ink-muted mb-2.5 text-center text-xs font-medium">Live preview</p>
            <PhonePreview
              type={type}
              mediaUrl={mediaUrl}
              header={header}
              body={body}
              footer={footer}
              buttons={buttons}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

/* --------------------------------- atoms ---------------------------------- */

const INPUT =
  "text-ink placeholder:text-ink-muted/55 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none transition-colors";

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <h3 className="text-ink-muted text-xs font-semibold tracking-wide uppercase">{label}</h3>
        {hint && <span className="text-ink-muted/70 text-xs normal-case">({hint})</span>}
      </div>
      <div className="rounded-xl border border-black/[0.08] bg-white p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  optional,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  const overLimit = hint ? approachingLimit(hint) : false;
  return (
    <div className="not-first:mt-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-ink text-sm font-medium">
          {label}
          {required && <span className="text-red-500"> *</span>}
          {optional && <span className="text-ink-muted/70 font-normal"> (optional)</span>}
        </label>
        {hint && (
          <span className={cn("text-[11px] tabular-nums", overLimit ? "text-brand-orange font-semibold" : "text-ink-muted/60")}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** "920/1024" -> true when within 10% of the limit. */
function approachingLimit(hint: string): boolean {
  const m = /^(\d+)\/(\d+)$/.exec(hint);
  if (!m) return false;
  return Number(m[1]) >= Number(m[2]) * 0.9;
}

function ModeCard({
  active,
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  icon: typeof Building2;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3.5 text-left transition-[background-color,border-color] outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.99]",
        active ? "border-accent-blue bg-accent-blue/[0.06]" : "border-black/12 bg-white hover:border-black/25"
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
          active ? "bg-accent-blue text-white" : "bg-black/[0.04] text-ink-muted"
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0">
        <span className="text-ink block text-sm font-semibold">{title}</span>
        <span className="text-ink-muted block text-xs">{desc}</span>
      </span>
    </button>
  );
}

function TypeCard({
  active,
  icon: Icon,
  label,
  desc,
  soon,
  onClick,
}: {
  active: boolean;
  icon: typeof MessageSquare;
  label: string;
  desc: string;
  soon?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={soon}
      aria-pressed={active}
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-[background-color,border-color] outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        soon
          ? "cursor-not-allowed border-black/[0.07] bg-black/[0.02] opacity-70"
          : active
            ? "border-accent-blue bg-accent-blue/[0.06] active:scale-[0.98]"
            : "border-black/12 bg-white hover:border-black/25 active:scale-[0.98]"
      )}
    >
      {soon && (
        <span className="bg-brand-orange absolute -top-1.5 right-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white">
          Soon
        </span>
      )}
      <Icon className={cn("size-5", active ? "text-accent-blue" : "text-ink-muted")} />
      <span className={cn("text-xs font-semibold", active ? "text-accent-blue" : "text-ink")}>{label}</span>
      <span className="text-ink-muted/70 text-[10px] leading-tight">{desc}</span>
    </button>
  );
}

function VariableMenu({ onInsert }: { onInsert: (token: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="text-accent-blue bg-accent-blue/[0.06] hover:bg-accent-blue/10 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
      >
        <Braces className="size-3.5" />
        Add Variable
        <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="absolute bottom-full left-0 z-40 mb-2 w-60 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
            style={{ animation: `scale-in 160ms ${EASE_OUT} both`, transformOrigin: "bottom left" }}
          >
            <p className="text-ink-muted/70 px-2.5 pt-1.5 pb-1 text-[11px] font-medium">Reserved variables</p>
            {VARIABLES.map((v) => (
              <button
                key={v.token}
                type="button"
                role="menuitem"
                onClick={() => {
                  onInsert(v.token);
                  setOpen(false);
                }}
                className="hover:bg-accent-blue/[0.06] flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left outline-none"
              >
                <span className="text-ink text-sm">{v.label}</span>
                <span className="text-ink-muted/70 font-mono text-[11px]">{v.token}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MediaDrop({
  type,
  mediaUrl,
  onPick,
  onClear,
}: {
  type: TypeValue;
  mediaUrl: string | null;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  if (type === "Image" && mediaUrl) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-black/[0.08]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl} alt="Header preview" className="h-40 w-full object-cover" />
        <button
          type="button"
          onClick={onClear}
          aria-label="Remove image"
          className="text-ink absolute top-2 right-2 grid size-7 place-items-center rounded-md bg-white/90 shadow-sm transition-colors hover:bg-white"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }
  return (
    <label className="hover:border-accent-blue/50 hover:bg-accent-blue/[0.03] flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/15 py-7 text-center transition-colors">
      <Upload className="text-ink-muted size-5" />
      <span className="text-ink text-sm font-medium">Add {type === "Image" ? "an image" : `a ${type.toLowerCase()}`}</span>
      <span className="text-ink-muted/70 text-xs">{type === "Image" ? "JPG or PNG" : type === "Video" ? "MP4 file" : "Upload a file"}</span>
      {type === "Image" && (
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      )}
    </label>
  );
}

function ButtonEditor({
  index,
  button,
  onChange,
  onRemove,
}: {
  index: number;
  button: DraftButton;
  onChange: (b: DraftButton) => void;
  onRemove: () => void;
}) {
  const def = BUTTON_TYPES.find((t) => t.value === button.kind) ?? BUTTON_TYPES[0];
  return (
    <div
      className="rounded-xl border border-black/[0.1] bg-black/[0.015] p-3.5"
      style={{ animation: `fade-in-up 220ms ${EASE_OUT} both` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-ink text-sm font-semibold">Button {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove button ${index + 1}`}
          className="text-ink-muted grid size-7 place-items-center rounded-md transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-ink-muted mb-1 block text-xs font-medium">Type</label>
          <Picker
            ariaLabel="Button type"
            value={button.kind}
            options={BUTTON_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            onChange={(v) => onChange({ ...button, kind: v as TemplateButtonKind, value: "" })}
          />
        </div>
        <div>
          <label className="text-ink-muted mb-1 flex items-center justify-between text-xs font-medium">
            Button text <span className="text-ink-muted/60">{button.text.length}/20</span>
          </label>
          <input
            value={button.text}
            maxLength={20}
            onChange={(e) => onChange({ ...button, text: e.target.value })}
            placeholder="e.g. View Property"
            className={cn(INPUT, "h-10")}
          />
        </div>
      </div>
      {def.valueLabel && (
        <div className="mt-3">
          <label className="text-ink-muted mb-1 block text-xs font-medium">{def.valueLabel}</label>
          <input
            value={button.value}
            onChange={(e) => onChange({ ...button, value: e.target.value })}
            placeholder={def.placeholder}
            className={cn(INPUT, "h-10")}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------- picker ---------------------------------- */

function Picker({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="text-ink hover:border-black/25 flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40"
      >
        <span className="truncate">{current?.label ?? "Select"}</span>
        <ChevronDown className={cn("text-ink-muted size-4 shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="listbox"
            className="absolute top-full right-0 left-0 z-40 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
            style={{ animation: `scale-in 150ms ${EASE_OUT} both`, transformOrigin: "top" }}
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

/* ------------------------------ phone preview ----------------------------- */

const BTN_ICON: Record<TemplateButtonKind, typeof Phone> = {
  url: ExternalLink,
  call: Phone,
  reply: Reply,
  copy: Reply,
};

function PhonePreview({
  type,
  mediaUrl,
  header,
  body,
  footer,
  buttons,
}: {
  type: TypeValue;
  mediaUrl: string | null;
  header: string;
  body: string;
  footer: string;
  buttons: DraftButton[];
}) {
  const hasMedia = type !== "Text";
  const empty = !header.trim() && !body.trim() && !hasMedia;
  const namedButtons = buttons.filter((b) => b.text.trim());

  return (
    <div className="mx-auto w-[290px] rounded-[2.4rem] bg-ink p-2.5 shadow-xl shadow-black/20">
      <div className="overflow-hidden rounded-[1.9rem] bg-wa-paper">
        {/* chat header */}
        <div className="bg-wa-header flex items-center gap-2 px-3 py-2.5 text-white">
          <ChevronLeft className="size-4 shrink-0 opacity-90" />
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15">
            <PlatformGlyph platform="whatsapp" className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight">Skyline Realty</p>
            <p className="text-[10px] text-white/70">online</p>
          </div>
          <Phone className="size-4 shrink-0 opacity-90" />
          <Video className="size-4 shrink-0 opacity-90" />
          <MoreVertical className="size-4 shrink-0 opacity-90" />
        </div>

        {/* chat body */}
        <div className="flex min-h-[320px] flex-col gap-2 px-3 py-4">
          {empty ? (
            <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-white/70 px-3 py-2 text-[13px] text-ink-muted shadow-sm">
              Your message will appear here...
              <span className="text-ink-muted/50 mt-1 block text-right text-[10px]">12:30</span>
            </div>
          ) : (
            <div className="max-w-[88%]">
              <div className="relative rounded-xl rounded-tl-sm bg-white p-1.5 shadow-sm">
                {hasMedia &&
                  (type === "Image" && mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl} alt="" className="mb-1.5 h-28 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="text-ink-muted/40 mb-1.5 grid h-28 place-items-center rounded-lg bg-gradient-to-br from-black/[0.07] to-black/[0.03]">
                      {type === "Video" ? <Video className="size-7" /> : <ImageIcon className="size-7" />}
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

              {namedButtons.length > 0 && (
                <div className="mt-1 space-y-1">
                  {namedButtons.map((b) => {
                    const Icon = BTN_ICON[b.kind];
                    return (
                      <div
                        key={b.id}
                        className="text-accent-blue flex items-center justify-center gap-1.5 rounded-lg bg-white py-1.5 text-[13px] font-medium shadow-sm"
                      >
                        <Icon className="size-3.5" />
                        {b.text}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
