"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Code2, Copy, Headphones, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentConfig } from "@/lib/agents";

const inputCls = "text-ink focus:border-accent-blue/50 h-10 w-full rounded-lg border border-black/15 px-3 text-sm outline-none";

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
 * Install the website chat widget. Two clear paths: do it yourself / hand it to
 * a developer, or have the TryThat.ai team install it via a quick form. Mock
 * only (no backend): the assistance request and email show success states.
 */
export function InstallWidget({
  agent,
  onClose,
  onStatus,
}: {
  agent: AgentConfig;
  onClose: () => void;
  onStatus: (s: "requested" | "live") => void;
}) {
  const snippet = `<script src="https://cdn.trythat.ai/widget.js" data-agent="${agent.id}"></script>`;
  const steps = `TryThat.ai website chat widget install steps

1. Open your website's HTML, or the "custom code" / "footer" section of your site builder.
2. Paste this line just before the closing </body> tag:

${snippet}

3. Save and publish. The chat bubble appears on your site.

Questions? Email support@trythat.ai.`;

  const [view, setView] = useState<"options" | "assist">("options");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState<"" | "code" | "steps">("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [devEmail, setDevEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const [name, setName] = useState("");
  const [site, setSite] = useState(agent.knowledge.website || "");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  function copy(what: "code" | "steps") {
    try {
      navigator.clipboard?.writeText(what === "code" ? snippet : steps);
      setCopied(what);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* ignore */
    }
  }

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
              {view === "assist" ? "Share a few details and our team installs it for you." : `Two ways to get ${agent.name} live on your website.`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted hover:bg-black/[0.05] grid size-8 shrink-0 place-items-center rounded-full">
            <X className="size-4" />
          </button>
        </div>

        {view === "options" ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {/* the code */}
            <div className="rounded-xl border border-black/[0.08] p-3.5">
              <p className="text-ink-muted text-xs font-medium">Your widget code</p>
              <pre className="text-ink mt-2 overflow-x-auto rounded-lg bg-black/[0.03] p-3 text-[11px] leading-relaxed">{snippet}</pre>
              <button
                type="button"
                onClick={() => copy("code")}
                className={cn("mt-2 inline-flex items-center gap-1.5 text-xs font-semibold", copied === "code" ? "text-brand-green" : "text-accent-blue")}
              >
                {copied === "code" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied === "code" ? "Copied" : "Copy code"}
              </button>
            </div>

            {/* two paths */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* self / developer */}
              <div className="flex flex-col rounded-xl border border-black/[0.08] p-4">
                <span className="bg-accent-blue/10 text-accent-blue grid size-9 place-items-center rounded-lg"><Code2 className="size-5" /></span>
                <p className="text-ink mt-2.5 font-semibold">You or your developer</p>
                <p className="text-ink-muted mt-1 mb-3 text-xs leading-snug">Paste the code just before the &lt;/body&gt; tag. It takes about a minute.</p>
                <div className="mt-auto space-y-2">
                  <button
                    type="button"
                    onClick={() => copy("steps")}
                    className="text-ink hover:bg-black/[0.03] flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-black/15 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
                  >
                    {copied === "steps" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied === "steps" ? "Copied steps" : "Copy install steps"}
                  </button>
                  {emailOpen ? (
                    emailSent ? (
                      <p className="text-brand-green flex items-center gap-1.5 px-1 text-xs font-medium"><Check className="size-3.5" /> Sent to {devEmail}</p>
                    ) : (
                      <div className="flex gap-1.5">
                        <input
                          value={devEmail}
                          onChange={(e) => setDevEmail(e.target.value)}
                          placeholder="developer@email.com"
                          className="text-ink focus:border-accent-blue/50 h-9 min-w-0 flex-1 rounded-lg border border-black/15 px-2.5 text-xs outline-none"
                        />
                        <button type="button" onClick={() => devEmail.trim() && setEmailSent(true)} className="bg-brand-blue hover:bg-brand-blue-hover h-9 shrink-0 rounded-lg px-3 text-xs font-semibold text-white">Send</button>
                      </div>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEmailOpen(true)}
                      className="text-ink hover:bg-black/[0.03] flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-black/15 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
                    >
                      <Mail className="size-3.5" /> Email to developer
                    </button>
                  )}
                </div>
              </div>

              {/* assisted */}
              <div className="border-accent-blue/30 bg-accent-blue/[0.03] flex flex-col rounded-xl border p-4">
                <span className="bg-accent-blue grid size-9 place-items-center rounded-lg text-white"><Headphones className="size-5" /></span>
                <p className="text-ink mt-2.5 font-semibold">Let our team install it</p>
                <p className="text-ink-muted mt-1 mb-3 text-xs leading-snug">Not technical? Share your site and the TryThat.ai team adds the widget for you, usually within one business day.</p>
                <Button onClick={() => setView("assist")} className="bg-brand-blue hover:bg-brand-blue-hover mt-auto h-9 w-full rounded-lg text-sm font-semibold text-white">
                  Request Assistance <ArrowRight className="size-4" />
                </Button>
              </div>
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

        {view === "options" && (
          <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] px-5 py-3">
            <span className="text-ink-muted text-xs">Already added it to your site?</span>
            <button type="button" onClick={() => { onStatus("live"); onClose(); }} className="text-brand-green inline-flex items-center gap-1.5 text-sm font-semibold outline-none">
              <Check className="size-4" /> Mark as live
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
