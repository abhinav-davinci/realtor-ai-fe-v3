"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  FileText,
  Info,
  Languages,
  Loader2,
  MessageSquare,
  Mic,
  Phone,
  Plus,
  Rocket,
  Settings2,
  Sparkles,
  Upload,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { MOCK_LISTINGS } from "@/lib/mock-data";
import {
  GUARDRAILS,
  LANGUAGES,
  LEAD_FIELDS,
  TONES,
  VOICES,
  getAgent,
  readiness,
  saveAgent,
  templateById,
  voiceById,
  type AgentConfig,
  type Channel,
  type KnowledgeState,
} from "@/lib/agents";
import { AgentOrb, ReadinessMeter } from "./agent-ui";

/* ----------------------------- speech helper ------------------------------ */

function speak(text: string, gender: "male" | "female", onEnd: () => void) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return onEnd();
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    // Prefer an Indian English voice; fall back to anything matching gender hints.
    const indian = voices.find((v) => /en-IN/i.test(v.lang));
    const byName = voices.find((v) =>
      gender === "female" ? /female|priya|veena|google uk english female/i.test(v.name) : /male|rishi|google uk english male/i.test(v.name)
    );
    u.voice = indian ?? byName ?? voices[0] ?? null;
    u.rate = 1; u.pitch = gender === "female" ? 1.08 : 0.92;
    u.onend = onEnd;
    synth.speak(u);
  } catch {
    onEnd();
  }
}

/* ------------------------------- the builder ------------------------------ */

