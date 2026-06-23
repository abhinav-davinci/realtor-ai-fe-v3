"use client";

/**
 * App-level state for an auto-call run. Lives in the root layout so a run keeps
 * going (and its progress stays watchable) after the modal is closed or the
 * user navigates to another page. The provider owns the single ticking clock;
 * the modal and the floating tracker are consumers rendered by AutoCallOverlay.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { runDuration, TICK, type Call } from "./auto-call-run";

export interface AgentMeta {
  name: string;
  gradient: [string, string];
  icon?: LucideIcon;
}

export type RunKind = "leads" | "contacts";

/** Optional per-run context: a named session, who started it, and a one-shot
 * completion hook (e.g. Contacts writes call outcomes back to its book). */
export interface RunMeta {
  sessionName?: string;
  kind?: RunKind;
  onComplete?: (calls: Call[]) => void;
}

interface AutoCallValue {
  calls: Call[];
  elapsed: number;
  paused: boolean;
  stopped: boolean;
  /** A run exists (live or finished, until cleared). */
  active: boolean;
  complete: boolean;
  agent: AgentMeta | null;
  modalOpen: boolean;
  /** Run label shown in the header (null for the default leads run). */
  sessionName: string | null;
  kind: RunKind;
  start: (calls: Call[], agent: AgentMeta, meta?: RunMeta) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  /** Discard a finished run (back to no run). */
  clearRun: () => void;
  openModal: () => void;
  closeModal: () => void;
}

const Ctx = createContext<AutoCallValue | null>(null);

export function useAutoCall(): AutoCallValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAutoCall must be used within <AutoCallProvider>");
  return v;
}

export function AutoCallProvider({ children }: { children: React.ReactNode }) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [agent, setAgent] = useState<AgentMeta | null>(null);
  const [meta, setMeta] = useState<RunMeta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const firedRef = useRef(false);

  const active = calls.length > 0;
  const totalDur = useMemo(() => runDuration(calls), [calls]);
  const complete = active && (stopped || elapsed >= totalDur);

  // The single run clock; persists across navigation because the provider sits
  // in the root layout.
  useEffect(() => {
    if (!active || paused || stopped || complete) return;
    const id = setInterval(() => setElapsed((e) => Math.min(totalDur, e + TICK)), TICK);
    return () => clearInterval(id);
  }, [active, paused, stopped, complete, totalDur]);

  // Fire the run's completion hook exactly once (e.g. sync outcomes to Contacts).
  useEffect(() => {
    if (complete && !firedRef.current) {
      firedRef.current = true;
      meta?.onComplete?.(calls);
    }
  }, [complete, calls, meta]);

  const start = useCallback((c: Call[], ag: AgentMeta, m?: RunMeta) => {
    setCalls(c);
    setElapsed(0);
    setPaused(false);
    setStopped(false);
    setAgent(ag);
    setMeta(m ?? null);
    firedRef.current = false;
    setModalOpen(true);
  }, []);
  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);
  const stop = useCallback(() => setStopped(true), []);
  const clearRun = useCallback(() => {
    setCalls([]);
    setElapsed(0);
    setPaused(false);
    setStopped(false);
    setAgent(null);
    setMeta(null);
    firedRef.current = false;
  }, []);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const value = useMemo<AutoCallValue>(
    () => ({
      calls, elapsed, paused, stopped, active, complete, agent, modalOpen,
      sessionName: meta?.sessionName ?? null,
      kind: meta?.kind ?? "leads",
      start, pause, resume, stop, clearRun, openModal, closeModal,
    }),
    [calls, elapsed, paused, stopped, active, complete, agent, modalOpen, meta, start, pause, resume, stop, clearRun, openModal, closeModal]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * The "Auto-call Leads" trigger. Extracted so only this tiny button subscribes
 * to the (ticking) context, leaving the heavy lead pages untouched.
 */
export function AutoCallButton({ className }: { className?: string }) {
  const { openModal } = useAutoCall();
  return (
    <Button
      onClick={openModal}
      className={cn("bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-3.5 text-sm font-semibold text-white", className)}
    >
      <PhoneCall className="size-4" /> Auto-call Leads
    </Button>
  );
}
