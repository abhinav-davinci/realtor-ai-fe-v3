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
  IndianRupee,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Share2,
  Trophy,
  Upload,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SourceIcon } from "@/components/leads/source-icons";

const enter = (delay: number): CSSProperties => ({
  animation: `fade-in-up 520ms cubic-bezier(0.23,1,0.32,1) ${delay}ms both`,
});

/* ------------------------------ social slide ------------------------------ */

/** One published post fans out to every channel; each lands and reacts. The
 * orange hub = publish, spokes carry the post out, reactions float up. */
const CHANNELS: {
  src: "instagram" | "facebook" | "youtube";
  color: string;
  cx: number;
  cy: number;
  react: LucideIcon;
  reactColor: string;
  delay: number;
}[] = [
  { src: "instagram", color: "text-pink-600", cx: 74, cy: 70, react: Heart, reactColor: "fill-red-500 text-red-500", delay: 0 },
  { src: "facebook", color: "text-[#1877F2]", cx: 246, cy: 80, react: MessageSquare, reactColor: "text-accent-blue", delay: 0.55 },
  { src: "youtube", color: "text-red-600", cx: 160, cy: 240, react: Share2, reactColor: "text-brand-green", delay: 1.1 },
];

function SocialSlide() {
  return (
    <div className="relative mx-auto h-72 w-80">
      {/* spokes carrying the post outward from the hub */}
      <svg viewBox="0 0 320 288" className="absolute inset-0 size-full" aria-hidden>
        {CHANNELS.map((c) => (
          <line
            key={c.src}
            x1="160"
            y1="144"
            x2={c.cx}
            y2={c.cy}
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="2 7"
            className="motion-safe:animate-[social-flow_1.1s_linear_infinite]"
          />
        ))}
      </svg>

      {/* channels */}
      {CHANNELS.map((c) => (
        <div key={c.src} className="absolute" style={{ left: c.cx - 28, top: c.cy - 28, ...enter(160 + c.delay * 120) }}>
          <div
            className="relative grid size-14 place-items-center rounded-2xl bg-white shadow-lg shadow-black/25 motion-safe:animate-[social-pulse_2.6s_ease-in-out_infinite]"
            style={{ animationDelay: `${c.delay}s` }}
          >
            <SourceIcon source={c.src} className={cn("size-7", c.color)} />
            <span
              className="absolute -top-2.5 -right-2.5 grid size-7 place-items-center rounded-full bg-white shadow-md motion-safe:animate-[social-react_2.6s_ease-in-out_infinite]"
              style={{ animationDelay: `${c.delay + 0.65}s` }}
            >
              <c.react className={cn("size-3.5", c.reactColor)} />
            </span>
          </div>
        </div>
      ))}

      {/* centre publish hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={enter(0)}>
        <span className="bg-brand-orange/40 absolute -inset-3 rounded-3xl blur-xl motion-safe:animate-[onb-glow_3.2s_ease-in-out_infinite]" aria-hidden />
        <div className="bg-brand-orange relative grid size-16 place-items-center rounded-2xl shadow-xl shadow-black/30 motion-safe:animate-[social-hub_2.6s_ease-in-out_infinite]">
          <Upload className="size-7 text-white" />
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
      <AgentCard icon={Mail} title="Lead Nurture Agent" sub="Smart follow-ups" className="bottom-0 left-0" enterDelay={280} />
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

const STAGES: { icon: LucideIcon; title: string; sub: string }[] = [
  { icon: UserPlus, title: "New Lead", sub: "Fresh lead captured" },
  { icon: BadgeCheck, title: "Qualified", sub: "AI has qualified the lead" },
  { icon: MapPin, title: "Site Visit", sub: "Visit scheduled" },
  { icon: Handshake, title: "Negotiation", sub: "Price discussion" },
];

function PipelineSlide() {
  // Stagger so each stage lights up as the connector charge reaches it. The line
  // fills over ~70% of the 5s cycle, so the last node peaks just as it lands.
  const step = 1.15;
  return (
    <div className="relative mx-auto w-72">
      {/* connector: a faint base line with an accent charge that draws down */}
      <span className="absolute top-7 bottom-7 left-[25px] w-0.5 -translate-x-1/2 rounded-full bg-white/12" aria-hidden />
      <span
        className="bg-accent-blue absolute top-7 bottom-7 left-[25px] w-0.5 origin-top -translate-x-1/2 rounded-full opacity-0 motion-safe:animate-[pipeline-line_5s_ease-in-out_infinite]"
        style={{ boxShadow: "0 0 9px rgba(47,107,237,0.65)" }}
        aria-hidden
      />

      <div className="relative space-y-3">
        {STAGES.map((s, i) => (
          <div key={s.title} className="relative flex items-center gap-3" style={enter(140 + i * 110)}>
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
            <div className="flex-1 rounded-xl bg-white/[0.06] px-3.5 py-2.5 ring-1 ring-white/10 backdrop-blur-sm">
              <p className="text-[13px] font-semibold text-white">{s.title}</p>
              <p className="text-[11px] text-white/55">{s.sub}</p>
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
  { icon: CalendarCheck, value: "32", label: "Appointments", delta: "+18%" },
  { icon: Trophy, value: "12", label: "Deals Won", delta: "+33%" },
  { icon: IndianRupee, value: "₹2.48 Cr", label: "Revenue", delta: "+28%" },
];

function DashboardSlide() {
  // A gentle upward line; the path length ~ 320 so the dash draws over ~1.1s.
  return (
    <div className="mx-auto w-80">
      <div className="grid grid-cols-2 gap-3">
        {STATS.map((s, i) => (
          <div key={s.label} className="rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10 backdrop-blur-sm" style={enter(100 + i * 80)}>
            <div className="flex items-center justify-between">
              <span className="grid size-7 place-items-center rounded-lg bg-white/10 text-white/80">
                <s.icon className="size-4" />
              </span>
              <span className="text-[11px] font-semibold text-brand-green">{s.delta}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-white tabular-nums">{s.value}</p>
            <p className="text-[11px] text-white/55">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10 backdrop-blur-sm" style={enter(460)}>
        <svg viewBox="0 0 280 70" className="h-16 w-full" preserveAspectRatio="none" aria-hidden>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={8 + i * 40} y={70 - (12 + ((i * 37) % 30))} width="16" height={12 + ((i * 37) % 30)} rx="3" className="fill-white/[0.07]" />
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
            className="motion-safe:animate-[onb-draw_1100ms_cubic-bezier(0.23,1,0.32,1)_300ms_forwards] motion-reduce:[stroke-dashoffset:0]"
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
    text: "AI voice, chat, and nurture agents engage, qualify, and follow up with every lead instantly.",
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