export function AgentBuilder({ templateId }: { templateId: string }) {
  const router = useRouter();
  // ?edit=<id> loads an existing agent and saves changes to it instead of
  // creating a new one.
  const editId = useSearchParams().get("edit");
  const { orgName } = useAuth();
  const company = orgName || "your company";
  const t = useMemo(() => templateById(templateId), [templateId]);

  const [name, setName] = useState(t.name);
  const [greeting, setGreeting] = useState(t.greeting);
  const [voiceId, setVoiceId] = useState(t.voiceId);
  const [languages, setLanguages] = useState<string[]>(voiceById(t.voiceId).langs.slice(0, 2));
  const [tone, setTone] = useState<string[]>(t.tone);
  const [collects, setCollects] = useState<string[]>(t.collects);
  const [channels, setChannels] = useState<Channel[]>(t.channels);
  const [knowledge, setKnowledge] = useState<KnowledgeState>({
    companyProfile: false,
    projects: [],
    docs: [],
    faqs: 0,
    website: "",
  });
  const [alwaysOn, setAlwaysOn] = useState(true);
  const [escalateTo, setEscalateTo] = useState("");
  const [guardrails, setGuardrails] = useState<string[]>(GUARDRAILS.slice(0, 2));
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [previewMode, setPreviewMode] = useState<"voice" | "chat">("voice");
  const [speaking, setSpeaking] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  // New builds render immediately; edits wait one tick to load from localStorage.
  const [ready, setReady] = useState(!editId);
  const fileRef = useRef<HTMLInputElement>(null);
  const createdAtRef = useRef<number | null>(null);

  const voice = voiceById(voiceId);
  const previewGreeting = greeting.replaceAll("{company}", company);
  const rd = readiness({ voiceId, tone, languages, greeting, channels, knowledge });

  // Edit mode: load the saved agent (client-only) and prefill every field.
  useEffect(() => {
    if (!editId) return;
    const a = getAgent(editId);
    if (a) {
      setName(a.name);
      setGreeting(a.greeting);
      setVoiceId(a.voiceId);
      setLanguages(a.languages);
      setTone(a.tone);
      setCollects(a.collects);
      setChannels(a.channels);
      setKnowledge(a.knowledge);
      setAlwaysOn(a.alwaysOn);
      setEscalateTo(a.escalateTo);
      setGuardrails(a.guardrails);
      createdAtRef.current = a.createdAt;
    }
    setReady(true);
  }, [editId]);

  // When channels drop voice, force the chat preview.
  useEffect(() => {
    if (!channels.includes("voice") && previewMode === "voice") setPreviewMode("chat");
  }, [channels, previewMode]);

  function toggle<T>(list: T[], v: T, set: (l: T[]) => void, max?: number) {
    if (list.includes(v)) set(list.filter((x) => x !== v));
    else if (!max || list.length < max) set([...list, v]);
    else set([...list.slice(1), v]);
  }

  function hearIt() {
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(previewGreeting, voice.gender, () => setSpeaking(false));
  }

  function launch() {
    setLaunching(true);
    const agent: AgentConfig = {
      id: editId || `agent-${Date.now().toString(36)}`,
      templateId: t.id,
      name,
      role: t.role,
      voiceId,
      languages,
      tone,
      greeting,
      channels,
      alwaysOn,
      escalateTo,
      collects,
      guardrails,
      knowledge,
      createdAt: createdAtRef.current ?? Date.now(),
    };
    saveAgent(agent);
    setLaunched(true);
    setTimeout(() => router.push(`/ai-team/agents/${agent.id}${editId ? "" : "?new=1"}`), 1700);
  }

  if (!ready) {
    return (
      <div className="grid h-full place-items-center">
        <Loader2 className="text-accent-blue size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-black/[0.06] bg-white/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/ai-team")}
          className="text-ink-muted hover:text-ink hover:bg-black/[0.04] grid size-9 shrink-0 place-items-center rounded-lg"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate font-bold">{editId ? "Edit" : "Build"} your {t.role}</p>
          <p className="text-ink-muted truncate text-xs">
            {editId ? "Update anything, then save your changes." : "Everything has a default, so you can launch now. Adding knowledge makes it smarter."}
          </p>
        </div>
        <Button
          onClick={launch}
          disabled={launching}
          className="bg-brand-green hover:bg-brand-green-hover hidden h-10 rounded-lg px-4 text-sm font-semibold text-white sm:inline-flex"
        >
          {editId ? <Check className="size-4" /> : <Rocket className="size-4" />}
          {editId ? "Save Changes" : "Launch Agent"}
        </Button>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        {/* -------------------------- left: inputs -------------------------- */}
        <div className="min-w-0 space-y-5">
          {/* Identity */}
          <SectionCard icon={Sparkles} title="Identity" desc="What your agent is called and how it opens a conversation.">
            <Field label="Agent name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-ink focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none"
              />
            </Field>
            <Field label="Opening line" hint="Use {company} to insert your business name.">
              <textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={2}
                className="text-ink focus:border-accent-blue/50 w-full resize-none rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none"
              />
            </Field>
          </SectionCard>

          {/* Voice */}
          <SectionCard icon={Mic} title="Voice" desc="Pick how your agent sounds. Tap ▶ to hear the opening line.">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {VOICES.map((v) => {
                const sel = v.id === voiceId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVoiceId(v.id);
                      setLanguages((cur) => (cur.length ? cur : v.langs.slice(0, 2)));
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors",
                      sel ? "border-accent-blue bg-accent-blue/[0.05]" : "border-black/12 hover:border-black/25"
                    )}
                  >
                    <AgentOrb colors={[v.color, "#16243f"]} size={38} speaking={sel && speaking} />
                    <div className="min-w-0 flex-1">
                      <p className="text-ink text-sm font-semibold">{v.name}</p>
                      <p className="text-ink-muted truncate text-xs">{v.tagline}</p>
                    </div>
                    {sel && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          hearIt();
                        }}
                        className="bg-accent-blue/10 text-accent-blue grid size-7 shrink-0 cursor-pointer place-items-center rounded-full"
                        aria-label="Hear voice"
                      >
                        {speaking ? <Volume2 className="size-3.5 animate-pulse" /> : <span className="text-[10px] font-bold">▶</span>}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Languages + personality */}
          <SectionCard icon={Languages} title="Languages & personality" desc="How it speaks, and in which languages.">
            <Field label="Languages">
              <ChipRow items={LANGUAGES} selected={languages} onToggle={(v) => toggle(languages, v, setLanguages)} />
            </Field>
            <Field label="Personality" hint="Choose up to 3">
              <ChipRow items={TONES} selected={tone} onToggle={(v) => toggle(tone, v, setTone, 3)} />
            </Field>
          </SectionCard>

          {/* Knowledge, the educational hero */}
          <div className="border-brand-orange/30 overflow-hidden rounded-2xl border bg-white">
            <div className="bg-brand-orange/[0.06] flex items-start gap-3 px-5 py-4">
              <span className="bg-brand-orange/15 text-brand-orange grid size-9 shrink-0 place-items-center rounded-lg">
                <FileText className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-ink font-bold">Knowledge base</p>
                  <span className="bg-brand-orange/15 text-brand-orange rounded-full px-2 py-0.5 text-[11px] font-semibold">Recommended</span>
                </div>
                <p className="text-ink-muted text-sm">
                  This is what makes your agent useful. Each item you add raises the readiness score and helps it give
                  real, specific answers.
                </p>
              </div>
            </div>

            <div className="space-y-3 p-5">
              <KnowledgeRow
                label={`Company profile: ${company}`}
                desc="Brand, USPs, contact details, and tone. Auto-filled from your account."
                points="+15"
                active={knowledge.companyProfile}
                onClick={() => setKnowledge((k) => ({ ...k, companyProfile: !k.companyProfile }))}
              />

              <div className="rounded-xl border border-black/[0.08] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-ink text-sm font-semibold">Projects & inventory</p>
                    <p className="text-ink-muted text-xs">Pull your live listings so the agent knows price, configuration, and location.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProjectPickerOpen(true)}
                    className="text-accent-blue border-accent-blue/30 hover:bg-accent-blue/[0.06] inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <Plus className="size-3.5" /> Add
                  </button>
                </div>
                {knowledge.projects.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {knowledge.projects.map((p) => (
                      <span key={p} className="border-accent-blue/30 bg-accent-blue/[0.06] text-ink inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs">
                        {p}
                        <button type="button" onClick={() => setKnowledge((k) => ({ ...k, projects: k.projects.filter((x) => x !== p) }))} aria-label="Remove">
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-black/[0.08] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-ink text-sm font-semibold">Brochures & price lists</p>
                    <p className="text-ink-muted text-xs">Upload PDFs. The agent learns the details inside them.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-ink-muted hover:bg-black/[0.04] inline-flex shrink-0 items-center gap-1 rounded-lg border border-black/15 px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <Upload className="size-3.5" /> Upload
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const names = Array.from(e.target.files ?? []).map((f) => f.name);
                      if (names.length) setKnowledge((k) => ({ ...k, docs: [...k.docs, ...names] }));
                    }}
                  />
                </div>
                {knowledge.docs.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {knowledge.docs.map((d, i) => (
                      <span key={`${d}-${i}`} className="text-ink inline-flex items-center gap-1.5 rounded-full border border-black/12 px-2.5 py-1 text-xs">
                        <FileText className="text-ink-muted size-3" /> {d}
                        <button type="button" onClick={() => setKnowledge((k) => ({ ...k, docs: k.docs.filter((_, j) => j !== i) }))} aria-label="Remove">
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-black/[0.08] p-3.5">
                  <p className="text-ink text-sm font-semibold">Common FAQs</p>
                  <p className="text-ink-muted text-xs">Add the questions buyers always ask.</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Stepper value={knowledge.faqs} onChange={(n) => setKnowledge((k) => ({ ...k, faqs: n }))} />
                    <span className="text-ink-muted text-xs">{knowledge.faqs} added</span>
                  </div>
                </div>
                <div className="rounded-xl border border-black/[0.08] p-3.5">
                  <p className="text-ink text-sm font-semibold">Website</p>
                  <p className="text-ink-muted text-xs">We&apos;ll learn from your site.</p>
                  <input
                    value={knowledge.website}
                    onChange={(e) => setKnowledge((k) => ({ ...k, website: e.target.value }))}
                    placeholder="skylinerealty.in"
                    className="text-ink focus:border-accent-blue/50 mt-2 h-9 w-full rounded-lg border border-black/15 px-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="bg-accent-blue/[0.05] flex items-center gap-2 rounded-lg px-3 py-2">
                <Info className="text-accent-blue size-4 shrink-0" />
                <p className="text-ink-muted text-xs">
                  Knowledge is up to <span className="text-ink font-semibold">60%</span> of your agent&apos;s readiness. The
                  meter on the right moves as you add.
                </p>
              </div>
            </div>
          </div>

          {/* What it collects */}
          {t.id !== "payment" && (
            <SectionCard icon={MessageSquare} title="What it captures" desc="Details the agent should collect during a conversation.">
              <ChipRow items={LEAD_FIELDS} selected={collects} onToggle={(v) => toggle(collects, v, setCollects)} />
            </SectionCard>
          )}

          {/* Channels */}
          <SectionCard icon={Phone} title="Where it works" desc="The same agent can take calls and answer chats on your website.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ChannelToggle
                icon={Phone}
                title="Voice agent"
                desc="Inbound and outbound phone or WhatsApp calls."
                on={channels.includes("voice")}
                onToggle={() => toggle(channels, "voice" as Channel, setChannels)}
              />
              <ChannelToggle
                icon={MessageSquare}
                title="Website chat widget"
                desc="The same agent as a text chatbot on your site."
                on={channels.includes("chat")}
                onToggle={() => toggle(channels, "chat" as Channel, setChannels)}
              />
            </div>
            {channels.includes("chat") && (
              <div className="mt-3 rounded-xl bg-black/[0.03] p-3.5">
                <p className="text-ink-muted text-xs font-medium">Add this to your website. No changes to your agent needed:</p>
                <pre className="text-ink mt-1.5 overflow-x-auto rounded-lg bg-white p-2.5 text-[11px] ring-1 ring-black/[0.06]">
{`<script src="https://cdn.trythat.ai/widget.js"
  data-agent="${name.toLowerCase()}"></script>`}
                </pre>
              </div>
            )}
          </SectionCard>

          {/* Advanced */}
          <div className="rounded-2xl border border-black/[0.08] bg-white">
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4"
            >
              <span className="flex items-center gap-3">
                <Settings2 className="text-ink-muted size-5" />
                <span className="text-ink font-bold">Advanced settings</span>
                <span className="text-ink-muted text-xs">Availability, escalation, and guardrails</span>
              </span>
              <ChevronDown className={cn("text-ink-muted size-5 transition-transform", advancedOpen && "rotate-180")} />
            </button>
            {advancedOpen && (
              <div className="space-y-4 border-t border-black/[0.06] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-ink text-sm font-semibold">Always on (24x7)</p>
                    <p className="text-ink-muted text-xs">Off = only during business hours; after-hours leads get a callback promise.</p>
                  </div>
                  <Switch on={alwaysOn} onToggle={() => setAlwaysOn((v) => !v)} />
                </div>
                <Field label="Escalate hot leads to" hint="Optional. A human takes over for this number.">
                  <div className="focus-within:border-accent-blue/50 flex h-11 items-center gap-2 rounded-lg border border-black/15 bg-white px-3">
                    <span className="text-ink-muted shrink-0 text-sm">🇮🇳 +91</span>
                    <input
                      value={escalateTo}
                      onChange={(e) => setEscalateTo(e.target.value)}
                      inputMode="numeric"
                      placeholder="Sales head's number"
                      className="text-ink min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                </Field>
                <div>
                  <p className="text-ink mb-2 text-sm font-semibold">Guardrails</p>
                  <div className="space-y-2">
                    {GUARDRAILS.map((g) => (
                      <SpecCheck key={g} label={g} checked={guardrails.includes(g)} onChange={() => toggle(guardrails, g, setGuardrails)} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* mobile launch */}
          <Button
            onClick={launch}
            disabled={launching}
            className="bg-brand-green hover:bg-brand-green-hover h-12 w-full rounded-xl text-base font-semibold text-white sm:hidden"
          >
            {editId ? <Check className="size-5" /> : <Rocket className="size-5" />}
            {editId ? "Save Changes" : "Launch Agent"}
          </Button>
        </div>

        {/* -------------------------- right: preview ------------------------ */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-gradient-to-b from-[#16243f] to-[#1d2f50] text-white shadow-sm">
            <div className="flex flex-col items-center px-5 pt-6 pb-4">
              <AgentOrb colors={[voice.color, "#2f6bed"]} size={104} speaking={speaking || previewMode === "voice"} />
              <p className="mt-3 text-lg font-bold">{name}</p>
              <p className="text-xs text-white/70">{t.role}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {tone.slice(0, 3).map((to) => (
                  <span key={to} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/85">{to}</span>
                ))}
              </div>
            </div>

            {/* readiness on a light tray */}
            <div className="bg-white px-5 py-4">
              <ReadinessMeter voiceId={voiceId} tone={tone} languages={languages} greeting={greeting} channels={channels} knowledge={knowledge} />
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className={cn("h-full rounded-full transition-[width] duration-500", rd.tone === "weak" ? "bg-amber-500" : rd.tone === "ok" ? "bg-accent-blue" : "bg-brand-green")}
                  style={{ width: `${rd.score}%` }}
                />
              </div>
              {rd.knowledgePoints < 30 && (
                <p className="text-ink-muted mt-2 text-xs">
                  Add your projects and company profile to take this past <span className="text-ink font-semibold">Capable</span>.
                </p>
              )}
            </div>

            {/* preview tabs */}
            <div className="bg-white px-5 pb-5">
              <div className="flex rounded-lg bg-black/[0.04] p-1">
                <TabBtn active={previewMode === "voice"} disabled={!channels.includes("voice")} onClick={() => setPreviewMode("voice")}>
                  <Phone className="size-3.5" /> Voice
                </TabBtn>
                <TabBtn active={previewMode === "chat"} disabled={!channels.includes("chat")} onClick={() => setPreviewMode("chat")}>
                  <MessageSquare className="size-3.5" /> Chat
                </TabBtn>
              </div>

              {previewMode === "voice" ? (
                <div className="mt-3 rounded-xl border border-black/[0.08] p-3.5">
                  <p className="text-ink-muted text-xs font-medium">Opening line</p>
                  <p className="text-ink mt-1 text-sm leading-snug">“{previewGreeting}”</p>
                  <button
                    type="button"
                    onClick={hearIt}
                    className={cn(
                      "mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
                      speaking ? "bg-red-50 text-red-600" : "bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/15"
                    )}
                  >
                    <Volume2 className="size-4" /> {speaking ? "Stop" : `Hear ${name}`}
                  </button>
                </div>
              ) : (
                <ChatPreview agentName={name} greeting={previewGreeting} reply={cannedReply(t.id, knowledge, company)} />
              )}
            </div>
          </div>

          <p className="text-ink-muted mt-3 px-1 text-center text-xs">Preview updates live as you edit. Nothing is published until you launch.</p>
        </div>
      </div>

      {projectPickerOpen && (
        <ProjectPicker
          selected={knowledge.projects}
          onClose={() => setProjectPickerOpen(false)}
          onSave={(projects) => {
            setKnowledge((k) => ({ ...k, projects }));
            setProjectPickerOpen(false);
          }}
        />
      )}

      {launched && <LaunchSuccess name={name} edited={!!editId} />}
    </div>
  );
}

/* ------------------------------ small pieces ------------------------------ */

function SectionCard({ icon: Icon, title, desc, children }: { icon: LucideIcon; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="bg-accent-blue/10 text-accent-blue grid size-9 shrink-0 place-items-center rounded-lg">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-ink font-bold">{title}</p>
          <p className="text-ink-muted text-sm">{desc}</p>
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-ink mb-2 flex items-center gap-2 text-sm font-semibold">
        {label}
        {hint && <span className="text-ink-muted text-xs font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function ChipRow({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const sel = selected.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              sel ? "border-accent-blue bg-accent-blue/[0.08] text-ink" : "text-ink-muted border-black/15 hover:border-black/25"
            )}
          >
            {sel && (
              <span className="bg-accent-blue grid size-3.5 place-items-center rounded-full">
                <Check className="size-2.5 text-white" strokeWidth={3} />
              </span>
            )}
            {item}
          </button>
        );
      })}
    </div>
  );
}

function KnowledgeRow({ label, desc, points, active, onClick }: { label: string; desc: string; points: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
        active ? "border-brand-green/40 bg-brand-green/[0.05]" : "border-black/[0.08] hover:border-black/20"
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", active ? "bg-brand-green text-white" : "bg-black/[0.04] text-ink-muted")}>
        {active ? <Check className="size-5" strokeWidth={3} /> : <Building2 className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ink text-sm font-semibold">{label}</p>
        <p className="text-ink-muted text-xs leading-snug">{desc}</p>
      </div>
      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-brand-green/15 text-brand-green" : "bg-black/[0.05] text-ink-muted")}>
        {points} readiness
      </span>
    </button>
  );
}

function ChannelToggle({ icon: Icon, title, desc, on, onToggle }: { icon: LucideIcon; title: string; desc: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
        on ? "border-accent-blue bg-accent-blue/[0.05]" : "border-black/[0.08] hover:border-black/20"
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", on ? "bg-accent-blue text-white" : "bg-black/[0.04] text-ink-muted")}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-ink text-sm font-semibold">{title}</p>
        <p className="text-ink-muted text-xs leading-snug">{desc}</p>
      </div>
      <Switch on={on} onToggle={onToggle} />
    </button>
  );
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors", on ? "bg-accent-blue" : "bg-black/15")}
      role="switch"
      aria-checked={on}
    >
      <span className={cn("inline-block size-4 transform rounded-full bg-white shadow transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
    </span>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-black/12 p-1">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="text-ink-muted grid size-6 place-items-center rounded-md hover:bg-black/[0.04]">−</button>
      <span className="text-ink w-5 text-center text-sm font-semibold">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} className="text-ink-muted grid size-6 place-items-center rounded-md hover:bg-black/[0.04]">+</button>
    </span>
  );
}

function SpecCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="flex items-start gap-2.5 text-left">
      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition-colors", checked ? "border-accent-blue bg-accent-blue text-white" : "border-black/25 bg-white")}>
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="text-ink-muted text-sm leading-snug">{label}</span>
    </button>
  );
}

function TabBtn({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors",
        active ? "bg-white text-ink shadow-sm" : "text-ink-muted",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {children}
    </button>
  );
}

function ChatPreview({ agentName, greeting, reply }: { agentName: string; greeting: string; reply: { q: string; a: string } }) {
  return (
    <div className="mt-3 rounded-xl border border-black/[0.08] bg-black/[0.02] p-3">
      <div className="space-y-2">
        <Bubble who="agent" name={agentName}>{greeting}</Bubble>
        <Bubble who="user">{reply.q}</Bubble>
        <Bubble who="agent" name={agentName}>{reply.a}</Bubble>
      </div>
    </div>
  );
}

function Bubble({ who, name, children }: { who: "agent" | "user"; name?: string; children: React.ReactNode }) {
  if (who === "user") {
    return (
      <div className="flex justify-end">
        <span className="bg-accent-blue max-w-[85%] rounded-2xl rounded-br-sm px-3 py-1.5 text-xs text-white">{children}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start">
      <span className="text-ink-muted mb-0.5 ml-1 text-[10px] font-semibold">{name}</span>
      <span className="text-ink max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-1.5 text-xs ring-1 ring-black/[0.06]">{children}</span>
    </div>
  );
}

function cannedReply(templateId: string, knowledge: KnowledgeState, company: string): { q: string; a: string } {
  const project = knowledge.projects[0];
  const has = knowledge.companyProfile || knowledge.projects.length > 0;
  switch (templateId) {
    case "lead-qualifier":
      return {
        q: "Looking for a 3BHK in Baner under ₹2 Cr.",
        a: has
          ? `${project ? `"${project}" is a good fit, and it is` : "We have 3BHK homes in Baner from ₹1.95 Cr,"} RERA-registered. Shall I book you a site visit this weekend?`
          : `Happy to help. Could you share your budget and possession timeline so I can shortlist the right homes?`,
      };
    case "receptionist":
      return {
        q: "What's the price range and is it RERA approved?",
        a: has
          ? `Yes, our projects are RERA-registered, with 2 and 3BHK homes from ₹95 L to ₹2.4 Cr. Can I take your number for our sales team to share details?`
          : `I'll connect you to the right person. Can I take your name and the project you're interested in?`,
      };
    case "site-visit":
      return { q: "Can I visit this Saturday afternoon?", a: `Sure, I've noted Saturday 4 PM. I'll send you the ${company} location pin and a reminder on the morning of the visit. Does that work?` };
    case "feedback":
      return { q: "Liked it, but the price felt a bit high.", a: `Thanks for being honest. Many buyers feel that at first. Can I share our payment plan and an EMI option that could make it more comfortable?` };
    case "payment":
      return { q: "When is my next instalment due?", a: `Your next milestone payment is due on the 15th. I can WhatsApp you the payment link and receipt. Shall I go ahead?` };
    default:
      return { q: "What can you help me with?", a: `I can answer questions about ${company}, share project details, and connect you with our team. What would you like to know?` };
  }
}

/* ----------------------------- project picker ----------------------------- */

function ProjectPicker({ selected, onClose, onSave }: { selected: string[]; onClose: () => void; onSave: (p: string[]) => void }) {
  const [pick, setPick] = useState<string[]>(selected);
  const titles = MOCK_LISTINGS.map((l) => l.property_title || "Untitled").filter(Boolean);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <div>
            <p className="text-ink font-bold">Add projects from your listings</p>
            <p className="text-ink-muted text-xs">The agent will know each project&apos;s details.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted hover:bg-black/[0.05] grid size-8 place-items-center rounded-full">
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
          {titles.map((title) => {
            const on = pick.includes(title);
            return (
              <button
                key={title}
                type="button"
                onClick={() => setPick((p) => (on ? p.filter((x) => x !== title) : [...p, title]))}
                className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors", on ? "border-accent-blue bg-accent-blue/[0.05]" : "border-black/[0.08] hover:border-black/20")}
              >
                <span className={cn("grid size-5 shrink-0 place-items-center rounded border", on ? "border-accent-blue bg-accent-blue text-white" : "border-black/25")}>
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="text-ink truncate text-sm">{title}</span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 border-t border-black/[0.06] px-5 py-3">
          <Button variant="outline" onClick={onClose} className="text-ink h-9 rounded-lg border-black/15 px-4 text-sm">Cancel</Button>
          <Button onClick={() => onSave(pick)} className="bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-4 text-sm font-semibold text-white">
            Add {pick.length > 0 ? `(${pick.length})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ launch success ---------------------------- */

function LaunchSuccess({ name, edited }: { name: string; edited?: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-2xl" style={{ animation: "fade-in-up 300ms ease-out both" }}>
        <span className="grid size-16 place-items-center rounded-full bg-green-500 text-white" style={{ animation: "tick-pop 500ms cubic-bezier(0.2,0.8,0.2,1.4) both" }}>
          {edited ? <Check className="size-8" strokeWidth={3} /> : <Rocket className="size-8" />}
        </span>
        <h2 className="text-ink mt-5 text-2xl font-bold">{name} {edited ? "updated" : "is live"}</h2>
        <p className="text-ink-muted mt-2 text-sm">
          {edited
            ? "Your changes are saved. Taking you back to its dashboard."
            : "Your agent is ready to take calls and answer chats. Opening its dashboard now."}
        </p>
      </div>
    </div>
  );
}
