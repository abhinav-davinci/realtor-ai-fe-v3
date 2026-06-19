"use client";

/**
 * Full-screen chat-flow builder (focus mode). Owns the Flow state and wires the
 * sidebar palette, canvas, config drawer, and the Test simulator. Adding a step
 * (click a slot's + or drag a component from the sidebar) auto-connects and
 * re-lays-out. Saves to localStorage. Design mode only.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, FlaskConical, GripVertical, Play, RotateCcw, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FLOW_PALETTE,
  FLOW_TEMPLATES,
  getFlow,
  newFlowNode,
  nodeIssues,
  saveFlow,
  type Flow,
  type FlowNode,
  type FlowNodeKind,
} from "@/lib/outreach";
import { ConfirmDialog, EASE_OUT, PhonePreview, renderVars } from "./outreach-shared";
import { layout } from "./outreach-flow-layout";
import { FLOW_NODE_META } from "./outreach-flow-node";
import { FlowCanvas } from "./outreach-flow-canvas";
import { FlowConfig } from "./outreach-flow-config";

interface DragState {
  kind: FlowNodeKind;
  x: number;
  y: number;
  overSlot: string | null;
  overParent: string | null;
  overBranch: string | null;
}

export function FlowComposer({
  flowId,
  onBack,
  onSaved,
}: {
  flowId: string | null;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [flow, setFlow] = useState<Flow | null>(() => (flowId ? getFlow(flowId) : null));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [test, setTest] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const reduced =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const lay = useMemo(() => (flow ? layout(flow) : null), [flow]);
  const issueIds = useMemo(
    () => new Set(flow ? Object.values(flow.nodes).filter((n) => nodeIssues(n).length > 0).map((n) => n.id) : []),
    [flow]
  );

  /* ----------------------------- mutations ------------------------------- */
  function addNode(parentId: string, branchId: string, kind: FlowNodeKind) {
    const node = newFlowNode(kind);
    setFlow((f) => {
      if (!f) return f;
      const parent = f.nodes[parentId];
      if (!parent) return f;
      return {
        ...f,
        nodes: {
          ...f.nodes,
          [parentId]: { ...parent, branches: parent.branches.map((b) => (b.id === branchId ? { ...b, to: node.id } : b)) },
          [node.id]: node,
        },
      };
    });
    setSelectedId(node.id);
    setTest(false);
  }
  // Keep a live ref so the once-bound drag listeners always call the latest addNode.
  const addRef = useRef(addNode);
  useEffect(() => {
    addRef.current = addNode;
  });

  function updateNode(id: string, patch: Partial<FlowNode>) {
    setFlow((f) => (f ? { ...f, nodes: { ...f.nodes, [id]: { ...f.nodes[id], ...patch } } } : f));
  }
  function deleteNode(id: string) {
    setFlow((f) => {
      if (!f) return f;
      const remove = new Set<string>();
      const collect = (nid: string) => {
        if (!nid || remove.has(nid)) return;
        remove.add(nid);
        f.nodes[nid]?.branches.forEach((b) => b.to && collect(b.to));
      };
      collect(id);
      const nodes: Record<string, FlowNode> = {};
      for (const [k, n] of Object.entries(f.nodes)) {
        if (remove.has(k)) continue;
        nodes[k] = { ...n, branches: n.branches.map((b) => (b.to === id ? { ...b, to: null } : b)) };
      }
      return { ...f, nodes };
    });
    setSelectedId(null);
    setConfirmId(null);
  }

  function save() {
    if (!flow) return;
    // prune unreachable nodes
    const keep = new Set<string>();
    const walk = (id: string | null) => {
      if (!id || keep.has(id)) return;
      keep.add(id);
      flow.nodes[id]?.branches.forEach((b) => walk(b.to));
    };
    walk(flow.rootId);
    const nodes: Record<string, FlowNode> = {};
    keep.forEach((id) => flow.nodes[id] && (nodes[id] = flow.nodes[id]));
    saveFlow({ ...flow, nodes });
    onSaved();
  }

  /* --------------------------- drag-from-sidebar ------------------------- */
  useEffect(() => {
    function move(e: PointerEvent) {
      setDrag((d) => {
        if (!d) return d;
        const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest(
          "[data-flow-slot]"
        ) as HTMLElement | null;
        return {
          ...d,
          x: e.clientX,
          y: e.clientY,
          overSlot: el?.dataset.flowSlot ?? null,
          overParent: el?.dataset.flowParent ?? null,
          overBranch: el?.dataset.flowBranch ?? null,
        };
      });
    }
    function up() {
      setDrag((d) => {
        if (d?.overParent && d.overBranch) addRef.current(d.overParent, d.overBranch, d.kind);
        return null;
      });
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  /* -------------------------------- render ------------------------------- */
  if (!flow || !lay) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <TopBarSlim title="New Flow" subtitle="Pick a starting point" onBack={onBack} />
        <StartGate onPick={(f) => setFlow(f)} />
      </div>
    );
  }

  const selected = selectedId ? flow.nodes[selectedId] : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-black/[0.06] pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to flows"
          className="text-ink-muted hover:text-ink hover:bg-black/[0.05] grid size-9 place-items-center rounded-lg transition-colors active:scale-95"
        >
          <ArrowLeft className="size-4.5" />
        </button>
        <input
          value={flow.name}
          onChange={(e) => setFlow((f) => (f ? { ...f, name: e.target.value } : f))}
          aria-label="Flow name"
          className="text-ink focus:border-accent-blue/50 min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1 text-lg font-bold outline-none transition-colors hover:border-black/10"
        />
        <Switch on={flow.enabled} onChange={() => setFlow((f) => (f ? { ...f, enabled: !f.enabled } : f))} label="Activate flow" />
        <span className="text-ink-muted hidden text-xs font-medium sm:inline">{flow.enabled ? "Active" : "Inactive"}</span>
        <button
          type="button"
          onClick={() => {
            setTest((t) => !t);
            setSelectedId(null);
          }}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors active:scale-[0.98]",
            test ? "border-accent-blue bg-accent-blue/[0.06] text-accent-blue" : "text-ink border-black/15 hover:bg-black/[0.03]"
          )}
        >
          <FlaskConical className="size-4" />
          Test
        </button>
        <button
          type="button"
          onClick={save}
          className="bg-brand-green hover:bg-brand-green-hover inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white transition-[background-color,transform] outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
        >
          <Save className="size-4" />
          Save
        </button>
      </div>

      {/* body */}
      <div className="flex min-h-0 flex-1 gap-4 pt-4">
        {/* palette sidebar */}
        <div className="hidden w-[184px] shrink-0 flex-col sm:flex">
          <p className="text-ink-muted mb-2.5 px-1 text-[11px] font-semibold tracking-wide uppercase">Drag to add</p>
          <div className="space-y-2">
            {FLOW_PALETTE.map((k) => {
              const m = FLOW_NODE_META[k];
              const Icon = m.Icon;
              return (
                <div
                  key={k}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setDrag({ kind: k, x: e.clientX, y: e.clientY, overSlot: null, overParent: null, overBranch: null });
                  }}
                  className="group flex cursor-grab items-center gap-2.5 rounded-xl border border-black/[0.08] bg-white p-2.5 shadow-sm transition-shadow select-none hover:shadow-md active:cursor-grabbing"
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", m.chip)}>
                    <Icon className="size-4.5" />
                  </span>
                  <span className="text-ink flex-1 text-sm font-medium">{m.label}</span>
                  <GripVertical className="text-ink-muted/40 size-4" />
                </div>
              );
            })}
          </div>
          <p className="text-ink-muted/70 mt-3 px-1 text-[11px] leading-snug">
            Drag onto a + slot, or click a + on the canvas to add a step.
          </p>
        </div>

        {/* canvas */}
        <div className="min-w-0 flex-1">
          <FlowCanvas
            flow={flow}
            lay={lay}
            selectedId={selectedId}
            issueIds={issueIds}
            reduced={!!reduced}
            onSelect={(id) => {
              setSelectedId(id);
              if (id) setTest(false);
            }}
            onAddAt={addNode}
            dragOverSlot={drag?.overSlot ?? null}
          />
        </div>

        {/* right panel: tester or config */}
        {test ? (
          <FlowTester flow={flow} onClose={() => setTest(false)} />
        ) : selected ? (
          <FlowConfig
            node={selected}
            onConfig={(patch) => updateNode(selected.id, { config: { ...selected.config, ...patch } })}
            onBranches={(branches) => updateNode(selected.id, { branches })}
            onClose={() => setSelectedId(null)}
            onDelete={() => setConfirmId(selected.id)}
          />
        ) : null}
      </div>

      {/* drag ghost */}
      {drag && (
        <div
          className="pointer-events-none fixed z-[60] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-medium shadow-lg"
          style={{ left: drag.x, top: drag.y }}
        >
          {(() => {
            const m = FLOW_NODE_META[drag.kind];
            const Icon = m.Icon;
            return (
              <>
                <span className={cn("grid size-6 place-items-center rounded-md", m.chip)}>
                  <Icon className="size-3.5" />
                </span>
                {m.label}
              </>
            );
          })()}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmId}
        title="Delete this step?"
        message="This step and everything after it will be removed. This can't be undone."
        confirmLabel="Delete"
        onConfirm={() => confirmId && deleteNode(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

/* ------------------------------- start gate ------------------------------- */

function TopBarSlim({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-2.5 border-b border-black/[0.06] pb-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to flows"
        className="text-ink-muted hover:text-ink hover:bg-black/[0.05] grid size-9 place-items-center rounded-lg transition-colors active:scale-95"
      >
        <ArrowLeft className="size-4.5" />
      </button>
      <div>
        <h2 className="text-ink text-lg font-bold leading-tight">{title}</h2>
        <p className="text-ink-muted text-xs">{subtitle}</p>
      </div>
    </div>
  );
}

function StartGate({ onPick }: { onPick: (f: Flow) => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto pt-6 pb-6">
      <div className="mx-auto max-w-3xl">
        <h3 className="text-ink text-base font-bold">Start a new flow</h3>
        <p className="text-ink-muted mt-0.5 text-sm">Begin from a ready-made flow or a blank canvas.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FLOW_TEMPLATES.map((t, i) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onPick(t.build())}
              style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
              className={cn(
                "flex items-start gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition-[border-color,box-shadow] outline-none hover:shadow-md motion-safe:opacity-0 motion-safe:animate-[fade-in-up_300ms_ease-out_both]",
                t.key === "blank" ? "border-dashed border-black/20" : "border-black/[0.08] hover:border-accent-blue/40"
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl",
                  t.key === "blank" ? "bg-black/[0.04] text-ink-muted" : "bg-accent-blue/10 text-accent-blue"
                )}
              >
                <Play className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="text-ink block text-sm font-semibold">{t.label}</span>
                <span className="text-ink-muted mt-0.5 block text-xs leading-snug">{t.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- tester ---------------------------------- */

function FlowTester({ flow, onClose }: { flow: Flow; onClose: () => void }) {
  const start = flow.nodes[flow.rootId];
  const firstStep = start?.branches[0]?.to ?? null;
  const [currentId, setCurrentId] = useState<string | null>(firstStep);

  const node = currentId ? flow.nodes[currentId] : null;
  const restart = () => setCurrentId(firstStep);

  let body = "Add a step to test your flow.";
  if (node) {
    if (node.kind === "message") body = node.config.text?.trim() || "(empty message)";
    else if (node.kind === "question") body = node.config.question?.trim() || "(empty question)";
    else if (node.kind === "condition")
      body = `Checks if the reply ${node.config.matchType === "equals" ? "is" : node.config.matchType === "starts_with" ? "starts with" : "contains"} "${node.config.keyword || "..."}"`;
    else if (node.kind === "delay") body = `⏳ Waits ${node.config.delayValue ?? 1} ${node.config.delayUnit ?? "hours"}, then continues`;
    else if (node.kind === "end") body = "The conversation ends here.";
  }

  const choices: { label: string; to: string | null }[] = node
    ? node.kind === "question" || node.kind === "condition"
      ? node.branches.map((b) => ({ label: b.label || "(unlabeled)", to: b.to }))
      : node.kind === "end"
        ? []
        : [{ label: "Continue", to: node.branches[0]?.to ?? null }]
    : [];

  const done = !node || node.kind === "end";

  return (
    <aside
      className="flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-white"
      style={{ animation: `slide-in-right 240ms ${EASE_OUT} both` }}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.06] px-4 py-3">
        <FlaskConical className="text-accent-blue size-4.5" />
        <p className="text-ink flex-1 text-sm font-semibold">Test your flow</p>
        <button type="button" onClick={restart} aria-label="Restart" className="text-ink-muted hover:text-ink hover:bg-black/[0.05] grid size-8 place-items-center rounded-lg transition-colors">
          <RotateCcw className="size-4" />
        </button>
        <button type="button" onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink hover:bg-black/[0.05] grid size-8 place-items-center rounded-lg transition-colors">
          <X className="size-4.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <PhonePreview title={flow.name || "Flow test"} subtitle="preview" body={renderVars(body)} />
        <div className="mt-3">
          {done ? (
            <button
              type="button"
              onClick={restart}
              className="text-ink inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-black/15 text-sm font-semibold transition-colors hover:bg-black/[0.04]"
            >
              <RotateCcw className="size-4" />
              Run again
            </button>
          ) : (
            <>
              <p className="text-ink-muted mb-1.5 text-[11px] font-medium">
                {node?.kind === "question" || node?.kind === "condition" ? "Reply as the customer" : "Next"}
              </p>
              <div className="space-y-1.5">
                {choices.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentId(c.to)}
                    className="text-accent-blue hover:bg-accent-blue/[0.06] flex w-full items-center justify-center rounded-lg border border-accent-blue/30 py-2 text-sm font-medium transition-colors active:scale-[0.98]"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

/* --------------------------------- switch --------------------------------- */

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        on ? "bg-brand-green" : "bg-black/15"
      )}
    >
      <span
        className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200", on && "translate-x-5")}
        style={{ transitionTimingFunction: EASE_OUT }}
      />
    </button>
  );
}
