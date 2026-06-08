"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  Languages,
  MessageSquare,
  Mic,
  Pencil,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  deleteAgent,
  getAgent,
  readiness,
  templateById,
  voiceById,
  type AgentConfig,
} from "@/lib/agents";
import { AgentOrb, ChannelBadge, ReadinessMeter } from "./agent-ui";

export function AgentDetail({ id }: { id: string }) {
  const router = useRouter();
  const { orgName } = useAuth();
  const company = orgName || "your company";
  const isNew = useSearchParams().get("new") === "1";
  const [agent, setAgent] = useState<AgentConfig | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAgent(getAgent(id));
    setLoaded(true);
  }, [id]);

  if (loaded && !agent) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <p className="text-ink font-bold">Agent not found</p>
          <p className="text-ink-muted mt-1 text-sm">It may have been deleted.</p>
          <Button onClick={() => router.push("/ai-team")} className="bg-brand-blue mt-4 h-10 rounded-lg px-4 text-sm font-semibold text-white">
            Back to AI Team
          </Button>
        </div>
      </div>
    );
  }
  if (!agent) return null;

  const t = templateById(agent.templateId);
  const voice = voiceById(agent.voiceId);
  const rd = readiness(agent);

  function remove() {
    deleteAgent(agent!.id);
    router.push("/ai-team");
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3 sm:px-6 lg:px-8">
        <button type="button" onClick={() => router.push("/ai-team/agents")} aria-label="Back" className="text-ink-muted hover:text-ink hover:bg-black/[0.04] grid size-9 place-items-center rounded-lg">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AgentOrb colors={t.gradient} size={40} />
          <div className="min-w-0">
            <p className="text-ink truncate font-bold">{agent.name}</p>
            <p className="text-ink-muted truncate text-xs">{agent.role}</p>
          </div>
        </div>
        <button type="button" onClick={() => router.push(`/ai-team/build/${agent.templateId}`)} className="text-ink-muted hover:bg-black/[0.04] hidden h-9 items-center gap-1.5 rounded-lg border border-black/15 px-3 text-sm font-medium sm:inline-flex">
          <Pencil className="size-4" /> Edit
        </button>
        <button type="button" onClick={remove} aria-label="Delete" className="text-ink-muted hover:text-red-500 grid size-9 place-items-center rounded-lg hover:bg-red-50">
          <Trash2 className="size-4" />
        </button>
      </div>

      {isNew && (
        <div className="bg-brand-green/[0.08] border-brand-green/20 mx-4 mt-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 sm:mx-6 lg:mx-8">
          <span className="bg-brand-green grid size-6 place-items-center rounded-full text-white"><Check className="size-3.5" strokeWidth={3} /></span>
          <p className="text-ink text-sm font-medium">{agent.name} is live. Try it out below, then share the widget on your website.</p>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
        {/* main */}
        <div className="min-w-0 space-y-5">
          {/* live test */}
          <TestChat agent={agent} company={company} />

          {/* configuration */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <p className="text-ink font-bold">Configuration</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Info icon={Mic} label="Voice">{voice.name} · {voice.tagline}</Info>
              <Info icon={Languages} label="Languages">{agent.languages.join(", ") || "Not set"}</Info>
              <Info icon={Sparkles} label="Personality">{agent.tone.join(", ") || "Not set"}</Info>
              <Info icon={Phone} label="Availability">{agent.alwaysOn ? "24x7" : "Business hours"}</Info>
            </div>

            {agent.collects.length > 0 && (
              <div className="mt-4">
                <p className="text-ink-muted text-xs font-medium">Captures during a conversation</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {agent.collects.map((c) => (
                    <span key={c} className="text-ink rounded-full border border-black/12 px-2.5 py-1 text-xs">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {agent.guardrails.length > 0 && (
              <div className="mt-4">
                <p className="text-ink-muted text-xs font-medium">Guardrails</p>
                <ul className="mt-2 space-y-1.5">
                  {agent.guardrails.map((g) => (
                    <li key={g} className="text-ink-muted flex items-start gap-2 text-xs"><ShieldCheck className="text-brand-green mt-0.5 size-3.5 shrink-0" />{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* knowledge */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-ink font-bold">Knowledge base</p>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", rd.knowledgePoints >= 30 ? "bg-brand-green/15 text-brand-green" : "bg-amber-100 text-amber-700")}>
                {rd.knowledgePoints} / 60 pts
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <KItem on={agent.knowledge.companyProfile} label={`Company profile: ${company}`} />
              <KItem on={agent.knowledge.projects.length > 0} label={`${agent.knowledge.projects.length} project${agent.knowledge.projects.length === 1 ? "" : "s"} linked`} />
              <KItem on={agent.knowledge.docs.length > 0} label={`${agent.knowledge.docs.length} document${agent.knowledge.docs.length === 1 ? "" : "s"} uploaded`} />
              <KItem on={agent.knowledge.faqs > 0} label={`${agent.knowledge.faqs} FAQ${agent.knowledge.faqs === 1 ? "" : "s"} added`} />
              <KItem on={!!agent.knowledge.website} label={agent.knowledge.website ? `Website: ${agent.knowledge.website}` : "Website not linked"} />
            </div>
            {rd.knowledgePoints < 60 && (
              <button onClick={() => router.push(`/ai-team/build/${agent.templateId}`)} className="text-accent-blue mt-3 inline-flex items-center gap-1 text-sm font-semibold">
                <BookOpen className="size-4" /> Add more knowledge to sharpen {agent.name}
              </button>
            )}
          </div>
        </div>

        {/* right rail */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <ReadinessMeter {...agent} />
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
              <div className={cn("h-full rounded-full", rd.tone === "weak" ? "bg-amber-500" : rd.tone === "ok" ? "bg-accent-blue" : "bg-brand-green")} style={{ width: `${rd.score}%` }} />
            </div>
          </div>

          {/* deploy */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
            <p className="text-ink font-bold">Deployment</p>
            <div className="mt-3 space-y-3">
              {agent.channels.includes("voice") && (
                <div className="flex items-center gap-3 rounded-xl bg-black/[0.02] p-3">
                  <span className="bg-accent-blue/10 text-accent-blue grid size-9 place-items-center rounded-lg"><Phone className="size-4.5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ink text-sm font-semibold">Voice number</p>
                    <p className="text-ink-muted text-xs">+91 80 4718 22XX · provisioning</p>
                  </div>
                  <ChannelBadge channel="voice" />
                </div>
              )}
              {agent.channels.includes("chat") && <EmbedCard agentName={agent.name} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- test chat -------------------------------- */

function TestChat({ agent, company }: { agent: AgentConfig; company: string }) {
  const greeting = agent.greeting.replaceAll("{company}", company);
  const [msgs, setMsgs] = useState<{ who: "agent" | "user"; text: string }[]>([{ who: "agent", text: greeting }]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { who: "user", text }]);
    setTimeout(() => setMsgs((m) => [...m, { who: "agent", text: respond(agent, text, company) }]), 450);
  }

  const suggestions = SUGGESTIONS[agent.templateId] ?? SUGGESTIONS.custom;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
      <div className="flex items-center gap-2 border-b border-black/[0.06] px-5 py-3">
        <span className="bg-brand-green size-2 animate-pulse rounded-full" />
        <p className="text-ink text-sm font-bold">Test {agent.name} live</p>
        <span className="text-ink-muted ml-auto text-xs">Try a real buyer question</span>
      </div>
      <div className="h-72 space-y-2.5 overflow-y-auto bg-black/[0.015] p-4">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex", m.who === "user" ? "justify-end" : "justify-start")}>
            <span className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", m.who === "user" ? "bg-accent-blue rounded-br-sm text-white" : "text-ink rounded-bl-sm bg-white ring-1 ring-black/[0.06]")}>
              {m.text}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {msgs.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => { setInput(s); }} className="text-ink-muted hover:border-accent-blue/40 rounded-full border border-black/12 px-2.5 py-1 text-xs">
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Message ${agent.name}`}
          className="text-ink focus:border-accent-blue/50 h-10 flex-1 rounded-lg border border-black/15 px-3.5 text-sm outline-none"
        />
        <Button onClick={send} className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-3.5 text-sm font-semibold text-white">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}

const SUGGESTIONS: Record<string, string[]> = {
  "lead-qualifier": ["Show me 3BHKs under 2 Cr", "Is it RERA approved?", "Can I get a home loan?"],
  receptionist: ["What's the price range?", "Where is the project?", "Talk to sales"],
  "site-visit": ["Book a visit this weekend", "Reschedule my visit", "Send me the location"],
  feedback: ["I found the price high", "I loved the amenities", "Need time to decide"],
  payment: ["When is my EMI due?", "Share the payment link", "What documents are pending?"],
  custom: ["What can you do?", "Tell me about your projects", "I want to buy a home"],
};

function respond(agent: AgentConfig, text: string, company: string): string {
  const q = text.toLowerCase();
  const project = agent.knowledge.projects[0];
  const smart = agent.knowledge.companyProfile || agent.knowledge.projects.length > 0;
  const rera = "Yes, our projects are RERA-registered.";
  if (/rera|approv|legal/.test(q)) return smart ? `${rera} I can share the registration number and the approved plan. Want me to send them on WhatsApp?` : `${rera} I can have our team share the documents. Can I take your number?`;
  if (/loan|emi|finance|bank/.test(q)) return agent.templateId === "payment" ? `Your next instalment is due on the 15th. I can WhatsApp the payment link and receipt. Shall I?` : `Yes, we have tie-ups with leading banks for up to 90% financing. Want me to check your eligibility?`;
  if (/price|cost|budget|rate|cr|lakh/.test(q)) return smart ? `${project ? `"${project}"` : "Our homes"} range from ₹95 L to ₹2.4 Cr depending on the configuration. What's your budget so I can shortlist a few options?` : `Could you share your budget and preferred location? I'll shortlist the right options.`;
  if (/visit|tour|see|saturday|sunday|weekend/.test(q)) return `Happy to book your site visit. Does this Saturday 4 PM work? I'll send the ${company} location pin and a reminder.`;
  if (/location|where|address|pin/.test(q)) return smart ? `${project ? `"${project}" is` : "Our projects are"} in well-connected parts of Pune. I'll drop the exact Google Maps pin. What's your WhatsApp number?` : `I'll share the exact location. Can I take your number?`;
  if (/reschedul|change|postpone/.test(q)) return `No problem. When would you like to reschedule to? I'll update it and resend the confirmation.`;
  if (/high|expensive|costly|discount/.test(q)) return `I understand. Many buyers feel that at first. Can I share our payment plan and an EMI option that makes it more comfortable?`;
  if (/sales|human|agent|talk|call/.test(q)) return agent.escalateTo ? `Sure, I'm connecting you to our sales head right now.` : `Of course. Can I take your name and number so our sales team calls you back shortly?`;
  if (/buy|interested|book/.test(q)) return `Glad to hear it. Let me note down a few details. What's your budget and preferred configuration?`;
  return smart ? `Good question, I can help with that. ${project ? `For "${project}", ` : ""}could you tell me a little about what you're looking for?` : `Happy to help. Could you tell me a bit more so I can assist you better?`;
}

/* --------------------------------- bits ----------------------------------- */

function Info({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="bg-black/[0.04] text-ink-muted mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg"><Icon className="size-4" /></span>
      <div className="min-w-0">
        <p className="text-ink-muted text-xs">{label}</p>
        <p className="text-ink text-sm font-medium">{children}</p>
      </div>
    </div>
  );
}

function KItem({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full", on ? "bg-brand-green text-white" : "bg-black/[0.06] text-ink-muted")}>
        {on ? <Check className="size-3" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
      </span>
      <span className={cn("text-sm", on ? "text-ink" : "text-ink-muted")}>{label}</span>
    </div>
  );
}

function EmbedCard({ agentName }: { agentName: string }) {
  const [copied, setCopied] = useState(false);
  const snippet = `<script src="https://cdn.trythat.ai/widget.js" data-agent="${agentName.toLowerCase()}"></script>`;
  function copy() {
    try {
      navigator.clipboard?.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }
  return (
    <div className="rounded-xl bg-black/[0.02] p-3">
      <div className="flex items-center gap-2">
        <span className="bg-brand-green/10 text-brand-green grid size-9 place-items-center rounded-lg"><MessageSquare className="size-4.5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-ink text-sm font-semibold">Website chat widget</p>
          <p className="text-ink-muted text-xs">Paste before &lt;/body&gt; on your site.</p>
        </div>
        <ChannelBadge channel="chat" />
      </div>
      <pre className="text-ink mt-2.5 overflow-x-auto rounded-lg bg-white p-2.5 text-[11px] ring-1 ring-black/[0.06]">{snippet}</pre>
      <button type="button" onClick={copy} className={cn("mt-2 inline-flex items-center gap-1.5 text-xs font-semibold", copied ? "text-brand-green" : "text-accent-blue")}>
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied!" : "Copy embed code"}
      </button>
    </div>
  );
}
