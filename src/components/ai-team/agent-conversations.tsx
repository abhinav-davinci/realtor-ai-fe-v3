"use client";

import { useMemo, useState } from "react";
import { ChevronRight, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { leadStats, leadsFor, matchesQuery, type Lead } from "@/lib/conversations";
import type { AgentConfig } from "@/lib/agents";
import {
  BothChannelsPill,
  FilterToggle,
  Highlight,
  LeadAvatar,
  LeadDetail,
  OutcomeBadge,
  SearchBar,
  matchesFilter,
  type Filter,
} from "@/components/conversations/conversation-ui";

/* ------------------------------ main list view ---------------------------- */

export function AgentConversations({ agent, onTest }: { agent: AgentConfig; onTest?: () => void }) {
  const leads = useMemo(() => leadsFor(agent.templateId), [agent.templateId]);
  const stats = useMemo(() => leadStats(leads), [leads]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("both");

  const open = leads.find((l) => l.id === openId);
  if (open) {
    return <LeadDetail lead={open} agentName={agent.name} onBack={() => setOpenId(null)} />;
  }

  if (leads.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-black/15 py-16 text-center">
        <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl">
          <MessagesSquare className="size-7" />
        </span>
        <p className="text-ink mt-4 font-bold">No conversations yet</p>
        <p className="text-ink-muted mt-1 max-w-xs text-sm">
          When your agent talks to customers on calls or chat, they show up here as leads with full transcripts.
        </p>
        {onTest && (
          <Button onClick={onTest} className="bg-brand-blue hover:bg-brand-blue-hover mt-4 h-9 rounded-lg px-4 text-sm font-semibold text-white">
            Test your agent
          </Button>
        )}
      </div>
    );
  }

  const filtered = leads.filter((l) => matchesFilter(l, filter) && matchesQuery(l, query));

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="text-ink font-bold">{stats.leads} {stats.leads === 1 ? "lead" : "leads"}</span>
        <span className="text-ink-muted">·</span>
        <span className="text-ink-muted">{stats.calls} calls, {stats.chats} chats</span>
        {stats.wins > 0 && (
          <>
            <span className="text-ink-muted">·</span>
            <span className="text-brand-green font-medium">{stats.wins} booked or qualified</span>
          </>
        )}
      </div>

      {/* toolbar: search + channel filter */}
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <SearchBar leads={leads} query={query} setQuery={setQuery} onOpenLead={setOpenId} />
        <FilterToggle value={filter} onChange={setFilter} />
      </div>

      {/* lead list */}
      {filtered.length > 0 ? (
        <div className="mt-4 space-y-2.5">
          {filtered.map((l) => (
            <LeadRow key={l.id} lead={l} query={query} onOpen={() => setOpenId(l.id)} />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-black/15 py-12 text-center">
          <p className="text-ink text-sm font-semibold">No leads match</p>
          <p className="text-ink-muted mt-1 text-xs">Try a different name, number, or channel.</p>
          <button
            type="button"
            onClick={() => { setQuery(""); setFilter("both"); }}
            className="text-accent-blue mt-3 text-xs font-semibold outline-none hover:underline"
          >
            Clear search and filter
          </button>
        </div>
      )}
    </div>
  );
}

function LeadRow({ lead, query, onOpen }: { lead: Lead; query: string; onOpen: () => void }) {
  const both = lead.hasCall && lead.hasChat;
  const metaLine = both ? `${lead.conversations.length} conversations` : lead.conversations[0].meta;

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
        <p className="text-ink-muted text-xs">{lead.when}</p>
        <p className="text-ink-muted/70 text-[11px]">{metaLine}</p>
      </div>
      <ChevronRight className="text-ink-muted/50 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
