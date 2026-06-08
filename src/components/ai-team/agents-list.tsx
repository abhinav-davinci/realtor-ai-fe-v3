"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteAgent, listAgents, readiness, templateById, type AgentConfig } from "@/lib/agents";
import { AgentOrb, ChannelBadge } from "./agent-ui";

export function AgentsList() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentConfig[]>([]);

  useEffect(() => {
    setAgents(listAgents());
  }, []);

  function remove(id: string) {
    deleteAgent(id);
    setAgents(listAgents());
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 pt-6 pb-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-ink text-2xl font-bold">My Agents</h1>
          <p className="text-ink-muted text-sm">Manage, test, and deploy each agent.</p>
        </div>
        <Button onClick={() => router.push("/ai-team")} className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-4 text-sm font-semibold text-white">
          <Plus className="size-4" /> New Agent
        </Button>
      </div>

      {agents.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-black/15 py-16 text-center">
          <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl"><Bot className="size-7" /></span>
          <p className="text-ink mt-4 font-bold">No agents yet</p>
          <p className="text-ink-muted mt-1 max-w-xs text-sm">Launch your first AI agent and it&apos;ll start handling leads, calls and follow-ups for you.</p>
          <Button onClick={() => router.push("/ai-team")} className="bg-brand-green hover:bg-brand-green-hover mt-4 h-10 rounded-lg px-4 text-sm font-semibold text-white">
            <Plus className="size-4" /> Launch an Agent
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((a) => (
            <AgentListCard
              key={a.id}
              agent={a}
              onOpen={() => router.push(`/ai-team/agents/${a.id}`)}
              onDelete={() => remove(a.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentListCard({ agent, onOpen, onDelete }: { agent: AgentConfig; onOpen: () => void; onDelete: () => void }) {
  const t = templateById(agent.templateId);
  const rd = readiness(agent);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl border border-black/[0.08] bg-white p-5">
      <div className="flex items-start gap-3">
        <AgentOrb colors={t.gradient} size={52} icon={t.icon} />
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate font-bold">{agent.name}</p>
          <p className="text-ink-muted truncate text-xs">{agent.role}</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${agent.name}`}
          className="text-ink-muted hover:text-red-500 grid size-7 place-items-center rounded-lg hover:bg-red-50"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1.5">{agent.channels.map((c) => <ChannelBadge key={c} channel={c} />)}</div>
        <span className="text-ink-muted text-xs font-medium">Readiness <span className="text-ink font-bold">{rd.score}</span></span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className={cn("h-full rounded-full", rd.tone === "weak" ? "bg-amber-500" : rd.tone === "ok" ? "bg-accent-blue" : "bg-brand-green")}
          style={{ width: `${rd.score}%` }}
        />
      </div>

      {confirming ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-2">
          <p className="text-ink min-w-0 flex-1 px-1 text-xs font-medium">Delete this agent?</p>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-ink h-8 rounded-lg border border-black/15 bg-white px-3 text-xs font-semibold hover:bg-black/[0.03]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="h-8 rounded-lg bg-red-500 px-3 text-xs font-semibold text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      ) : (
        <Button onClick={onOpen} className="bg-surface text-ink hover:bg-black/[0.04] mt-4 h-9 rounded-lg text-sm font-semibold ring-1 ring-black/[0.08]">
          Manage & Test
        </Button>
      )}
    </div>
  );
}
