"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  PhoneCall,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listAgents, templateById, voiceById, type AgentConfig } from "@/lib/agents";
import { AgentOrb } from "@/components/ai-team/agent-ui";
import {
  SOURCE_META,
  SOURCE_ORDER,
  TIER_META,
  TIER_ORDER,
  listScoredLeads,
  type LeadSource,
  type Tier,
} from "@/lib/lead-intelligence";
import { SourceIcon } from "./source-icons";

/* --------------------------------- helpers -------------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");

function to12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${ap}`;
}
function minutesBetween(a: string, b: string): number {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return bh * 60 + bm - (ah * 60 + am);
}

type Status = "new" | "retry" | "uncontacted" | "all";
const STATUS_OPTS: { value: Status; label: string }[] = [
  { value: "new", label: "New (never called)" },
  { value: "retry", label: "Needs follow-up" },
  { value: "uncontacted", label: "New + follow-up" },
  { value: "all", label: "Everyone" },
];
const INTENT_OPTS: { value: Tier | "all"; label: string }[] = [
  { value: "very-hot", label: "Very hot only" },
  { value: "hot", label: "Hot and above" },
  { value: "warm", label: "Warm and above" },
  { value: "all", label: "Any intent" },
];

/* --------------------------------- modal ---------------------------------- */

