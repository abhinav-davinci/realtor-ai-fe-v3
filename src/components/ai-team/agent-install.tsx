"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, Clock, Code, Copy, Headphones, TrendingUp, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentConfig } from "@/lib/agents";

const inputCls = "text-ink focus:border-accent-blue/50 h-10 w-full rounded-lg border border-black/15 px-3 text-sm outline-none";

/** Why a realtor should add the chat widget to their site. */
const BENEFITS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Clock, title: "Always on, day and night", desc: "Replies the moment a visitor lands, so no enquiry waits or slips away." },
  { icon: ClipboardCheck, title: "Qualifies leads for you", desc: "Captures budget, location, and timeline, then books a site visit automatically." },
  { icon: TrendingUp, title: "More booked visits", desc: "Turns website chats into named, qualified leads in your pipeline." },
];

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-ink mb-1.5 flex items-center gap-2 text-sm font-medium">
        {label}
        {optional && <span className="text-ink-muted text-xs font-normal">Optional</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * Install the website chat widget. The TryThat.ai team installs it for the
 * client, so the modal sells the value of the widget and collects a request
 * for assisted setup. Mock only (no backend): the request shows a success state.
 */
export function InstallWidget({
  agent,
  onClose,
  onStatus,
}: {
  agent: AgentConfig;
  onClose: () => void;
  onStatus: (s: "pending" | "requested" | "live") => void;
}) {
  const [view, setView] = useState<"options" | "assist">("options");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const snippet = `<script src="https://cdn.trythat.ai/widget.js" data-agent="${agent.id}"></script>`;
  function copyCode() {
    try {
      navigator.clipboard?.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const [name, setName] = useState("");
  const [site, setSite] = useState(agent.knowledge.website || "");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  const canSubmit = name.trim() && site.trim() && contact.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-pop flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
          <div>
            {view === "assist" && (
              <button
                type="button"
                onClick={() => { setView("options"); setDone(false); }}
                className="text-accent-blue mb-1 inline-flex items-center gap-1 text-xs font-semibold"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
            )}
            <p className="text-ink text-lg font-bold">{view === "assist" ? "Request install help" : "Add the chat widget to your site"}</p>
            <p className="text-ink-muted text-sm">
              {view === "assist"
                ? "Share a few details and our team installs it for you."
                : `Turn website visitors into qualified leads with ${agent.name}, 24x7.`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted hover:bg-black/[0.05] grid size-8 shrink-0 place-items-center rounded-full">
            <X className="size-4" />
          </button>
        </div>

        {view === "options" ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {/* why add the widget */}
            <div className="rounded-xl border border-black/[0.08] p-4">
              <p className="text-ink font-semibold">Why add {agent.name} to your website</p>
              <ul className="mt-3 space-y-3">
                {BENEFITS.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="bg-brand-green/10 text-brand-green grid size-8 shrink-0 place-items-center rounded-lg">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-ink text-sm font-semibold">{title}</p>
                      <p className="text-ink-muted text-xs leading-snug">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* the widget code, shown for context — our team installs it for you */}
            <div className="rounded-xl border border-black/[0.08] p-3.5">
              <p className="text-ink-muted flex items-center gap-1.5 text-xs font-medium">
                <Code className="text-accent-blue size-4" /> Your widget code
              </p>
              <p className="text-ink-muted/80 mt-1 text-[11px] leading-snug">
                This is what our team adds to your site. Share it with whoever manages your website if you like.
              </p>
              <pre className="text-ink mt-2 overflow-x-auto rounded-lg bg-black/[0.03] p-3 text-[11px] leading-relaxed">{snippet}</pre>
              <button
                type="button"
                onClick={copyCode}
                className={cn("mt-2 inline-flex items-center gap-1.5 text-xs font-semibold", copied ? "text-brand-green" : "text-accent-blue")}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy code"}
              </button>
            </div>

            {/* assisted install (the only path), the closing call to action */}
            <div className="border-accent-blue/30 bg-accent-blue/[0.04] rounded-xl border p-5">
              <div className="flex items-start gap-3">
                <span className="bg-accent-blue grid size-10 shrink-0 place-items-center rounded-lg text-white">
                  <Headphones className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-ink font-semibold">We&apos;ll set it up for you</p>
                  <p className="text-ink-muted mt-1 text-sm leading-snug">
                    Share your website and our team adds {agent.name} to it for you, usually within one business day. Nothing technical on your end.
                  </p>
                </div>
              </div>
              <Button onClick={() => setView("assist")} className="bg-brand-blue hover:bg-brand-blue-hover mt-4 h-10 w-full rounded-lg text-sm font-semibold text-white">
                Request Installation <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {done ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="bg-brand-green grid size-14 place-items-center rounded-full text-white" style={{ animation: "tick-pop 500ms cubic-bezier(0.2,0.8,0.2,1.4) both" }}>
                  <Check className="size-7" strokeWidth={3} />
                </span>
                <p className="text-ink mt-4 text-lg font-bold">Request sent</p>
                <p className="text-ink-muted mt-1 max-w-xs text-sm">Our team will add {agent.name} to your site and reach out within one business day.</p>
                <Button onClick={onClose} className="bg-brand-blue hover:bg-brand-blue-hover mt-5 h-10 rounded-lg px-5 text-sm font-semibold text-white">Done</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Field label="Your name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputCls} /></Field>
                <Field label="Website to install on"><input value={site} onChange={(e) => setSite(e.target.value)} placeholder="yourwebsite.com" className={inputCls} /></Field>
                <Field label="Email or phone to reach you"><input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@email.com or +91 98xxx xxxxx" className={inputCls} /></Field>
                <Field label="Anything we should know?" optional>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Platform (WordPress, Wix, Shopify), access notes, preferred time" className={cn(inputCls, "h-auto resize-none py-2")} />
                </Field>
                <Button
                  onClick={() => { onStatus("requested"); setDone(true); }}
                  disabled={!canSubmit}
                  className="bg-brand-blue hover:bg-brand-blue-hover mt-1 h-10 w-full rounded-lg text-sm font-semibold text-white"
                >
                  Send Request
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
