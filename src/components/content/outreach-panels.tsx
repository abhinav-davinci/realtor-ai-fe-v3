"use client";

/**
 * The secondary Outreach tabs: Templates, Broadcasts, Contacts, and Chat
 * Flows. Read-focused designed views over the mock data in
 * src/lib/outreach.ts. The "New ..." / "Add ..." actions are the entry points a
 * developer wires to real editors later.
 */
import { useMemo, useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronDown,
  CircleCheck,
  Copy,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Megaphone,
  MessageSquarePlus,
  Phone,
  Plus,
  Reply,
  RotateCw,
  Search,
  Trash2,
  Upload,
  Workflow,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BROADCASTS,
  BROADCAST_STATUS_TONE,
  CHAT_FLOWS,
  CONTACTS,
  TEMPLATES,
  TEMPLATE_STATUS_TONE,
  type ChatFlow,
  type TemplateButtonKind,
  type TemplateStatus,
  type WaTemplate,
} from "@/lib/outreach";
import { EASE_OUT, inr, Monogram, StatusPill } from "./outreach-shared";
import { TemplateComposer } from "./outreach-template-composer";

/** Scroll wrapper shared by every panel so density matches the page. */
function PanelScroll({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto pt-1 pb-10"
      style={{ animation: `fade-in 200ms ${EASE_OUT} both` }}
    >
      {children}
    </div>
  );
}

function PanelHead({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-ink text-base font-bold">{title}</h2>
        <p className="text-ink-muted text-sm">{desc}</p>
      </div>
      {action}
    </div>
  );
}

function PrimaryButton({
  children,
  icon: Icon,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      className="bg-brand-blue hover:bg-brand-blue-hover h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-white"
    >
      <Icon className="size-4" />
      {children}
    </Button>
  );
}

const CARD = "rounded-2xl border border-black/[0.08] bg-white";

/* ------------------------------- templates -------------------------------- */

const STATUS_OPTIONS = ["All Status", "Approved", "Pending", "Rejected"];
const CATEGORY_OPTIONS = ["All Categories", "Marketing", "Utility", "Authentication"];
const TYPE_OPTIONS = ["All Types", "Standard", "Media", "Interactive"];

export function TemplatesPanel() {
  const [composing, setComposing] = useState(false);
  const [templates, setTemplates] = useState(TEMPLATES);
  const languageOptions = useMemo(
    () => ["All Languages", ...Array.from(new Set(templates.map((t) => t.language)))],
    [templates]
  );
  const [language, setLanguage] = useState("All Languages");
  const [status, setStatus] = useState("All Status");
  const [category, setCategory] = useState("All Categories");
  const [type, setType] = useState("All Types");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (!language.startsWith("All") && t.language !== language) return false;
      if (!status.startsWith("All") && t.status !== status) return false;
      if (!category.startsWith("All") && t.category !== category) return false;
      if (!type.startsWith("All") && t.kind !== type) return false;
      if (q && !`${t.title} ${t.name} ${t.heading ?? ""} ${t.body}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [templates, language, status, category, type, query]);

  if (composing) {
    return (
      <TemplateComposer
        onBack={() => setComposing(false)}
        onSave={(tpl) => {
          setTemplates((prev) => [tpl, ...prev]);
          setComposing(false);
        }}
      />
    );
  }

  return (
    <PanelScroll>
      {/* filter toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterSelect label="language" value={language} options={languageOptions} onChange={setLanguage} />
        <FilterSelect label="status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
        <FilterSelect label="category" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />
        <FilterSelect label="type" value={type} options={TYPE_OPTIONS} onChange={setType} />

        <div className="relative w-full sm:w-52">
          <Search className="text-ink-muted/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by content..."
            aria-label="Search templates by content"
            className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-9 w-full rounded-lg border border-black/12 bg-white pr-8 pl-9 text-sm outline-none transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-ink-muted hover:bg-black/[0.05] hover:text-ink absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded-md transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <SyncButton />
          <PrimaryButton icon={MessageSquarePlus} onClick={() => setComposing(true)}>
            New Template
          </PrimaryButton>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className={cn(CARD, "grid place-items-center p-12 text-center")}>
          <p className="text-ink-muted text-sm">No templates match these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map((t, i) => (
            <TemplateCard key={t.id} t={t} index={i} />
          ))}
        </div>
      )}
    </PanelScroll>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isAll = value.startsWith("All");
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Filter by ${label}`}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40",
          isAll
            ? "text-ink-muted border-black/12 bg-white hover:border-black/25"
            : "border-accent-blue/40 bg-accent-blue/[0.06] text-ink"
        )}
      >
        {value}
        <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="listbox"
            className="absolute left-0 z-40 mt-2 min-w-[176px] overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
            style={{ animation: `scale-in 160ms ${EASE_OUT} both`, transformOrigin: "top left" }}
          >
            {options.map((opt) => {
              const selected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className="hover:bg-accent-blue/[0.06] flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none"
                >
                  <span className={cn("truncate", selected ? "text-ink font-medium" : "text-ink-muted")}>
                    {opt}
                  </span>
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

function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (syncing) return;
        setSyncing(true);
        setTimeout(() => setSyncing(false), 900);
      }}
      className="text-ink inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-black/12 bg-white px-3 text-sm font-medium outline-none transition-colors hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-accent-blue/40"
    >
      <RotateCw className={cn("size-4", syncing && "animate-spin")} />
      {syncing ? "Syncing" : "Sync"}
    </button>
  );
}

