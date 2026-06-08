"use client";

import { MessageSquare, Phone, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { readiness as computeReadiness, type Channel, type KnowledgeState } from "@/lib/agents";

/* --------------------------------- orb ------------------------------------ */

/**
 * Animated agent "orb". The gradient itself comes alive: blurred colour blobs
 * in the agent's palette drift and scale (transform/opacity only, on the GPU)
 * behind a still icon, so it reads as futuristic without the icon spinning.
 * Shows a speaking waveform when `speaking`, otherwise the role icon when one
 * is passed. Same orb everywhere keeps one visual language. Honours
 * prefers-reduced-motion (handled in globals.css).
 */
export function AgentOrb({
  colors,
  size = 132,
  speaking = false,
  icon: Icon,
  className,
}: {
  colors: [string, string];
  size?: number;
  speaking?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  const [a, b] = colors;
  const blur = Math.round(size * 0.1) + 2;
  // Desync each orb from a cheap hash of its first colour, so a grid of orbs
  // morphs out of sync instead of pulsing in unison.
  const seed = (parseInt(a.slice(1, 3), 16) || 0) % 100;
  const orbStyle = {
    "--orb-delay": `${-((seed / 100) * 7).toFixed(2)}s`,
    backgroundImage: `radial-gradient(circle at 32% 28%, ${a}, ${b})`,
  } as React.CSSProperties;

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      {/* outer glow */}
      <span
        className="absolute inset-0 rounded-full blur-xl"
        style={{ background: `radial-gradient(circle at 50% 45%, ${a}55, transparent 70%)` }}
      />
      {/* sonar rings when active (e.g. the hero and builder preview orbs) */}
      {speaking && (
        <>
          <span className="agent-ripple-ring" style={{ animationDelay: "0s" }} />
          <span className="agent-ripple-ring" style={{ animationDelay: "1.5s" }} />
        </>
      )}
      {/* sphere with a static two-colour base gradient; breathes when active */}
      <span
        className={cn(
          "relative grid size-full place-items-center overflow-hidden rounded-full shadow-lg ring-1 ring-white/25",
          speaking && "agent-breathe"
        )}
        style={orbStyle}
      >
        {/* drifting aurora blobs */}
        <span className="agent-blob agent-blob-a" style={{ inset: "-25%", filter: `blur(${blur}px)`, background: `radial-gradient(circle, ${a} 0%, transparent 68%)` }} />
        <span className="agent-blob agent-blob-b" style={{ inset: "-20%", filter: `blur(${blur}px)`, background: `radial-gradient(circle, ${b} 0%, transparent 64%)` }} />
        <span className="agent-blob agent-sheen" style={{ inset: "-10%", filter: `blur(${Math.round(blur * 0.8)}px)`, background: "radial-gradient(circle, rgba(255,255,255,0.85) 0%, transparent 55%)" }} />
        {/* static glossy top highlight */}
        <span className="absolute rounded-full bg-white/20 blur-md" style={{ top: "10%", left: "18%", width: "38%", height: "30%" }} />

        {!speaking && Icon ? (
          <Icon
            className="relative z-10 text-white drop-shadow"
            style={{ width: size * 0.42, height: size * 0.42 }}
            strokeWidth={1.75}
          />
        ) : null}
      </span>
    </div>
  );
}

/* ----------------------------- readiness meter ---------------------------- */

const TONE_STYLES = {
  weak: { ring: "stroke-amber-500", text: "text-amber-600", track: "stroke-amber-100" },
  ok: { ring: "stroke-accent-blue", text: "text-accent-blue", track: "stroke-accent-blue/15" },
  strong: { ring: "stroke-brand-green", text: "text-brand-green", track: "stroke-brand-green/15" },
} as const;

/** Radial readiness gauge, same open-gauge visual language as the Spotlight Score. */
export function ReadinessMeter({
  voiceId,
  tone,
  languages,
  greeting,
  channels,
  knowledge,
  size = 96,
}: {
  voiceId?: string;
  tone: string[];
  languages: string[];
  greeting: string;
  channels: Channel[];
  knowledge: KnowledgeState;
  size?: number;
}) {
  const { score, label, tone: band } = computeReadiness({ voiceId, tone, languages, greeting, channels, knowledge });
  const s = TONE_STYLES[band];
  const r = 26;
  const circ = 2 * Math.PI * r;
  const GAP = 0.12;
  const arc = (1 - GAP) * circ;
  const rotation = -90 + GAP * 180;
  const progress = (score / 100) * arc;
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg className="size-full" viewBox="0 0 64 64">
          <g transform={`rotate(${rotation} 32 32)`}>
            <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" strokeLinecap="round" className={s.track} strokeDasharray={`${arc} ${circ}`} />
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              className={cn(s.ring, "transition-[stroke-dasharray] duration-500 ease-out")}
              strokeDasharray={`${progress} ${circ}`}
            />
          </g>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-ink text-lg font-bold leading-none">{score}</span>
          <span className="text-ink-muted text-[9px] font-medium">/ 100</span>
        </div>
      </div>
      <div>
        <p className="text-ink-muted text-xs font-medium">Agent Readiness</p>
        <p className={cn("text-sm font-bold", s.text)}>{label}</p>
      </div>
    </div>
  );
}

/* ------------------------------ channel badge ----------------------------- */

export function ChannelBadge({ channel }: { channel: Channel }) {
  return channel === "voice" ? (
    <span className="border-accent-blue/25 bg-accent-blue/[0.07] text-accent-blue inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
      <Phone className="size-3" /> Voice
    </span>
  ) : (
    <span className="border-brand-green/25 bg-brand-green/[0.08] text-brand-green inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium">
      <MessageSquare className="size-3" /> Web chat
    </span>
  );
}
