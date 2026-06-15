"use client";

/**
 * The four brand value-prop illustrations for the onboarding aside carousel.
 * All motion is CSS, transform/opacity only, and gated behind motion-safe so it
 * goes still under prefers-reduced-motion (per the project motion rules). The
 * elements fade/slide in on mount via the shared fade-in-up keyframe, so each
 * slide replays its entrance when the carousel swaps to it.
 */
import type { CSSProperties, ReactNode } from "react";
import {
  BadgeCheck,
  Calendar,
  CalendarCheck,
  Flame,
  Handshake,
  Heart,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SourceIcon } from "@/components/leads/source-icons";

const enter = (delay: number): CSSProperties => ({
  animation: `fade-in-up 520ms cubic-bezier(0.23,1,0.32,1) ${delay}ms both`,
});

/* ------------------------------ social slide ------------------------------ */

/**
 * The full story, top to bottom: an AI video made from your photos is published
 * to every channel (spokes carry it out), people react (likes/comments pop), and
 * that engagement is captured as a new lead. All motion is transform/opacity/dash
 * and motion-safe, so it goes still under reduced motion.
 */
const CHANNELS: { src: "instagram" | "facebook" | "whatsapp" | "youtube"; color: string; cx: number; react: LucideIcon; reactColor: string; delay: number }[] = [
  { src: "instagram", color: "text-pink-600", cx: 56, react: Heart, reactColor: "fill-red-500 text-red-500", delay: 0 },
  { src: "facebook", color: "text-[#1877F2]", cx: 126, react: MessageSquare, reactColor: "text-accent-blue", delay: 0.45 },
  { src: "whatsapp", color: "text-brand-green", cx: 194, react: Heart, reactColor: "fill-red-500 text-red-500", delay: 0.9 },
  { src: "youtube", color: "text-red-600", cx: 264, react: MessageSquare, reactColor: "text-accent-blue", delay: 1.35 },
];

// Reactions converging into the lead card (offset from the lead centre = channel).
const SPARKS: { fx: number; fy: number; icon: LucideIcon; color: string; delay: number }[] = [
  { fx: -104, fy: -92, icon: Heart, color: "fill-red-500 text-red-500", delay: 0 },
  { fx: -34, fy: -92, icon: MessageSquare, color: "text-accent-blue", delay: 0.8 },
  { fx: 104, fy: -92, icon: Heart, color: "fill-red-500 text-red-500", delay: 1.6 },
];

