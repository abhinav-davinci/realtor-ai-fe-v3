"use client";

/**
 * New Broadcast wizard: a 3-step flow (Template + name, Contacts, Review & Send)
 * with a live WhatsApp phone preview alongside. Launched from a template card's
 * "Use Template" or the Broadcasts tab "New Broadcast". Design mode only; on
 * send it builds a Broadcast and hands it back to the panel (no backend).
 */
import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Megaphone,
  Plus,
  Search,
  Send,
  Tag,
  Upload,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CONTACTS,
  TEMPLATES,
  type Broadcast,
  type OutreachContact,
  type WaTemplate,
} from "@/lib/outreach";
import { EASE_OUT, Monogram, PhonePreview } from "./outreach-shared";

const INPUT =
  "text-ink placeholder:text-ink-muted/55 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none transition-colors";

const STEPS = [
  { n: 1, label: "Template" },
  { n: 2, label: "Contacts" },
  { n: 3, label: "Review & Send" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function BroadcastComposer({
  initialTemplate,
  onBack,
  onSave,
}: {
  initialTemplate: WaTemplate | null;
  onBack: () => void;
  onSave: (b: Broadcast) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<WaTemplate | null>(initialTemplate);
  const [recipients, setRecipients] = useState<OutreachContact[]>([]);
  const [scheduled, setScheduled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [sent, setSent] = useState(false);

  const step1Ok = name.trim().length > 0 && !!template;
  const step2Ok = recipients.length > 0;

  function addRecipients(list: OutreachContact[]) {
    setRecipients((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...list.filter((c) => !seen.has(c.id))];
    });
  }

  function buildBroadcast(status: Broadcast["status"]): Broadcast {
    return {
      id: `b-${name.length}-${recipients.length}-${step}`,
      name: name.trim() || "Untitled broadcast",
      template: template?.name ?? "",
      audience: recipients.length,
      sent: 0,
      delivered: 0,
      read: 0,
      replied: 0,
      failed: 0,
      status,
      when: scheduled && scheduleAt ? scheduleAt.replace("T", ", ") : "Just now",
    };
  }

  const footer = (
    <div className="mt-6 flex items-center justify-between gap-3">
      {step > 1 ? (
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          className="text-ink inline-flex h-10 items-center gap-1.5 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-colors outline-none hover:bg-black/[0.04] active:scale-[0.98]"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2.5">
        {step > 1 && (
          <button
            type="button"
            onClick={() => onSave(buildBroadcast("Draft"))}
            className="text-ink inline-flex h-10 items-center gap-1.5 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-colors outline-none hover:bg-black/[0.04] active:scale-[0.98]"
          >
            <FileText className="size-4" />
            Save as Draft
          </button>
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 ? !step1Ok : !step2Ok}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-lg px-5 text-sm font-semibold transition-[background-color,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
              (step === 1 ? step1Ok : step2Ok)
                ? "bg-brand-green hover:bg-brand-green-hover text-white active:scale-[0.98]"
                : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
            )}
          >
            Next
            <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSent(true)}
            className="bg-brand-green hover:bg-brand-green-hover inline-flex h-10 items-center gap-1.5 rounded-lg px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
          >
            <Send className="size-4" />
            {scheduled ? "Schedule Broadcast" : "Send Now"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* top bar */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-black/[0.06] pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to broadcasts"
          className="text-ink-muted hover:text-ink hover:bg-black/[0.05] grid size-9 place-items-center rounded-lg transition-colors active:scale-95"
        >
          <ArrowLeft className="size-4.5" />
        </button>
        <div>
          <h2 className="text-ink text-lg font-bold leading-tight">New Broadcast</h2>
          <p className="text-ink-muted text-xs">Send a template to a list of contacts.</p>
        </div>
      </div>

      {/* stepper */}
      <div className="shrink-0 py-4">
        <Stepper step={step} />
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {step === 1 ? (
          <div key="s1" className="max-w-5xl" style={{ animation: `fade-in-up 240ms ${EASE_OUT} both` }}>
            <Step1 name={name} setName={setName} template={template} setTemplate={setTemplate} />
            {footer}
          </div>
        ) : (
          <div
            key={step}
            className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
            style={{ animation: `fade-in-up 240ms ${EASE_OUT} both` }}
          >
            <div className="min-w-0">
              {step === 2 ? (
                <Step2
                  template={template}
                  recipients={recipients}
                  onSelectContacts={() => setShowContacts(true)}
                  onAddContact={() => setShowAdd(true)}
                  onImportCsv={(list) => addRecipients(list)}
                  onRemove={(id) => setRecipients((prev) => prev.filter((c) => c.id !== id))}
                  onClear={() => setRecipients([])}
                />
              ) : (
                <Step3
                  name={name}
                  template={template}
                  recipientCount={recipients.length}
                  scheduled={scheduled}
                  setScheduled={setScheduled}
                  scheduleAt={scheduleAt}
                  setScheduleAt={setScheduleAt}
                />
              )}
              {footer}
            </div>

            {/* live preview */}
            <aside className="hidden lg:block">
              <div className="sticky top-0">
                <p className="text-ink-muted mb-2.5 text-center text-xs font-medium">Live preview</p>
                <PhonePreview
                  media={template?.hasMedia ? "image" : null}
                  header={template?.heading ?? ""}
                  body={template?.body ?? ""}
                  buttons={template?.buttons ?? []}
                  title={name.trim() || "Skyline Realty"}
                  subtitle={
                    recipients.length
                      ? `${recipients.length} recipient${recipients.length > 1 ? "s" : ""}`
                      : "online"
                  }
                />
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* modals */}
      {showContacts && (
        <SelectContactsModal
          alreadySelected={recipients}
          onClose={() => setShowContacts(false)}
          onAdd={(list) => {
            addRecipients(list);
            setShowContacts(false);
          }}
        />
      )}
      {showAdd && (
        <AddContactModal
          onClose={() => setShowAdd(false)}
          onAdd={(c) => {
            addRecipients([c]);
            setShowAdd(false);
          }}
        />
      )}
      {sent && (
        <SentDialog
          count={recipients.length}
          scheduled={scheduled}
          onDone={() => onSave(buildBroadcast(scheduled ? "Scheduled" : "Sending"))}
        />
      )}
    </div>
  );
}

/* -------------------------------- stepper --------------------------------- */

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <Fragment key={s.n}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors duration-200",
                  done
                    ? "bg-brand-green text-white"
                    : active
                      ? "border-brand-green text-brand-green border-2 bg-white"
                      : "text-ink-muted border border-black/15 bg-white"
                )}
              >
                {done ? <Check className="size-4" /> : s.n}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium whitespace-nowrap transition-colors",
                  active ? "text-ink" : "text-ink-muted",
                  !active && "hidden sm:inline"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="h-0.5 w-6 shrink-0 overflow-hidden rounded-full bg-black/10 sm:w-12">
                <span
                  className="bg-brand-green block h-full rounded-full transition-[width] duration-300"
                  style={{ width: done ? "100%" : "0%", transitionTimingFunction: EASE_OUT }}
                />
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/* --------------------------------- step 1 --------------------------------- */

function Step1({
  name,
  setName,
  template,
  setTemplate,
}: {
  name: string;
  setName: (v: string) => void;
  template: WaTemplate | null;
  setTemplate: (t: WaTemplate) => void;
}) {
  const [q, setQ] = useState("");
  const approved = useMemo(() => TEMPLATES.filter((t) => t.status === "Approved"), []);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return approved;
    return approved.filter((t) => `${t.title} ${t.body} ${t.category}`.toLowerCase().includes(s));
  }, [approved, q]);

  return (
    <div className="space-y-5">
      <Section label="Broadcast name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. April property launch"
          className={INPUT}
        />
      </Section>

      <div>
        <div className="mb-2.5 flex items-center gap-2">
          <h3 className="text-ink-muted text-xs font-semibold tracking-wide uppercase">Select approved template</h3>
          {template && (
            <span className="text-brand-green inline-flex items-center gap-1 text-xs font-medium normal-case">
              <Check className="size-3.5" /> {template.title}
            </span>
          )}
        </div>

        <div className="relative mb-3">
          <Search className="text-ink-muted/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates..."
            aria-label="Search templates"
            className={cn(INPUT, "h-10 pl-9")}
          />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-black/[0.08] bg-white p-10 text-center">
            <p className="text-ink-muted text-sm">No approved templates match that search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((t) => (
              <PickTemplateCard key={t.id} t={t} selected={t.id === template?.id} onSelect={() => setTemplate(t)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PickTemplateCard({
  t,
  selected,
  onSelect,
}: {
  t: WaTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-[border-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        selected
          ? "border-accent-blue ring-accent-blue/30 ring-2"
          : "border-black/[0.08] hover:border-black/20 hover:shadow-sm"
      )}
    >
      {selected && (
        <span className="bg-accent-blue absolute top-2 right-2 z-10 grid size-5 place-items-center rounded-full text-white shadow-sm">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
      <div className="bg-wa-header px-3 py-2">
        <p className="truncate pr-6 text-sm font-semibold text-white">{t.title}</p>
      </div>
      <div className="bg-wa-paper flex-1 px-3 py-3">
        <div className="rounded-xl rounded-tl-sm bg-white p-2 shadow-sm">
          {t.hasMedia && (
            <div className="text-ink-muted/40 mb-1.5 grid h-16 place-items-center rounded-lg bg-gradient-to-br from-black/[0.07] to-black/[0.03]">
              <ImageIcon className="size-5" />
            </div>
          )}
          <div className="px-1 pb-0.5">
            {t.heading && <p className="text-ink text-[13px] leading-snug font-bold">{t.heading}</p>}
            <p className="text-ink/90 mt-0.5 line-clamp-3 text-[13px] leading-snug">{t.body}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 border-t border-black/[0.06] px-3 py-2">
        <span className="bg-brand-green/10 text-brand-green rounded-full px-2 py-0.5 text-[10px] font-medium">{t.kind}</span>
        <span className="bg-tag text-tag-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">{t.category}</span>
        <span className="text-ink-muted text-[10px]">{t.language}</span>
      </div>
    </button>
  );
}

/* --------------------------------- step 2 --------------------------------- */

function Step2({
  template,
  recipients,
  onSelectContacts,
  onAddContact,
  onImportCsv,
  onRemove,
  onClear,
}: {
  template: WaTemplate | null;
  recipients: OutreachContact[];
  onSelectContacts: () => void;
  onAddContact: () => void;
  onImportCsv: (list: OutreachContact[]) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-5">
      {template && (
        <div className="flex items-center gap-2 rounded-lg bg-black/[0.02] px-3.5 py-2.5 text-sm">
          <span className="text-ink-muted">Sending</span>
          <span className="text-ink truncate font-semibold">{template.title}</span>
          <span className="bg-tag text-tag-foreground ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium">
            {template.category}
          </span>
        </div>
      )}

      <Section label="Add recipients">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <AudienceAction icon={Users} title="Select from Contacts" desc="Pick from your list" onClick={onSelectContacts} />
          <AudienceAction icon={Plus} title="Add Contact" desc="Enter one manually" onClick={onAddContact} />
          <CsvAction onImport={onImportCsv} />
        </div>
        <div className="text-ink-muted mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <Download className="size-3.5" />
          <button type="button" className="text-accent-blue font-medium hover:underline">
            Download sample CSV
          </button>
          <span className="text-ink-muted/50">·</span>
          <span>
            Required column: <span className="font-mono">phone</span> (optional:{" "}
            <span className="font-mono">first_name</span>, <span className="font-mono">last_name</span>)
          </span>
        </div>
      </Section>

      <Section
        label="Recipients"
        hint={recipients.length ? `${recipients.length} selected` : undefined}
        action={
          recipients.length > 0 ? (
            <button type="button" onClick={onClear} className="text-ink-muted hover:text-red-500 text-xs font-medium transition-colors">
              Clear all
            </button>
          ) : undefined
        }
      >
        {recipients.length === 0 ? (
          <p className="text-ink-muted py-6 text-center text-sm">No recipients yet. Add some from the options above.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recipients.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white py-1 pr-1 pl-2.5 text-sm"
                style={{ animation: `scale-in 160ms ${EASE_OUT} both` }}
              >
                <span className="text-ink font-medium">{c.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(c.id)}
                  aria-label={`Remove ${c.name}`}
                  className="text-ink-muted hover:bg-black/[0.06] hover:text-ink grid size-5 place-items-center rounded-full transition-colors"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function AudienceAction({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: typeof Users;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:border-accent-blue/50 hover:bg-accent-blue/[0.03] flex flex-col items-start gap-1 rounded-xl border border-black/12 bg-white p-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.99]"
    >
      <span className="bg-accent-blue/10 text-accent-blue grid size-8 place-items-center rounded-lg">
        <Icon className="size-4.5" />
      </span>
      <span className="text-ink mt-1 text-sm font-semibold">{title}</span>
      <span className="text-ink-muted text-xs">{desc}</span>
    </button>
  );
}

/** Upload CSV: in design mode it simulates importing a small batch of contacts. */
function CsvAction({ onImport }: { onImport: (list: OutreachContact[]) => void }) {
  const POOL = ["Rohan Shah", "Divya Menon", "Aman Kapoor", "Pooja Iyer", "Nikhil Rao", "Sara Khan"];
  return (
    <label className="hover:border-accent-blue/50 hover:bg-accent-blue/[0.03] flex cursor-pointer flex-col items-start gap-1 rounded-xl border border-black/12 bg-white p-3.5 text-left transition-colors active:scale-[0.99]">
      <span className="bg-accent-blue/10 text-accent-blue grid size-8 place-items-center rounded-lg">
        <Upload className="size-4.5" />
      </span>
      <span className="text-ink mt-1 text-sm font-semibold">Upload CSV</span>
      <span className="text-ink-muted text-xs">Import in bulk</span>
      <input
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          if (!e.target.files?.[0]) return;
          onImport(
            POOL.map((name, i) => ({
              id: `csv-${i}`,
              name,
              initials: initials(name),
              phone: `+91 9${(800000000 + i * 137).toString().slice(0, 9)}`,
              tags: ["Imported"],
              source: "Import",
              added: "Just now",
            }))
          );
          e.target.value = "";
        }}
      />
    </label>
  );
}

/* --------------------------------- step 3 --------------------------------- */

function Step3({
  name,
  template,
  recipientCount,
  scheduled,
  setScheduled,
  scheduleAt,
  setScheduleAt,
}: {
  name: string;
  template: WaTemplate | null;
  recipientCount: number;
  scheduled: boolean;
  setScheduled: (v: boolean) => void;
  scheduleAt: string;
  setScheduleAt: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ReviewCard icon={Megaphone} label="Broadcast" value={name || "Untitled"} tint="green" />
        <ReviewCard icon={LayoutGrid} label="Template" value={template?.title ?? "None"} tint="blue" />
        <ReviewCard icon={Users} label="Recipients" value={`${recipientCount} contact${recipientCount === 1 ? "" : "s"}`} tint="orange" />
        <ReviewCard icon={Tag} label="Category" value={template?.category ?? "Marketing"} tint="gold" />
      </div>

      <div className="rounded-xl border border-black/[0.08] bg-white p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <Toggle on={scheduled} onChange={() => setScheduled(!scheduled)} label="Schedule for later" />
          <span className="flex items-center gap-1.5">
            <Calendar className="text-ink-muted size-4" />
            <span className="text-ink text-sm font-medium">Schedule for later</span>
          </span>
          <span className="text-ink-muted/70 ml-auto text-xs">Min 15 min ahead</span>
        </label>
        {scheduled && (
          <div className="mt-3" style={{ animation: `fade-in-up 200ms ${EASE_OUT} both` }}>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className={cn(INPUT, "max-w-xs")}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const TINTS: Record<string, { bg: string; fg: string }> = {
  green: { bg: "bg-brand-green/[0.08]", fg: "text-brand-green" },
  blue: { bg: "bg-accent-blue/[0.08]", fg: "text-accent-blue" },
  orange: { bg: "bg-brand-orange/[0.08]", fg: "text-brand-orange" },
  gold: { bg: "bg-gold/25", fg: "text-gold-foreground" },
};

function ReviewCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Megaphone;
  label: string;
  value: string;
  tint: keyof typeof TINTS;
}) {
  const t = TINTS[tint];
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-black/[0.06] p-4", t.bg)}>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-white/70", t.fg)}>
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-ink-muted text-[11px] font-semibold tracking-wide uppercase">{label}</p>
        <p className="text-ink mt-0.5 truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

/* --------------------------- shared little bits --------------------------- */

function Section({
  label,
  hint,
  action,
  children,
}: {
  label: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <h3 className="text-ink-muted text-xs font-semibold tracking-wide uppercase">{label}</h3>
        {hint && <span className="text-ink-muted/70 text-xs normal-case">({hint})</span>}
        {action && <span className="ml-auto">{action}</span>}
      </div>
      <div className="rounded-xl border border-black/[0.08] bg-white p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        onChange();
      }}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        on ? "bg-brand-green" : "bg-black/15"
      )}
    >
      <span
        className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200", on && "translate-x-5")}
        style={{ transitionTimingFunction: EASE_OUT }}
      />
    </button>
  );
}

function ModalShell({
  children,
  onClose,
  className,
}: {
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div
        className="bg-ink/40 absolute inset-0"
        style={{ animation: `fade-in 150ms ${EASE_OUT} both` }}
        onClick={onClose}
        aria-hidden
      />
      <div className={cn("modal-pop relative w-full rounded-2xl bg-white shadow-2xl shadow-black/25", className)}>
        {children}
      </div>
    </div>
  );
}

/* ----------------------------- select contacts ---------------------------- */

const PER_PAGE = 8;

function SelectContactsModal({
  alreadySelected,
  onClose,
  onAdd,
}: {
  alreadySelected: OutreachContact[];
  onClose: () => void;
  onAdd: (list: OutreachContact[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(alreadySelected.map((c) => c.id)));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CONTACTS;
    return CONTACTS.filter((c) => c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")));
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);
  const allOnPage = rows.length > 0 && rows.every((c) => picked.has(c.id));

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAllOnPage() {
    setPicked((prev) => {
      const next = new Set(prev);
      if (allOnPage) rows.forEach((c) => next.delete(c.id));
      else rows.forEach((c) => next.add(c.id));
      return next;
    });
  }

  const newlyPicked = CONTACTS.filter((c) => picked.has(c.id) && !alreadySelected.some((a) => a.id === c.id));

  return (
    <ModalShell onClose={onClose} className="flex max-h-[80vh] max-w-md flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Users className="text-brand-green size-5" />
          <h2 className="text-ink text-base font-bold">Select Contacts</h2>
          {picked.size > 0 && (
            <span className="bg-brand-green/10 text-brand-green rounded-full px-2 py-0.5 text-[11px] font-semibold">
              {picked.size} selected
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-muted hover:bg-black/[0.05] hover:text-ink grid size-8 place-items-center rounded-lg transition-colors"
        >
          <X className="size-4.5" />
        </button>
      </div>

      <div className="shrink-0 px-4 pt-3">
        <div className="relative">
          <Search className="text-ink-muted/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name or phone..."
            aria-label="Search contacts"
            className={cn(INPUT, "h-10 pl-9")}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <button type="button" onClick={toggleAllOnPage} className="text-accent-blue font-semibold hover:underline">
            {allOnPage ? "Clear this page" : `Select all ${rows.length} on this page`}
          </button>
          <span className="text-ink-muted">{filtered.length} total contacts</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {rows.length === 0 ? (
          <p className="text-ink-muted py-10 text-center text-sm">No contacts match that search.</p>
        ) : (
          rows.map((c) => {
            const on = picked.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                  on ? "bg-brand-green/[0.07]" : "hover:bg-black/[0.03]"
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                    on ? "bg-brand-green border-brand-green text-white" : "border-black/25 bg-white"
                  )}
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <Monogram initials={c.initials} className="size-9" />
                <span className="min-w-0 flex-1">
                  <span className="text-ink block truncate text-sm font-medium">{c.name}</span>
                  <span className="text-ink-muted block truncate text-xs">{c.phone}</span>
                </span>
                {c.tags.length > 0 && (
                  <span className="bg-tag text-tag-foreground hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:inline">
                    {c.tags.join(", ")}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-center gap-2 border-t border-black/[0.06] py-2.5 text-xs">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={safePage === 0}
          className="text-ink rounded-md border border-black/15 px-2.5 py-1 font-medium transition-colors hover:bg-black/[0.04] disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-ink-muted">
          Page {safePage + 1} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={safePage >= pageCount - 1}
          className="text-ink rounded-md border border-black/15 px-2.5 py-1 font-medium transition-colors hover:bg-black/[0.04] disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <div className="flex items-center justify-end gap-2.5 border-t border-black/[0.06] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-colors hover:bg-black/[0.04] active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onAdd(newlyPicked)}
          disabled={newlyPicked.length === 0}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-[background-color,transform] duration-150",
            newlyPicked.length > 0
              ? "bg-brand-green hover:bg-brand-green-hover text-white active:scale-[0.98]"
              : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
          )}
        >
          <Users className="size-4" />
          Add {newlyPicked.length} {newlyPicked.length === 1 ? "Contact" : "Contacts"}
        </button>
      </div>
    </ModalShell>
  );
}

/* ------------------------------- add contact ------------------------------ */

function AddContactModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (c: OutreachContact) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const ok = phone.trim().length >= 6;

  return (
    <ModalShell onClose={onClose} className="max-w-sm">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3.5">
        <h2 className="text-ink text-base font-bold">Add a contact</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-muted hover:bg-black/[0.05] hover:text-ink grid size-8 place-items-center rounded-lg transition-colors"
        >
          <X className="size-4.5" />
        </button>
      </div>
      <div className="space-y-3 p-5">
        <div>
          <label className="text-ink mb-1.5 block text-sm font-medium">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ketan Mehta" className={INPUT} />
        </div>
        <div>
          <label className="text-ink mb-1.5 block text-sm font-medium">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="+91 98765 43210"
            className={INPUT}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2.5 border-t border-black/[0.06] px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-colors hover:bg-black/[0.04] active:scale-[0.98]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            const display = name.trim() || phone.trim();
            onAdd({
              id: `manual-${phone.replace(/\D/g, "")}`,
              name: display,
              initials: initials(display),
              phone: phone.trim(),
              tags: [],
              source: "Manual",
              added: "Just now",
            });
          }}
          disabled={!ok}
          className={cn(
            "h-10 rounded-lg px-4 text-sm font-semibold transition-[background-color,transform] duration-150",
            ok ? "bg-brand-green hover:bg-brand-green-hover text-white active:scale-[0.98]" : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
          )}
        >
          Add Contact
        </button>
      </div>
    </ModalShell>
  );
}

/* -------------------------------- sent dialog ----------------------------- */

// 8 directions for the "sent" particle burst.
const SEND_PARTICLES = [
  { px: 50, py: 0 },
  { px: 35, py: 35 },
  { px: 0, py: 50 },
  { px: -35, py: 35 },
  { px: -50, py: 0 },
  { px: -35, py: -35 },
  { px: 0, py: -50 },
  { px: 35, py: -35 },
];

function SentDialog({
  count,
  scheduled,
  onDone,
}: {
  count: number;
  scheduled: boolean;
  onDone: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="bg-ink/40 absolute inset-0" style={{ animation: `fade-in 150ms ${EASE_OUT} both` }} aria-hidden />
      <div className="modal-pop relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl shadow-black/25">
        {/* icon with broadcasting radar rings + sent particles */}
        <div className="relative mx-auto grid size-16 place-items-center">
          {[0, 0.6, 1.2].map((d) => (
            <span
              key={d}
              aria-hidden
              className="border-brand-green/40 absolute inset-0 rounded-full border-2 motion-reduce:hidden motion-safe:animate-[broadcast-ring_1.8s_ease-out_infinite]"
              style={{ animationDelay: `${d}s` }}
            />
          ))}
          {SEND_PARTICLES.map((p, i) => (
            <span
              key={i}
              aria-hidden
              className="bg-brand-green absolute top-1/2 left-1/2 size-1.5 rounded-full motion-reduce:hidden motion-safe:animate-[send-particle_900ms_ease-out_both]"
              style={{ "--px": `${p.px}px`, "--py": `${p.py}px`, animationDelay: `${200 + i * 18}ms` } as CSSProperties}
            />
          ))}
          <span
            className="bg-brand-green/10 text-brand-green relative grid size-16 place-items-center rounded-full motion-safe:animate-[success-pop_420ms_cubic-bezier(0.34,1.56,0.64,1)_both]"
          >
            <Check className="size-8 motion-safe:animate-[tick-pop_460ms_200ms_ease-out_both]" strokeWidth={2.5} />
          </span>
        </div>

        <h2
          className="text-ink mt-4 text-lg font-bold motion-safe:opacity-0 motion-safe:animate-[fade-in-up_360ms_ease-out_both]"
          style={{ animationDelay: "140ms" }}
        >
          {scheduled ? "Broadcast scheduled" : "Broadcast is on its way"}
        </h2>
        <p
          className="text-ink-muted mt-1 text-sm motion-safe:opacity-0 motion-safe:animate-[fade-in-up_360ms_ease-out_both]"
          style={{ animationDelay: "210ms" }}
        >
          {scheduled ? "It will go out at the time you set" : "Sending now"} to{" "}
          <span className="text-ink font-semibold">
            {count} contact{count === 1 ? "" : "s"}
          </span>
          .
        </p>
        <button
          type="button"
          onClick={onDone}
          style={{ animationDelay: "290ms" }}
          className="bg-brand-green hover:bg-brand-green-hover mt-5 h-10 w-full rounded-lg text-sm font-semibold text-white transition-[background-color,transform] outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98] motion-safe:opacity-0 motion-safe:animate-[fade-in-up_360ms_ease-out_both]"
        >
          Back to Broadcasts
        </button>
      </div>
    </div>
  );
}
