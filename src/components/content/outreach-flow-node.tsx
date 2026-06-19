"use client";

/**
 * Visual metadata + the node card + the add-step palette for the chat-flow
 * builder. The card is fixed-size (matches the layout math); branch labels ride
 * on the edges, not inside the card, so heights never vary the layout.
 */
import {
  CircleHelp,
  CircleStop,
  Clock,
  GitBranch,
  MessageSquare,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FLOW_PALETTE, type FlowNode, type FlowNodeKind } from "@/lib/outreach";
import { NODE_H, NODE_W } from "./outreach-flow-layout";

export const FLOW_NODE_META: Record<
  FlowNodeKind,
  { label: string; Icon: LucideIcon; chip: string; bar: string }
> = {
  start: { label: "Start", Icon: Zap, chip: "bg-brand-green/10 text-brand-green", bar: "bg-brand-green" },
  message: { label: "Send message", Icon: MessageSquare, chip: "bg-accent-blue/10 text-accent-blue", bar: "bg-accent-blue" },
  question: { label: "Ask question", Icon: CircleHelp, chip: "bg-flow-violet/10 text-flow-violet", bar: "bg-flow-violet" },
  condition: { label: "Condition", Icon: GitBranch, chip: "bg-brand-orange/10 text-brand-orange", bar: "bg-brand-orange" },
  delay: { label: "Delay", Icon: Clock, chip: "bg-gold/40 text-gold-foreground", bar: "bg-gold" },
  end: { label: "End", Icon: CircleStop, chip: "bg-red-500/10 text-red-500", bar: "bg-red-500" },
};

export function nodeSummary(n: FlowNode): string {
  switch (n.kind) {
    case "start":
      return "Runs on the contact's first message";
    case "message":
      return n.config.text?.trim() || (n.config.templateName ? "Template message" : "Click to add a message");
    case "question":
      return n.config.question?.trim() || "Click to add a question";
    case "condition": {
      const verb = n.config.matchType === "equals" ? "is" : n.config.matchType === "starts_with" ? "starts with" : "contains";
      return n.config.keyword?.trim() ? `If reply ${verb} "${n.config.keyword}"` : "Set a matching rule";
    }
    case "delay":
      return `Wait ${n.config.delayValue ?? 1} ${n.config.delayUnit ?? "hours"}`;
    case "end":
      return "Conversation ends or hands off to AI";
  }
}

export function FlowNodeCard({
  node,
  selected,
  hasIssues,
  onClick,
}: {
  node: FlowNode;
  selected: boolean;
  hasIssues: boolean;
  onClick: () => void;
}) {
  const meta = FLOW_NODE_META[node.kind];
  const Icon = meta.Icon;
  return (
    <button
      type="button"
      data-flow-interactive
      onClick={onClick}
      style={{ width: NODE_W, height: NODE_H }}
      className={cn(
        "relative block overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-[border-color,box-shadow,transform] outline-none active:scale-[0.99]",
        selected ? "border-accent-blue ring-2 ring-accent-blue/30" : "border-black/[0.08] hover:shadow-md"
      )}
    >
      <span className={cn("absolute top-0 left-0 h-full w-[3px]", meta.bar)} aria-hidden />
      <div className="flex items-start gap-2.5 p-3 pl-3.5">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", meta.chip)}>
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-ink text-sm font-semibold">{meta.label}</span>
            {hasIssues && (
              <span className="bg-brand-orange size-1.5 shrink-0 rounded-full" title="Needs setup" aria-label="Needs setup" />
            )}
          </div>
          <p className="text-ink-muted mt-0.5 line-clamp-2 text-xs leading-snug">{nodeSummary(node)}</p>
        </div>
      </div>
    </button>
  );
}

/** The list of insertable node kinds, used by the slot "+" popover and as drag labels. */
export function AddPalette({ onPick }: { onPick: (k: FlowNodeKind) => void }) {
  return (
    <div className="w-52 p-1">
      {FLOW_PALETTE.map((k) => {
        const m = FLOW_NODE_META[k];
        const Icon = m.Icon;
        return (
          <button
            key={k}
            type="button"
            onClick={() => onPick(k)}
            className="hover:bg-black/[0.04] flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-colors"
          >
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-md", m.chip)}>
              <Icon className="size-4" />
            </span>
            <span className="text-ink text-sm font-medium">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
