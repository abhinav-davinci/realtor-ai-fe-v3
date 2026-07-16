"use client";

/**
 * The lead row + open-lead header for Lead Intelligence, kept deliberately in
 * step with the shared LeadRow in agent-conversations (channel avatar, outcome
 * badge, summary, right-aligned meta) so the two screens never drift. The only
 * intelligence-specific additions are the colour-coded intent score and the
 * origin source chip, both folded into the existing right-hand column.
 */
import { ArrowLeft, Check, ChevronRight, Headset, PhoneCall, Sparkles, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HOT_THRESHOLD, SOURCE_META, TIER_META, type ScoredLead, type Tier } from "@/lib/lead-intelligence";
import { BothChannelsPill, Highlight, LeadAvatar, OutcomeBadge } from "@/components/conversations/conversation-ui";
import { SourceChip } from "./source-icons";

/** Sticky bar that returns from a lead's detail to the full list. It stays pinned
 * to the top while the (long) transcript scrolls, so the way back is always in
 * reach. The arrow nudges left on hover to read as "go back"; press scales for
 * feedback; both are motion-safe. */
export function BackToLeadsBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="sticky top-0 z-20 -mx-4 bg-white/80 px-4 py-2.5 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="group text-ink hover:border-black/25 inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm font-semibold outline-none transition-[border-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/30 active:scale-[0.98]"
      >
        <ArrowLeft className="size-4 transition-transform duration-150 ease-out motion-safe:group-hover:-translate-x-0.5" />
        Back to leads
      </button>
    </div>
  );
}

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
          {lead.promotedFromAiCall && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600">
              <Sparkles className="size-2.5" /> AI call
            </span>
          )}
          {lead.owner === "human" && (
            <span className="bg-brand-green/10 text-brand-green inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
              <UserRoundCheck className="size-2.5" /> You
            </span>
          )}
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
export function LeadScoreHeader({ lead, onTakeOver }: { lead: ScoredLead; onTakeOver?: () => void }) {
  const handedOff = lead.owner === "human";
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
          {handedOff ? "With sales" : lead.status} · scored {lead.score}/100 · via {lead.agentRole}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {handedOff ? (
          <span className="bg-brand-green/10 text-brand-green inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
            <UserRoundCheck className="size-4" /> You&apos;re handling this
          </span>
        ) : (
          onTakeOver && (
            <Button
              variant="outline"
              onClick={onTakeOver}
              className="text-ink h-9 rounded-lg border-black/15 px-3 text-sm font-semibold"
            >
              <Headset className="size-4" /> Take over
            </Button>
          )
        )}
        <Button className="bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-3 text-sm font-semibold text-white">
          <PhoneCall className="size-4" /> Call lead
        </Button>
      </div>
      <ScoreBreakdown lead={lead} />
    </div>
  );
}

/** Why this score: the flow's factors, filled when met, with the Hot line. Makes
 * the number explainable and shows what would raise it. */
function ScoreBreakdown({ lead }: { lead: ScoredLead }) {
  if (!lead.scoreBreakdown?.length) return null;
  return (
    <div className="w-full border-t border-black/[0.06] pt-3">
      <p className="text-ink-muted mb-2 text-xs font-medium">Why this score</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {lead.scoreBreakdown.map((f) => (
          <span
            key={f.key}
            title={f.met ? `${f.label}: +${f.points}` : `${f.label}: not captured yet`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              f.met
                ? "bg-brand-green/10 text-brand-green"
                : "text-ink-muted/60 border border-dashed border-black/15"
            )}
          >
            {f.met && <Check className="size-2.5" />}
            {f.label}
            <span className="tabular-nums">+{f.points}</span>
          </span>
        ))}
      </div>
      <p className="text-ink-muted mt-2 text-[11px]">
        Adds up to <span className="text-ink font-semibold tabular-nums">{lead.score}</span>/100. Hot at{" "}
        {HOT_THRESHOLD}+. The score moves as the lead replies.
      </p>
    </div>
  );
}