const BTN_ICON: Record<TemplateButtonKind, React.ComponentType<{ className?: string }>> = {
  url: ExternalLink,
  call: Phone,
  reply: Reply,
  copy: Copy,
};

function TemplateCard({ t, index }: { t: WaTemplate; index: number }) {
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(`${t.heading ? `${t.heading}\n\n` : ""}${t.body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked; ignore in design mode */
    }
  }

  return (
    <div
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm transition-shadow hover:shadow-md motion-safe:opacity-0 motion-safe:animate-[fade-in-up_320ms_ease-out_both]"
    >
      {/* whatsapp header */}
      <div className="bg-wa-header flex items-center justify-between gap-2 px-3.5 py-2">
        <p className="truncate text-sm font-semibold text-white">{t.title}</p>
        <HeaderStatus status={t.status} />
      </div>

      {/* whatsapp message preview */}
      <div className="bg-wa-paper flex-1 px-3 py-3">
        <div className="relative ml-1.5 max-w-[94%]">
          {/* bubble tail */}
          <span aria-hidden className="absolute -left-1.5 top-2.5 size-3 rotate-45 rounded-[2px] bg-white" />
          <div className="relative rounded-xl rounded-tl-sm bg-white p-2 shadow-sm ring-1 ring-black/[0.03]">
            {t.hasMedia && (
              <div className="text-ink-muted/40 mb-1.5 grid h-28 place-items-center rounded-lg bg-gradient-to-br from-black/[0.07] to-black/[0.03]">
                <ImageIcon className="size-7" />
              </div>
            )}
            <div className="px-1 pb-0.5">
              {t.heading && <p className="text-ink text-[13px] leading-snug font-bold">{t.heading}</p>}
              <p className="text-ink/90 mt-0.5 line-clamp-2 text-[13px] leading-snug">{t.body}</p>
              <p className="text-ink-muted/60 mt-1 flex items-center justify-end gap-1 text-[10px]">
                10:30 AM
                <CheckCheck className="text-accent-blue size-3" />
              </p>
            </div>
          </div>

          {/* quick-reply / cta buttons */}
          {t.buttons.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {t.buttons.map((b) => {
                const Icon = BTN_ICON[b.kind];
                return (
                  <div
                    key={b.label}
                    className="text-accent-blue flex items-center justify-center gap-1.5 rounded-lg bg-white py-1.5 text-[13px] font-medium shadow-sm ring-1 ring-black/[0.03]"
                  >
                    <Icon className="size-3.5" />
                    {b.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* footer: meta + actions */}
      <div className="border-t border-black/[0.06] p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="bg-tag text-tag-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
              {t.category}
            </span>
            <span className="bg-brand-green/10 text-brand-green rounded-full px-2 py-0.5 text-[11px] font-medium">
              {t.kind}
            </span>
          </div>
          <div className="text-ink-muted flex items-center gap-1">
            <span className="mr-0.5 inline-flex items-center gap-1 text-[11px]">
              <Globe className="size-3" />
              {t.language}
            </span>
            <button
              type="button"
              onClick={copyMessage}
              aria-label="Copy message"
              className="hover:text-ink grid size-7 place-items-center rounded-md transition-colors hover:bg-black/[0.05]"
            >
              {copied ? <Check className="text-brand-green size-3.5" /> : <Copy className="size-3.5" />}
            </button>
            <button
              type="button"
              aria-label="Delete template"
              className="grid size-7 place-items-center rounded-md transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
        <Button className="bg-brand-blue hover:bg-brand-blue-hover mt-2.5 h-9 w-full rounded-lg text-sm font-semibold text-white">
          Use Template
        </Button>
      </div>
    </div>
  );
}

function HeaderStatus({ status }: { status: TemplateStatus }) {
  const tone = TEMPLATE_STATUS_TONE[status];
  const dot = tone === "good" ? "bg-brand-green" : tone === "warm" ? "bg-brand-orange" : "bg-red-500";
  return (
    <span className="text-ink inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold">
      <span className={cn("size-1.5 rounded-full", dot)} />
      {status}
    </span>
  );
}

/* ------------------------------- broadcasts ------------------------------- */

export function BroadcastsPanel() {
  return (
    <PanelScroll>
      <PanelHead
        title="Broadcasts"
        desc="Send a template to a list of contacts and track how it lands."
        action={<PrimaryButton icon={Megaphone}>New Broadcast</PrimaryButton>}
      />
      <div className="space-y-3">
        {BROADCASTS.map((b) => {
          const readRate = b.audience > 0 ? Math.round((b.read / b.audience) * 100) : 0;
          return (
            <div key={b.id} className={cn(CARD, "p-4")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-ink truncate text-sm font-semibold">{b.name}</p>
                  <p className="text-ink-muted mt-0.5 truncate text-xs">
                    <span className="font-mono">{b.template}</span>
                    <span className="text-ink-muted/50"> · </span>
                    {b.when}
                  </p>
                </div>
                <StatusPill tone={BROADCAST_STATUS_TONE[b.status]} dot>
                  {b.status}
                </StatusPill>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3">
                <Metric label="Audience" value={inr(b.audience)} />
                <Metric label="Delivered" value={inr(b.delivered)} />
                <Metric label="Read" value={inr(b.read)} />
                <Metric label="Replied" value={inr(b.replied)} />
              </div>

              {b.audience > 0 && (
                <div className="mt-3">
                  <div className="text-ink-muted mb-1 flex items-center justify-between text-[11px]">
                    <span>Read rate</span>
                    <span className="text-ink font-semibold">{readRate}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.07]">
                    <div
                      className="bg-brand-green h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${readRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PanelScroll>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/[0.02] px-3 py-2">
      <p className="text-ink-muted text-[11px]">{label}</p>
      <p className="text-ink mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/* -------------------------------- contacts -------------------------------- */

export function ContactsPanel() {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CONTACTS;
    return CONTACTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <PanelScroll>
      <PanelHead
        title="Contacts"
        desc="Everyone who has messaged you, with their interests and opt-in status."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="text-ink h-10 rounded-lg border-black/15 px-4 text-sm font-medium"
            >
              <Upload className="size-4" />
              Import
            </Button>
            <PrimaryButton icon={Plus}>Add Contact</PrimaryButton>
          </div>
        }
      />

      <div className="mb-3 max-w-sm">
        <div className="relative">
          <Search className="text-ink-muted/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, number, or tag"
            aria-label="Search contacts"
            className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-10 w-full rounded-lg border border-black/12 bg-white pr-9 pl-9 text-sm outline-none transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-ink-muted hover:bg-black/[0.05] hover:text-ink absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className={cn(CARD, "overflow-hidden")}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink-muted border-b border-black/[0.06] text-left text-xs">
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Opt-in</th>
              <th className="px-4 py-3 text-right font-medium">Last contacted</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-ink-muted px-4 py-10 text-center">
                  No contacts match that search.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Monogram initials={c.initials} className="size-9" />
                      <div className="min-w-0">
                        <p className="text-ink truncate font-medium">{c.name}</p>
                        <p className="text-ink-muted truncate text-xs">{c.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {c.tags.map((t) => (
                        <span key={t} className="bg-tag text-tag-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.optedIn ? (
                      <StatusPill tone="good">Opted in</StatusPill>
                    ) : (
                      <StatusPill tone="neutral">Not opted in</StatusPill>
                    )}
                  </td>
                  <td className="text-ink-muted px-4 py-3 text-right text-xs whitespace-nowrap">
                    {c.lastContacted}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PanelScroll>
  );
}

/* ------------------------------- chat flows ------------------------------- */

export function FlowsPanel() {
  const [flows, setFlows] = useState<ChatFlow[]>(CHAT_FLOWS);
  return (
    <PanelScroll>
      <PanelHead
        title="Chat flows"
        desc="Automations that reply or route a conversation before the AI takes over."
        action={<PrimaryButton icon={Workflow}>New Flow</PrimaryButton>}
      />
      <div className="space-y-3">
        {flows.map((f) => (
          <div key={f.id} className={cn(CARD, "flex items-center gap-4 p-4")}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-ink truncate text-sm font-semibold">{f.name}</p>
                {f.enabled && (
                  <span className="text-brand-green inline-flex items-center gap-1 text-[11px] font-medium">
                    <CircleCheck className="size-3" /> Active
                  </span>
                )}
              </div>
              <p className="text-ink-muted mt-1 text-xs">
                <span className="text-ink font-medium">When</span> {f.trigger}
                <span className="text-ink-muted/50"> → </span>
                <span className="text-ink font-medium">do</span> {f.action}
              </p>
              <p className="text-ink-muted mt-1.5 text-[11px]">{inr(f.runs)} runs</p>
            </div>
            <Toggle
              on={f.enabled}
              label={`Enable ${f.name}`}
              onChange={() =>
                setFlows((prev) => prev.map((x) => (x.id === f.id ? { ...x, enabled: !x.enabled } : x)))
              }
            />
          </div>
        ))}
      </div>
    </PanelScroll>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        on ? "bg-brand-green" : "bg-black/15"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          on && "translate-x-5"
        )}
        style={{ transitionTimingFunction: EASE_OUT }}
      />
    </button>
  );
}
