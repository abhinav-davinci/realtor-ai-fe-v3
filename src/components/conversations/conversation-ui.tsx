"use client";

/**
 * Shared, presentational lead/conversation UI. Used by both the AI Team agent
 * "Conversations" tab (components/ai-team/agent-conversations.tsx) and the
 * Lead Intelligence screen (components/leads/lead-intelligence.tsx). Keeping one
 * copy here is the single source of truth so the two screens can't drift.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  Gauge,
  MessageSquare,
  Pause,
  Phone,
  Play,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  matchesQuery,
  parseDurationSec,
  type Conversation,
  type Lead,
  type OutcomeTone,
} from "@/lib/conversations";
import { type JourneyStep } from "@/lib/lead-intelligence";
import { SourceChip } from "@/components/leads/source-icons";

export const EASE_OUT = "cubic-bezier(0.23,1,0.32,1)";

const TONE_STYLES: Record<OutcomeTone, string> = {
  good: "bg-brand-green/10 text-brand-green",
  warm: "bg-brand-orange/10 text-brand-orange",
  cold: "bg-red-50 text-red-500",
  neutral: "bg-black/[0.05] text-ink-muted",
};

export function OutcomeBadge({ outcome, tone }: { outcome: string; tone: OutcomeTone }) {
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", TONE_STYLES[tone])}>
      {outcome}
    </span>
  );
}

export function ChannelIcon({ channel, className }: { channel: "voice" | "chat"; className?: string }) {
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
export function LeadAvatar({ lead, className }: { lead: Lead; className?: string }) {
  if (lead.hasCall && lead.hasChat) {
    return (
      <span className={cn("relative shrink-0", className)}>
        <span className="bg-accent-blue/10 text-accent-blue grid size-full place-items-center rounded-lg">
          <Phone className="size-5" />
        </span>
        <span className="text-brand-green absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-white shadow-sm ring-2 ring-white">
          <MessageSquare className="size-3" />
        </span>
      </span>
    );
  }
  return <ChannelIcon channel={lead.hasCall ? "voice" : "chat"} className={className} />;
}

/** Inline "Call + Chat" pill shown next to a multi-channel lead's name. */
export function BothChannelsPill() {
  return (
    <span className="text-ink-muted inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-semibold">
      <Phone className="size-2.5" /> Call
      <span className="text-ink-muted/50">+</span>
      <MessageSquare className="size-2.5" /> Chat
    </span>
  );
}

/* -------------------------------- search bar ------------------------------ */

export function SearchBar({
  leads,
  query,
  setQuery,
  onOpenLead,
  placeholder = "Search leads by name or number",
}: {
  leads: Lead[];
  query: string;
  setQuery: (q: string) => void;
  onOpenLead: (id: string) => void;
  placeholder?: string;
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
        placeholder={placeholder}
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
export function Highlight({ text, query }: { text: string; query: string }) {
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

/* ------------------------------ channel filter ---------------------------- */

export type Filter = "both" | "calls" | "chats";

export function matchesFilter(l: Lead, filter: Filter): boolean {
  if (filter === "calls") return l.hasCall;
  if (filter === "chats") return l.hasChat;
  return true;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "both", label: "Both" },
  { key: "calls", label: "Calls" },
  { key: "chats", label: "Chats" },
];

export function FilterToggle({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
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

export function LeadDetail({
  lead,
  agentName,
  onBack,
  journey,
}: {
  lead: Lead;
  agentName: string;
  onBack: () => void;
  journey?: JourneyStep[];
}) {
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

      {/* how the lead reached us (first-touch to qualified) */}
      {journey && journey.length > 0 && (
        <div className="border-b border-black/[0.06] px-4 py-3">
          <p className="text-ink-muted mb-2 text-xs font-medium">How this lead reached you</p>
          <ol className="space-y-2">
            {journey.map((s, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <SourceChip source={s.channel} className="size-6" iconClassName="size-3" />
                <span className="text-ink flex-1 text-xs">{s.note}</span>
                {i === 0 && (
                  <span className="text-ink-muted/70 shrink-0 text-[10px] font-semibold tracking-wide uppercase">
                    First touch
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

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
