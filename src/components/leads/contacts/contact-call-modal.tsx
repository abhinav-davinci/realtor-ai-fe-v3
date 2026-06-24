"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  FileSpreadsheet,
  Gauge,
  ListChecks,
  Loader2,
  PhoneCall,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listAgents, templateById, voiceById, type AgentConfig } from "@/lib/agents";
import { AgentOrb } from "@/components/ai-team/agent-ui";
import { TIER_ORDER } from "@/lib/lead-intelligence";
import {
  addContactsToList,
  applyCallOutcomes,
  buildCallsFromContacts,
  contactIdFor,
  contactTierMeta,
  initialsOf,
  listContactLists,
  listContacts,
  normPhone,
  saveContactList,
  upsertMany,
  type Contact,
  type ContactTier,
} from "@/lib/contacts";
import { useAutoCall } from "../auto-call-context";
import { INPUT, TagEditor } from "./ui";

const DAY = 86_400_000;
type Mode = "list" | "tier" | "upload";
type ExtractState = "idle" | "extracting" | "ready" | "error";
type Draft = Omit<Contact, "id" | "initials" | "addedAt">;

const TIER_CHOICES: ContactTier[] = [...TIER_ORDER, "new"];

function formatPhone(raw: string): string {
  const d = normPhone(raw);
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : raw.trim();
}
function todayLabel(now: number): string {
  return new Date(now).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function defaultScheduleValue(): string {
  const d = new Date(Date.now() + DAY);
  d.setHours(10, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function ContactCallModal({
  onClose,
  presetIds,
  onStarted,
}: {
  onClose: () => void;
  /** When set, call exactly these contacts (the table selection) — no audience picker. */
  presetIds?: string[];
  /** Fired when a run actually starts (so the hub can clear the selection). */
  onStarted?: () => void;
}) {
  const router = useRouter();
  const run = useAutoCall();
  const agents = useMemo(() => listAgents().filter((a) => a.channels.includes("voice")), []);
  const allContacts = useMemo(() => listContacts(), []);
  const lists = useMemo(() => listContactLists(), []);

  const preset = !!presetIds;
  const presetContacts = useMemo(
    () => (presetIds ? allContacts.filter((c) => presetIds.includes(c.id)) : []),
    [presetIds, allContacts]
  );

  const [agentId, setAgentId] = useState<string | null>(agents[0]?.id ?? null);
  const [mode, setMode] = useState<Mode>(lists.length ? "list" : "tier");
  const [listId, setListId] = useState<string>(lists[0]?.id ?? "all");
  const [tierSel, setTierSel] = useState<Set<ContactTier>>(() => new Set<ContactTier>(["very-hot", "hot"]));
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [extract, setExtract] = useState<ExtractState>("idle");
  const [extractError, setExtractError] = useState("");
  const [sheetHasTags, setSheetHasTags] = useState(false);
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [saveToBook, setSaveToBook] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [skipDays, setSkipDays] = useState(0);
  const [maxCount, setMaxCount] = useState(25);
  const [advanced, setAdvanced] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(defaultScheduleValue);
  const [scheduled, setScheduled] = useState(false);
  // A run-stable "now" so recency filters and the default name don't drift on re-render.
  const [now] = useState(() => Date.now());

  const agent = agents.find((a) => a.id === agentId) ?? null;

  // Resolve the audience (before the count cap) for the live match count.
  const audience = useMemo<Contact[]>(() => {
    if (preset) return presetContacts;
    let base: Contact[];
    if (mode === "list") {
      base = listId === "all" ? allContacts : (lists.find((l) => l.id === listId)?.contactIds ?? [])
        .map((id) => allContacts.find((c) => c.id === id))
        .filter((c): c is Contact => !!c);
    } else if (mode === "tier") {
      base = allContacts.filter((c) => tierSel.has(c.tier));
    } else {
      base = []; // upload mode resolves at start
    }
    if (skipDays > 0) base = base.filter((c) => !(c.lastContacted && now - c.lastContacted < skipDays * DAY));
    return base;
  }, [preset, presetContacts, mode, listId, tierSel, allContacts, lists, skipDays, now]);

  const matchCount = preset ? presetContacts.length : mode === "upload" ? drafts.length : audience.length;
  const willCall = preset ? matchCount : Math.min(maxCount, matchCount);
  const noAgent = agents.length === 0;
  const canStart =
    !!agent &&
    (preset ? presetContacts.length > 0 : mode === "upload" ? drafts.length > 0 && (!saveToBook || uploadName.trim().length > 0) : willCall > 0) &&
    (!schedule || scheduleAt.trim().length > 0);

  const audienceLabel = preset
    ? `${presetContacts.length} selected contact${presetContacts.length === 1 ? "" : "s"}`
    : mode === "list"
      ? listId === "all" ? "all contacts" : lists.find((l) => l.id === listId)?.name ?? "list"
      : mode === "tier"
        ? (tierSel.size ? `${[...tierSel].map((t) => contactTierMeta(t).name).join(", ")} contacts` : "no tiers")
        : (saveToBook ? uploadName.trim() : "") || "the uploaded contacts";
  const defaultName = `${audienceLabel} · ${todayLabel(now)}`;

  async function onPickFile(f: File | undefined) {
    if (!f) return;
    setUploadFile(f.name);
    setExtract("extracting");
    setDrafts([]);
    setExtractError("");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "", blankrows: false });
      const headers = (aoa[0] as unknown[] | undefined)?.map((h) => String(h).toLowerCase().trim()) ?? [];
      const phoneCol = headers.findIndex((h) => /phone|mobile|number|contact/.test(h));
      const nameCol = headers.findIndex((h) => /name/.test(h));
      const tagsCol = headers.findIndex((h) => /tag/.test(h));
      if (phoneCol < 0) {
        setExtract("error");
        setExtractError("We could not find a phone column. Check the sheet and try again.");
        return;
      }
      const byPhone = new Map<string, Draft>();
      for (const r of aoa.slice(1)) {
        const cell = String((r as unknown[])[phoneCol] ?? "");
        const norm = normPhone(cell);
        if (norm.length < 10 || byPhone.has(norm)) continue;
        const nm = nameCol >= 0 ? String((r as unknown[])[nameCol] ?? "").trim() : "";
        const tags = (tagsCol >= 0 ? String((r as unknown[])[tagsCol] ?? "") : "").split(/[;,]/).map((t) => t.trim()).filter(Boolean);
        byPhone.set(norm, { name: nm || formatPhone(cell), phone: formatPhone(cell), tags, tier: "new", source: "Upload", lastContacted: null });
      }
      const rows = [...byPhone.values()];
      if (rows.length === 0) {
        setExtract("error");
        setExtractError("No valid phone numbers found in this file.");
        return;
      }
      // A short, deliberate beat so the extraction reads as "AI is working".
      window.setTimeout(() => {
        setDrafts(rows);
        setSheetHasTags(rows.some((d) => d.tags.length > 0));
        if (!uploadName.trim()) setUploadName(f.name.replace(/\.(xlsx|xls|csv)$/i, ""));
        setExtract("ready");
      }, 850);
    } catch {
      setExtract("error");
      setExtractError("We could not read that file. Please try again.");
    }
  }

  function resetUpload() {
    setDrafts([]);
    setUploadFile(null);
    setExtract("idle");
    setExtractError("");
    setSheetHasTags(false);
  }

  function submit() {
    if (!canStart || !agent) return;
    if (schedule) {
      setScheduled(true);
      return;
    }
    let pool: Contact[];
    if (preset) {
      pool = presetContacts;
    } else if (mode === "upload") {
      // Combine sheet tags with any custom tags the user added for this upload.
      const tagged: Draft[] = drafts.map((d) => ({ ...d, tags: Array.from(new Set([...d.tags, ...uploadTags])) }));
      const ids = tagged.map((d) => contactIdFor(d.phone));
      if (saveToBook) {
        upsertMany(tagged);
        const newListId = `list-${Date.now()}`;
        saveContactList({ id: newListId, name: uploadName.trim() || "Uploaded list", color: "accent-blue", contactIds: ids, createdAt: Date.now() });
        addContactsToList(newListId, ids);
        const all = listContacts();
        pool = all.filter((c) => ids.includes(c.id));
      } else {
        // Call them this once without persisting to the master book.
        pool = tagged.map((d) => ({
          ...d,
          id: contactIdFor(d.phone),
          initials: initialsOf(d.name),
          addedAt: now,
        }));
      }
    } else {
      pool = audience;
    }
    const top = preset ? pool : pool.slice(0, maxCount);
    const calls = buildCallsFromContacts(top);
    const t = templateById(agent.templateId);
    run.start(calls, { name: agent.name, gradient: t.gradient, icon: t.icon }, {
      sessionName: name.trim() || defaultName,
      kind: "contacts",
      sourceLabel: audienceLabel,
      sourceKind: preset ? "selected" : mode,
      onComplete: (cs) => applyCallOutcomes(cs),
    });
    onStarted?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Start AI calling"
        className="modal-pop flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            onPickFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {scheduled ? (
          /* ---------------------------- scheduled --------------------------- */
          <div className="p-6 text-center">
            <span className="bg-accent-blue/10 text-accent-blue mx-auto grid size-16 place-items-center rounded-2xl motion-safe:animate-[tick-pop_460ms_cubic-bezier(0.23,1,0.32,1)_both]">
              <Calendar className="size-8" />
            </span>
            <h2 className="text-ink mt-4 text-lg font-bold">Session scheduled</h2>
            <p className="text-ink-muted mx-auto mt-1.5 max-w-sm text-sm">
              {agent?.name} will call {willCall} contact{willCall === 1 ? "" : "s"} from{" "}
              <span className="text-ink font-medium">{audienceLabel}</span> at{" "}
              {new Date(scheduleAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })}.
            </p>
            <Button onClick={onClose} className="bg-brand-blue hover:bg-brand-blue-hover mx-auto mt-5 h-11 w-full max-w-[220px] rounded-lg text-sm font-semibold text-white">
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <span className="bg-accent-blue/10 text-accent-blue grid size-9 place-items-center rounded-lg">
                  <PhoneCall className="size-5" />
                </span>
                <div>
                  <h2 className="text-ink text-lg font-bold">Start AI calling</h2>
                  <p className="text-ink-muted text-xs">Your AI agent calls a set of contacts and updates their status.</p>
                </div>
              </div>
              <Button variant="ghost" onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink -mt-1 -mr-1 size-8 rounded-lg p-0">
                <ChevronDown className="hidden" />
                <span aria-hidden className="text-xl leading-none">×</span>
              </Button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              {/* agent */}
              <Section label="Which agent makes the calls?">
                {noAgent ? (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-black/15 bg-black/[0.015] p-3.5">
                    <span className="bg-accent-blue/10 text-accent-blue grid size-9 shrink-0 place-items-center rounded-lg">
                      <Sparkles className="size-4" />
                    </span>
                    <p className="text-ink-muted min-w-0 flex-1 text-xs">No voice agent deployed yet. Build one to start calling.</p>
                    <button type="button" onClick={() => { onClose(); router.push("/ai-team"); }} className="text-accent-blue shrink-0 text-xs font-semibold whitespace-nowrap hover:underline">
                      Build agent
                    </button>
                  </div>
                ) : (
                  <AgentSelect agents={agents} value={agent!} onChange={(a) => setAgentId(a.id)} />
                )}
              </Section>

              {/* session name */}
              <Section label="Session name">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={defaultName} className={INPUT} />
              </Section>

              {/* who to call */}
              <Section label="Who to call" hint={preset ? `${matchCount} selected` : `${matchCount} match${matchCount === 1 ? "" : "es"}`}>
                {preset ? (
                  <div className="border-accent-blue/20 bg-accent-blue/[0.05] flex items-center gap-3 rounded-xl border p-3.5">
                    <span className="bg-accent-blue/12 text-accent-blue grid size-9 shrink-0 place-items-center rounded-lg">
                      <Users className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-ink text-sm font-bold">{presetContacts.length} selected contact{presetContacts.length === 1 ? "" : "s"}</p>
                      <p className="text-ink-muted text-xs">Calling only the contacts you picked from the table.</p>
                    </div>
                  </div>
                ) : (
                <>
                <div className="flex flex-wrap gap-2 rounded-xl bg-black/[0.03] p-1">
                  <ModeTab active={mode === "list"} icon={ListChecks} label="A list" onClick={() => setMode("list")} />
                  <ModeTab active={mode === "tier"} icon={Gauge} label="By intent" onClick={() => setMode("tier")} />
                  <ModeTab active={mode === "upload"} icon={Upload} label="Upload" onClick={() => setMode("upload")} />
                </div>

                {mode === "list" && (
                  <NativeSelect
                    value={listId}
                    onChange={setListId}
                    options={[{ value: "all", label: `All contacts (${allContacts.length})` }, ...lists.map((l) => ({ value: l.id, label: `${l.name} (${l.contactIds.length})` }))]}
                  />
                )}

                {mode === "tier" && (
                  <div className="flex flex-wrap gap-1.5">
                    {TIER_CHOICES.map((t) => {
                      const on = tierSel.has(t);
                      const m = contactTierMeta(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() =>
                            setTierSel((prev) => {
                              const next = new Set(prev);
                              if (next.has(t)) next.delete(t);
                              else next.add(t);
                              return next;
                            })
                          }
                          aria-pressed={on}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                            on ? "border-transparent bg-ink text-white" : "text-ink-muted border-black/12 hover:border-black/25"
                          )}
                        >
                          <span className={cn("size-2 rounded-full", m.dot)} />
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {mode === "upload" && (
                  <div className="space-y-3">
                    {extract === "idle" && (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="hover:border-accent-blue/50 hover:bg-accent-blue/[0.03] flex w-full items-center gap-3 rounded-xl border border-dashed border-black/15 px-3.5 py-3 text-left transition-colors"
                      >
                        <span className="bg-accent-blue/10 text-accent-blue grid size-9 shrink-0 place-items-center rounded-lg">
                          <Upload className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-ink block text-sm font-medium">Attach an Excel or CSV</span>
                          <span className="text-ink-muted block text-xs">.xlsx, .xls, .csv with a phone column</span>
                        </span>
                      </button>
                    )}

                    {extract === "extracting" && (
                      <div className="grid place-items-center rounded-xl border border-black/[0.08] bg-black/[0.015] py-7 text-center">
                        <span className="bg-accent-blue/10 text-accent-blue grid size-10 place-items-center rounded-full">
                          <Loader2 className="size-5 animate-spin" />
                        </span>
                        <p className="text-ink mt-2.5 text-sm font-semibold">Reading your file…</p>
                        <p className="text-ink-muted mt-0.5 max-w-[80%] truncate text-xs">{uploadFile}</p>
                      </div>
                    )}

                    {extract === "error" && (
                      <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 text-center" style={{ animation: "scale-in 180ms cubic-bezier(0.23,1,0.32,1) both" }}>
                        <span className="mx-auto grid size-10 place-items-center rounded-full bg-red-100 text-red-600">
                          <AlertCircle className="size-5" />
                        </span>
                        <p className="text-ink mt-2.5 text-sm font-semibold">We could not read that file</p>
                        <p className="text-ink-muted mx-auto mt-1 max-w-xs text-xs">{extractError}</p>
                        <button type="button" onClick={resetUpload} className="text-accent-blue mt-2.5 text-xs font-semibold hover:underline">
                          Choose another file
                        </button>
                      </div>
                    )}

                    {extract === "ready" && (
                      <>
                        <div
                          className="border-brand-green/25 bg-brand-green/[0.06] flex items-center gap-3 rounded-xl border p-3.5"
                          style={{ animation: "fade-in-up 220ms cubic-bezier(0.23,1,0.32,1) both" }}
                        >
                          <span className="bg-brand-green/15 text-brand-green grid size-10 shrink-0 place-items-center rounded-full motion-safe:animate-[success-pop_460ms_cubic-bezier(0.23,1,0.32,1)_both]">
                            <FileSpreadsheet className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-ink text-sm font-bold">
                              <span className="tabular-nums">{drafts.length}</span> contact{drafts.length === 1 ? "" : "s"} extracted
                            </p>
                            <p className="text-ink-muted truncate text-xs">
                              {uploadFile}
                              {sheetHasTags && " · tags detected"}
                            </p>
                          </div>
                          <button type="button" onClick={resetUpload} className="text-ink-muted hover:text-ink shrink-0 text-xs font-semibold hover:underline">
                            Replace
                          </button>
                        </div>

                        {/* tags for this upload */}
                        <div>
                          <p className="text-ink mb-1.5 text-sm font-medium">Tags for these contacts</p>
                          <TagEditor value={uploadTags} onChange={setUploadTags} />
                          {sheetHasTags && <p className="text-ink-muted mt-1.5 text-xs">Tags already in your sheet are kept too.</p>}
                        </div>

                        {/* save to book */}
                        <Switch
                          checked={saveToBook}
                          onChange={setSaveToBook}
                          title="Save these to my contacts book"
                          subtitle={saveToBook ? "Added to your book and updated after the call." : "Called this once, not saved to your book."}
                        />
                        {saveToBook && (
                          <input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Name this list, e.g. Diwali outreach" className={INPUT} />
                        )}
                      </>
                    )}
                  </div>
                )}
                </>
                )}
              </Section>

              {/* advanced */}
              <section>
                <button type="button" onClick={() => setAdvanced((a) => !a)} className="text-ink inline-flex items-center gap-1.5 text-sm font-semibold">
                  More options
                  <ChevronDown className={cn("text-ink-muted size-4 transition-transform", advanced && "rotate-180")} />
                </button>
                {advanced && (
                  <div className="mt-3 space-y-4 rounded-xl border border-black/[0.08] bg-white p-4" style={{ animation: "fade-in-up 200ms cubic-bezier(0.23,1,0.32,1) both" }}>
                    {!preset && (
                      <Labeled label="How many to call">
                        <input type="number" min={1} value={maxCount} onChange={(e) => setMaxCount(Math.max(1, Number(e.target.value) || 1))} className={cn(INPUT, "w-28")} />
                      </Labeled>
                    )}
                    {!preset && (
                      <Labeled label="Skip contacts reached recently">
                        <NativeSelect
                          value={String(skipDays)}
                          onChange={(v) => setSkipDays(Number(v))}
                          options={[
                            { value: "0", label: "Don't skip" },
                            { value: "3", label: "Skip if called in last 3 days" },
                            { value: "7", label: "Skip if called in last 7 days" },
                            { value: "30", label: "Skip if called in last 30 days" },
                          ]}
                        />
                      </Labeled>
                    )}
                    <Labeled label="When">
                      <div className="flex flex-col gap-2.5">
                        <div className="flex gap-2">
                          <WhenTab active={!schedule} label="Run now" onClick={() => setSchedule(false)} />
                          <WhenTab active={schedule} label="Schedule" onClick={() => setSchedule(true)} />
                        </div>
                        {schedule && (
                          <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={INPUT} />
                        )}
                      </div>
                    </Labeled>
                  </div>
                )}
              </section>

              {/* summary */}
              <div className="bg-accent-blue/[0.06] border-accent-blue/15 rounded-xl border p-3.5 text-sm leading-relaxed">
                {canStart ? (
                  preset ? (
                    <p className="text-ink-muted">
                      <span className="text-ink font-semibold">{agent?.name}</span> will {schedule ? "be scheduled to call" : "call"} the{" "}
                      <span className="text-ink font-semibold tabular-nums">{willCall}</span> selected contact{willCall === 1 ? "" : "s"}. Outcomes update each contact and sync to their lists.
                    </p>
                  ) : (
                    <p className="text-ink-muted">
                      <span className="text-ink font-semibold">{agent?.name}</span> will {schedule ? "be scheduled to call" : "call"}{" "}
                      <span className="text-ink font-semibold tabular-nums">{willCall}</span> contact{willCall === 1 ? "" : "s"} from{" "}
                      <span className="text-ink font-semibold">{audienceLabel}</span>. Outcomes update each contact and sync to their lists.
                    </p>
                  )
                ) : (
                  <p className="text-ink-muted">
                    {noAgent ? "Build a voice agent to begin." : mode === "upload" && !drafts.length ? "Upload a contact list to begin." : matchCount === 0 ? "No contacts match this selection." : "Pick who to call to begin."}
                  </p>
                )}
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] px-5 py-4 sm:px-6">
              <Button variant="outline" onClick={onClose} className="text-ink h-10 rounded-lg border-black/15 px-4 text-sm font-semibold">
                Cancel
              </Button>
              <Button onClick={submit} disabled={!canStart} className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-4 text-sm font-semibold text-white">
                {schedule ? <Calendar className="size-4" /> : <PhoneCall className="size-4" />}
                {schedule ? "Schedule session" : "Start calling"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- sub-pieces ------------------------------- */

function Section({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-ink text-sm font-medium">{label}</p>
        {hint && <span className="text-ink-muted text-xs tabular-nums">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-ink mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Switch({
  checked,
  onChange,
  title,
  subtitle,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-xl border border-black/[0.1] bg-white p-3 text-left transition-colors hover:border-black/20"
    >
      <span className="min-w-0 flex-1">
        <span className="text-ink block text-sm font-medium">{title}</span>
        <span className="text-ink-muted block text-xs">{subtitle}</span>
      </span>
      <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", checked ? "bg-brand-green" : "bg-black/15")}>
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform", checked && "translate-x-4")} />
      </span>
    </button>
  );
}

function ModeTab({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Upload; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors active:scale-[0.98]",
        active ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function WhenTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 flex-1 rounded-lg border text-sm font-medium transition-colors",
        active ? "border-accent-blue bg-accent-blue/[0.06] text-ink" : "text-ink-muted border-black/12 hover:border-black/25"
      )}
    >
      {label}
    </button>
  );
}

function NativeSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-ink focus:border-accent-blue/60 h-11 w-full appearance-none rounded-lg border border-black/15 bg-white pr-9 pl-3.5 text-sm outline-none transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="text-ink-muted/60 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
    </div>
  );
}

function AgentSelect({ agents, value, onChange }: { agents: AgentConfig[]; value: AgentConfig; onChange: (a: AgentConfig) => void }) {
  const [open, setOpen] = useState(false);
  const single = agents.length === 1;
  const row = (a: AgentConfig) => {
    const t = templateById(a.templateId);
    return (
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <AgentOrb colors={t.gradient} size={34} icon={t.icon} />
        <span className="min-w-0 flex-1">
          <span className="text-ink block truncate text-sm font-semibold">{a.name}</span>
          <span className="text-ink-muted block truncate text-xs">{a.role} · {voiceById(a.voiceId).name} voice</span>
        </span>
      </span>
    );
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !single && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn("flex w-full items-center gap-3 rounded-xl border border-black/[0.12] bg-white p-2.5 text-left", !single && "hover:border-black/25")}
      >
        {row(value)}
        {!single && <ChevronDown className={cn("text-ink-muted/70 size-4 shrink-0 transition-transform", open && "rotate-180")} />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div role="listbox" className="absolute top-full right-0 left-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]" style={{ animation: "scale-in 160ms cubic-bezier(0.23,1,0.32,1) both", transformOrigin: "top" }}>
            {agents.map((a) => (
              <button
                key={a.id}
                type="button"
                role="option"
                aria-selected={a.id === value.id}
                onClick={() => { onChange(a); setOpen(false); }}
                className="hover:bg-accent-blue/[0.06] flex w-full items-center gap-3 rounded-lg p-2 text-left"
              >
                {row(a)}
                {a.id === value.id && <Check className="text-accent-blue size-4 shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