export function AutoCallModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const agents = useMemo(() => listAgents().filter((a) => a.channels.includes("voice")), []);
  const leads = useMemo(() => listScoredLeads(), []);

  const [agentId, setAgentId] = useState<string | null>(agents[0]?.id ?? null);
  const [status, setStatus] = useState<Status>("new");
  const [intent, setIntent] = useState<Tier | "all">("hot");
  const [count, setCount] = useState(10);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [from, setFrom] = useState(() => pad((new Date().getHours() + 1) % 24) + ":00");
  const [to, setTo] = useState(() => pad((new Date().getHours() + 2) % 24) + ":00");
  const [sources, setSources] = useState<Set<LeadSource>>(() => new Set(SOURCE_ORDER));
  const [minScore, setMinScore] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const agent = agents.find((a) => a.id === agentId) ?? null;
  const minScoreNum = minScore.trim() === "" ? null : Number(minScore);

  // Live count of leads matching the current filters (highest-intent first).
  const matches = useMemo(() => {
    const rank = (t: Tier) => TIER_ORDER.indexOf(t);
    return leads.filter((l) => {
      if (status === "new" && l.status !== "new") return false;
      if (status === "retry" && l.status !== "retry") return false;
      if (status === "uncontacted" && l.status !== "new" && l.status !== "retry") return false;
      if (intent !== "all" && rank(l.tier) > rank(intent)) return false;
      if (!sources.has(l.source)) return false;
      if (minScoreNum != null && l.score < minScoreNum) return false;
      return true;
    });
  }, [leads, status, intent, sources, minScoreNum]);

  const willCall = Math.min(count, matches.length);
  const windowMin = minutesBetween(from, to);
  const pace = willCall > 0 && windowMin > 0 ? Math.max(1, Math.round(windowMin / willCall)) : 0;
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();
  const dateLabel = date === todayStr ? "today" : new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const intentLabel = intent === "all" ? "" : `${TIER_META[intent].name.toLowerCase()} `;

  const canStart = !!agent && willCall > 0 && windowMin > 0;

  function start() {
    if (!canStart) return;
    setStarting(true);
    setTimeout(() => {
      setStarting(false);
      setStarted(true);
    }, 900);
  }

  function toggleSource(s: LeadSource) {
    setSources((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Auto-call leads"
        className="modal-pop flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {started ? (
          /* ----------------------------- started ---------------------------- */
          <div className="p-6 text-center">
            <span className="bg-brand-green/10 text-brand-green mx-auto grid size-16 place-items-center rounded-2xl motion-safe:animate-[tick-pop_460ms_cubic-bezier(0.23,1,0.32,1)_both]">
              <CheckCircle2 className="size-9" />
            </span>
            <h2 className="text-ink mt-4 text-lg font-bold">Calls started</h2>
            <p className="text-ink-muted mx-auto mt-1.5 max-w-sm text-sm">
              {willCall === 1
                ? `${agent?.name} is dialing your top lead now. Track it in your list.`
                : `${agent?.name} is dialing ${willCall} leads, about one every ${pace} min. Track them in your list.`}
            </p>
            <Button onClick={onClose} className="bg-brand-green hover:bg-brand-green-hover mx-auto mt-5 h-11 w-full max-w-[220px] rounded-lg text-sm font-semibold text-white">
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="bg-accent-blue/10 text-accent-blue grid size-9 place-items-center rounded-lg">
                  <PhoneCall className="size-5" />
                </span>
                <div>
                  <h2 className="text-ink text-lg font-bold">Auto-call leads</h2>
                  <p className="text-ink-muted text-xs">Your AI voice agent dials your top leads, spread across a window.</p>
                </div>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink hover:bg-black/[0.04] -mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-lg">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              {/* agent picker */}
              <div>
                <p className="text-ink mb-1.5 text-sm font-medium">Which agent makes the calls?</p>
                {agent ? (
                  <AgentPicker agents={agents} value={agent} onChange={(a) => setAgentId(a.id)} />
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-black/15 bg-black/[0.015] p-3.5">
                    <span className="bg-accent-blue/10 text-accent-blue grid size-9 shrink-0 place-items-center rounded-lg">
                      <Sparkles className="size-4" />
                    </span>
                    <p className="text-ink-muted min-w-0 flex-1 text-xs">No voice agent deployed yet. Build one to run auto-calls.</p>
                    <button type="button" onClick={() => { onClose(); router.push("/ai-team"); }} className="text-accent-blue shrink-0 text-xs font-semibold whitespace-nowrap hover:underline">
                      Build agent
                    </button>
                  </div>
                )}
              </div>

              {/* who to call */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Labeled label="Who to call">
                  <NativeSelect value={status} onChange={(v) => setStatus(v as Status)} options={STATUS_OPTS} />
                </Labeled>
                <Labeled label="Minimum intent">
                  <NativeSelect value={intent} onChange={(v) => setIntent(v as Tier | "all")} options={INTENT_OPTS} />
                </Labeled>
              </div>

              {/* how many */}
              <Labeled label="How many leads">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, matches.length)}
                    value={count}
                    onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                    className="text-ink focus:border-accent-blue/60 h-11 w-28 rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none transition-colors"
                  />
                  <p className="text-ink-muted text-xs">
                    <span className="text-ink font-semibold tabular-nums">{matches.length}</span> {matches.length === 1 ? "lead matches" : "leads match"} these filters
                  </p>
                </div>
              </Labeled>

              {/* when */}
              <Labeled label="Call window">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-ink focus:border-accent-blue/60 h-11 rounded-lg border border-black/15 bg-white px-3 text-sm outline-none transition-colors" />
                  <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} className="text-ink focus:border-accent-blue/60 h-11 rounded-lg border border-black/15 bg-white px-3 text-sm outline-none transition-colors" />
                  <input type="time" value={to} onChange={(e) => setTo(e.target.value)} className="text-ink focus:border-accent-blue/60 h-11 rounded-lg border border-black/15 bg-white px-3 text-sm outline-none transition-colors" />
                </div>
                {windowMin <= 0 && <p className="mt-1.5 text-xs font-medium text-red-600">The end time must be after the start time.</p>}
              </Labeled>

              {/* advanced */}
              <div className="border-t border-black/[0.06] pt-4">
                <button type="button" onClick={() => setAdvanced((v) => !v)} className="text-ink inline-flex items-center gap-1.5 text-sm font-semibold outline-none">
                  <SlidersHorizontal className="size-4" /> More filters
                  <ChevronDown className={cn("text-ink-muted size-4 transition-transform", advanced && "rotate-180")} />
                </button>
                {advanced && (
                  <div className="mt-3 space-y-4" style={{ animation: "fade-in-up 220ms cubic-bezier(0.23,1,0.32,1) both" }}>
                    <Labeled label="Lead sources">
                      <div className="flex flex-wrap gap-1.5">
                        {SOURCE_ORDER.map((s) => {
                          const on = sources.has(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleSource(s)}
                              aria-pressed={on}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold outline-none transition-colors",
                                on ? "border-transparent bg-ink text-white" : "text-ink-muted border-black/10 hover:border-black/25"
                              )}
                            >
                              <SourceIcon source={s} className="size-3.5" />
                              {SOURCE_META[s].short}
                            </button>
                          );
                        })}
                      </div>
                    </Labeled>
                    <Labeled label="Minimum score" optional>
                      <input
                        type="number"
                        value={minScore}
                        onChange={(e) => setMinScore(e.target.value)}
                        placeholder="e.g. 60"
                        inputMode="numeric"
                        className="text-ink placeholder:text-ink-muted/50 focus:border-accent-blue/60 h-11 w-36 rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none transition-colors"
                      />
                    </Labeled>
                  </div>
                )}
              </div>

              {/* summary */}
              <div className="bg-accent-blue/[0.06] border-accent-blue/15 rounded-xl border p-3.5 text-sm leading-relaxed">
                {canStart ? (
                  willCall === 1 ? (
                    <p className="text-ink-muted">
                      <span className="text-ink font-semibold">{agent?.name}</span> will call your top {intentLabel}lead between{" "}
                      <span className="text-ink font-semibold">{to12(from)}</span> and <span className="text-ink font-semibold">{to12(to)}</span> {dateLabel}.
                    </p>
                  ) : (
                    <p className="text-ink-muted">
                      <span className="text-ink font-semibold">{agent?.name}</span> will call the top{" "}
                      <span className="text-ink font-semibold tabular-nums">{willCall}</span> {intentLabel}leads, about one every{" "}
                      <span className="text-ink font-semibold">{pace} min</span>, between{" "}
                      <span className="text-ink font-semibold">{to12(from)}</span> and <span className="text-ink font-semibold">{to12(to)}</span> {dateLabel}.
                    </p>
                  )
                ) : (
                  <p className="text-ink-muted">
                    {!agent ? "Pick a voice agent to begin." : matches.length === 0 ? "No leads match these filters. Loosen them to start a run." : "Set a valid call window to begin."}
                  </p>
                )}
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] px-5 py-4 sm:px-6">
              <Button variant="outline" onClick={onClose} className="text-ink h-10 rounded-lg border-black/15 px-4 text-sm font-semibold">
                Cancel
              </Button>
              <Button onClick={start} disabled={!canStart || starting} className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-4 text-sm font-semibold text-white">
                {starting ? <Loader2 className="size-4 animate-spin" /> : <PhoneCall className="size-4" />}
                Start calls
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- sub-pieces ------------------------------- */

