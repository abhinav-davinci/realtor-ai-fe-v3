"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  Gauge,
  MessageSquare,
  MessagesSquare,
  Pause,
  Phone,
  Play,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  leadStats,
  leadsFor,
  parseDurationSec,
  type Conversation,
  type Lead,
  type OutcomeTone,
} from "@/lib/conversations";
import type { AgentConfig } from "@/lib/agents";

type Filter = "both" | "calls" | "chats";

const TONE_STYLES: Record<OutcomeTone, string> = {
  good: "bg-brand-green/10 text-brand-green",
  warm: "bg-brand-orange/10 text-brand-orange",
  cold: "bg-red-50 text-red-500",
  neutral: "bg-black/[0.05] text-ink-muted",
};

const EASE_OUT = "cubic-bezier(0.23,1,0.32,1)";

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

/** Leading icon for a lead row: one channel, or a layered "both" badge. */
function LeadAvatar({ lead, className }: { lead: Lead; className?: string }) {
  if (lead.hasCall && lead.hasChat) {
    return (
      <span className={cn("relative shrink-0", className)}>
        <span className="bg-accent-blue/10 text-accent-blue grid size-full place-items-center rounded-lg">
          <Phone className="size-5" />
        </span>
        <span className="bg-brand-green absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full text-white ring-2 ring-white">
          <MessageSquare className="size-3" />
        </span>
      </span>
    );
  }
  return <ChannelIcon channel={lead.hasCall ? "voice" : "chat"} className={className} />;
}

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

function matchesFilter(l: Lead, filter: Filter): boolean {
  if (filter === "calls") return l.hasCall;
  if (filter === "chats") return l.hasChat;
  return true;
}

function matchesQuery(l: Lead, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  const phoneHit = digits.length >= 2 && !!l.phone && l.phone.replace(/\D/g, "").includes(digits);
  return l.name.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q) || phoneHit;
}

