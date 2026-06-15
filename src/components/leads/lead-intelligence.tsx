"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Download, PhoneCall, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALL_TEMPLATE_IDS } from "@/lib/conversations";
import { templateById, type TemplateId } from "@/lib/agents";
import {
  bestConvertingSource,
  leadSummary,
  listScoredLeads,
  sourceBreakdown,
  type LeadSource,
} from "@/lib/lead-intelligence";
import { LeadDetail } from "@/components/conversations/conversation-ui";
import { KpiStrip, SourcesPanel } from "./lead-sources";
import { LeadScoreHeader, ScoredLeadRow } from "./lead-row";
import { SourceChip } from "./source-icons";
import { UploadLeadsModal } from "./upload-leads-modal";
import { AutoCallModal } from "./auto-call-modal";

const PREVIEW_COUNT = 6;

export function LeadIntelligence() {
  const router = useRouter();
  const params = useSearchParams();
  // Deep links from an agent page filter to that agent's template (SSR-safe: the
  // template id rides in the URL, no localStorage needed).
  const templateParam = params.get("template");
  const templateId: TemplateId | null = ALL_TEMPLATE_IDS.includes(templateParam as TemplateId)
    ? (templateParam as TemplateId)
    : null;

  const allLeads = useMemo(() => listScoredLeads(), []);
  const summary = useMemo(() => leadSummary(), []);
  const sources = useMemo(() => sourceBreakdown(), []);
  const best = useMemo(() => bestConvertingSource(), []);

  const [openId, setOpenId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [autoCallOpen, setAutoCallOpen] = useState(false);

  const scoped = templateId ? allLeads.filter((l) => l.templateId === templateId) : allLeads;
  const recent = scoped.slice(0, PREVIEW_COUNT);
  const open = allLeads.find((l) => l.id === openId) ?? null;

  const viewAll = () => router.push(`/leads/all${templateId ? `?template=${templateId}` : ""}`);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-ink text-xl font-bold">Lead Intelligence</h1>
          <p className="text-ink-muted text-sm">
            {summary.total.toLocaleString("en-IN")} leads across {sources.length} channels · last 30 days
            {templateId && <span> · {templateById(templateId).role}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setUploadOpen(true)} variant="outline" className="text-ink hidden h-9 items-center gap-1.5 rounded-lg border-black/15 px-3 text-sm font-semibold sm:inline-flex">
            <Upload className="size-4" /> Upload Leads
          </Button>
          <Button onClick={() => setAutoCallOpen(true)} className="bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-3.5 text-sm font-semibold text-white">
            <PhoneCall className="size-4" /> Auto-call Hot Leads
          </Button>
          <Button variant="outline" className="text-ink hidden h-9 items-center gap-1.5 rounded-lg border-black/15 px-3 text-sm font-semibold sm:inline-flex">
            <Download className="size-4" /> Export
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {open ? (
          <div className="space-y-3">
            <LeadScoreHeader lead={open} />
            <LeadDetail lead={open} agentName={open.agentRole} onBack={() => setOpenId(null)} />
          </div>
        ) : allLeads.length === 0 ? (
          <EmptyLeads onLaunch={() => router.push("/ai-team")} />
        ) : (
          <div className="space-y-5">
            <KpiStrip summary={summary} />

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              {/* main: recent leads (the priority) */}
              <section className="min-w-0 flex-1 rounded-2xl border border-black/[0.07] bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-ink font-bold">Recent leads</h2>
                    <p className="text-ink-muted text-xs">Your latest leads, scored by buying intent.</p>
                  </div>
                  <button
                    type="button"
                    onClick={viewAll}
                    className="text-accent-blue inline-flex shrink-0 items-center gap-1 text-sm font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent-blue/30 rounded"
                  >
                    View all <ArrowRight className="size-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-2.5">
                  {recent.map((l) => (
                    <ScoredLeadRow key={l.id} lead={l} query="" onOpen={() => setOpenId(l.id)} />
                  ))}
                </div>

                {scoped.length > PREVIEW_COUNT && (
                  <button
                    type="button"
                    onClick={viewAll}
                    className="text-ink-muted hover:text-ink hover:border-black/25 mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-black/15 py-2.5 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/30"
                  >
                    View all {scoped.length} leads
                    <ArrowRight className="size-4" />
                  </button>
                )}
              </section>

              {/* side: compact lead sources */}
              <div className="lg:w-[332px] lg:shrink-0">
                <SourcesPanel data={sources} summary={summary} best={best} />
              </div>
            </div>
          </div>
        )}
      </div>

      {uploadOpen && <UploadLeadsModal onClose={() => setUploadOpen(false)} />}
      {autoCallOpen && <AutoCallModal onClose={() => setAutoCallOpen(false)} />}
    </div>
  );
}

/* -------------------------------- empty ----------------------------------- */

function EmptyLeads({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="mx-auto grid max-w-md place-items-center py-16 text-center">
      <div className="flex -space-x-1.5">
        {(["whatsapp", "voice", "website", "instagram", "facebook"] as LeadSource[]).map((s, i) => (
          <span
            key={s}
            className="ring-cream rounded-xl ring-4"
            style={{ animation: `fade-in-up 360ms ease-out ${i * 60}ms both`, zIndex: 10 - i }}
          >
            <SourceChip source={s} className="size-10" iconClassName="size-5" />
          </span>
        ))}
      </div>
      <h2 className="text-ink mt-5 text-lg font-bold">No leads yet</h2>
      <p className="text-ink-muted mt-1.5 text-sm">
        Connect your channels and your AI agents start capturing leads from calls, WhatsApp, your website, and social.
        They show up here, scored and ready to call.
      </p>
      <Button onClick={onLaunch} className="bg-brand-green hover:bg-brand-green-hover mt-5 h-10 rounded-lg px-4 text-sm font-semibold text-white">
        <Sparkles className="size-4" /> Launch an Agent
      </Button>
    </div>
  );
}
