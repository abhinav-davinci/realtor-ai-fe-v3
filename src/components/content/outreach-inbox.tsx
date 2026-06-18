"use client";

/**
 * The Outreach inbox: a two-pane WhatsApp-style messenger. Left is the contact
 * list (searchable, with presence and unread counts); right is the live
 * conversation where the AI handles replies until a teammate takes over.
 *
 * All state is local (design mode). Sending appends a message and simulates the
 * sent -> delivered -> read receipt; a developer wires these to the real send
 * endpoint later (see src/lib/outreach.ts).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Paperclip,
  Search,
  SendHorizontal,
  Smile,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  lastMessage,
  type OutreachMessage,
  type OutreachThread,
} from "@/lib/outreach";
import { EASE_OUT, Monogram } from "./outreach-shared";

export function OutreachInbox({ threads }: { threads: OutreachThread[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(threads[0]?.id ?? null);
  // Per-thread message log + AI/human handling, seeded from the mock threads so
  // edits (send, take over) persist while the user moves between threads.
  const [messagesByThread, setMessagesByThread] = useState<Record<string, OutreachMessage[]>>(
    () => Object.fromEntries(threads.map((t) => [t.id, t.messages]))
  );
  const [aiByThread, setAiByThread] = useState<Record<string, boolean>>(
    () => Object.fromEntries(threads.map((t) => [t.id, t.aiHandling]))
  );
  const [draft, setDraft] = useState("");
  // Ids of messages added this session, so only those play the enter animation.
  const [animatedIds, setAnimatedIds] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.contact.toLowerCase().includes(q) ||
        (lastMessage(t)?.text.toLowerCase().includes(q) ?? false)
    );
  }, [threads, query]);

  const selected = threads.find((t) => t.id === selectedId) ?? null;
  const messages = selected ? messagesByThread[selected.id] ?? [] : [];
  const aiHandling = selected ? aiByThread[selected.id] ?? false : false;

  const scrollRef = useRef<HTMLDivElement>(null);
  // Stick to the latest message on thread switch and on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [selectedId, messages.length]);

  function send() {
    const text = draft.trim();
    if (!text || !selected) return;
    const id = `local-${selected.id}-${messages.length}-${text.length}`;
    setAnimatedIds((prev) => new Set(prev).add(id));
    const msg: OutreachMessage = {
      id,
      from: "agent",
      by: "human",
      text,
      time: nowTime(),
      status: "sent",
    };
    setMessagesByThread((prev) => ({ ...prev, [selected.id]: [...(prev[selected.id] ?? []), msg] }));
    setDraft("");
    // Walk the receipt forward so the ticks feel live.
    bumpStatus(selected.id, id, "delivered", 600);
    bumpStatus(selected.id, id, "read", 1500);
  }

  function bumpStatus(threadId: string, msgId: string, status: OutreachMessage["status"], delay: number) {
    setTimeout(() => {
      setMessagesByThread((prev) => ({
        ...prev,
        [threadId]: (prev[threadId] ?? []).map((m) => (m.id === msgId ? { ...m, status } : m)),
      }));
    }, delay);
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
      {/* ---------------------------- contact list ---------------------------- */}
      <div className="flex w-[320px] shrink-0 flex-col border-r border-black/[0.06]">
        <div className="shrink-0 p-3">
          <div className="relative">
            <Search className="text-ink-muted/70 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts..."
              aria-label="Search contacts"
              className="text-ink placeholder:text-ink-muted/60 focus:border-accent-blue/50 h-10 w-full rounded-lg border border-black/12 bg-cream/60 pr-9 pl-9 text-sm outline-none transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-ink-muted hover:bg-black/[0.05] hover:text-ink absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 ? (
            <p className="text-ink-muted px-3 py-10 text-center text-sm">No contacts match that search.</p>
          ) : (
            filtered.map((t) => {
              const preview = lastMessage(t);
              const active = t.id === selected?.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border-l-2 px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-accent-blue bg-accent-blue/[0.06]"
                      : "border-transparent hover:bg-black/[0.03]"
                  )}
                >
                  <Monogram initials={t.initials} online={t.online} className="mt-0.5 size-10" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-ink truncate text-sm font-semibold">{t.name}</span>
                      <span className="text-ink-muted shrink-0 text-[11px]">{t.lastTime}</span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="text-ink-muted truncate text-xs">{preview?.text}</span>
                      {t.unread > 0 && (
                        <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                          {t.unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* --------------------------- conversation ---------------------------- */}
      {selected ? (
        <div className="flex min-w-0 flex-1 flex-col">
          {/* header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-black/[0.06] px-5 py-3">
            <Monogram initials={selected.initials} className="size-9" />
            <div className="min-w-0">
              <p className="text-ink truncate text-sm font-semibold">{selected.name}</p>
              <p className={cn("flex items-center gap-1.5 text-xs", selected.online ? "text-brand-green" : "text-ink-muted")}>
                {selected.online && <span className="bg-brand-green size-1.5 rounded-full" />}
                {selected.online ? "Online" : "Offline"}
                <span className="text-ink-muted/50">·</span>
                <span className="text-ink-muted">{selected.contact}</span>
              </p>
            </div>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-cream/40 px-5 py-4">
            <div key={selected.id} style={{ animation: `fade-in 200ms ${EASE_OUT} both` }}>
              <DayDivider label="Today" />
              <div className="space-y-2.5">
                {messages.map((m) => (
                  <Bubble key={m.id} message={m} animate={animatedIds.has(m.id)} />
                ))}
              </div>
            </div>
          </div>

          {/* footer: AI banner + composer */}
          <div className="shrink-0 border-t border-black/[0.06] px-5 py-3">
            <HandlingBanner
              aiHandling={aiHandling}
              onToggle={() =>
                setAiByThread((prev) => ({ ...prev, [selected.id]: !aiHandling }))
              }
            />
            <Composer
              key={selected.id}
              value={draft}
              onChange={setDraft}
              onSend={send}
              disabled={aiHandling}
            />
          </div>
        </div>
      ) : (
        <div className="grid flex-1 place-items-center p-10 text-center">
          <p className="text-ink-muted text-sm">Select a conversation to start replying.</p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- pieces ---------------------------------- */

function DayDivider({ label }: { label: string }) {
  return (
    <div className="mb-3 flex items-center justify-center">
      <span className="text-ink-muted rounded-full bg-white px-3 py-1 text-[11px] font-medium shadow-sm ring-1 ring-black/[0.05]">
        {label}
      </span>
    </div>
  );
}

function Bubble({ message, animate }: { message: OutreachMessage; animate?: boolean }) {
  const isAgent = message.from === "agent";
  const style = animate ? { animation: `scale-in 220ms ${EASE_OUT} both` } : undefined;

  if (!isAgent) {
    return (
      <div className="flex flex-col items-start" style={style}>
        <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm ring-1 ring-black/[0.05]">
          {message.text}
        </div>
        <span className="text-ink-muted/70 mt-1 ml-1 text-[10px]">{message.time}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end" style={style}>
      {message.by === "ai" && (
        <span className="text-accent-blue mr-1 mb-1 inline-flex items-center gap-1 text-[10px] font-semibold">
          <Sparkles className="size-3" /> AI Agent
        </span>
      )}
      <div className="bg-brand-green/12 max-w-[78%] rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm text-ink">
        {message.text}
      </div>
      <span className="text-ink-muted/70 mt-1 mr-1 flex items-center gap-1 text-[10px]">
        {message.time}
        <ReadTicks status={message.status} />
      </span>
    </div>
  );
}

function ReadTicks({ status }: { status?: OutreachMessage["status"] }) {
  if (!status) return null;
  if (status === "sent") return <Check className="text-ink-muted/60 size-3" />;
  return (
    <CheckCheck className={cn("size-3", status === "read" ? "text-accent-blue" : "text-ink-muted/60")} />
  );
}

function HandlingBanner({ aiHandling, onToggle }: { aiHandling: boolean; onToggle: () => void }) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5 text-xs">
      {aiHandling ? (
        <>
          <Sparkles className="text-accent-blue size-3.5" />
          <span className="text-ink-muted">AI is handling this conversation</span>
          <span className="text-ink-muted/50">·</span>
          <button
            type="button"
            onClick={onToggle}
            className="text-accent-blue font-semibold underline-offset-2 hover:underline"
          >
            Take over manually
          </button>
        </>
      ) : (
        <>
          <span className="bg-brand-green size-1.5 rounded-full" />
          <span className="text-ink-muted">You are handling this conversation</span>
          <span className="text-ink-muted/50">·</span>
          <button
            type="button"
            onClick={onToggle}
            className="text-accent-blue font-semibold underline-offset-2 hover:underline"
          >
            Let AI resume
          </button>
        </>
      )}
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  const canSend = value.trim().length > 0;
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-12 flex-1 items-center gap-2 rounded-xl border bg-white px-3 transition-colors",
          disabled ? "border-black/[0.07] bg-black/[0.02]" : "border-black/12 focus-within:border-accent-blue/50"
        )}
      >
        <button
          type="button"
          aria-label="Attach a file"
          disabled={disabled}
          className="text-ink-muted hover:text-ink hover:bg-black/[0.05] grid size-7 shrink-0 place-items-center rounded-md transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Paperclip className="size-4.5" />
        </button>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={disabled}
          placeholder={disabled ? "Take over to reply..." : "Type a message..."}
          aria-label="Message"
          className="text-ink placeholder:text-ink-muted/60 min-w-0 flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          aria-label="Add emoji"
          disabled={disabled}
          className="text-ink-muted hover:text-ink hover:bg-black/[0.05] grid size-7 shrink-0 place-items-center rounded-md transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <Smile className="size-4.5" />
        </button>
      </div>
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !canSend}
        aria-label="Send message"
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-xl text-white transition-[background-color,transform] duration-150 ease-out",
          disabled || !canSend
            ? "bg-ink/30 cursor-not-allowed"
            : "bg-ink hover:bg-ink/90 active:scale-95"
        )}
      >
        <SendHorizontal className="size-5" />
      </button>
    </div>
  );
}

/** Current local time as "9:45 AM" (design mode only). */
function nowTime(): string {
  return new Date()
    .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
}
