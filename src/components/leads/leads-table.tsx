"use client";

/**
 * The "Lead Intelligence" page (also reached from the Overview "View all" CTA):
 * a full-page list of every captured lead with search and the complete filter
 * set (source, intent tier, channel). Reuses the same ScoredLeadRow and lead
 * detail as the Overview dashboard so the two stay visually identical.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronDown, Download, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALL_TEMPLATE_IDS } from "@/lib/conversations";
import { type TemplateId } from "@/lib/agents";
import {
  SOURCE_META,
  SOURCE_ORDER,
  TIER_META,
  TIER_ORDER,
  filterLeads,
  listScoredLeads,
  sourceCounts,
  type LeadSource,
  type ScoredLead,
  type Tier,
} from "@/lib/lead-intelligence";
import {
  acknowledgePromoted,
  LEADS_CHANGED_EVENT,
  listAllScoredLeads,
  takeOverLead,
  unseenPromotedCount,
} from "@/lib/lead-promotion";
import { EASE_OUT, SearchBar, LeadDetail } from "@/components/conversations/conversation-ui";
import { LeadScoreHeader, ScoredLeadRow } from "./lead-row";
import { SourceIcon } from "./source-icons";
import { AutoCallButton } from "./auto-call-context";

export function LeadsTable() {
  const params = useSearchParams();
  const templateParam = params.get("template");
  const templateId: TemplateId | null = ALL_TEMPLATE_IDS.includes(templateParam as TemplateId)
    ? (templateParam as TemplateId)
    : null;

  // Start from the deterministic seed set (SSR-safe), then merge in promoted
  // leads from localStorage after mount and whenever they change.
  const [allLeads, setAllLeads] = useState<ScoredLead[]>(() => listScoredLeads());
  const [unseen, setUnseen] = useState(0);
  useEffect(() => {
    const load = () => {
      setAllLeads(listAllScoredLeads());
      setUnseen(unseenPromotedCount());
    };
    load();
    window.addEventListener(LEADS_CHANGED_EVENT, load);
    return () => window.removeEventListener(LEADS_CHANGED_EVENT, load);
  }, []);
  const perSource = useMemo(() => sourceCounts(allLeads), [allLeads]);

  const [tier, setTier] = useState<Tier | "all">("all");
  const [source, setSource] = useState<LeadSource | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  function dismissBanner() {
    acknowledgePromoted();
    setUnseen(0);
  }
  function onTakeOver(id: string) {
    takeOverLead(id);
  }

  const visible = useMemo(
    () =>
      filterLeads(allLeads, { tab: "all", tier, channel: "both", source, minScore: null, maxScore: null, query, templateId }),
    [allLeads, tier, source, query, templateId]
  );

  const open = allLeads.find((l) => l.id === openId) ?? null;
  const filtered = tier !== "all" || source !== "all" || query.trim() !== "";

  function resetFilters() {
    setQuery("");
    setTier("all");
    setSource("all");
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-ink text-xl font-bold">Lead Intelligence</h1>
          <p className="text-ink-muted text-sm">{allLeads.length} leads · last 30 days</p>
        </div>
        <div className="flex items-center gap-2">
          <AutoCallButton />
          <Button variant="outline" className="text-ink hidden h-9 items-center gap-1.5 rounded-lg border-black/15 px-3 text-sm font-semibold sm:inline-flex">
            <Download className="size-4" /> Download All Leads
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
        {open ? (
          <div className="space-y-3">
            <LeadScoreHeader lead={open} onTakeOver={() => onTakeOver(open.id)} />
            <LeadDetail lead={open} agentName={open.agentRole} onBack={() => setOpenId(null)} />
          </div>
        ) : (
          <>
            {/* new leads from AI calls */}
            {unseen > 0 && (
              <div
                className="border-brand-green/25 bg-brand-green/[0.06] mb-3 flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ animation: `fade-in-up 260ms ${EASE_OUT} both` }}
              >
                <span className="bg-brand-green/15 text-brand-green grid size-9 shrink-0 place-items-center rounded-full motion-safe:animate-[success-pop_460ms_cubic-bezier(0.23,1,0.32,1)_both]">
                  <Sparkles className="size-4.5" />
                </span>
                <p className="text-ink min-w-0 flex-1 text-sm font-semibold">
                  {unseen} new {unseen === 1 ? "lead" : "leads"} added from AI calls.{" "}
                  <span className="text-ink-muted font-normal">Now at the top of your list.</span>
                </p>
                <button
                  type="button"
                  onClick={dismissBanner}
                  aria-label="Dismiss"
                  className="text-ink-muted hover:bg-black/[0.05] hover:text-ink grid size-7 shrink-0 place-items-center rounded-lg transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* source chips */}
            <SourceFilter value={source} counts={perSource} total={allLeads.length} onChange={setSource} />

            {/* search + tier + channel */}
            <div className="mt-3 flex flex-col gap-2.5 lg:flex-row lg:items-center">
              <SearchBar leads={allLeads} query={query} setQuery={setQuery} onOpenLead={setOpenId} />
              <div className="flex flex-wrap items-center gap-2">
                <TierFilter value={tier} onChange={setTier} />
              </div>
            </div>

            {/* count */}
            <p className="text-ink-muted mt-4 text-xs font-medium">
              {visible.length} {visible.length === 1 ? "lead" : "leads"}
              {filtered && (
                <button type="button" onClick={resetFilters} className="text-accent-blue ml-2 font-semibold outline-none hover:underline">
                  Clear filters
                </button>
              )}
            </p>

            {/* list */}
            {visible.length > 0 ? (
              <div className="mt-2.5 space-y-2.5">
                {visible.map((l) => (
                  <ScoredLeadRow key={l.id} lead={l} query={query} onOpen={() => setOpenId(l.id)} />
                ))}
              </div>
            ) : (
              <div className="mt-3 grid place-items-center rounded-xl border border-dashed border-black/15 py-14 text-center">
                <p className="text-ink text-sm font-semibold">No leads match</p>
                <p className="text-ink-muted mt-1 text-xs">Try a different name, source, tier, or channel.</p>
                {filtered && (
                  <button type="button" onClick={resetFilters} className="text-accent-blue mt-3 text-xs font-semibold outline-none hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </>
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

/* -------------------------------- tier filter ----------------------------- */

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
