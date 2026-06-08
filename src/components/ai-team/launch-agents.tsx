"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  Languages,
  PhoneCall,
  Plus,
  Sparkles,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CUSTOM_TEMPLATE,
  TEMPLATES,
  deleteAgent,
  listAgents,
  templateById,
  voiceById,
  type AgentConfig,
  type AgentTemplate,
} from "@/lib/agents";
import { AgentOrb, ChannelBadge } from "./agent-ui";

const VALUE_PROPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Zap, title: "Replies right away", desc: "Engages every lead the moment they enquire." },
  { icon: Languages, title: "Speaks the buyer's language", desc: "English, Hindi, and Hinglish." },
  { icon: Clock, title: "Works 24x7", desc: "No missed calls, no after-hours gaps." },
];

/** Show at most two languages, then a "+N" so footers stay one line. */
function shortLangs(langs: string[]): string {
  if (langs.length <= 2) return langs.join(", ");
  return `${langs.slice(0, 2).join(", ")} +${langs.length - 2}`;
}

function scrollToTemplates() {
  document.getElementById("templates")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LaunchAgents() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentConfig[]>([]);

  useEffect(() => {
    setAgents(listAgents());
  }, []);

  function remove(id: string) {
    deleteAgent(id);
    setAgents(listAgents());
  }

  const shown = agents.slice(0, 3);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 pt-6 pb-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div
        className="relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-r from-[#16243f] via-[#1d3a6b] to-[#2f6bed] px-6 py-5 text-white"
        style={{ animation: "fade-in-up 400ms ease-out both" }}
      >
        <span className="pointer-events-none absolute -top-24 -right-10 size-64 rounded-full border border-white/10" />
        <span className="pointer-events-none absolute top-6 right-24 size-40 rounded-full border border-white/[0.07]" />
        <div className="relative flex items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
              <Sparkles className="size-3.5" /> Your AI Team
            </span>
            <h1 className="mt-2.5 text-2xl font-bold">Launch AI agents for your business</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/80">
              AI teammates that call, qualify, and follow up with your leads, on the phone and as a chat widget on your
              site. Pick one below, give it your voice and knowledge, and go live.
            </p>
          </div>
          {/* Orb, framed in its own space so the glow is not clipped */}
          <div className="relative hidden shrink-0 pr-2 lg:grid lg:place-items-center">
            <AgentOrb colors={["#8b5cf6", "#22d3ee"]} size={108} speaking />
          </div>
        </div>

        {/* value props */}
        <div className="relative mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {VALUE_PROPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-2.5 rounded-xl bg-white/[0.07] px-3 py-2 ring-1 ring-white/10">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10">
                <Icon className="size-4 text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-tight">{title}</p>
                <p className="truncate text-xs text-white/70">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My agents */}
      {agents.length > 0 && (
        <section className="mt-8 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-ink text-lg font-bold">My Agents</h2>
            <Link href="/ai-team/agents" className="text-accent-blue text-sm font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((a) => (
              <MyAgentCard key={a.id} agent={a} onOpen={() => router.push(`/ai-team/agents/${a.id}`)} onDelete={() => remove(a.id)} />
            ))}
            {/* Fill the row instead of leaving empty columns */}
            {shown.length < 3 && <NewAgentTile onClick={scrollToTemplates} />}
          </div>
        </section>
      )}

      {/* Template gallery */}
      <section id="templates" className="mt-8 shrink-0 scroll-mt-4">
        <h2 className="text-ink text-lg font-bold">Start from a ready-made agent</h2>
        <p className="text-ink-muted text-sm">Each one is pre-tuned for the Indian real-estate workflow. You can change everything in the next step.</p>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map((t, i) => (
            <TemplateCard key={t.id} t={t} onBuild={() => router.push(`/ai-team/build/${t.id}`)} index={i} />
          ))}
          <CustomCard onBuild={() => router.push(`/ai-team/build/${CUSTOM_TEMPLATE.id}`)} />
        </div>
      </section>
    </div>
  );
}

