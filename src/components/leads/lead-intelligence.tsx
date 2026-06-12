"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronDown, ChevronRight, Download, PhoneCall, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALL_TEMPLATE_IDS } from "@/lib/conversations";
import { templateById, type TemplateId } from "@/lib/agents";
import {
  LIFECYCLE_LABEL,
  LIFECYCLE_TABS,
  TIER_META,
  TIER_ORDER,
  filterLeads,
  intelligenceStats,
  listScoredLeads,
  tabCounts,
  type LifecycleTab,
  type ScoredLead,
  type Tier,
} from "@/lib/lead-intelligence";
import {
  EASE_OUT,
  FilterToggle,
  Highlight,
  LeadAvatar,
  LeadDetail,
  SearchBar,
  type Filter,
} from "@/components/conversations/conversation-ui";

const num = (s: string): number | null => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};

export function LeadIntelligence() {
  const params = useSearchParams();
  // Deep links from an agent page filter to that agent's template (SSR-safe: no
  // localStorage needed, the template id rides in the URL).
  const templateParam = params.get("template");
  const templateId: TemplateId | null = ALL_TEMPLATE_IDS.includes(templateParam as TemplateId)
    ? (templateParam as TemplateId)
    : null;
  const tabParam = params.get("tab");
  const initialTab: LifecycleTab = LIFECYCLE_TABS.includes(tabParam as LifecycleTab)
    ? (tabParam as LifecycleTab)
    : "all";

  const allLeads = useMemo(() => listScoredLeads(), []);
  const stats = useMemo(() => intelligenceStats(allLeads), [allLeads]);

  const [tab, setTab] = useState<LifecycleTab>(initialTab);
  const [tier, setTier] = useState<Tier | "all">("all");
  const [channel, setChannel] = useState<Filter>("both");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // Everything except the lifecycle tab, so the tab counts reflect the rest.
  const baseFiltered = useMemo(
    () =>
      filterLeads(allLeads, {
        tab: "all",
        tier,
        channel,
        minScore: num(minScore),
        maxScore: num(maxScore),
        query,
        templateId,
      }),
    [allLeads, tier, channel, minScore, maxScore, query, templateId]
  );
  const counts = useMemo(() => tabCounts(baseFiltered), [baseFiltered]);
  const visible = tab === "all" ? baseFiltered : baseFiltered.filter((l) => l.status === tab);

  const open = allLeads.find((l) => l.id === openId) ?? null;

  function resetFilters() {
    setQuery("");
    setTier("all");
    setChannel("both");
    setMinScore("");
    setMaxScore("");
    setTab("all");
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-ink text-xl font-bold">Lead Intelligence</h1>
          <p className="text-ink-muted text-sm">
            {stats.total} leads qualified by AI · last 30 days
            {templateId && <span> · {templateById(templateId).role}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-ink hidden h-9 items-center gap-1.5 rounded-lg border-black/15 px-3 text-sm font-semibold sm:inline-flex">
            <Upload className="size-4" /> Upload Leads
          </Button>
          <Button className="bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-3.5 text-sm font-semibold text-white">
            <PhoneCall className="size-4" /> Auto-call Leads
          </Button>
          <Button variant="outline" className="text-ink hidden h-9 items-center gap-1.5 rounded-lg border-black/15 px-3 text-sm font-semibold sm:inline-flex">
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {open ? (
          <div className="space-y-3">
            {/* score banner for the lead intelligence context */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-3">
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl text-lg font-bold tabular-nums", TIER_META[open.tier].badge)}>
                {open.score}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-ink truncate text-sm font-bold">{open.name}</p>
                  <TierBadge tier={open.tier} />
                </div>
                <p className="text-ink-muted mt-0.5 text-xs capitalize">
                  {open.status} · scored {open.score}/100 · via {open.agentRole}
                </p>
              </div>
              <Button className="bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-3 text-sm font-semibold text-white">
                <PhoneCall className="size-4" /> Call lead
              </Button>
            </div>
            <LeadDetail lead={open} agentName={open.agentRole} onBack={() => setOpenId(null)} />
          </div>
        ) : (
          <>
            {/* lifecycle tabs */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-black/[0.06]">
              {LIFECYCLE_TABS.map((t) => (
                <TabButton key={t} active={tab === t} onClick={() => setTab(t)}>
                  {LIFECYCLE_LABEL[t]}
                  <span className="bg-black/[0.06] text-ink-muted ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold">
                    {counts[t]}
                  </span>
                </TabButton>
              ))}
            </div>

            {/* filter row */}
            <div className="mt-4 flex flex-col gap-2.5 lg:flex-row lg:items-center">
              <SearchBar leads={allLeads} query={query} setQuery={setQuery} onOpenLead={setOpenId} />
              <div className="flex flex-wrap items-center gap-2">
                <TierFilter value={tier} onChange={setTier} />
                <input
                  type="number"
                  inputMode="numeric"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  placeholder="Min score"
                  aria-label="Minimum score"
                  className="text-ink focus:border-accent-blue/50 h-10 w-28 rounded-lg border border-black/15 bg-white px-3 text-sm outline-none"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  placeholder="Max score"
                  aria-label="Maximum score"
                  className="text-ink focus:border-accent-blue/50 h-10 w-28 rounded-lg border border-black/15 bg-white px-3 text-sm outline-none"
                />
                <FilterToggle value={channel} onChange={setChannel} />
              </div>
            </div>

            {/* list */}
            {visible.length > 0 ? (
              <div className="mt-4 space-y-2.5">
                {visible.map((l) => (
                  <ScoredLeadRow key={l.id} lead={l} query={query} onOpen={() => setOpenId(l.id)} />
                ))}
              </div>
            ) : (
              <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-black/15 py-14 text-center">
                <p className="text-ink text-sm font-semibold">No leads match</p>
                <p className="text-ink-muted mt-1 text-xs">Try a different name, score range, tier, or channel.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-accent-blue mt-3 text-xs font-semibold outline-none hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const meta = TIER_META[tier];
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", meta.badge)}>{meta.name}</span>;
}

/* ------------------------------ tier dropdown ----------------------------- */

function TierFilter({ value, onChange }: { value: Tier | "all"; onChange: (t: Tier | "all") => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const label = value === "all" ? "All Categories" : TIER_META[value].name;
  const options: { key: Tier | "all"; name: string }[] = [
    { key: "all", name: "All Categories" },
    ...TIER_ORDER.map((t) => ({ key: t, name: TIER_META[t].name })),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="text-ink hover:border-black/25 focus-visible:border-accent-blue/50 flex h-10 items-center gap-2 rounded-lg border border-black/15 bg-white pr-2.5 pl-3 text-sm outline-none"
      >
        <span>{label}</span>
        <ChevronDown className={cn("text-ink-muted/70 size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 z-20 mt-1.5 min-w-[190px] overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
          style={{ animation: `scale-in 160ms ${EASE_OUT} both`, transformOrigin: "top" }}
        >
          {options.map((o) => {
            const selected = o.key === value;
            return (
              <button
                key={o.key}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors",
                  selected ? "text-ink font-semibold" : "text-ink-muted hover:bg-black/[0.04] hover:text-ink"
                )}
              >
                <span className="flex items-center gap-2.5">
                  {o.key !== "all" && <span className={cn("size-2 rounded-full", TIER_META[o.key as Tier].dot)} />}
                  {o.name}
                </span>
                {selected && <Check className="text-accent-blue size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex shrink-0 items-center px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        active ? "text-ink" : "text-ink-muted hover:text-ink"
      )}
    >
      {children}
      {active && <span className="bg-accent-blue absolute inset-x-3 -bottom-px h-0.5 rounded-full" />}
    </button>
  );
}

function ScoredLeadRow({ lead, query, onOpen }: { lead: ScoredLead; query: string; onOpen: () => void }) {
  const meta = TIER_META[lead.tier];
  const channelLabel = lead.hasCall && lead.hasChat ? "Call + Chat" : lead.hasCall ? "Voice" : "Chat";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group hover:border-accent-blue/30 hover:bg-accent-blue/[0.02] flex w-full items-center gap-3 rounded-xl border border-black/[0.08] p-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40"
    >
      <LeadAvatar lead={lead} className="size-10" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-ink truncate text-sm font-semibold">
            <Highlight text={lead.name} query={query} />
          </p>
          <TierBadge tier={lead.tier} />
        </div>
        <p className="text-ink-muted mt-0.5 truncate text-xs">{lead.summary}</p>
        <p className="text-ink-muted/70 mt-0.5 text-[11px]">{channelLabel} · {lead.when}</p>
      </div>
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl text-lg font-bold tabular-nums", meta.badge)}>
        {lead.score}
      </span>
      <ChevronRight className="text-ink-muted/50 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
