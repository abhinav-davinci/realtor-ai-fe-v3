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
  ChevronLeft,
  ChevronRight,
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
  type Broadcast,
  type ChatFlow,
  type TemplateButtonKind,
  type TemplateStatus,
  type WaTemplate,
} from "@/lib/outreach";
import { ConfirmDialog, EASE_OUT, inr, Monogram, StatusPill } from "./outreach-shared";
import { TemplateComposer } from "./outreach-template-composer";
import { BroadcastComposer } from "./outreach-broadcast-composer";

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

export function TemplatesPanel({
  onFocus,
  onUseTemplate,
}: {
  onFocus?: (v: boolean) => void;
  onUseTemplate?: (t: WaTemplate) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [templates, setTemplates] = useState(TEMPLATES);
  const [pendingDelete, setPendingDelete] = useState<WaTemplate | null>(null);
  function openComposer() {
    setComposing(true);
    onFocus?.(true);
  }
  function closeComposer() {
    setComposing(false);
    onFocus?.(false);
  }
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
        onBack={closeComposer}
        onSave={(tpl) => {
          setTemplates((prev) => [tpl, ...prev]);
          closeComposer();
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
          <PrimaryButton icon={MessageSquarePlus} onClick={openComposer}>
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
            <TemplateCard
              key={t.id}
              t={t}
              index={i}
              onDelete={() => setPendingDelete(t)}
              onUse={() => onUseTemplate?.(t)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this template?"
        message={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          setTemplates((prev) => prev.filter((x) => x.id !== pendingDelete?.id));
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
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

function TemplateCard({
  t,
  index,
  onDelete,
  onUse,
}: {
  t: WaTemplate;
  index: number;
  onDelete: () => void;
  onUse: () => void;
}) {
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
              onClick={onDelete}
              aria-label={`Delete ${t.title}`}
              className="grid size-7 place-items-center rounded-md transition-colors hover:bg-red-50 hover:text-red-500 active:scale-95"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
        <Button
          onClick={onUse}
          className="bg-brand-blue hover:bg-brand-blue-hover mt-2.5 h-9 w-full rounded-lg text-sm font-semibold text-white"
        >
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

export function BroadcastsPanel({
  initialTemplate,
  onFocus,
  onConsumeTemplate,
}: {
  initialTemplate?: WaTemplate | null;
  onFocus?: (v: boolean) => void;
  onConsumeTemplate?: () => void;
}) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(BROADCASTS);
  const [wizard, setWizard] = useState(!!initialTemplate);
  const [wizardTemplate, setWizardTemplate] = useState<WaTemplate | null>(initialTemplate ?? null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [page, setPage] = useState(0);

  function openWizard(tpl: WaTemplate | null) {
    setWizardTemplate(tpl);
    setWizard(true);
    onFocus?.(true);
  }
  function closeWizard() {
    setWizard(false);
    setWizardTemplate(null);
    onFocus?.(false);
    onConsumeTemplate?.();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return broadcasts.filter((b) => {
      if (!statusFilter.startsWith("All") && b.status !== statusFilter) return false;
      if (q && !`${b.name} ${b.template}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [broadcasts, query, statusFilter]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (a, b) => ({
          audience: a.audience + b.audience,
          sent: a.sent + b.sent,
          delivered: a.delivered + b.delivered,
          read: a.read + b.read,
          failed: a.failed + b.failed,
        }),
        { audience: 0, sent: 0, delivered: 0, read: 0, failed: 0 }
      ),
    [filtered]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage);

  if (wizard) {
    return (
      <BroadcastComposer
        initialTemplate={wizardTemplate}
        onBack={closeWizard}
        onSave={(b) => {
          setBroadcasts((prev) => [b, ...prev]);
          closeWizard();
        }}
      />
    );
  }

  return (
    <PanelScroll>
      {/* toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="text-ink-muted/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search broadcasts..."
            aria-label="Search broadcasts"
            className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-9 w-full rounded-lg border border-black/12 bg-white pr-3 pl-9 text-sm outline-none transition-colors"
          />
        </div>
        <FilterSelect
          label="status"
          value={statusFilter}
          options={["All Statuses", "Sent", "Sending", "Scheduled", "Draft"]}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(0);
          }}
        />
        <div className="ml-auto">
          <PrimaryButton icon={Megaphone} onClick={() => openWizard(null)}>
            New Broadcast
          </PrimaryButton>
        </div>
      </div>

      {/* stats strip */}
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm">
        <Stat n={filtered.length} label="broadcasts" />
        <Stat n={totals.audience} label="recipients" />
        <Stat n={totals.sent} label="sent" tone="text-accent-blue" />
        <Stat n={totals.delivered} label="delivered" tone="text-brand-green" />
        <Stat n={totals.read} label="read" tone="text-brand-orange" />
        <Stat n={totals.failed} label="failed" tone="text-red-500" />
      </div>

      {/* table */}
      <div className={cn(CARD, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-ink-muted border-b border-black/[0.06] text-left text-xs">
                <th className="px-4 py-3 font-medium">Broadcast</th>
                <th className="px-4 py-3 font-medium">Template</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Sent</th>
                <th className="px-4 py-3 text-right font-medium">Delivered</th>
                <th className="px-4 py-3 text-right font-medium">Read</th>
                <th className="px-4 py-3 text-right font-medium">Failed</th>
                <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-ink-muted px-4 py-12 text-center">
                    No broadcasts match your filters.
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02]">
                    <td className="text-ink px-4 py-3 font-semibold">{b.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-ink-muted block truncate font-mono text-xs">{b.template}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={BROADCAST_STATUS_TONE[b.status]} dot>
                        {b.status}
                      </StatusPill>
                    </td>
                    <td className="text-ink px-4 py-3 text-right font-semibold tabular-nums">{inr(b.audience)}</td>
                    <td className="text-accent-blue px-4 py-3 text-right font-medium tabular-nums">{inr(b.sent)}</td>
                    <td className="text-brand-green px-4 py-3 text-right font-medium tabular-nums">{inr(b.delivered)}</td>
                    <td className="text-brand-orange px-4 py-3 text-right font-medium tabular-nums">{inr(b.read)}</td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-medium tabular-nums",
                        b.failed > 0 ? "text-red-500" : "text-ink-muted"
                      )}
                    >
                      {inr(b.failed)}
                    </td>
                    <td className="text-ink-muted px-4 py-3 text-right text-xs whitespace-nowrap">{b.when}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="text-ink-muted flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span>
              {filtered.length} broadcast{filtered.length === 1 ? "" : "s"}
            </span>
            <span className="text-ink-muted/40">·</span>
            <span>Rows</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(0);
              }}
              aria-label="Rows per page"
              className="text-ink h-7 rounded-md border border-black/12 bg-white px-1.5 text-xs outline-none"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span>
              Page {safePage + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              aria-label="Previous page"
              className="text-ink grid size-7 place-items-center rounded-md border border-black/12 transition-colors hover:bg-black/[0.04] disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              aria-label="Next page"
              className="text-ink grid size-7 place-items-center rounded-md border border-black/12 transition-colors hover:bg-black/[0.04] disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </PanelScroll>
  );
}

function Stat({ n, label, tone = "text-ink" }: { n: number; label: string; tone?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={cn("text-base font-bold tabular-nums", tone)}>{inr(n)}</span>
      <span className="text-ink-muted text-xs">{label}</span>
    </span>
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