function Labeled({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-ink mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        {label}
        {optional && <span className="text-ink-muted/60 text-xs font-normal">(Optional)</span>}
      </span>
      {children}
    </label>
  );
}

function NativeSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-ink focus:border-accent-blue/60 h-11 w-full appearance-none rounded-lg border border-black/15 bg-white pr-9 pl-3.5 text-sm outline-none transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="text-ink-muted/60 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
    </div>
  );
}

function AgentPicker({ agents, value, onChange }: { agents: AgentConfig[]; value: AgentConfig; onChange: (a: AgentConfig) => void }) {
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

  const single = agents.length === 1;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !single && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border border-black/[0.12] bg-white p-2.5 text-left outline-none transition-colors",
          !single && "hover:border-black/25 focus-visible:border-accent-blue/50"
        )}
      >
        <AgentRow agent={value} />
        {!single && <ChevronDown className={cn("text-ink-muted/70 size-4 shrink-0 transition-transform", open && "rotate-180")} />}
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute top-full right-0 left-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
          style={{ animation: "scale-in 160ms cubic-bezier(0.23,1,0.32,1) both", transformOrigin: "top" }}
        >
          {agents.map((a) => (
            <button
              key={a.id}
              type="button"
              role="option"
              aria-selected={a.id === value.id}
              onClick={() => { onChange(a); setOpen(false); }}
              className="hover:bg-accent-blue/[0.06] flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none"
            >
              <AgentRow agent={a} />
              {a.id === value.id && <Check className="text-accent-blue size-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AgentRow({ agent }: { agent: AgentConfig }) {
  const t = templateById(agent.templateId);
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <AgentOrb colors={t.gradient} size={36} icon={t.icon} />
      <span className="min-w-0 flex-1">
        <span className="text-ink block truncate text-sm font-semibold">{agent.name}</span>
        <span className="text-ink-muted block truncate text-xs">
          {agent.role} · {voiceById(agent.voiceId).name} voice
        </span>
      </span>
    </span>
  );
}
