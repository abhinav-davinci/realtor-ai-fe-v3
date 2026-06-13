"use client";

import { useState } from "react";
import { BadgeCheck, Flame, Gauge, TrendingDown, TrendingUp, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SOURCE_META,
  leadSummary,
  type LeadSource,
  type SourceStat,
} from "@/lib/lead-intelligence";
import { SourceChip } from "./source-icons";

const fmt = (n: number) => n.toLocaleString("en-IN");
const pct = (f: number) => `${Math.round(f * 100)}%`;

type Summary = ReturnType<typeof leadSummary>;

/* ---------------------------------- KPIs ---------------------------------- */

function TrendChip({ value }: { value: number }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-bold", up ? "text-brand-green" : "text-red-500")}>
      <Icon className="size-3.5" />
      {Math.abs(value)}%
    </span>
  );
}

export function KpiStrip({ summary }: { summary: Summary }) {
  const cards = [
    { label: "Total leads", value: fmt(summary.total), trend: summary.trends.total, Icon: Users, tint: "bg-accent-blue/10 text-accent-blue" },
    { label: "Very hot", value: fmt(summary.veryHot), trend: summary.trends.veryHot, Icon: Flame, tint: "bg-red-50 text-red-600" },
    { label: "Qualified", value: fmt(summary.qualified), trend: summary.trends.qualified, Icon: BadgeCheck, tint: "bg-brand-green/10 text-brand-green" },
    { label: "Avg intent score", value: `${summary.avgIntent}%`, trend: summary.trends.avgIntent, Icon: Gauge, tint: "bg-violet-50 text-violet-600" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className="rounded-2xl border border-black/[0.07] bg-white p-4"
          style={{ animation: `fade-in-up 360ms ease-out ${i * 45}ms both` }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-muted text-xs font-medium">{c.label}</span>
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", c.tint)}>
              <c.Icon className="size-4" />
            </span>
          </div>
          <p className="text-ink mt-2.5 text-[26px] font-bold leading-none tabular-nums">{c.value}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <TrendChip value={c.trend} />
            <span className="text-ink-muted/70 text-[11px]">vs last 30 days</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- donut ---------------------------------- */

const R = 46;
const STROKE = 14;
const C = 2 * Math.PI * R;
const GAP = 2.5; // length units of separation between segments

function SourceDonut({
  data,
  total,
  active,
  onHover,
  size = 184,
}: {
  data: SourceStat[];
  total: number;
  active: LeadSource | null;
  onHover: (s: LeadSource | null) => void;
  size?: number;
}) {
  // Cumulative arc length before each segment (pure: no outer mutation, so the
  // React Compiler immutability rule stays happy). n is tiny (≤7).
  const segs = data.map((d, i) => {
    const before = data.slice(0, i).reduce((sum, x) => sum + x.share * C, 0);
    const len = d.share * C;
    const dash = Math.max(len - GAP, 1);
    const rotation = -90 + (before / C) * 360;
    return { source: d.source, color: SOURCE_META[d.source].color, dash, rotation };
  });

  const activeStat = active ? data.find((d) => d.source === active) ?? null : null;

  return (
    <div className="relative mx-auto grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="size-full" role="img" aria-label="Leads by source">
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth={STROKE} className="stroke-black/[0.05]" />
        {segs.map((s, i) => {
          const dim = active != null && active !== s.source;
          const style = {
            "--seg-from": s.dash,
            strokeWidth: active === s.source ? STROKE + 3 : STROKE,
            opacity: dim ? 0.25 : 1,
            transition: "opacity 200ms ease, stroke-width 200ms ease",
            animationDelay: `${i * 70}ms`,
            cursor: "pointer",
          } as React.CSSProperties;
          return (
            <circle
              key={s.source}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={s.color}
              strokeLinecap="butt"
              strokeDasharray={`${s.dash} ${C - s.dash}`}
              transform={`rotate(${s.rotation} 60 60)`}
              style={style}
              className="motion-safe:animate-[donut-seg_900ms_cubic-bezier(0.23,1,0.32,1)_both]"
              onMouseEnter={() => onHover(s.source)}
              onMouseLeave={() => onHover(null)}
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-ink text-2xl font-bold leading-none tabular-nums">
            {fmt(activeStat ? activeStat.leads : total)}
          </p>
          <p className="text-ink-muted mt-1 text-[11px] font-medium">
            {activeStat ? SOURCE_META[activeStat.source].short : "Total leads"}
          </p>
          {activeStat && <p className="text-ink-muted/60 mt-0.5 text-[10px] tabular-nums">{pct(activeStat.share)} of leads</p>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ sources panel ----------------------------- */

function LegendRow({
  stat,
  active,
  isTop,
  onHover,
}: {
  stat: SourceStat;
  active: LeadSource | null;
  isTop: boolean;
  onHover: (s: LeadSource | null) => void;
}) {
  const meta = SOURCE_META[stat.source];
  const dim = active != null && active !== stat.source;
  return (
    <button
      type="button"
      onMouseEnter={() => onHover(stat.source)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(stat.source)}
      onBlur={() => onHover(null)}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left outline-none transition-all hover:bg-black/[0.02] focus-visible:ring-2 focus-visible:ring-accent-blue/30",
        dim && "opacity-45"
      )}
    >
      <SourceChip source={stat.source} className="size-7" iconClassName="size-3.5" />
      <span className="text-ink min-w-0 flex-1 truncate text-[13px] font-medium">{meta.label}</span>
      {isTop && (
        <span className="bg-brand-orange/10 text-brand-orange shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase">
          Top
        </span>
      )}
      <span className="text-ink shrink-0 text-[13px] font-bold tabular-nums">{fmt(stat.leads)}</span>
      <span className="text-ink-muted/60 w-8 shrink-0 text-right text-[11px] tabular-nums">{pct(stat.share)}</span>
    </button>
  );
}

export function SourcesPanel({ data, summary, best }: { data: SourceStat[]; summary: Summary; best: SourceStat }) {
  const [active, setActive] = useState<LeadSource | null>(null);
  const top = data[0];
  const bestMeta = SOURCE_META[best.source];

  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-5">
      <div>
        <h2 className="text-ink font-bold">Lead sources</h2>
        <p className="text-ink-muted text-xs">Where leads come from, and what converts.</p>
      </div>

      <div className="mt-4 grid place-items-center">
        <SourceDonut data={data} total={summary.total} active={active} onHover={setActive} size={154} />
      </div>

      <div className="mt-4 space-y-0.5">
        {data.map((d) => (
          <LegendRow key={d.source} stat={d} active={active} isTop={d.source === top.source} onHover={setActive} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-black/[0.06] bg-cream/70 p-2.5">
        <span className="bg-brand-orange/10 text-brand-orange grid size-8 shrink-0 place-items-center rounded-lg">
          <Trophy className="size-4" />
        </span>
        <p className="text-ink-muted min-w-0 text-[11px] leading-snug">
          <span className="text-ink font-semibold">Best converting: {bestMeta.label}.</span> {pct(best.qualifiedRate)} qualify, the highest of any channel.
        </p>
      </div>
    </section>
  );
}
