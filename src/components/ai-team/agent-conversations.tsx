"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, MessageSquare, MessagesSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  conversationStats,
  conversationsFor,
  type Conversation,
  type OutcomeTone,
} from "@/lib/conversations";
import type { AgentConfig } from "@/lib/agents";

const TONE_STYLES: Record<OutcomeTone, string> = {
  good: "bg-brand-green/10 text-brand-green",
  warm: "bg-brand-orange/10 text-brand-orange",
  cold: "bg-red-50 text-red-500",
  neutral: "bg-black/[0.05] text-ink-muted",
};

function OutcomeBadge({ outcome, tone }: { outcome: string; tone: OutcomeTone }) {
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", TONE_STYLES[tone])}>
      {outcome}
    </span>
  );
}

function ChannelIcon({ channel, className }: { channel: "voice" | "chat"; className?: string }) {
  return channel === "voice" ? (
    <span className={cn("bg-accent-blue/10 text-accent-blue grid place-items-center rounded-lg", className)}>
      <Phone className="size-5" />
    </span>
  ) : (
    <span className={cn("bg-brand-green/10 text-brand-green grid place-items-center rounded-lg", className)}>
      <MessageSquare className="size-5" />
    </span>
  );
}

export function AgentConversations({ agent, onTest }: { agent: AgentConfig; onTest?: () => void }) {
  const convs = useMemo(() => conversationsFor(agent.templateId), [agent.templateId]);
  const stats = useMemo(() => conversationStats(convs), [convs]);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = convs.find((c) => c.id === openId);

  if (open) {
    return <Transcript conv={open} agentName={agent.name} onBack={() => setOpenId(null)} />;
  }

  if (convs.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-black/15 py-16 text-center">
        <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl">
          <MessagesSquare className="size-7" />
        </span>
        <p className="text-ink mt-4 font-bold">No conversations yet</p>
        <p className="text-ink-muted mt-1 max-w-xs text-sm">
          When your agent talks to customers on calls or chat, they show up here with full transcripts.
        </p>
        {onTest && (
          <Button onClick={onTest} className="bg-brand-blue hover:bg-brand-blue-hover mt-4 h-9 rounded-lg px-4 text-sm font-semibold text-white">
            Test your agent
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="text-ink font-bold">{stats.total} conversations</span>
        <span className="text-ink-muted">·</span>
        <span className="text-ink-muted">{stats.calls} calls, {stats.chats} chats</span>
        {stats.wins > 0 && (
          <>
            <span className="text-ink-muted">·</span>
            <span className="text-brand-green font-medium">{stats.wins} booked or qualified</span>
          </>
        )}
      </div>

      <div className="mt-4 space-y-2.5">
        {convs.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setOpenId(c.id)}
            className="group hover:border-accent-blue/30 hover:bg-accent-blue/[0.02] flex w-full items-center gap-3 rounded-xl border border-black/[0.08] p-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40"
          >
            <ChannelIcon channel={c.channel} className="size-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-ink truncate text-sm font-semibold">{c.customer}</p>
                <OutcomeBadge outcome={c.outcome} tone={c.tone} />
              </div>
              <p className="text-ink-muted mt-0.5 truncate text-xs">{c.summary}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-ink-muted text-xs">{c.when}</p>
              <p className="text-ink-muted/70 text-[11px]">{c.meta}</p>
            </div>
            <ChevronRight className="text-ink-muted/50 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Transcript({ conv, agentName, onBack }: { conv: Conversation; agentName: string; onBack: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="text-ink-muted hover:text-ink hover:bg-black/[0.04] grid size-8 shrink-0 place-items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
        >
          <ArrowLeft className="size-4.5" />
        </button>
        <ChannelIcon channel={conv.channel} className="size-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate text-sm font-semibold">
            {conv.customer}
            {conv.phone && <span className="text-ink-muted ml-2 font-normal">{conv.phone}</span>}
          </p>
          <p className="text-ink-muted text-xs">
            {conv.channel === "voice" ? "Call" : "Web chat"} · {conv.when} · {conv.meta}
          </p>
        </div>
        <OutcomeBadge outcome={conv.outcome} tone={conv.tone} />
      </div>

      {/* captured details */}
      {conv.captured && conv.captured.length > 0 && (
        <div className="border-b border-black/[0.06] px-4 py-3">
          <p className="text-ink-muted mb-2 text-xs font-medium">Details the agent captured</p>
          <div className="flex flex-wrap gap-1.5">
            {conv.captured.map((d) => (
              <span key={d.label} className="text-ink inline-flex items-center gap-1.5 rounded-full border border-black/12 px-2.5 py-1 text-xs">
                <span className="text-ink-muted">{d.label}:</span>
                <span className="font-medium">{d.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* transcript */}
      <div className="space-y-3 bg-black/[0.015] p-4">
        {conv.transcript.map((t, i) => (
          <Bubble key={i} who={t.who} name={t.who === "agent" ? agentName : conv.customer}>
            {t.text}
          </Bubble>
        ))}
      </div>
    </div>
  );
}

function Bubble({ who, name, children }: { who: "agent" | "customer"; name: string; children: React.ReactNode }) {
  if (who === "customer") {
    return (
      <div className="flex flex-col items-end">
        <span className="text-ink-muted mr-1 mb-0.5 text-[10px] font-semibold">{name}</span>
        <span className="bg-accent-blue max-w-[82%] rounded-2xl rounded-br-sm px-3 py-2 text-sm text-white">{children}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start">
      <span className="text-ink-muted ml-1 mb-0.5 text-[10px] font-semibold">{name}</span>
      <span className="text-ink max-w-[82%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm ring-1 ring-black/[0.06]">{children}</span>
    </div>
  );
}
