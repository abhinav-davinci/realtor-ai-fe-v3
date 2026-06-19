/**
 * Pure auto-layout for the chat-flow tree. Two passes (subtree widths, then
 * positions) produce node coordinates, open "add step" slots, and SVG elbow
 * edge paths. It's a tree (one parent per node) so this is O(n) and has no
 * edge routing or overlap to solve. Node cards are a fixed size; branch labels
 * ride on the edges, so heights never vary the layout. No React here.
 */
import type { Flow } from "@/lib/outreach";

export const NODE_W = 248;
export const NODE_H = 96;
export const GAP_X = 40;
export const GAP_Y = 68;
const SLOT_H = 44;

export interface NodePos {
  x: number;
  y: number;
}

/** An open branch with no next step yet: where the "+ add step" target sits. */
export interface AddSlot {
  key: string;
  parentId: string;
  branchId: string;
  x: number; // center x
  y: number; // top y
}

export interface FlowEdge {
  key: string;
  d: string; // SVG path
  label: string;
  lx: number; // label center x
  ly: number; // label center y
}

export interface FlowLayout {
  pos: Record<string, NodePos>;
  slots: AddSlot[];
  edges: FlowEdge[];
  width: number;
  height: number;
}

export function layout(flow: Flow): FlowLayout {
  const pos: Record<string, NodePos> = {};
  const slots: AddSlot[] = [];
  const edges: FlowEdge[] = [];

  const widthCache = new Map<string, number>();
  const computing = new Set<string>();

  function subtreeWidth(id: string): number {
    const cached = widthCache.get(id);
    if (cached !== undefined) return cached;
    const node = flow.nodes[id];
    if (!node || computing.has(id)) return NODE_W;
    computing.add(id);
    let w: number;
    if (node.branches.length === 0) {
      w = NODE_W;
    } else {
      let total = 0;
      node.branches.forEach((b, i) => {
        total += (b.to ? subtreeWidth(b.to) : NODE_W) + (i > 0 ? GAP_X : 0);
      });
      w = Math.max(NODE_W, total);
    }
    computing.delete(id);
    widthCache.set(id, w);
    return w;
  }

  const placed = new Set<string>();
  function place(id: string, leftEdge: number, depth: number) {
    const node = flow.nodes[id];
    if (!node || placed.has(id)) return;
    placed.add(id);

    const w = subtreeWidth(id);
    const x = leftEdge + w / 2 - NODE_W / 2;
    const y = depth * (NODE_H + GAP_Y);
    pos[id] = { x, y };

    const n = node.branches.length;
    let cursor = leftEdge;
    node.branches.forEach((b, i) => {
      const childW = b.to ? subtreeWidth(b.to) : NODE_W;
      const colLeft = cursor;
      const childCenterX = colLeft + childW / 2;
      const childY = (depth + 1) * (NODE_H + GAP_Y);

      // parent output anchor: fanned along the card's bottom edge
      const ax = x + (NODE_W * (i + 1)) / (n + 1);
      const ay = y + NODE_H;
      const bx = childCenterX;
      const by = childY;
      const midY = ay + GAP_Y / 2;
      const d =
        Math.abs(ax - bx) < 0.5
          ? `M ${ax} ${ay} L ${bx} ${by}` // straight when aligned
          : `M ${ax} ${ay} V ${midY} H ${bx} V ${by}`;
      edges.push({ key: b.id, d, label: b.label, lx: (ax + bx) / 2, ly: midY });

      if (b.to) {
        place(b.to, colLeft, depth + 1);
      } else {
        slots.push({ key: b.id, parentId: id, branchId: b.id, x: bx, y: by });
      }
      cursor += childW + GAP_X;
    });
  }

  place(flow.rootId, 0, 0);

  let width = 0;
  let height = 0;
  for (const p of Object.values(pos)) {
    width = Math.max(width, p.x + NODE_W);
    height = Math.max(height, p.y + NODE_H);
  }
  for (const s of slots) {
    width = Math.max(width, s.x + NODE_W / 2);
    height = Math.max(height, s.y + SLOT_H);
  }
  return { pos, slots, edges, width, height };
}
