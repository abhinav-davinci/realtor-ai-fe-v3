"use client";

/**
 * The pannable / zoomable flow canvas. Renders SVG elbow edges, the node cards,
 * and the dashed "add step" slots, all in a single transformed world layer.
 * Pan = drag the background; zoom = ctrl/⌘-wheel or the zoom controls. Adding a
 * step is a click on a slot's "+" (palette popover) or a drag from the sidebar
 * (the composer hit-tests the slot's data attributes).
 */
import { useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Flow, FlowNodeKind } from "@/lib/outreach";
import { EASE_OUT } from "./outreach-shared";
import { AddPalette, FlowNodeCard } from "./outreach-flow-node";
import { type FlowLayout } from "./outreach-flow-layout";

const MIN_SCALE = 0.4;
const MAX_SCALE = 1.5;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

interface View {
  x: number;
  y: number;
  scale: number;
}

export function FlowCanvas({
  flow,
  lay,
  selectedId,
  issueIds,
  reduced,
  onSelect,
  onAddAt,
  dragOverSlot,
}: {
  flow: Flow;
  lay: FlowLayout;
  selectedId: string | null;
  issueIds: Set<string>;
  reduced: boolean;
  onSelect: (id: string | null) => void;
  onAddAt: (parentId: string, branchId: string, kind: FlowNodeKind) => void;
  dragOverSlot: string | null;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const pan = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const [palette, setPalette] = useState<{ parentId: string; branchId: string; x: number; y: number } | null>(null);

  function fitView() {
    const el = viewportRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 64;
    const scale = clamp(Math.min((r.width - pad * 2) / Math.max(lay.width, 1), 1), MIN_SCALE, MAX_SCALE);
    setView({ x: Math.max(pad, (r.width - lay.width * scale) / 2), y: 48, scale });
  }

  // Keep the whole flow framed: re-fit on mount and whenever the step count
  // changes (add/delete). Manual zoom between edits is preserved.
  const nodeCount = Object.keys(flow.nodes).length;
  useEffect(() => {
    fitView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeCount]);

  // Native wheel handler (passive:false so we can preventDefault).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        const px = e.clientX - r.left;
        const py = e.clientY - r.top;
        setView((v) => {
          const next = clamp(v.scale * (e.deltaY < 0 ? 1.08 : 0.92), MIN_SCALE, MAX_SCALE);
          const wx = (px - v.x) / v.scale;
          const wy = (py - v.y) / v.scale;
          return { x: px - wx * next, y: py - wy * next, scale: next };
        });
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function zoomBy(factor: number) {
    const el = viewportRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = r.width / 2;
    const py = r.height / 2;
    setView((v) => {
      const next = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE);
      const wx = (px - v.x) / v.scale;
      const wy = (py - v.y) / v.scale;
      return { x: px - wx * next, y: py - wy * next, scale: next };
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("[data-flow-interactive]")) return;
    pan.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
    setDragging(true);
    viewportRef.current?.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pan.current) return;
    const dx = e.clientX - pan.current.x;
    const dy = e.clientY - pan.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) pan.current.moved = true;
    setView((v) => ({ ...v, x: pan.current!.vx + dx, y: pan.current!.vy + dy }));
  }
  function onPointerUp() {
    if (pan.current && !pan.current.moved) {
      onSelect(null);
      setPalette(null);
    }
    pan.current = null;
    setDragging(false);
  }

  function openPalette(parentId: string, branchId: string, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    setPalette({ parentId, branchId, x: r.left, y: r.bottom + 6 });
  }

  return (
    <div
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative h-full w-full overflow-hidden rounded-xl border border-black/[0.08]"
      style={{
        backgroundColor: "var(--color-cream)",
        backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: `${22 * view.scale}px ${22 * view.scale}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: "0 0",
          transition: dragging || reduced ? "none" : `transform 220ms ${EASE_OUT}`,
          width: lay.width,
          height: lay.height,
        }}
      >
        {/* edges */}
        <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width={lay.width} height={lay.height}>
          {lay.edges.map((e) => (
            <path
              key={e.key}
              d={e.d}
              fill="none"
              stroke="var(--color-ink-muted)"
              strokeOpacity={0.35}
              strokeWidth={1.5}
            />
          ))}
        </svg>

        {/* edge labels (Yes / No / reply options) */}
        {lay.edges
          .filter((e) => e.label)
          .map((e) => (
            <span
              key={`l-${e.key}`}
              className="text-ink-muted absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/[0.08] bg-white px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap shadow-sm"
              style={{ left: e.lx, top: e.ly }}
            >
              {e.label}
            </span>
          ))}

        {/* nodes */}
        {Object.entries(lay.pos).map(([id, p]) => {
          const node = flow.nodes[id];
          if (!node) return null;
          return (
            <div
              key={id}
              className="absolute"
              style={{
                left: p.x,
                top: p.y,
                transition: dragging || reduced ? "none" : `left 220ms ${EASE_OUT}, top 220ms ${EASE_OUT}`,
              }}
            >
              <FlowNodeCard
                node={node}
                selected={selectedId === id}
                hasIssues={issueIds.has(id)}
                onClick={() => onSelect(id)}
              />
            </div>
          );
        })}

        {/* add-step slots */}
        {lay.slots.map((s) => {
          const over = dragOverSlot === s.key;
          return (
            <button
              key={s.key}
              type="button"
              data-flow-interactive
              data-flow-slot={s.key}
              data-flow-parent={s.parentId}
              data-flow-branch={s.branchId}
              onClick={(e) => openPalette(s.parentId, s.branchId, e.currentTarget)}
              className={cn(
                "absolute flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-xs font-medium transition-all",
                over
                  ? "border-accent-blue bg-accent-blue/10 text-accent-blue scale-105"
                  : "text-ink-muted hover:border-accent-blue/50 hover:text-accent-blue border-black/20 bg-white/85"
              )}
              style={{ left: s.x, top: s.y }}
            >
              <Plus className="size-3.5" />
              Add step
            </button>
          );
        })}
      </div>

      {/* zoom controls */}
      <div className="absolute bottom-4 left-4 flex flex-col overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-sm">
        <button type="button" data-flow-interactive onClick={() => zoomBy(1.15)} aria-label="Zoom in" className="text-ink hover:bg-black/[0.04] grid size-8 place-items-center transition-colors">
          <Plus className="size-4" />
        </button>
        <button type="button" data-flow-interactive onClick={() => zoomBy(0.87)} aria-label="Zoom out" className="text-ink hover:bg-black/[0.04] grid size-8 place-items-center border-t border-black/[0.06] transition-colors">
          <Minus className="size-4" />
        </button>
        <button type="button" data-flow-interactive onClick={fitView} aria-label="Fit to screen" className="text-ink hover:bg-black/[0.04] grid size-8 place-items-center border-t border-black/[0.06] transition-colors">
          <Maximize2 className="size-3.5" />
        </button>
      </div>
      <div className="text-ink-muted absolute right-4 bottom-4 rounded-md bg-white/80 px-2 py-1 text-[11px] font-medium tabular-nums shadow-sm">
        {Math.round(view.scale * 100)}%
      </div>

      {/* add-step palette popover (click path) */}
      {palette && (
        <>
          <div data-flow-interactive className="fixed inset-0 z-40" onClick={() => setPalette(null)} aria-hidden />
          <div
            data-flow-interactive
            className="fixed z-50 overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-lg shadow-black/[0.08]"
            style={{ left: palette.x, top: palette.y, animation: `scale-in 150ms ${EASE_OUT} both`, transformOrigin: "top left" }}
          >
            <AddPalette
              onPick={(k) => {
                onAddAt(palette.parentId, palette.branchId, k);
                setPalette(null);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
