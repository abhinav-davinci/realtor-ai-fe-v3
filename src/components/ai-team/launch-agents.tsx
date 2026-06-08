"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
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
import { cn } from "@/lib/utils";
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
  { icon: Zap, title: "Replies right away", desc: "Answers every lead the moment they enquire, day or night." },
  { icon: Languages, title: "Speaks your buyer's language", desc: "English, Hindi, and Hinglish, with regional options." },
  { icon: Clock, title: "Works 24x7", desc: "No missed calls and no after-hours gaps." },
];

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

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 pt-6 pb-12 sm:px-6 lg:px-8">
      {/* Hero / education banner */}
      <div
        className="relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-r from-[#16243f] via-[#1d3a6b] to-[#2f6bed] px-6 py-7 text-white"
        style={{ animation: "fade-in-up 400ms ease-out both" }}
      >
        <span className="pointer-events-none absolute -top-20 right-10 size-56 rounded-full border border-white/10" />
        <span className="pointer-events-none absolute -bottom-28 right-40 size-72 rounded-full border border-white/[0.06]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
              <Sparkles className="size-3.5" /> Your AI Team
            </span>
            <h1 className="mt-3 text-2xl font-bold sm:text-[28px]">Launch AI agents for your business</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/80">
              Build AI teammates that call, qualify, and follow up with your leads. They work on the phone and as a
              chat widget on your website. Pick a ready-made agent below, give it your voice and knowledge, and go live.
            </p>
          </div>
          <div className="relative hidden shrink-0 lg:block">
            <AgentOrb colors={["#ef8e2b", "#2f6bed"]} size={120} speaking />
          </div>
        </div>

        {/* value props */}
        <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {VALUE_PROPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/10">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10">
                <Icon className="size-4.5 text-white" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-white/70">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My agents */}
      {agents.length > 0 && (
        <section className="mt-8 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-ink text-lg font-bold">Your Agents</h2>
            <Link href="/ai-team/agents" className="text-accent-blue text-sm font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {agents.slice(0, 3).map((a) => (
              <MyAgentCard key={a.id} agent={a} onOpen={() => router.push(`/ai-team/agents/${a.id}`)} onDelete={() => remove(a.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Template gallery */}
      <section className="mt-8">
        <h2 className="text-ink text-lg font-bold">Start from a ready-made agent</h2>
        <p className="text-ink-muted text-sm">Each one is pre-tuned for the Indian real-estate workflow. Customise everything in the next step.</p>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map((t, i) => (
            <TemplateCard key={t.id} t={t} onBuild={() => router.push(`/ai-team/build/${t.id}`)} index={i} />
          ))}
          <CustomCard onBuild={() => router.push(`/ai-team/build/${CUSTOM_TEMPLATE.id}`)} />
        </div>
      </section>

      {/* Knowledge education strip */}
      <Link
        href="/ai-team/knowledge"
        className="group border-brand-orange/25 bg-brand-orange/[0.06] mt-8 flex items-start gap-4 rounded-2xl border p-5 transition-colors hover:bg-brand-orange/[0.1]"
      >
        <span className="bg-brand-orange/15 text-brand-orange grid size-11 shrink-0 place-items-center rounded-xl">
          <BookOpen className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-ink font-bold">Why a knowledge base matters</p>
          <p className="text-ink-muted mt-1 text-sm leading-snug">
            An agent that knows your projects, price bands, RERA details, and FAQs gives real answers instead of generic
            ones. Add it once and every agent you build can use it.
          </p>
        </div>
        <ArrowRight className="text-brand-orange mt-1 size-5 shrink-0 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function TemplateCard({ t, onBuild, index }: { t: AgentTemplate; onBuild: () => void; index: number }) {
  return (
    <div
      className="group hover:border-accent-blue/30 flex flex-col rounded-2xl border border-black/[0.08] bg-white p-5 transition-all hover:shadow-md"
      style={{ animation: `fade-in-up 360ms ease-out ${index * 50}ms both` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-sm"
            style={{ backgroundImage: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})` }}
          >
            <t.icon className="size-6" strokeWidth={1.75} />
          </span>
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
      <p className="text-ink-muted mt-1 text-sm leading-snug">{t.description}</p>

      <ul className="mt-3 space-y-1.5">
        {t.handles.slice(0, 3).map((h) => (
          <li key={h} className="text-ink-muted flex items-start gap-2 text-xs leading-snug">
            <span className="bg-accent-blue/50 mt-1.5 size-1.5 shrink-0 rounded-full" />
            {h}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-1.5">
        {t.channels.map((c) => (
          <ChannelBadge key={c} channel={c} />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-black/[0.06] pt-4">
        <span className="text-ink-muted inline-flex items-center gap-1 text-xs">
          <PhoneCall className="size-3.5" /> {voiceById(t.voiceId).name}&apos;s voice · {voiceById(t.voiceId).langs.join(" / ")}
        </span>
        <Button
          onClick={onBuild}
          className="bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-3.5 text-sm font-semibold text-white"
        >
          Build Agent
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function CustomCard({ onBuild }: { onBuild: () => void }) {
  return (
    <button
      type="button"
      onClick={onBuild}
      className="group hover:border-accent-blue/50 hover:bg-accent-blue/[0.03] flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-black/15 p-5 text-center transition-colors"
    >
      <span className="bg-accent-blue/10 text-accent-blue grid size-12 place-items-center rounded-2xl transition-transform group-hover:scale-110">
        <Plus className="size-6" />
      </span>
      <div>
        <p className="text-ink font-bold">Build from scratch</p>
        <p className="text-ink-muted mt-1 text-sm">Start with a blank agent and shape it your way.</p>
      </div>
    </button>
  );
}

function MyAgentCard({ agent, onOpen, onDelete }: { agent: AgentConfig; onOpen: () => void; onDelete: () => void }) {
  const t = templateById(agent.templateId);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.08] bg-white p-4">
      <AgentOrb colors={t.gradient} size={52} />
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="text-ink truncate font-bold">{agent.name}</p>
        <p className="text-ink-muted truncate text-xs">{agent.role}</p>
        <div className="mt-1.5 flex items-center gap-1.5">
          {agent.channels.map((c) => (
            <ChannelBadge key={c} channel={c} />
          ))}
        </div>
      </button>
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete agent"
          className="text-ink-muted hover:text-red-500 grid size-7 place-items-center rounded-lg hover:bg-red-50"
        >
          <Trash2 className="size-4" />
        </button>
        <button type="button" onClick={onOpen} className={cn("text-accent-blue text-xs font-semibold")}>
          Manage →
        </button>
      </div>
    </div>
  );
}
