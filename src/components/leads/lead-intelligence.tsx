"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, ChevronRight, Download, PhoneCall, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALL_TEMPLATE_IDS } from "@/lib/conversations";
import { templateById, type TemplateId } from "@/lib/agents";
import {
  SOURCE_META,
  SOURCE_ORDER,
  TIER_META,
  TIER_ORDER,
  bestConvertingSource,
  filterLeads,
  leadSummary,
  listScoredLeads,
  sourceBreakdown,
  sourceCounts,
  type LeadSource,
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
import { KpiStrip, SourcesPanel } from "./lead-sources";
import { SourceChip, SourceIcon } from "./source-icons";

export function LeadIntelligence() {
  const router = useRouter();
  const params = useSearchParams();
  // Deep links from an agent page filter to that agent's template (SSR-safe: no
  // localStorage needed, the template id rides in the URL).
  const templateParam = params.get("template");
  const templateId: TemplateId | null = ALL_TEMPLATE_IDS.includes(templateParam as TemplateId)
    ? (templateParam as TemplateId)
    : null;

  const allLeads = useMemo(() => listScoredLeads(), []);
  const summary = useMemo(() => leadSummary(), []);
  const sources = useMemo(() => sourceBreakdown(), []);
  const best = useMemo(() => bestConvertingSource(), []);
  const perSource = useMemo(() => sourceCounts(allLeads), [allLeads]);

  const [tier, setTier] = useState<Tier | "all">("all");
  const [channel, setChannel] = useState<Filter>("both");
  const [source, setSource] = useState<LeadSource | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      filterLeads(allLeads, {
        tab: "all",
        tier,
        channel,
        source,
        minScore: null,
        maxScore: null,
        query,
        templateId,
      }),
    [allLeads, tier, channel, source, query, templateId]
  );

  const open = allLeads.find((l) => l.id === openId) ?? null;
  const filtered = tier !== "all" || channel !== "both" || source !== "all" || query.trim() !== "";

  function resetFilters() {
    setQuery("");
    setTier("all");
    setChannel("both");
    setSource("all");
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-ink text-xl font-bold">Lead Intelligence</h1>
          <p className="text-ink-muted text-sm">
            {summary.total.toLocaleString("en-IN")} leads across {sources.length} channels · last 30 days
            {templateId && <span> · {templateById(templateId).role}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-ink hidden h-9 items-center gap-1.5 rounded-lg border-black/15 px-3 text-sm font-semibold sm:inline-flex">
            <Upload className="size-4" /> Upload Leads
          </Button>
          <Button className="bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-3.5 text-sm font-semibold text-white">
            <PhoneCall className="size-4" /> Auto-call Hot Leads
          </Button>
          <Button variant="outline" className="text-ink hidden h-9 items-center gap-1.5 rounded-lg border-black/15 px-3 text-sm font-semibold sm:inline-flex">
            <Download className="size-4" /> Export
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {open ? (
          <div className="space-y-3">
            {/* score banner for the open lead */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-3">
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl text-lg font-bold tabular-nums", TIER_META[open.tier].badge)}>
                {open.score}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-ink truncate text-sm font-bold">{open.name}</p>
                  <TierBadge tier={open.tier} />
                  <span className="text-ink-muted inline-flex items-center gap-1 text-xs">
                    <SourceChip source={open.source} className="size-4" iconClassName="size-2.5" />
                    {SOURCE_META[open.source].label}
                  </span>
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
        ) : allLeads.length === 0 ? (
          <EmptyLeads onLaunch={() => router.push("/ai-team")} />
        ) : (
          <div className="space-y-5">
            <KpiStrip summary={summary} />
            <SourcesPanel data={sources} summary={summary} best={best} />

            {/* recent leads */}
            <section className="rounded-2xl border border-black/[0.07] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-ink font-bold">Recent leads</h2>
                  <p className="text-ink-muted text-xs">Every lead your AI captured, scored by buying intent.</p>
                </div>
              </div>

              {/* source filter chips */}
              <div className="mt-4">
                <SourceFilter value={source} counts={perSource} total={allLeads.length} onChange={setSource} />
              </div>

              {/* search + tier + channel */}
              <div className="mt-3 flex flex-col gap-2.5 lg:flex-row lg:items-center">
                <SearchBar leads={allLeads} query={query} setQuery={setQuery} onOpenLead={setOpenId} />
                <div className="flex flex-wrap items-center gap-2">
                  <TierFilter value={tier} onChange={setTier} />
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
                  <p className="text-ink-muted mt-1 text-xs">Try a different name, source, tier, or channel.</p>
                  {filtered && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-accent-blue mt-3 text-xs font-semibold outline-none hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ source filter ----------------------------- */

function SourceFilter({
  value,
  counts,
  total,
  onChange,
}: {
  value: LeadSource | "all";
  counts: Record<LeadSource, number>;
  total: number;
  onChange: (s: LeadSource | "all") => void;
}) {
  const chips: { key: LeadSource | "all"; label: string; count: number }[] = [
    { key: "all", label: "All sources", count: total },
    ...SOURCE_ORDER.filter((s) => counts[s] > 0).map((s) => ({ key: s, label: SOURCE_META[s].short, count: counts[s] })),
  ];
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      {chips.map((c) => {
        const sel = value === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/30",
              sel ? "border-transparent bg-ink text-white" : "text-ink-muted hover:text-ink border-black/10 hover:border-black/25"
            )}
          >
            {c.key !== "all" && <SourceIcon source={c.key} className="size-3.5" />}
            {c.label}
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] tabular-nums", sel ? "bg-white/20 text-white" : "bg-black/[0.06] text-ink-muted")}>
              {c.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- empty ----------------------------------- */

function EmptyLeads({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="mx-auto grid max-w-md place-items-center py-16 text-center">
      <div className="flex -space-x-1.5">
        {(["whatsapp", "voice", "website", "instagram", "facebook"] as LeadSource[]).map((s, i) => (
          <span
            key={s}
            className="ring-cream rounded-xl ring-4"
            style={{ animation: `fade-in-up 360ms ease-out ${i * 60}ms both`, zIndex: 10 - i }}
          >
            <SourceChip source={s} className="size-10" iconClassName="size-5" />
          </span>
        ))}
      </div>
      <h2 className="text-ink mt-5 text-lg font-bold">No leads yet</h2>
      <p className="text-ink-muted mt-1.5 text-sm">
        Connect your channels and your AI agents start capturing leads from calls, WhatsApp, your website, and social.
        They show up here, scored and ready to call.
      </p>
      <Button onClick={onLaunch} className="bg-brand-green hover:bg-brand-green-hover mt-5 h-10 rounded-lg px-4 text-sm font-semibold text-white">
        <Sparkles className="size-4" /> Launch an Agent
      </Button>
    </div>
  );
}

/* --------------------------------- bits ----------------------------------- */

function TierBadge({ tier }: { tier: Tier }) {
  const meta = TIER_META[tier];
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", meta.badge)}>{meta.name}</span>;
}

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

function ScoredLeadRow({ lead, query, onOpen }: { lead: ScoredLead; query: string; onOpen: () => void }) {
  const meta = TIER_META[lead.tier];
  // The source already implies a single channel; only call out the mix when a
  // lead reached us on both, so we never print "Voice · Voice".
  const both = lead.hasCall && lead.hasChat;

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
        <p className="text-ink-muted/70 mt-1 flex items-center gap-1.5 text-[11px]">
          <SourceChip source={lead.source} className="size-4" iconClassName="size-2.5" />
          {SOURCE_META[lead.source].short}
          {both && " · Call + Chat"} · {lead.when}
        </p>
      </div>
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl text-lg font-bold tabular-nums", meta.badge)}>
        {lead.score}
      </span>
      <ChevronRight className="text-ink-muted/50 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
