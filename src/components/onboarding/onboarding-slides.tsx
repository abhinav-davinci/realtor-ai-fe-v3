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

function FloatTile({
  className,
  bg = "bg-white",
  variant = "a",
  duration = 6,
  delay = 0,
  enterDelay = 0,
  children,
}: {
  className?: string;
  bg?: string;
  variant?: "a" | "b";
  duration?: number;
  delay?: number;
  enterDelay?: number;
  children: ReactNode;
}) {
  return (
    <div className={cn("absolute", className)} style={enter(enterDelay)}>
      <div
        className={cn("grid size-full place-items-center rounded-2xl shadow-lg shadow-black/25", bg)}
        style={{
          animation: `onb-float-${variant} ${duration}s ease-in-out ${delay}s infinite`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SocialSlide() {
  return (
    <div className="relative mx-auto h-64 w-72">
      <FloatTile className="top-2 left-6 size-14" enterDelay={40} delay={0} duration={6}>
        <SourceIcon source="instagram" className="size-7 text-pink-600" />
      </FloatTile>
      <FloatTile className="top-4 right-4 size-14" variant="b" enterDelay={120} delay={0.4} duration={7}>
        <SourceIcon source="facebook" className="size-7 text-[#1877F2]" />
      </FloatTile>
      <FloatTile className="top-24 left-2 size-12" variant="b" enterDelay={200} delay={0.8} duration={6.5}>
        <SourceIcon source="youtube" className="size-6 text-red-600" />
      </FloatTile>

      {/* the focal "publish" tile */}
      <FloatTile className="top-20 left-1/2 size-16 -translate-x-1/2" bg="bg-brand-orange" enterDelay={0} delay={0.2} duration={5.5}>
        <Upload className="size-7 text-white" />
      </FloatTile>

      <FloatTile className="top-36 right-10 size-9" variant="a" enterDelay={260} delay={1} duration={6}>
        <MessageSquare className="size-4 text-ink-muted" />
      </FloatTile>

      {/* engagement reactions along the bottom */}
      <FloatTile className="bottom-2 left-10 size-9 rounded-full" variant="b" enterDelay={300} delay={0.5} duration={6}>
        <Heart className="size-4 fill-red-500 text-red-500" />
      </FloatTile>
      <FloatTile className="bottom-0 left-1/3 size-9 rounded-full" variant="a" enterDelay={360} delay={0.9} duration={6.5}>
        <MessageSquare className="size-4 text-accent-blue" />
      </FloatTile>
      <FloatTile className="right-1/3 bottom-1 size-9 rounded-full" variant="b" enterDelay={420} delay={0.3} duration={6}>
        <Share2 className="size-4 text-brand-green" />
      </FloatTile>
      <FloatTile className="right-8 bottom-4 size-9 rounded-full" variant="a" enterDelay={480} delay={1.1} duration={7}>
        <Heart className="size-4 fill-red-500 text-red-500" />
      </FloatTile>
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
  return (
    <div className="relative mx-auto w-72">
      <span className="absolute top-6 bottom-6 left-[26px] w-px bg-white/15" aria-hidden />
      <div className="space-y-3">
        {STAGES.map((s, i) => (
          <div key={s.title} className="relative flex items-center gap-3" style={enter(120 + i * 110)}>
            <span className="bg-rail relative z-10 grid size-[52px] shrink-0 place-items-center rounded-xl text-white/80 ring-1 ring-white/15">
              <s.icon className="size-5" />
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
