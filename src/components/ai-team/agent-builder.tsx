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
  Play,
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
  FAQ_SUGGESTIONS,
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
  type FaqItem,
  type KnowledgeState,
} from "@/lib/agents";
import { AgentOrb, ChannelBadge, ReadinessMeter } from "./agent-ui";

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
    faqs: [],
    website: "",
  });
  const [alwaysOn, setAlwaysOn] = useState(true);
  const [escalateTo, setEscalateTo] = useState("");
  const [guardrails, setGuardrails] = useState<string[]>(GUARDRAILS.slice(0, 2));
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [previewMode, setPreviewMode] = useState<"voice" | "chat">("voice");
  const [speaking, setSpeaking] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  // New builds render immediately; edits wait one tick to load from localStorage.
  const [ready, setReady] = useState(!editId);
  const fileRef = useRef<HTMLInputElement>(null);
  const createdAtRef = useRef<number | null>(null);

  const voice = voiceById(voiceId);
  const previewGreeting = greeting.replaceAll("{name}", name).replaceAll("{company}", company);
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

  // Build mode reviews before going live; edit mode saves directly (already live).
  function onLaunchClick() {
    if (editId) launch();
    else setReviewOpen(true);
  }

  function launch() {
    setReviewOpen(false);
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
    // Give the launch celebration room to play before moving on.
    setTimeout(() => router.push(`/ai-team/agents/${agent.id}${editId ? "" : "?new=1"}`), editId ? 1500 : 2100);
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
          onClick={onLaunchClick}
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
            <Field label="Opening line" hint="Use {name} and {company} to insert the agent and business names.">
              <textarea
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={2}
                className="text-ink focus:border-accent-blue/50 w-full resize-none rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none"
              />
            </Field>
          </SectionCard>

          {/* Voice */}
          <SectionCard icon={Mic} title="Voice" desc="Pick how your agent sounds, then press play to hear the opening line.">
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
                      "flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
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
                        {speaking ? <Volume2 className="size-3.5 animate-pulse" /> : <Play className="size-3 fill-current" />}
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

              <div className="rounded-xl border border-black/[0.08] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-ink text-sm font-semibold">Common FAQs</p>
                    <p className="text-ink-muted text-xs">The questions buyers always ask, with the answers your agent should give.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFaqModalOpen(true)}
                    className="text-accent-blue border-accent-blue/30 hover:bg-accent-blue/[0.06] inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
                  >
                    <Plus className="size-3.5" /> {knowledge.faqs.length ? "Manage" : "Add"}
                  </button>
                </div>
                {knowledge.faqs.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {knowledge.faqs.map((f, i) => (
                      <span key={i} className="border-accent-blue/30 bg-accent-blue/[0.06] text-ink inline-flex max-w-[18rem] items-center rounded-full border px-2.5 py-1 text-xs">
                        <span className="truncate">{f.q || "Untitled question"}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-black/[0.08] p-3.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-ink text-sm font-semibold">Website</p>
                    <p className="text-ink-muted text-xs">We&apos;ll learn from your site.</p>
                  </div>
                  <input
                    value={knowledge.website}
                    onChange={(e) => setKnowledge((k) => ({ ...k, website: e.target.value }))}
                    placeholder="skylinerealty.in"
                    className="text-ink focus:border-accent-blue/50 h-9 w-full rounded-lg border border-black/15 px-3 text-sm outline-none sm:w-64"
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
                <p className="text-ink-muted text-xs font-medium">Add this to your website, or send it to whoever manages your site:</p>
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
                <button
                  type="button"
                  onClick={() => setAlwaysOn((v) => !v)}
                  role="switch"
                  aria-checked={alwaysOn}
                  className="flex w-full items-center justify-between gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
                >
                  <span>
                    <span className="text-ink block text-sm font-semibold">Always on (24x7)</span>
                    <span className="text-ink-muted block text-xs">Off = only during business hours; after-hours leads get a callback promise.</span>
                  </span>
                  <Switch on={alwaysOn} />
                </button>
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
            onClick={onLaunchClick}
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

      {faqModalOpen && (
        <FaqModal
          initial={knowledge.faqs}
          onClose={() => setFaqModalOpen(false)}
          onSave={(faqs) => {
            setKnowledge((k) => ({ ...k, faqs }));
            setFaqModalOpen(false);
          }}
        />
      )}

      {reviewOpen && (
        <LaunchReview
          name={name}
          role={t.role}
          gradient={t.gradient}
          icon={t.icon}
          rd={rd}
          channels={channels}
          launching={launching}
          onLaunch={launch}
          onCancel={() => setReviewOpen(false)}
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
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
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
        "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
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
      role="switch"
      aria-checked={on}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
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
      <Switch on={on} />
    </button>
  );
}

/** Decorative switch visual. The parent button carries role="switch" + aria-checked. */
function Switch({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors", on ? "bg-accent-blue" : "bg-black/15")}
    >
      <span className={cn("inline-block size-4 transform rounded-full bg-white shadow transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
    </span>
  );
}

function SpecCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="group/spec flex items-start gap-2.5 text-left outline-none">
      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition-colors group-focus-visible/spec:ring-2 group-focus-visible/spec:ring-accent-blue/40", checked ? "border-accent-blue bg-accent-blue text-white" : "border-black/25 bg-white")}>
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

/* -------------------------------- FAQ modal ------------------------------- */

function FaqModal({ initial, onClose, onSave }: { initial: FaqItem[]; onClose: () => void; onSave: (faqs: FaqItem[]) => void }) {
  const [list, setList] = useState<FaqItem[]>(initial);
  const used = new Set(list.map((f) => f.q.trim().toLowerCase()));
  const remaining = FAQ_SUGGESTIONS.filter((s) => !used.has(s.q.trim().toLowerCase()));

  const add = (item: FaqItem) => setList((l) => [...l, { ...item }]);
  const update = (i: number, field: "q" | "a", val: string) => setList((l) => l.map((f, j) => (j === i ? { ...f, [field]: val } : f)));
  const remove = (i: number) => setList((l) => l.filter((_, j) => j !== i));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="modal-pop flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
          <div>
            <p className="text-ink font-bold">Common FAQs</p>
            <p className="text-ink-muted text-xs">Pick a question buyers always ask, or add your own. Each one needs an answer your agent can give.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted hover:bg-black/[0.05] grid size-8 shrink-0 place-items-center rounded-full">
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {remaining.length > 0 && (
            <div>
              <p className="text-ink-muted text-xs font-medium">Add a common question</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {remaining.map((s) => (
                  <button
                    key={s.q}
                    type="button"
                    onClick={() => add(s)}
                    className="text-ink-muted hover:border-accent-blue/40 hover:text-ink inline-flex items-center gap-1 rounded-full border border-black/15 px-2.5 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40"
                  >
                    <Plus className="size-3" /> {s.q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {list.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-ink-muted text-xs font-medium">Your FAQs ({list.length})</p>
              {list.map((f, i) => (
                <div key={i} className="rounded-xl border border-black/[0.08] p-3">
                  <div className="flex items-start gap-2">
                    <input
                      value={f.q}
                      onChange={(e) => update(i, "q", e.target.value)}
                      placeholder="Question"
                      className="text-ink focus:border-accent-blue/50 h-9 w-full rounded-lg border border-black/15 px-3 text-sm font-medium outline-none"
                    />
                    <button type="button" onClick={() => remove(i)} aria-label="Remove FAQ" className="text-ink-muted hover:text-red-500 grid size-9 shrink-0 place-items-center rounded-lg hover:bg-red-50">
                      <X className="size-4" />
                    </button>
                  </div>
                  <textarea
                    value={f.a}
                    onChange={(e) => update(i, "a", e.target.value)}
                    rows={2}
                    placeholder="The answer your agent should give"
                    className="text-ink focus:border-accent-blue/50 mt-2 w-full resize-none rounded-lg border border-black/15 px-3 py-2 text-sm outline-none"
                  />
                  {f.q.trim() && !f.a.trim() && (
                    <p className="mt-1 text-[11px] text-amber-600">Add an answer so the agent can use this.</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-muted rounded-xl border border-dashed border-black/15 p-4 text-center text-sm">
              No FAQs yet. Tap a suggestion above, or add your own below.
            </p>
          )}

          <button type="button" onClick={() => add({ q: "", a: "" })} className="text-accent-blue inline-flex items-center gap-1.5 text-sm font-semibold outline-none">
            <Plus className="size-4" /> Add your own question
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] px-5 py-3">
          <span className="text-ink-muted hidden text-xs sm:inline">Only questions with an answer help your agent.</span>
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="text-ink h-9 rounded-lg border-black/15 px-4 text-sm">Cancel</Button>
            <Button onClick={() => onSave(list.filter((f) => f.q.trim()))} className="bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-4 text-sm font-semibold text-white">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ launch review ---------------------------- */

function LaunchReview({
  name,
  role,
  gradient,
  icon,
  rd,
  channels,
  launching,
  onLaunch,
  onCancel,
}: {
  name: string;
  role: string;
  gradient: [string, string];
  icon: LucideIcon;
  rd: ReturnType<typeof readiness>;
  channels: Channel[];
  launching: boolean;
  onLaunch: () => void;
  onCancel: () => void;
}) {
  const weak = rd.tone === "weak";
  const barColor = weak ? "bg-amber-500" : rd.tone === "ok" ? "bg-accent-blue" : "bg-brand-green";
  const textColor = weak ? "text-amber-600" : rd.tone === "ok" ? "text-accent-blue" : "text-brand-green";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="modal-pop w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-4">
          <AgentOrb colors={gradient} size={46} icon={icon} />
          <div className="min-w-0">
            <p className="text-ink text-lg font-bold">Launch {name}?</p>
            <p className="text-ink-muted text-sm">{role}, ready to go live.</p>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* readiness, used as a gentle gate */}
          <div className="rounded-xl border border-black/[0.08] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-ink text-sm font-semibold">Agent readiness</span>
              <span className={cn("text-sm font-bold", textColor)}>{rd.score} / 100 · {rd.label}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
              <div className={cn("h-full rounded-full", barColor)} style={{ width: `${rd.score}%` }} />
            </div>
            {weak && (
              <p className="text-ink-muted mt-2 text-xs leading-snug">
                It can go live now. Adding your projects and company profile makes it noticeably sharper.
              </p>
            )}
          </div>

          {/* where it deploys + what happens next */}
          <div>
            <p className="text-ink-muted text-xs font-medium">Where it goes live</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {channels.map((c) => (
                <ChannelBadge key={c} channel={c} />
              ))}
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {channels.includes("voice") && (
                <li className="text-ink-muted flex items-start gap-2 text-xs leading-snug">
                  <Phone className="text-accent-blue mt-0.5 size-3.5 shrink-0" /> We set up a phone number so it can take calls.
                </li>
              )}
              {channels.includes("chat") && (
                <li className="text-ink-muted flex items-start gap-2 text-xs leading-snug">
                  <MessageSquare className="text-brand-green mt-0.5 size-3.5 shrink-0" /> A website chat widget becomes available to add to your site.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-black/[0.06] px-5 py-4">
          <Button variant="outline" onClick={onCancel} className="text-ink h-10 rounded-lg border-black/15 px-4 text-sm font-semibold">
            Keep Editing
          </Button>
          <Button onClick={onLaunch} disabled={launching} className="bg-brand-green hover:bg-brand-green-hover h-10 rounded-lg px-4 text-sm font-semibold text-white">
            <Rocket className="size-4" /> Launch Agent
          </Button>
        </div>
      </div>
    </div>
  );
}

/* Confetti, stars, and smoke for the launch celebration. Fixed values keep the
   burst stable (no Math.random, SSR-safe); colours are design tokens. */
const LAUNCH_CONFETTI = [
  { w: 7, h: 7, color: "var(--color-brand-green)", round: true, delay: 600, tx: -86, peakY: -58, fallY: 70, r: -180 },
  { w: 6, h: 10, color: "var(--color-accent-blue)", round: false, delay: 600, tx: -54, peakY: -70, fallY: 64, r: 150 },
  { w: 8, h: 8, color: "var(--color-brand-orange)", round: true, delay: 620, tx: -22, peakY: -64, fallY: 80, r: -120 },
  { w: 6, h: 9, color: "var(--color-gold)", round: false, delay: 600, tx: 8, peakY: -72, fallY: 60, r: 200 },
  { w: 7, h: 7, color: "var(--color-brand-blue)", round: true, delay: 640, tx: 40, peakY: -60, fallY: 74, r: 120 },
  { w: 6, h: 10, color: "var(--color-brand-green)", round: false, delay: 600, tx: 72, peakY: -52, fallY: 66, r: -160 },
  { w: 5, h: 5, color: "var(--color-accent-blue)", round: true, delay: 660, tx: 96, peakY: -40, fallY: 58, r: 90 },
  { w: 8, h: 8, color: "var(--color-brand-orange)", round: true, delay: 620, tx: -100, peakY: -44, fallY: 52, r: -90 },
  { w: 6, h: 9, color: "var(--color-gold)", round: false, delay: 640, tx: 24, peakY: -76, fallY: 70, r: 170 },
  { w: 5, h: 5, color: "var(--color-brand-blue)", round: true, delay: 600, tx: -40, peakY: -50, fallY: 84, r: -140 },
  { w: 6, h: 6, color: "var(--color-brand-green)", round: true, delay: 660, tx: 58, peakY: -66, fallY: 56, r: 110 },
  { w: 6, h: 9, color: "var(--color-brand-orange)", round: false, delay: 620, tx: -70, peakY: -72, fallY: 62, r: -200 },
];

const LAUNCH_STARS = [
  { x: "16%", y: "26%", r: 3, o: 0.7, dur: 1500, delay: 0 },
  { x: "30%", y: "16%", r: 2, o: 0.5, dur: 1700, delay: 200 },
  { x: "44%", y: "30%", r: 2, o: 0.6, dur: 1400, delay: 120 },
  { x: "62%", y: "18%", r: 3, o: 0.8, dur: 1600, delay: 320 },
  { x: "74%", y: "30%", r: 2, o: 0.5, dur: 1800, delay: 80 },
  { x: "84%", y: "22%", r: 2, o: 0.6, dur: 1500, delay: 240 },
  { x: "22%", y: "44%", r: 2, o: 0.45, dur: 1650, delay: 160 },
  { x: "54%", y: "10%", r: 2, o: 0.55, dur: 1550, delay: 360 },
  { x: "70%", y: "44%", r: 2, o: 0.4, dur: 1750, delay: 60 },
];

const LAUNCH_SMOKE = [
  { sx: -20, sy: 8 },
  { sx: 20, sy: 10 },
  { sx: -30, sy: 2 },
  { sx: 30, sy: 4 },
  { sx: 0, sy: 14 },
];

function LaunchSuccess({ name, edited }: { name: string; edited?: boolean }) {
  if (edited) return <EditedSuccess name={name} />;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" style={{ animation: "fade-in 200ms ease-out both" }}>
      <div className="launch-celebration modal-pop w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* night-sky launch theater */}
        <div className="from-rail relative h-44 overflow-hidden bg-gradient-to-b to-[#1d2f50]">
          {/* twinkling stars */}
          {LAUNCH_STARS.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left: s.x, top: s.y, width: s.r, height: s.r, opacity: s.o, animation: `twinkle ${s.dur}ms ease-in-out ${s.delay}ms infinite` }}
            />
          ))}

          {/* ignition smoke */}
          {LAUNCH_SMOKE.map((p, i) => (
            <span
              key={i}
              className="bg-brand-green/20 absolute top-[64%] left-1/2 size-7 rounded-full opacity-0 blur-[1px]"
              style={{ animation: "liftoff-smoke 900ms ease-out 600ms forwards", "--sx": `${p.sx}px`, "--sy": `${p.sy}px` } as React.CSSProperties}
            />
          ))}

          {/* shockwave ring */}
          <span
            className="border-brand-green/50 absolute top-[64%] left-1/2 size-16 rounded-full border-2 opacity-0"
            style={{ animation: "liftoff-shockwave 720ms ease-out 600ms forwards" }}
          />

          {/* confetti burst */}
          {LAUNCH_CONFETTI.map((c, i) => (
            <span
              key={i}
              className="pointer-events-none absolute top-[64%] left-1/2 opacity-0"
              style={{
                width: c.w,
                height: c.h,
                backgroundColor: c.color,
                borderRadius: c.round ? "9999px" : "1px",
                animation: `confetti-pop 1200ms cubic-bezier(0.15, 0.6, 0.4, 1) ${c.delay}ms forwards`,
                "--tx": `${c.tx}px`,
                "--peak-y": `${c.peakY}px`,
                "--fall-y": `${c.fallY}px`,
                "--r": `${c.r}deg`,
              } as React.CSSProperties}
            />
          ))}

          {/* launch pad badge, with the confirmed check that rises after liftoff */}
          <span className="absolute top-[64%] left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span
              className="bg-brand-green grid size-16 place-items-center rounded-full text-white shadow-lg shadow-black/20"
              style={{ animation: "tick-pop 460ms cubic-bezier(0.2, 0.8, 0.2, 1.4) 120ms both" }}
            >
              <span className="opacity-0" style={{ animation: "liftoff-check 380ms cubic-bezier(0.2, 0.8, 0.2, 1.4) 860ms both" }}>
                <Check className="size-7" strokeWidth={3} />
              </span>
            </span>
          </span>

          {/* the rocket that lifts off, nose pointing the way it travels (up) */}
          <span
            className="absolute top-[64%] left-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform"
            style={{ animation: "liftoff-rocket 1150ms 260ms both" }}
          >
            <span className="relative grid place-items-center">
              {/* exhaust trail, directly behind the nozzle, stretching with speed */}
              <span
                className="from-brand-orange via-gold absolute top-[78%] left-1/2 h-7 w-2 origin-top rounded-full bg-gradient-to-b to-transparent opacity-0 blur-[1.5px]"
                style={{ animation: "liftoff-exhaust 1150ms 260ms both" }}
              />
              {/* warm thrust glow */}
              <span
                className="bg-brand-orange/30 absolute size-10 rounded-full opacity-0 blur-md"
                style={{ animation: "liftoff-glow 1150ms 260ms both" }}
              />
              <Rocket className="size-9 -rotate-45 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]" />
            </span>
          </span>
        </div>

        {/* copy */}
        <div className="px-6 pt-3 pb-8 text-center">
          <h2 className="text-ink text-2xl font-bold" style={{ animation: "fade-in-up 420ms ease-out 900ms both" }}>
            {name} is live
          </h2>
          <p className="text-ink-muted mx-auto mt-2 max-w-[17rem] text-sm" style={{ animation: "fade-in-up 420ms ease-out 1000ms both" }}>
            Your agent is ready to take calls and answer chats. Opening its dashboard now.
          </p>
        </div>
      </div>
    </div>
  );
}

function EditedSuccess({ name }: { name: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" style={{ animation: "fade-in 200ms ease-out both" }}>
      <div className="modal-pop flex w-full max-w-sm flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-2xl">
        <span className="bg-brand-green grid size-16 place-items-center rounded-full text-white" style={{ animation: "tick-pop 500ms cubic-bezier(0.2, 0.8, 0.2, 1.4) both" }}>
          <Check className="size-8" strokeWidth={3} />
        </span>
        <h2 className="text-ink mt-5 text-2xl font-bold" style={{ animation: "fade-in-up 380ms ease-out 200ms both" }}>{name} updated</h2>
        <p className="text-ink-muted mt-2 text-sm" style={{ animation: "fade-in-up 380ms ease-out 300ms both" }}>
          Your changes are saved. Taking you back to its dashboard.
        </p>
      </div>
    </div>
  );
}