function TemplateCard({ t, onBuild, index }: { t: AgentTemplate; onBuild: () => void; index: number }) {
  const voice = voiceById(t.voiceId);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onBuild}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBuild();
        }
      }}
      className="group hover:border-accent-blue/40 flex cursor-pointer flex-col rounded-2xl border border-black/[0.08] bg-white p-5 outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent-blue/40"
      style={{ animation: `fade-in-up 360ms ease-out ${index * 50}ms both` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AgentOrb colors={t.gradient} size={44} icon={t.icon} />
          <div>
            <p className="text-ink font-bold">{t.name}</p>
            <p className="text-ink-muted text-xs font-medium">{t.role}</p>
          </div>
        </div>
        {t.popular && (
          <span className="bg-brand-orange/10 text-brand-orange rounded-full px-2 py-0.5 text-[11px] font-semibold">
            Popular
          </span>
        )}
      </div>

      <p className="text-ink mt-3 text-sm font-semibold">{t.tagline}</p>

      <ul className="mt-2.5 space-y-1.5">
        {t.handles.slice(0, 3).map((h) => (
          <li key={h} className="text-ink-muted flex items-start gap-2 text-xs leading-snug">
            <span className="bg-accent-blue/50 mt-1.5 size-1.5 shrink-0 rounded-full" />
            {h}
          </li>
        ))}
      </ul>

      {/* Pinned to the bottom so every card's CTA lines up */}
      <div className="mt-auto pt-4">
        <div className="flex items-center gap-1.5">
          {t.channels.map((c) => (
            <ChannelBadge key={c} channel={c} />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-black/[0.06] pt-3">
          <span className="text-ink-muted inline-flex min-w-0 items-center gap-1 text-xs">
            <PhoneCall className="size-3.5 shrink-0" />
            <span className="truncate">{voice.name}, {shortLangs(voice.langs)}</span>
          </span>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onBuild();
            }}
            className="bg-brand-blue hover:bg-brand-blue-hover h-9 shrink-0 rounded-lg px-3.5 text-sm font-semibold text-white"
          >
            Build Agent
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CustomCard({ onBuild }: { onBuild: () => void }) {
  return (
    <button
      type="button"
      onClick={onBuild}
      className="group hover:border-accent-blue/50 bg-accent-blue/[0.02] hover:bg-accent-blue/[0.05] flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-accent-blue/20 p-5 text-center transition-colors"
    >
      <span className="bg-accent-blue/10 text-accent-blue grid size-12 place-items-center rounded-full transition-transform group-hover:scale-110">
        <Plus className="size-6" />
      </span>
      <div>
        <p className="text-ink font-bold">Build from scratch</p>
        <p className="text-ink-muted mt-1 text-sm">Start with a blank agent and shape it your way.</p>
      </div>
    </button>
  );
}

function NewAgentTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group hover:border-accent-blue/50 hover:bg-accent-blue/[0.04] flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/12 p-4 text-sm font-semibold text-ink-muted transition-colors"
    >
      <span className="bg-accent-blue/10 text-accent-blue grid size-8 place-items-center rounded-full transition-transform group-hover:scale-110">
        <Plus className="size-4" />
      </span>
      Build another agent
    </button>
  );
}

function MyAgentCard({ agent, onOpen, onDelete }: { agent: AgentConfig; onOpen: () => void; onDelete: () => void }) {
  const t = templateById(agent.templateId);
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-500">
            <Trash2 className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-ink truncate text-sm font-semibold">Delete {agent.name}?</p>
            <p className="text-ink-muted text-xs">This cannot be undone.</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-ink h-8 rounded-lg border border-black/15 px-3 text-xs font-semibold hover:bg-black/[0.03]"
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
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group hover:border-accent-blue/40 flex cursor-pointer flex-col rounded-2xl border border-black/[0.08] bg-white p-4 outline-none transition-colors hover:bg-black/[0.01] focus-visible:ring-2 focus-visible:ring-accent-blue/40"
    >
      <div className="flex items-center gap-3">
        <AgentOrb colors={t.gradient} size={44} icon={t.icon} />
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate font-bold">{agent.name}</p>
          <p className="text-ink-muted truncate text-xs">{agent.role}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(true);
          }}
          aria-label={`Delete ${agent.name}`}
          className="text-ink-muted hover:text-red-500 grid size-7 shrink-0 place-items-center rounded-lg hover:bg-red-50"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {agent.channels.map((c) => (
          <ChannelBadge key={c} channel={c} />
        ))}
      </div>
    </div>
  );
}
