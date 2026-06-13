"use client";

/**
 * The lead row + open-lead header for Lead Intelligence, kept deliberately in
 * step with the shared LeadRow in agent-conversations (channel avatar, outcome
 * badge, summary, right-aligned meta) so the two screens never drift. The only
 * intelligence-specific additions are the colour-coded intent score and the
 * origin source chip, both folded into the existing right-hand column.
 */
import { ChevronRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SOURCE_META, TIER_META, type ScoredLead, type Tier } from "@/lib/lead-intelligence";
import { BothChannelsPill, Highlight, LeadAvatar, OutcomeBadge } from "@/components/conversations/conversation-ui";
import { SourceChip } from "./source-icons";

export function TierBadge({ tier }: { tier: Tier }) {
  const meta = TIER_META[tier];
  return <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", meta.badge)}>{meta.name}</span>;
}

export function ScoredLeadRow({ lead, query, onOpen }: { lead: ScoredLead; query: string; onOpen: () => void }) {
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
          <OutcomeBadge outcome={lead.outcome} tone={lead.tone} />
          {both && <BothChannelsPill />}
        </div>
        <p className="text-ink-muted mt-0.5 truncate text-xs">{lead.summary}</p>
      </div>
      <div className="shrink-0 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <SourceChip source={lead.source} className="size-4" iconClassName="size-2.5" />
          <span className={cn("text-base font-bold tabular-nums", TIER_META[lead.tier].score)}>{lead.score}</span>
        </div>
        <p className="text-ink-muted/70 mt-1 text-[11px]">{lead.when}</p>
      </div>
      <ChevronRight className="text-ink-muted/50 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

/** The banner shown above a lead's transcript when it's opened. */
export function LeadScoreHeader({ lead }: { lead: ScoredLead }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[0.08] bg-white px-4 py-3">
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl text-lg font-bold tabular-nums", TIER_META[lead.tier].badge)}>
        {lead.score}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-ink truncate text-sm font-bold">{lead.name}</p>
          <TierBadge tier={lead.tier} />
          <span className="text-ink-muted inline-flex items-center gap-1 text-xs">
            <SourceChip source={lead.source} className="size-4" iconClassName="size-2.5" />
            {SOURCE_META[lead.source].label}
          </span>
        </div>
        <p className="text-ink-muted mt-0.5 text-xs capitalize">
          {lead.status} · scored {lead.score}/100 · via {lead.agentRole}
        </p>
      </div>
      <Button className="bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-3 text-sm font-semibold text-white">
        <PhoneCall className="size-4" /> Call lead
      </Button>
    </div>
  );
}