function SocialSlide() {
  return (
    <div className="relative mx-auto h-[300px] w-80">
      {/* spokes: the AI video publishing out to each channel */}
      <svg viewBox="0 0 320 300" className="absolute inset-0 size-full" aria-hidden>
        {CHANNELS.map((c) => (
          <line
            key={c.src}
            x1="160"
            y1="66"
            x2={c.cx}
            y2="126"
            stroke="rgba(255,255,255,0.26)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="2 7"
            className="motion-safe:animate-[social-flow_1.1s_linear_infinite]"
          />
        ))}
      </svg>

      {/* AI video, made from your photos */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2">
        <div style={enter(0)}>
          <div className="relative motion-safe:animate-[onb-float-a_6s_ease-in-out_infinite]">
            <span className="absolute top-2 -left-3 h-12 w-14 -rotate-6 rounded-lg bg-gradient-to-br from-white/40 to-white/10 shadow-md" aria-hidden />
            <span className="absolute top-2 -right-3 h-12 w-14 rotate-6 rounded-lg bg-gradient-to-br from-white/30 to-white/5 shadow-md" aria-hidden />
            <div className="from-accent-blue to-brand-orange relative grid h-16 w-28 place-items-center overflow-hidden rounded-xl bg-gradient-to-br shadow-lg shadow-black/30">
              <span className="grid size-9 place-items-center rounded-full bg-white/95 shadow">
                <Play className="fill-ink text-ink size-4 translate-x-px" />
              </span>
              <span className="text-ink absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-bold shadow-sm">
                <Sparkles className="text-accent-blue size-2.5 motion-safe:animate-[welcome-spark_2.4s_ease-in-out_infinite]" /> AI
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* channels: published everywhere, people react */}
      {CHANNELS.map((c) => (
        <div key={c.src} className="absolute top-[126px]" style={{ left: c.cx - 22, ...enter(180 + c.delay * 90) }}>
          <div
            className="relative grid size-11 place-items-center rounded-2xl bg-white shadow-lg shadow-black/25 motion-safe:animate-[social-pulse_2.6s_ease-in-out_infinite]"
            style={{ animationDelay: `${c.delay}s` }}
          >
            <SourceIcon source={c.src} className={cn("size-6", c.color)} />
            <span
              className="absolute -top-2.5 -right-2 grid size-6 place-items-center rounded-full bg-white shadow-md motion-safe:animate-[social-react_2.6s_ease-in-out_infinite]"
              style={{ animationDelay: `${c.delay + 0.6}s` }}
            >
              <c.react className={cn("size-3", c.reactColor)} />
            </span>
          </div>
        </div>
      ))}

      {/* captured as a lead */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
        <div className="relative" style={enter(620)}>
          <span className="bg-brand-green/40 absolute -inset-2 rounded-2xl blur-lg motion-safe:animate-[onb-glow_3s_ease-in-out_infinite]" aria-hidden />
          <div className="relative flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg shadow-black/25">
            <span className="bg-brand-green/10 text-brand-green grid size-7 shrink-0 place-items-center rounded-lg">
              <UserPlus className="size-4" />
            </span>
            <span className="leading-tight">
              <span className="text-ink block text-xs font-bold whitespace-nowrap">New lead captured</span>
              <span className="text-ink-muted block text-[10px] whitespace-nowrap">From social engagement</span>
            </span>
            <span className="bg-brand-green ml-1 size-2 shrink-0 rounded-full motion-safe:animate-[onb-glow_1.6s_ease-in-out_infinite]" aria-hidden />
          </div>
          {/* reactions flowing in */}
          {SPARKS.map((s, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute -top-4 left-1/2 -ml-2.5 grid size-5 place-items-center rounded-full bg-white opacity-0 shadow-sm motion-safe:animate-[s2-capture_2.4s_ease-in-out_infinite]"
              style={{ "--fx": `${s.fx}px`, "--fy": `${s.fy}px`, animationDelay: `${0.7 + s.delay}s` } as React.CSSProperties}
            >
              <s.icon className={cn("size-2.5", s.color)} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ AI team slide ----------------------------- */

function AgentCard({ icon: Icon, title, sub, className, enterDelay }: { icon: LucideIcon; title: string; sub: string; className?: string; enterDelay: number }) {
  return (
    <div
      className={cn("absolute w-36 rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10 backdrop-blur-sm", className)}
      style={enter(enterDelay)}
    >
      <span className="grid size-7 place-items-center rounded-lg bg-white/10 text-white">
        <Icon className="size-4" />
      </span>
      <p className="mt-2 text-[13px] font-semibold text-white">{title}</p>
      <p className="text-[11px] text-white/55">{sub}</p>
    </div>
  );
}

function AiTeamSlide() {
  return (
    <div className="relative mx-auto h-64 w-80">
      <AgentCard icon={MessageSquare} title="AI Chat Agent" sub="Replies instantly" className="top-0 left-0" enterDelay={120} />
      <AgentCard icon={Phone} title="AI Voice Agent" sub="Calls & qualifies" className="top-0 right-0" enterDelay={200} />
      <AgentCard icon={BadgeCheck} title="Lead Qualifier Agent" sub="Scores buying intent" className="bottom-0 left-0" enterDelay={280} />
      <AgentCard icon={Calendar} title="Appointment Agent" sub="Books site visits" className="right-0 bottom-0" enterDelay={360} />

      {/* centre brand with a breathing glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={enter(0)}>
        <span
          className="absolute -inset-5 rounded-3xl bg-accent-blue/40 blur-2xl motion-safe:animate-[onb-glow_4s_ease-in-out_infinite]"
          aria-hidden
        />
        <div className="relative rounded-2xl bg-white/[0.08] px-5 py-4 text-center ring-1 ring-white/15 backdrop-blur-sm">
          <p className="text-lg font-bold tracking-tight text-white">
            TryThat<span className="bg-accent-blue ml-0.5 rounded-md px-1.5 py-0.5 text-base">.ai</span>
          </p>
          <p className="mt-1 text-[9px] font-semibold tracking-[0.2em] text-white/50">FOR REALTORS</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ pipeline slide ---------------------------- */

const STAGES: { icon: LucideIcon; title: string; sub: string; done?: boolean }[] = [
  { icon: UserPlus, title: "New Lead", sub: "Fresh lead captured" },
  { icon: BadgeCheck, title: "Qualified", sub: "AI has qualified the lead" },
  { icon: MapPin, title: "Site Visit", sub: "Visit scheduled" },
  { icon: Handshake, title: "Negotiation", sub: "Price discussion" },
  { icon: Trophy, title: "Closed", sub: "Deal won", done: true },
];

function PipelineSlide() {
  // Stagger so each stage lights up as the connector charge reaches it; the line
  // fills over ~70% of the cycle and ends green at the won deal.
  const step = 0.9;
  return (
    <div className="relative mx-auto w-72">
      {/* connector: a faint base line with a charge that draws down, blue -> green */}
      <span className="absolute top-7 bottom-7 left-[25px] w-0.5 -translate-x-1/2 rounded-full bg-white/12" aria-hidden />
      <span
        className="from-accent-blue to-brand-green absolute top-7 bottom-7 left-[25px] w-0.5 origin-top -translate-x-1/2 rounded-full bg-gradient-to-b opacity-0 motion-safe:animate-[pipeline-line_5s_ease-in-out_infinite]"
        aria-hidden
      />

      <div className="relative space-y-3">
        {STAGES.map((s, i) => (
          <div key={s.title} className="relative flex items-center gap-3" style={enter(140 + i * 100)}>
            {s.done ? (
              <span className="bg-brand-green shadow-brand-green/30 ring-brand-green/40 relative z-10 grid size-[52px] shrink-0 place-items-center rounded-xl text-white shadow-lg ring-1">
                <span className="bg-brand-green/40 absolute -inset-1.5 rounded-2xl blur-md motion-safe:animate-[onb-glow_3s_ease-in-out_infinite]" aria-hidden />
                <s.icon className="relative z-10 size-5" />
              </span>
            ) : (
              <span
                className="relative z-10 grid size-[52px] shrink-0 place-items-center rounded-xl text-white ring-1 ring-white/15 motion-safe:animate-[pipeline-pop_5s_ease-out_infinite]"
                style={{ animationDelay: `${i * step}s` }}
              >
                <span className="absolute inset-0 rounded-xl bg-white/10 backdrop-blur-sm" aria-hidden />
                <span
                  className="bg-accent-blue absolute inset-0 rounded-xl opacity-0 motion-safe:animate-[pipeline-fill_5s_ease-out_infinite]"
                  style={{ animationDelay: `${i * step}s`, boxShadow: "0 0 18px rgba(47,107,237,0.55)" }}
                  aria-hidden
                />
                <s.icon className="relative z-10 size-5" />
              </span>
            )}
            <div
              className={cn(
                "flex-1 rounded-xl px-3.5 py-2.5 ring-1 backdrop-blur-sm",
                s.done ? "bg-brand-green/[0.1] ring-brand-green/25" : "bg-white/[0.06] ring-white/10"
              )}
            >
              <p className="text-[13px] font-semibold text-white">{s.title}</p>
              <p className={cn("text-[11px]", s.done ? "text-green-300" : "text-white/55")}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- dashboard slide ---------------------------- */

const STATS: { icon: LucideIcon; value: string; label: string; delta: string }[] = [
  { icon: Flame, value: "248", label: "Hot Leads", delta: "+24%" },
  { icon: CalendarCheck, value: "32", label: "Site Visits", delta: "+18%" },
  { icon: Trophy, value: "12", label: "Deals Won", delta: "+33%" },
  { icon: Target, value: "34%", label: "Conversion", delta: "+6%" },
];

const BARS = [22, 18, 30, 26, 34, 28, 40];

function DashboardSlide() {
  return (
    <div className="mx-auto w-80">
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s, i) => (
          <div key={s.label} className="relative overflow-hidden rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10 backdrop-blur-sm" style={enter(100 + i * 80)}>
            {/* faint refresh glow that sweeps the cards in turn */}
            <span
              className="bg-accent-blue/15 pointer-events-none absolute inset-0 opacity-0 motion-safe:animate-[stat-refresh_4.5s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.5}s` }}
              aria-hidden
            />
            <div className="relative flex items-center justify-between">
              <span className="grid size-7 place-items-center rounded-lg bg-white/10 text-white/80">
                <s.icon className="size-4" />
              </span>
              <span className="text-brand-green text-[11px] font-semibold">{s.delta}</span>
            </div>
            <p className="relative mt-2 text-lg font-bold text-white tabular-nums">{s.value}</p>
            <p className="relative text-[11px] text-white/55">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10 backdrop-blur-sm" style={enter(460)}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-white/55">Leads this week</span>
          <span className="text-brand-green inline-flex items-center gap-1.5 text-[10px] font-semibold">
            <span className="bg-brand-green size-1.5 rounded-full motion-safe:animate-[chart-live_1.6s_ease-in-out_infinite]" />
            Live
          </span>
        </div>
        <svg viewBox="0 0 280 70" className="h-16 w-full" preserveAspectRatio="none" aria-hidden>
          {BARS.map((h, i) => (
            <rect
              key={i}
              x={8 + i * 40}
              y={70 - h}
              width="16"
              height={h}
              rx="3"
              className="fill-white/[0.07] motion-safe:animate-[chart-bar_2.4s_ease-in-out_infinite]"
              style={{ transformBox: "fill-box", transformOrigin: "bottom", animationDelay: `${i * 0.12}s` }}
            />
          ))}
          <polyline
            points="8,52 48,46 88,40 128,42 168,30 208,22 252,12"
            fill="none"
            stroke="#ef8e2b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={320}
            strokeDasharray={320}
            strokeDashoffset={320}
            className="motion-safe:animate-[chart-draw-loop_3.4s_ease-in-out_infinite] motion-reduce:[stroke-dashoffset:0]"
          />
        </svg>
      </div>
    </div>
  );
}

/* --------------------------------- config --------------------------------- */

export type TitleSeg = { t: string; accent?: boolean };

export interface OnbSlide {
  id: string;
  Illustration: () => ReactNode;
  title: TitleSeg[];
  text: string;
}

export const ONB_SLIDES: OnbSlide[] = [
  {
    id: "social",
    Illustration: SocialSlide,
    title: [{ t: "Turn Social Engagement " }, { t: "into Real Leads", accent: true }],
    text: "Publish once and your listing goes out across every channel, turning engagement into qualified leads.",
  },
  {
    id: "team",
    Illustration: AiTeamSlide,
    title: [{ t: "Your " }, { t: "AI Team", accent: true }, { t: " Works 24/7" }],
    text: "AI voice, chat, and scheduling agents engage, qualify, and follow up with every lead instantly.",
  },
  {
    id: "pipeline",
    Illustration: PipelineSlide,
    title: [{ t: "Convert Prospects " }, { t: "into Opportunities", accent: true }],
    text: "Track every lead's journey and move it through your sales pipeline.",
  },
  {
    id: "dashboard",
    Illustration: DashboardSlide,
    title: [{ t: "Close More Deals, " }, { t: "Grow Your Business", accent: true }],
    text: "Real-time insights and analytics to scale your real estate business.",
  },
];
