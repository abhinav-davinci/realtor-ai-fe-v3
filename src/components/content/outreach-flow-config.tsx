"use client";

/**
 * Right-side config drawer for the selected flow node. One `switch (kind)` body
 * with proper forms (no cramped inline editing). Edits flow up via onConfig /
 * onBranches; Delete is confirmed at the composer level.
 */
import { useRef, useState } from "react";
import { Braces, ChevronDown, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TEMPLATES,
  type FlowBranch,
  type FlowNode,
  type FlowNodeConfig,
} from "@/lib/outreach";
import { EASE_OUT, VARIABLES } from "./outreach-shared";
import { FLOW_NODE_META } from "./outreach-flow-node";

const INPUT =
  "text-ink placeholder:text-ink-muted/55 focus:border-accent-blue/50 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none transition-colors";

function bid(): string {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function FlowConfig({
  node,
  onConfig,
  onBranches,
  onClose,
  onDelete,
}: {
  node: FlowNode;
  onConfig: (patch: Partial<FlowNodeConfig>) => void;
  onBranches: (branches: FlowBranch[]) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const meta = FLOW_NODE_META[node.kind];
  const Icon = meta.Icon;

  return (
    <aside
      className="flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-white"
      style={{ animation: `slide-in-right 240ms ${EASE_OUT} both` }}
    >
      <div className="flex shrink-0 items-center gap-2.5 border-b border-black/[0.06] px-4 py-3">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", meta.chip)}>
          <Icon className="size-4.5" />
        </span>
        <p className="text-ink flex-1 text-sm font-semibold">{meta.label}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-muted hover:bg-black/[0.05] hover:text-ink grid size-8 place-items-center rounded-lg transition-colors"
        >
          <X className="size-4.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {node.kind === "start" && (
          <p className="text-ink-muted text-sm leading-relaxed">
            This flow runs automatically when a contact sends their first message on WhatsApp. Add the first step below the
            Start card.
          </p>
        )}

        {node.kind === "message" && <MessageConfig node={node} onConfig={onConfig} />}
        {node.kind === "question" && <QuestionConfig node={node} onConfig={onConfig} onBranches={onBranches} />}
        {node.kind === "condition" && <ConditionConfig node={node} onConfig={onConfig} />}
        {node.kind === "delay" && <DelayConfig node={node} onConfig={onConfig} />}

        {node.kind === "end" && (
          <p className="text-ink-muted text-sm leading-relaxed">
            The conversation ends here, or hands off to your AI agent to take over live.
          </p>
        )}
      </div>

      {node.kind !== "start" && (
        <div className="shrink-0 border-t border-black/[0.06] p-4">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/60 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 active:scale-[0.99]"
          >
            <Trash2 className="size-4" />
            Delete step
          </button>
        </div>
      )}
    </aside>
  );
}

/* -------------------------------- message --------------------------------- */

