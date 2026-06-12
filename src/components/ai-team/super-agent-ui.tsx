"use client";

import Link from "next/link";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LIFECYCLE_SKILLS,
  SUPER_TEMPLATE,
  coveredSkills,
  isSuperAgent,
  readiness,
  templateById,
  type AgentConfig,
  type KnowledgeState,
  type TemplateId,
} from "@/lib/agents";
import { AgentOrb, ChannelBadge, ReadinessMeter } from "./agent-ui";

const SUPER_GRADIENT = SUPER_TEMPLATE.gradient;

/** Small "Super" pill, the master badge. */
export function SuperBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white",
        className
      )}
      style={{ background: `linear-gradient(90deg, ${SUPER_GRADIENT[0]}, ${SUPER_GRADIENT[1]})` }}
    >
      <Crown className="size-2.5" /> SUPER
    </span>
  );
}

/* --------------------------- capability coverage -------------------------- */

/** The five lifecycle skills as tiles that light up by coverage. */
export function CapabilityCoverage({ covered, className }: { covered: TemplateId[]; className?: string }) {
  const set = new Set(covered);
  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        <p className="text-ink-muted text-xs font-medium">Capability coverage</p>
        <p className="text-ink text-xs font-semibold">
          {covered.length} of {LIFECYCLE_SKILLS.length}
        </p>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {LIFECYCLE_SKILLS.map((s) => {
          const on = set.has(s.template);
          const Icon = templateById(s.template).icon;
          return (
            <div
              key={s.template}
              title={s.label}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition-colors duration-300",
                on ? "border-brand-green/30 bg-brand-green/[0.06]" : "border-black/[0.07] bg-black/[0.015]"
              )}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-md transition-colors duration-300",
                  on ? "bg-brand-green/15 text-brand-green" : "bg-black/[0.05] text-ink-muted/60"
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span className={cn("text-[9px] leading-tight font-medium", on ? "text-ink" : "text-ink-muted/60")}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------- inherited summary ---------------------------- */

/** Read-only line of what the Super Agent absorbed from its selected sources. */
export function InheritedSummary({ knowledge, sourceCount }: { knowledge: KnowledgeState; sourceCount: number }) {
  if (sourceCount === 0) return null;
  const completeFaqs = knowledge.faqs.filter((f) => f.q.trim() && f.a.trim()).length;
  const items = [
    knowledge.companyProfile && "company profile",
    knowledge.projects.length > 0 && `${knowledge.projects.length} project${knowledge.projects.length === 1 ? "" : "s"}`,
    knowledge.docs.length > 0 && `${knowledge.docs.length} document${knowledge.docs.length === 1 ? "" : "s"}`,
    completeFaqs > 0 && `${completeFaqs} FAQ${completeFaqs === 1 ? "" : "s"}`,
    knowledge.website.trim() && "website",
  ].filter(Boolean) as string[];

  return (
    <div className="bg-brand-green/[0.05] border-brand-green/15 mt-3 flex items-start gap-2 rounded-lg border px-3 py-2">
      <span className="bg-brand-green mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-white">
        <Check className="size-2.5" strokeWidth={3} />
      </span>
      <p className="text-ink-muted text-xs leading-snug">
        Learning from {sourceCount} agent{sourceCount === 1 ? "" : "s"}.
        {items.length > 0 && <span className="text-ink font-medium"> Absorbed {items.join(", ")}.</span>}
      </p>
    </div>
  );
}

/* --------------------------- source agent picker -------------------------- */

/** Multi-select grid of specialist agents the Super Agent can learn from. */
export function SourceAgentPicker({
  agents,
  selected,
  onToggle,
}: {
  agents: AgentConfig[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (agents.length === 0) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-black/15 py-8 text-center">
        <span className="bg-accent-blue/10 text-accent-blue grid size-11 place-items-center rounded-2xl">
          <Sparkles className="size-5" />
        </span>
        <p className="text-ink mt-3 text-sm font-semibold">No agents to learn from yet</p>
        <p className="text-ink-muted mt-1 max-w-xs text-xs">
          Build a couple of specialists first, or just add your own knowledge below.
        </p>
        <Link href="/ai-team#templates" className="text-accent-blue mt-2.5 text-xs font-semibold hover:underline">
          Browse ready-made agents →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {agents.map((a) => {
          const on = selected.includes(a.id);
          const v = templateById(a.templateId);
          const rd = readiness(a);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onToggle(a.id)}
              aria-pressed={on}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
                on ? "border-accent-blue bg-accent-blue/[0.05]" : "border-black/12 hover:border-black/25"
              )}
            >
              <AgentOrb colors={v.gradient} size={36} icon={v.icon} />
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate text-sm font-semibold">{a.name}</p>
                <p className="text-ink-muted truncate text-xs">{a.role} · {rd.score} pts</p>
              </div>
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                  on ? "border-accent-blue bg-accent-blue text-white" : "border-black/20"
                )}
              >
                {on && <Check className="size-3" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
      {selected.length === 1 && (
        <p className="text-ink-muted mt-2.5 text-xs">Add one or two more so your Super Agent covers more of the lifecycle.</p>
      )}
    </div>
  );
}

/* ------------------------------ gallery band ------------------------------ */

/** The Launch-page flagship: "build your Super Agent" or its live status. */
export function SuperAgentBand({ agents }: { agents: AgentConfig[] }) {
  const superAgent = agents.find(isSuperAgent) ?? null;

  if (!superAgent) {
    return (
      <section className="mt-6 shrink-0">
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-5 text-white"
          style={{
            backgroundImage: `linear-gradient(110deg, #1b1145 0%, ${SUPER_GRADIENT[0]} 55%, ${SUPER_GRADIENT[1]} 130%)`,
            animation: "fade-in-up 400ms ease-out both",
          }}
        >
          <span className="pointer-events-none absolute -top-20 -right-8 size-56 rounded-full border border-white/10" />
          <div className="relative flex items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
                <Crown className="size-3.5" /> New · Super Agent
              </span>
              <h2 className="mt-2.5 text-2xl font-bold">Meet your Super Agent</h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/85">
                One AI that does the work of your whole team. It learns from the specialists you&apos;ve built and your
                knowledge base, then qualifies, answers, schedules, and follows up, all in one.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {LIFECYCLE_SKILLS.map((s) => (
                  <span key={s.template} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/10">
                    {s.label}
                  </span>
                ))}
              </div>
              <Link
                href="/ai-team/super"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#1b1145] transition-transform hover:-translate-y-0.5"
              >
                <Crown className="size-4" /> Build your Super Agent <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="relative hidden shrink-0 pr-2 lg:grid lg:place-items-center">
              <AgentOrb colors={SUPER_GRADIENT} size={128} speaking />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Live status card
  const sources = (superAgent.sourceAgentIds ?? [])
    .map((id) => agents.find((a) => a.id === id))
    .filter((a): a is AgentConfig => !!a);
  const covered = coveredSkills(sources);

  return (
    <section className="mt-6 shrink-0">
      <div className="relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: `${SUPER_GRADIENT[0]}22` }}>
        <span className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full blur-2xl" style={{ background: `${SUPER_GRADIENT[0]}12` }} />
        <div className="relative flex flex-wrap items-center gap-4">
          <AgentOrb colors={SUPER_GRADIENT} size={60} speaking />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-ink text-lg font-bold">{superAgent.name}</p>
              <SuperBadge />
              <span className="text-brand-green inline-flex items-center gap-1 text-[11px] font-semibold">
                <span className="bg-brand-green size-1.5 animate-pulse rounded-full" /> Live
              </span>
            </div>
            <p className="text-ink-muted text-sm">Your master agent across calls and chat</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              {superAgent.channels.map((c) => (
                <ChannelBadge key={c} channel={c} />
              ))}
            </div>
          </div>
          <ReadinessMeter {...superAgent} size={76} />
          <Link
            href={`/ai-team/agents/${superAgent.id}`}
            className="bg-surface text-ink ring-1 ring-black/[0.08] hover:bg-black/[0.03] inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold"
          >
            Manage <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="relative mt-4 border-t border-black/[0.06] pt-4">
          <CapabilityCoverage covered={covered} />
        </div>
      </div>
    </section>
  );
}
