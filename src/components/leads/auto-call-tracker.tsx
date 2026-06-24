"use client";

/**
 * Floating progress card shown when an auto-call run is live (or just finished)
 * and the modal is closed. Click it to reopen the full progress modal; dismiss
 * a finished run with the X. Bottom-right, above page content.
 */
import { ChevronUp, X } from "lucide-react";
import { AgentOrb } from "@/components/ai-team/agent-ui";
import { useAutoCall } from "./auto-call-context";
import { summarize } from "./auto-call-run";

export function AutoCallTracker() {
  const { calls, elapsed, complete, agent, sessionName, openModal, clearRun } = useAutoCall();
  const c = summarize(calls, elapsed);

  return (
    <div
      className="fixed right-4 bottom-4 z-40 w-[300px]"
      style={{ animation: "fade-in-up 260ms cubic-bezier(0.23,1,0.32,1) both" }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-xl shadow-black/10">
        {complete && (
          <button
            type="button"
            onClick={clearRun}
            aria-label="Dismiss"
            className="text-ink-muted hover:text-ink hover:bg-black/[0.06] absolute top-2 right-2 z-10 grid size-7 place-items-center rounded-lg"
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="button"
          onClick={openModal}
          aria-label="Open call progress"
          className="group block w-full p-3 text-left outline-none transition-colors hover:bg-black/[0.015]"
        >
          <div className="flex items-center gap-2.5">
            {agent && <AgentOrb colors={agent.gradient} size={36} icon={agent.icon} speaking={c.connected > 0 && !complete} />}
            <div className="min-w-0 flex-1">
              <p className="text-ink truncate text-sm font-semibold">
                {complete ? "Run complete" : (sessionName ?? `${agent?.name ?? "Agent"} is calling`)}
              </p>
              <p className="text-ink-muted text-xs tabular-nums">
                Dialled {c.dialled}/{c.total} · {c.connected} connected
              </p>
            </div>
            {!complete && (
              <ChevronUp className="text-ink-muted/60 size-4 shrink-0 transition-transform group-hover:-translate-y-0.5" />
            )}
          </div>
          <div className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-black/[0.07]">
            <div className="bg-brand-green transition-[width] duration-500 ease-out" style={{ width: `${(c.connected / Math.max(c.total, 1)) * 100}%` }} />
            <div className="bg-ink-muted/30 transition-[width] duration-500 ease-out" style={{ width: `${(c.missed / Math.max(c.total, 1)) * 100}%` }} />
            <div className="bg-accent-blue/40 transition-[width] duration-300 ease-out motion-safe:animate-pulse" style={{ width: `${(c.active / Math.max(c.total, 1)) * 100}%` }} />
          </div>
        </button>
      </div>
    </div>
  );
}
