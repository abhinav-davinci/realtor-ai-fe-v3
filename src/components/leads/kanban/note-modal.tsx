"use client";

/**
 * Notes on a lead. What was said on the call is the context nobody else has, and
 * it is worthless a week later if it was never written down, so the box is the
 * first thing focused and Cmd+Enter saves without reaching for the mouse.
 */
import { useEffect, useRef, useState } from "react";
import { StickyNote, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalShell } from "@/components/leads/contacts/ui";
import { addNote, deleteNote, entryFor, fmtStamp, type PipelineEntry } from "@/lib/lead-pipeline";

export function NoteModal({
  leadId,
  leadName,
  onClose,
}: {
  leadId: string;
  leadName: string;
  onClose: () => void;
}) {
  const [entry, setEntry] = useState<PipelineEntry | null>(null);
  const [text, setText] = useState("");
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setEntry(entryFor(leadId));
    boxRef.current?.focus();
  }, [leadId]);

  const notes = entry?.notes ?? [];
  const ok = text.trim().length > 0;

  function save() {
    if (!ok) return;
    setEntry(addNote(leadId, text));
    setText("");
    boxRef.current?.focus();
  }

  return (
    <ModalShell
      title={`Notes on ${leadName}`}
      onClose={onClose}
      width="max-w-lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
          >
            Done
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!ok}
            className={cn(
              "h-10 rounded-lg px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
              ok
                ? "bg-brand-blue hover:bg-brand-blue-hover text-white active:scale-[0.98]"
                : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
            )}
          >
            Add Note
          </button>
        </>
      }
    >
      <textarea
        ref={boxRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        rows={3}
        placeholder="What did they say? Budget, timeline, who else is deciding..."
        className="text-ink placeholder:text-ink-muted/55 focus:border-accent-blue/50 w-full resize-none rounded-lg border border-black/15 bg-white p-3 text-sm leading-relaxed outline-none transition-colors"
      />
      <p className="text-ink-muted/70 mt-1.5 text-[11px]">
        {ok ? "Cmd + Enter to add" : "Everything you write here stays on the lead's timeline."}
      </p>

      {notes.length > 0 ? (
        <div className="mt-5">
          <p className="text-ink-muted mb-2 text-xs font-semibold">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </p>
          <div className="space-y-2">
            {notes.map((n, i) => (
              <div
                key={n.id}
                className="group flex items-start gap-2.5 rounded-xl border border-black/[0.07] bg-black/[0.015] p-3 motion-safe:opacity-0 motion-safe:animate-[fade-in-up_260ms_ease-out_both]"
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <span className="bg-gold/40 text-gold-foreground grid size-7 shrink-0 place-items-center rounded-lg">
                  <StickyNote className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{n.text}</p>
                  <p className="text-ink-muted/70 mt-1 text-[11px]">{fmtStamp(n.at)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    deleteNote(leadId, n.id);
                    setEntry(entryFor(leadId));
                  }}
                  aria-label="Delete note"
                  className="text-ink-muted/50 grid size-7 shrink-0 place-items-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:outline-none"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-ink-muted mt-5 rounded-xl border border-dashed border-black/12 py-6 text-center text-xs">
          No notes yet. The first one is usually the most useful.
        </p>
      )}
    </ModalShell>
  );
}