function MessageConfig({ node, onConfig }: { node: FlowNode; onConfig: (p: Partial<FlowNodeConfig>) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const approved = TEMPLATES.filter((t) => t.status === "Approved");
  const replies = node.config.quickReplies ?? [];

  function insertToken(token: string) {
    const el = ref.current;
    const text = node.config.text ?? "";
    if (!el) {
      onConfig({ text: text + token });
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    onConfig({ text: text.slice(0, start) + token + text.slice(end) });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <>
      <Field label="Message">
        <textarea
          ref={ref}
          value={node.config.text ?? ""}
          onChange={(e) => onConfig({ text: e.target.value })}
          rows={5}
          placeholder="Hi {{first_name}}, ..."
          className={cn(INPUT, "h-auto resize-y py-2.5 leading-relaxed")}
        />
        <div className="mt-2">
          <VariableMenu onInsert={insertToken} />
        </div>
      </Field>

      <Field label="Use an approved template" hint="optional">
        <Picker
          ariaLabel="Template"
          value={node.config.templateName ?? ""}
          options={[{ value: "", label: "No template" }, ...approved.map((t) => ({ value: t.name, label: t.title }))]}
          onChange={(name) => {
            const t = approved.find((x) => x.name === name);
            onConfig(t ? { templateName: t.name, text: t.body, media: t.hasMedia ? "image" : null } : { templateName: null });
          }}
        />
      </Field>

      <Field label="Quick reply buttons" hint={`${replies.length}/3`}>
        <QuickReplies value={replies} onChange={(v) => onConfig({ quickReplies: v })} />
      </Field>
    </>
  );
}

function QuickReplies({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  return (
    <div className="space-y-2">
      {value.map((r, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-black/12 bg-black/[0.02] px-3 py-1.5">
          <span className="text-ink flex-1 truncate text-sm">{r}</span>
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            aria-label={`Remove ${r}`}
            className="text-ink-muted hover:text-red-500 grid size-5 place-items-center rounded transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      {value.length < 3 && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                e.preventDefault();
                onChange([...value, input.trim()]);
                setInput("");
              }
            }}
            placeholder="e.g. Book a visit"
            className={cn(INPUT, "h-9")}
          />
          <button
            type="button"
            onClick={() => {
              if (input.trim()) {
                onChange([...value, input.trim()]);
                setInput("");
              }
            }}
            className="text-ink shrink-0 rounded-lg border border-black/15 px-3 text-sm font-medium transition-colors hover:bg-black/[0.04]"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- question -------------------------------- */

function QuestionConfig({
  node,
  onConfig,
  onBranches,
}: {
  node: FlowNode;
  onConfig: (p: Partial<FlowNodeConfig>) => void;
  onBranches: (b: FlowBranch[]) => void;
}) {
  return (
    <>
      <Field label="Question">
        <input
          value={node.config.question ?? ""}
          onChange={(e) => onConfig({ question: e.target.value })}
          placeholder="e.g. What are you looking for?"
          className={INPUT}
        />
      </Field>
      <Field label="Reply options" hint="each one branches the flow">
        <div className="space-y-2">
          {node.branches.map((b, i) => (
            <div key={b.id} className="flex items-center gap-2">
              <input
                value={b.label}
                onChange={(e) => onBranches(node.branches.map((x) => (x.id === b.id ? { ...x, label: e.target.value } : x)))}
                placeholder={`Option ${i + 1}`}
                className={cn(INPUT, "h-9")}
              />
              {node.branches.length > 2 && (
                <button
                  type="button"
                  onClick={() => onBranches(node.branches.filter((x) => x.id !== b.id))}
                  aria-label="Remove option"
                  className="text-ink-muted hover:bg-red-50 hover:text-red-500 grid size-9 shrink-0 place-items-center rounded-lg transition-colors"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
          {node.branches.length < 4 && (
            <button
              type="button"
              onClick={() => onBranches([...node.branches, { id: bid(), label: "", to: null }])}
              className="text-ink hover:border-accent-blue/50 hover:text-accent-blue flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-black/15 py-2 text-sm font-medium transition-colors active:scale-[0.99]"
            >
              <Plus className="size-4" />
              Add option
            </button>
          )}
        </div>
      </Field>
    </>
  );
}

/* ------------------------------- condition -------------------------------- */

function ConditionConfig({ node, onConfig }: { node: FlowNode; onConfig: (p: Partial<FlowNodeConfig>) => void }) {
  const verb = node.config.matchType === "equals" ? "is" : node.config.matchType === "starts_with" ? "starts with" : "contains";
  return (
    <>
      <Field label="If the reply...">
        <Picker
          ariaLabel="Match type"
          value={node.config.matchType ?? "contains"}
          options={[
            { value: "contains", label: "Contains" },
            { value: "equals", label: "Is exactly" },
            { value: "starts_with", label: "Starts with" },
          ]}
          onChange={(v) => onConfig({ matchType: v as FlowNodeConfig["matchType"] })}
        />
      </Field>
      <Field label="Keyword">
        <input
          value={node.config.keyword ?? ""}
          onChange={(e) => onConfig({ keyword: e.target.value })}
          placeholder="e.g. yes"
          className={INPUT}
        />
      </Field>
      <p className="text-ink-muted rounded-lg bg-black/[0.02] px-3 py-2 text-xs leading-relaxed">
        If the reply {verb} <span className="text-ink font-semibold">{node.config.keyword?.trim() || "..."}</span>, the flow
        follows <span className="text-brand-green font-semibold">Yes</span>, otherwise{" "}
        <span className="text-ink font-semibold">No</span>.
      </p>
    </>
  );
}

/* --------------------------------- delay ---------------------------------- */

function DelayConfig({ node, onConfig }: { node: FlowNode; onConfig: (p: Partial<FlowNodeConfig>) => void }) {
  return (
    <Field label="Wait for">
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          value={node.config.delayValue ?? 1}
          onChange={(e) => onConfig({ delayValue: Math.max(1, Number(e.target.value) || 1) })}
          className={cn(INPUT, "w-24")}
        />
        <Picker
          ariaLabel="Unit"
          value={node.config.delayUnit ?? "hours"}
          options={[
            { value: "minutes", label: "Minutes" },
            { value: "hours", label: "Hours" },
            { value: "days", label: "Days" },
          ]}
          onChange={(v) => onConfig({ delayUnit: v as FlowNodeConfig["delayUnit"] })}
        />
      </div>
    </Field>
  );
}

/* --------------------------------- atoms ---------------------------------- */

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-ink text-sm font-medium">{label}</label>
        {hint && <span className="text-ink-muted/70 text-[11px]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Picker({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="text-ink hover:border-black/25 flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/40"
      >
        <span className="truncate">{current?.label ?? "Select"}</span>
        <ChevronDown className={cn("text-ink-muted size-4 shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="listbox"
            className="absolute top-full right-0 left-0 z-40 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
            style={{ animation: `scale-in 150ms ${EASE_OUT} both`, transformOrigin: "top" }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "hover:bg-accent-blue/[0.06] block w-full truncate rounded-lg px-2.5 py-2 text-left text-sm outline-none",
                  o.value === value ? "text-ink font-medium" : "text-ink-muted"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function VariableMenu({ onInsert }: { onInsert: (token: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-accent-blue bg-accent-blue/[0.06] hover:bg-accent-blue/10 inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors outline-none"
      >
        <Braces className="size-3.5" />
        Add variable
        <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden />
          <div
            className="absolute bottom-full left-0 z-40 mb-2 w-56 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
            style={{ animation: `scale-in 150ms ${EASE_OUT} both`, transformOrigin: "bottom left" }}
          >
            {VARIABLES.map((v) => (
              <button
                key={v.token}
                type="button"
                onClick={() => {
                  onInsert(v.token);
                  setOpen(false);
                }}
                className="hover:bg-accent-blue/[0.06] flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left outline-none"
              >
                <span className="text-ink text-sm">{v.label}</span>
                <span className="text-ink-muted/70 font-mono text-[11px]">{v.token}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
