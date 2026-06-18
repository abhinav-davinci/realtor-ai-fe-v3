"use client";

/**
 * The secondary Outreach tabs: Templates, Broadcasts, Contacts, and Chat
 * Flows. Read-focused designed views over the mock data in
 * src/lib/outreach.ts. The "New ..." / "Add ..." actions are the entry points a
 * developer wires to real editors later.
 */
import { useMemo, useState } from "react";
import {
  CircleCheck,
  Megaphone,
  MessageSquarePlus,
  Plus,
  Search,
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
} from "@/lib/outreach";
import { EASE_OUT, inr, Monogram, StatusPill } from "./outreach-shared";

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
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Button className="bg-brand-blue hover:bg-brand-blue-hover h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-white">
      <Icon className="size-4" />
      {children}
    </Button>
  );
}

const CARD = "rounded-2xl border border-black/[0.08] bg-white";

/* ------------------------------- templates -------------------------------- */

export function TemplatesPanel() {
  return (
    <PanelScroll>
      <PanelHead
        title="Message templates"
        desc="Pre-approved messages you can send outside the 24 hour window."
        action={<PrimaryButton icon={MessageSquarePlus}>New Template</PrimaryButton>}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {TEMPLATES.map((t) => (
          <div key={t.id} className={cn(CARD, "p-4 transition-shadow hover:shadow-sm")}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-ink truncate font-mono text-sm font-semibold">{t.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="bg-tag text-tag-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                    {t.category}
                  </span>
                  <span className="bg-tag text-tag-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">
                    {t.language}
                  </span>
                </div>
              </div>
              <StatusPill tone={TEMPLATE_STATUS_TONE[t.status]} dot>
                {t.status}
              </StatusPill>
            </div>

            <p className="text-ink-muted mt-3 line-clamp-2 rounded-lg bg-black/[0.02] px-3 py-2 text-sm">
              {t.body}
            </p>

            <div className="text-ink-muted mt-3 flex items-center justify-between text-xs">
              <span>{t.sent > 0 ? `${inr(t.sent)} sent` : "Not sent yet"}</span>
              <span>Updated {t.updated}</span>
            </div>
          </div>
        ))}
      </div>
    </PanelScroll>
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