function LeadRow({ lead, query, onOpen }: { lead: Lead; query: string; onOpen: () => void }) {
  const both = lead.hasCall && lead.hasChat;
  const metaLine = both
    ? `${lead.conversations.length} conversations`
    : lead.conversations[0].meta;

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
          {both && (
            <span className="text-ink-muted inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-semibold">
              <Phone className="size-2.5" /> Call
              <span className="text-ink-muted/50">+</span>
              <MessageSquare className="size-2.5" /> Chat
            </span>
          )}
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

/* -------------------------------- search bar ------------------------------ */

function SearchBar({
  leads,
  query,
  setQuery,
  onOpenLead,
}: {
  leads: Lead[];
  query: string;
  setQuery: (q: string) => void;
  onOpenLead: (id: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return leads.filter((l) => matchesQuery(l, q)).slice(0, 5);
  }, [leads, query]);

  const showDropdown = focused && query.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="relative flex-1">
      <Search className="text-ink-muted/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setQuery("");
            inputRef.current?.blur();
          } else if (e.key === "Enter" && suggestions[0]) {
            onOpenLead(suggestions[0].id);
          }
        }}
        placeholder="Search leads by name or number"
        aria-label="Search leads"
        className="text-ink focus:border-accent-blue/50 h-10 w-full rounded-lg border border-black/15 bg-white pr-9 pl-9 text-sm outline-none"
      />
      {query && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setQuery("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="text-ink-muted hover:bg-black/[0.05] hover:text-ink absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md"
        >
          <X className="size-3.5" />
        </button>
      )}

      {showDropdown && (
        <div
          className="absolute top-full right-0 left-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
          style={{ animation: `scale-in 160ms ${EASE_OUT} both`, transformOrigin: "top" }}
          role="listbox"
        >
          {suggestions.map((l) => (
            <button
              key={l.id}
              type="button"
              role="option"
              aria-selected={false}
              // mousedown fires before the input's blur, so the click always lands
              onMouseDown={(e) => {
                e.preventDefault();
                onOpenLead(l.id);
              }}
              className="hover:bg-accent-blue/[0.06] flex w-full items-center gap-2.5 rounded-lg p-2 text-left outline-none"
            >
              <LeadAvatar lead={l} className="size-8" />
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-sm font-medium">
                  <Highlight text={l.name} query={query} />
                </p>
                <p className="text-ink-muted truncate text-xs">{l.phone ?? l.summary}</p>
              </div>
              <OutcomeBadge outcome={l.outcome} tone={l.tone} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Bold the part of `text` matching the typed query. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-ink bg-brand-orange/15 rounded-sm font-bold">{text.slice(i, i + q.length)}</span>
      {text.slice(i + q.length)}
    </>
  );
}

/* ------------------------------ filter toggle ----------------------------- */

const FILTERS: { key: Filter; label: string }[] = [
  { key: "both", label: "Both" },
  { key: "calls", label: "Calls" },
  { key: "chats", label: "Chats" },
];

function FilterToggle({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  const idx = FILTERS.findIndex((f) => f.key === value);
  return (
    <div className="relative flex shrink-0 rounded-lg bg-black/[0.05] p-1" role="tablist" aria-label="Filter by channel">
      {/* sliding white pill behind the active label */}
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-md bg-white shadow-sm"
        style={{
          width: "calc((100% - 0.5rem) / 3)",
          transform: `translateX(${idx * 100}%)`,
          transition: `transform 220ms ${EASE_OUT}`,
        }}
      />
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          role="tab"
          aria-selected={value === f.key}
          onClick={() => onChange(f.key)}
          className={cn(
            "relative z-10 w-[68px] rounded-md py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
            value === f.key ? "text-ink" : "text-ink-muted hover:text-ink"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- lead detail ------------------------------ */

function LeadDetail({ lead, agentName, onBack }: { lead: Lead; agentName: string; onBack: () => void }) {
  const [idx, setIdx] = useState(0);
  const conv = lead.conversations[idx];
  const multi = lead.conversations.length > 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to leads"
          className="text-ink-muted hover:text-ink hover:bg-black/[0.04] grid size-8 shrink-0 place-items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
        >
          <ArrowLeft className="size-4.5" />
        </button>
        <LeadAvatar lead={lead} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate text-sm font-semibold">
            {lead.name}
            {lead.phone && <span className="text-ink-muted ml-2 font-normal">{lead.phone}</span>}
          </p>
          <p className="text-ink-muted text-xs">
            {lead.hasCall && lead.hasChat
              ? `${lead.conversations.length} conversations · call and chat`
              : `${conv.channel === "voice" ? "Call" : "Web chat"} · ${conv.when}`}
          </p>
        </div>
        <OutcomeBadge outcome={lead.outcome} tone={lead.tone} />
      </div>

      {/* merged captured details */}
      {lead.captured.length > 0 && (
        <div className="border-b border-black/[0.06] px-4 py-3">
          <p className="text-ink-muted mb-2 text-xs font-medium">Details the agent captured</p>
          <div className="flex flex-wrap gap-1.5">
            {lead.captured.map((d) => (
              <span key={d.label} className="text-ink inline-flex items-center gap-1.5 rounded-full border border-black/12 px-2.5 py-1 text-xs">
                <span className="text-ink-muted">{d.label}:</span>
                <span className="font-medium">{d.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* conversation switcher (only when the lead reached us more than once) */}
      {multi && (
        <div className="flex flex-wrap gap-2 border-b border-black/[0.06] px-4 py-3">
          {lead.conversations.map((c, i) => {
            const active = i === idx;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setIdx(i)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
                  active ? "border-accent-blue bg-accent-blue/[0.05]" : "border-black/[0.1] hover:border-black/25"
                )}
              >
                <ChannelIcon channel={c.channel} className="size-7" />
                <span>
                  <span className="text-ink block font-semibold">{c.channel === "voice" ? "Call" : "Web chat"}</span>
                  <span className="text-ink-muted block">{c.when} · {c.meta}</span>
                </span>
                {active && <Check className="text-accent-blue size-4" />}
              </button>
            );
          })}
        </div>
      )}

      {/* recording (calls only) + transcript */}
      <div className="space-y-3 bg-black/[0.015] p-4">
        {conv.channel === "voice" && <CallRecording key={conv.id} conv={conv} />}
        {conv.transcript.map((t, i) => (
          <Bubble key={i} who={t.who} name={t.who === "agent" ? agentName : lead.name}>
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

/* ---------------------------- call recording ------------------------------ */

const SPEEDS: number[] = [1, 1.5, 2];

function CallRecording({ conv }: { conv: Conversation }) {
  const total = useMemo(() => parseDurationSec(conv.meta) || 1, [conv.meta]);
  const bars = useMemo(() => waveform(conv.id), [conv.id]);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  // Mirror of elapsed the interval can read without being a dependency.
  const elapsedRef = useRef(0);

  // Simulated playback: there is no audio file in design mode, so advance a
  // clock while "playing" to drive the scrubber, and stop at the end. setState
  // here runs in the interval callback (not the effect body).
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      const next = Math.min(total, elapsedRef.current + 0.1 * speed);
      elapsedRef.current = next;
      setElapsed(next);
      if (next >= total) setPlaying(false);
    }, 100);
    return () => clearInterval(t);
  }, [playing, speed, total]);

  const frac = Math.min(1, elapsed / total);

  function setClock(v: number) {
    const c = Math.max(0, Math.min(total, v));
    elapsedRef.current = c;
    setElapsed(c);
  }

  function toggle() {
    if (!playing && elapsedRef.current >= total) setClock(0);
    setPlaying((p) => !p);
  }

  function seek(clientX: number, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    setClock(((clientX - rect.left) / rect.width) * total);
  }

  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-3 ring-1 ring-black/[0.02]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-ink-muted text-[11px] font-semibold tracking-wide uppercase">Call recording</p>
        <button
          type="button"
          aria-label="Download recording"
          className="text-ink-muted/60 hover:text-ink hover:bg-black/[0.04] grid size-6 place-items-center rounded-md"
        >
          <Download className="size-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause recording" : "Play recording"}
          className="bg-accent-blue grid size-10 shrink-0 place-items-center rounded-full text-white shadow-sm transition-[transform,background-color] duration-150 ease-out hover:bg-accent-blue/90 active:scale-95"
        >
          {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 translate-x-px fill-current" />}
        </button>

        {/* waveform scrubber */}
        <button
          type="button"
          onClick={(e) => seek(e.clientX, e.currentTarget)}
          aria-label="Seek"
          className="group/wave relative flex h-9 flex-1 items-center gap-[2px] outline-none"
        >
          {bars.map((h, i) => {
            const filled = i / bars.length <= frac;
            return (
              <span
                key={i}
                className={cn(
                  "w-full rounded-full transition-colors duration-150",
                  filled ? "bg-accent-blue" : "bg-accent-blue/15 group-hover/wave:bg-accent-blue/25"
                )}
                style={{ height: `${Math.round(h * 100)}%` }}
              />
            );
          })}
        </button>

        <span className="text-ink-muted shrink-0 text-xs tabular-nums">
          {fmtTime(elapsed)} <span className="text-ink-muted/50">/ {fmtTime(total)}</span>
        </span>

        <button
          type="button"
          onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
          aria-label="Playback speed"
          className="text-ink-muted hover:text-ink hover:bg-black/[0.04] inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold tabular-nums"
        >
          <Gauge className="size-3.5" />
          {speed}x
        </button>
      </div>
    </div>
  );
}

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Deterministic bar heights (0.25–1) from the conversation id, so the
 * waveform is stable across renders and never needs Math.random. */
function waveform(seed: string, count = 44): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out.push(0.25 + ((h % 1000) / 1000) * 0.75);
  }
  return out;
}
