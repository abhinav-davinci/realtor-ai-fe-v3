"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  FileText,
  Globe,
  HelpCircle,
  ListChecks,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SOURCES: { icon: LucideIcon; title: string; desc: string; points: string }[] = [
  { icon: Building2, title: "Company profile", desc: "Your brand, USPs, RERA details, office address, and contact info, so the agent represents you correctly.", points: "+15" },
  { icon: ListChecks, title: "Projects & inventory", desc: "Pull your live listings so the agent quotes the right price band, configuration, location, and availability.", points: "up to +20" },
  { icon: FileText, title: "Brochures & price lists", desc: "Upload PDFs and the agent picks up the floor plans, payment schedules, and amenities inside them.", points: "up to +10" },
  { icon: HelpCircle, title: "Common FAQs", desc: "The questions buyers always ask, like possession date, loan tie-ups, and maintenance, answered right away.", points: "up to +10" },
  { icon: Globe, title: "Website", desc: "Point the agent at your site and it picks up everything you have already published.", points: "+5" },
];

export function KnowledgeBase() {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 pt-6 pb-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <span className="bg-brand-orange/10 text-brand-orange inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <Sparkles className="size-3.5" /> What makes an agent good
        </span>
        <h1 className="text-ink mt-3 text-2xl font-bold">What a knowledge base is, and why it matters</h1>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          An AI agent is only as good as what it knows. On its own, it can chat politely, but it can&apos;t tell a buyer
          your 3BHK price in Baner or whether your project is RERA-approved. Add your <span className="text-ink font-semibold">company details, projects, brochures, and FAQs</span>, and it
          gives clear, correct answers around the clock.
        </p>
      </div>

      {/* Before / after */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
          <p className="text-ink-muted text-xs font-bold uppercase tracking-wide">Without a knowledge base</p>
          <div className="mt-3 space-y-2">
            <span className="text-ink inline-block rounded-2xl rounded-bl-sm bg-black/[0.04] px-3 py-2 text-sm">“What&apos;s the price of your 3BHK in Baner?”</span>
            <div className="flex justify-end">
              <span className="text-ink-muted inline-block max-w-[85%] rounded-2xl rounded-br-sm bg-black/[0.03] px-3 py-2 text-sm italic">“I&apos;m not sure about that. Let me have someone get back to you.”</span>
            </div>
          </div>
          <p className="text-ink-muted mt-3 text-xs">Generic, loses the lead&apos;s interest, needs a human anyway.</p>
        </div>
        <div className="border-brand-green/30 bg-brand-green/[0.04] rounded-2xl border p-5">
          <p className="text-brand-green text-xs font-bold uppercase tracking-wide">With a knowledge base</p>
          <div className="mt-3 space-y-2">
            <span className="text-ink inline-block rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm ring-1 ring-black/[0.05]">“What&apos;s the price of your 3BHK in Baner?”</span>
            <div className="flex justify-end">
              <span className="bg-brand-green inline-block max-w-[90%] rounded-2xl rounded-br-sm px-3 py-2 text-sm text-white">“Our 3BHK at Skyline Residence, Baner starts at ₹2.4 Cr and is RERA-registered. Shall I book you a site visit this weekend?”</span>
            </div>
          </div>
          <p className="text-brand-green mt-3 text-xs font-medium">Specific, confident, and moves the buyer to the next step.</p>
        </div>
      </div>

      {/* Sources */}
      <h2 className="text-ink mt-8 text-lg font-bold">What you can feed your agents</h2>
      <p className="text-ink-muted text-sm">You add these once while building an agent. Every agent you create can use them.</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SOURCES.map((s) => (
          <div key={s.title} className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="bg-accent-blue/10 text-accent-blue grid size-10 place-items-center rounded-xl"><s.icon className="size-5" /></span>
              <span className="bg-brand-green/10 text-brand-green rounded-full px-2 py-0.5 text-[11px] font-bold">{s.points}</span>
            </div>
            <p className="text-ink mt-3 font-bold">{s.title}</p>
            <p className="text-ink-muted mt-1 text-sm leading-snug">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#16243f] to-[#2f6bed] px-6 py-6 text-white sm:flex-row sm:items-center">
        <div>
          <p className="text-lg font-bold">Ready to build a smarter agent?</p>
          <p className="text-sm text-white/80">You add your knowledge right inside the builder, and watch the readiness score climb.</p>
        </div>
        <Button onClick={() => router.push("/ai-team")} className="bg-white text-ink h-11 shrink-0 rounded-lg px-5 text-sm font-semibold hover:bg-white/90">
          Build an Agent <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
