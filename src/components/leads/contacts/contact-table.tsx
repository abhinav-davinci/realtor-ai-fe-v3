"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtDate, listsForContact, type Contact, type ContactList } from "@/lib/contacts";
import { CheckBox, ListChip, Monogram } from "./ui";

export function ContactTable({
  contacts,
  lists,
  selected,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
  activeListId,
  onRemoveFromList,
}: {
  contacts: Contact[];
  lists: ContactList[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (c: Contact) => void;
  onDelete: (id: string) => void;
  activeListId?: string | null;
  onRemoveFromList?: (id: string) => void;
}) {
  const allChecked = contacts.length > 0 && contacts.every((c) => selected.has(c.id));
  const someChecked = contacts.some((c) => selected.has(c.id)) && !allChecked;

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/[0.08] bg-white">
      <table className="w-full min-w-[880px] border-collapse text-sm">
        <thead>
          <tr className="text-ink-muted border-b border-black/[0.06] text-left text-xs">
            <th className="w-12 py-3 pr-2 pl-4">
              <CheckBox checked={allChecked} indeterminate={someChecked} onChange={onToggleAll} label="Select all" />
            </th>
            <th className="py-3 pr-3 font-medium">Name</th>
            <th className="py-3 pr-3 font-medium">Mobile</th>
            <th className="py-3 pr-3 font-medium">Tags</th>
            <th className="py-3 pr-3 font-medium">Lists</th>
            <th className="py-3 pr-3 font-medium whitespace-nowrap">Last Contacted</th>
            <th className="w-[92px] py-3 pr-4 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => {
            const sel = selected.has(c.id);
            const memberships = listsForContact(c.id, lists);
            return (
              <tr
                key={c.id}
                className={cn(
                  "border-b border-black/[0.04] transition-colors last:border-0 hover:bg-black/[0.02]",
                  sel && "bg-accent-blue/[0.05]"
                )}
              >
                <td className="py-2.5 pr-2 pl-4">
                  <CheckBox checked={sel} onChange={() => onToggle(c.id)} label={`Select ${c.name}`} />
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    <Monogram initials={c.initials} tier={c.tier} className="size-9" />
                    <span className="text-ink truncate font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="text-ink-muted py-2.5 pr-3 tabular-nums whitespace-nowrap">{c.phone}</td>
                <td className="py-2.5 pr-3">
                  <TagsCell tags={c.tags} name={c.name} />
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex max-w-[200px] flex-wrap items-center gap-1">
                    {memberships.map((l) => (
                      <ListChip key={l.id} name={l.name} />
                    ))}
                    {memberships.length === 0 && <span className="text-ink-muted/40 text-xs">—</span>}
                  </div>
                </td>
                <td className="text-ink-muted py-2.5 pr-3 text-xs whitespace-nowrap">
                  {c.lastContacted ? fmtDate(c.lastContacted) : <span className="text-ink-muted/50">Never</span>}
                </td>
                <td className="py-2.5 pr-4">
                  <div className="flex items-center justify-end gap-1">
                    {activeListId && onRemoveFromList && (
                      <button
                        type="button"
                        onClick={() => onRemoveFromList(c.id)}
                        aria-label={`Remove ${c.name} from this list`}
                        title="Remove from this list"
                        className="text-ink-muted grid size-8 place-items-center rounded-lg transition-colors hover:bg-black/[0.05] hover:text-ink"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      aria-label={`Edit ${c.name}`}
                      className="text-ink-muted grid size-8 place-items-center rounded-lg transition-colors hover:bg-black/[0.05] hover:text-ink"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      aria-label={`Delete ${c.name}`}
                      className="text-ink-muted grid size-8 place-items-center rounded-lg transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------------- tags cell ------------------------------- */

function TagChip({ label }: { label: string }) {
  return <span className="bg-tag text-tag-foreground rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap">{label}</span>;
}

const MAX_TAGS = 3;

/** First few tags inline; the "+N" is a hover card revealing the full set. The
 * popover is position:fixed so the table's overflow-x-auto can't clip it. */
function TagsCell({ tags, name }: { tags: string[]; name: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; above: boolean }>({ left: 0, top: 0, above: false });
  const btnRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | null>(null);

  function place() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const above = window.innerHeight - r.bottom < 180;
    setPos(above ? { left: r.left, bottom: window.innerHeight - r.top + 6, above: true } : { left: r.left, top: r.bottom + 6, above: false });
  }
  function show() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    place();
    setOpen(true);
  }
  function hideSoon() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), 120);
  }

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (tags.length === 0) return <span className="text-ink-muted/40 text-xs">—</span>;

  const shown = tags.slice(0, MAX_TAGS);
  const extra = tags.length - shown.length;

  return (
    <div className="flex max-w-[220px] flex-wrap items-center gap-1">
      {shown.map((t) => (
        <TagChip key={t} label={t} />
      ))}
      {extra > 0 && (
        <>
          <button
            ref={btnRef}
            type="button"
            aria-label={`Show all ${tags.length} tags for ${name}`}
            aria-expanded={open}
            onClick={() => (open ? setOpen(false) : show())}
            onMouseEnter={show}
            onMouseLeave={hideSoon}
            onFocus={show}
            onBlur={hideSoon}
            className="text-accent-blue hover:bg-accent-blue/10 cursor-pointer rounded-full px-1.5 py-0.5 text-[11px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/30"
          >
            +{extra}
          </button>
          {open && (
            <div
              role="tooltip"
              onMouseEnter={show}
              onMouseLeave={hideSoon}
              className="fixed z-50 w-max max-w-[280px] rounded-xl border border-black/[0.08] bg-white p-2.5 shadow-lg shadow-black/[0.1]"
              style={{ left: pos.left, top: pos.top, bottom: pos.bottom, transformOrigin: pos.above ? "bottom left" : "top left", animation: "scale-in 140ms cubic-bezier(0.23,1,0.32,1) both" }}
            >
              <p className="text-ink-muted/70 mb-1.5 text-[10px] font-semibold tracking-wide uppercase">All tags ({tags.length})</p>
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <TagChip key={t} label={t} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
