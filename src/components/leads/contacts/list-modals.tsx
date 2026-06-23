"use client";

import { useMemo, useState } from "react";
import { ListPlus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIST_COLORS, type Contact, type ContactList } from "@/lib/contacts";
import { CheckBox, INPUT, listTint, ModalShell, Monogram } from "./ui";

/* ----------------------------- create / rename ---------------------------- */

export function ListModal({
  list,
  onClose,
  onSave,
}: {
  list: ContactList | null;
  onClose: () => void;
  onSave: (l: ContactList) => void;
}) {
  const [name, setName] = useState(list?.name ?? "");
  const [color, setColor] = useState<string>(list?.color ?? LIST_COLORS[0]);
  const ok = name.trim().length > 0;

  function save() {
    if (!ok) return;
    onSave({
      id: list?.id ?? `list-${Date.now()}`,
      name: name.trim(),
      color,
      contactIds: list?.contactIds ?? [],
      createdAt: list?.createdAt ?? Date.now(),
    });
  }

  return (
    <ModalShell
      title={list ? "Rename list" : "New list"}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold hover:bg-black/[0.04] active:scale-[0.98]">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!ok}
            className={cn(
              "h-10 rounded-lg px-4 text-sm font-semibold transition-[background-color,transform]",
              ok ? "bg-brand-green hover:bg-brand-green-hover text-white active:scale-[0.98]" : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
            )}
          >
            {list ? "Save" : "Create list"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-ink mb-1.5 block text-sm font-medium">List name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali campaign" className={INPUT} autoFocus />
        </div>
        <div>
          <label className="text-ink mb-1.5 block text-sm font-medium">Colour</label>
          <div className="flex flex-wrap gap-2">
            {LIST_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Colour ${c}`}
                className={cn(
                  "grid size-9 place-items-center rounded-lg ring-2 transition-all active:scale-95",
                  color === c ? "ring-ink/40" : "ring-transparent hover:ring-black/15"
                )}
              >
                <span className={cn("size-5 rounded-full", listTint(c))} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

/* ----------------------------- add to a list ------------------------------ */

/** Pick an existing list to drop the current selection into (or make a new one). */
export function AddToListModal({
  count,
  lists,
  onClose,
  onPick,
  onCreate,
}: {
  count: number;
  lists: ContactList[];
  onClose: () => void;
  onPick: (listId: string) => void;
  onCreate: () => void;
}) {
  return (
    <ModalShell title={`Add ${count} contact${count === 1 ? "" : "s"} to a list`} onClose={onClose}>
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={onCreate}
          className="text-accent-blue hover:bg-accent-blue/[0.06] flex w-full items-center gap-2.5 rounded-lg border border-dashed border-accent-blue/40 px-3 py-2.5 text-sm font-semibold"
        >
          <ListPlus className="size-4" /> Create a new list
        </button>
        {lists.length === 0 ? (
          <p className="text-ink-muted py-3 text-center text-sm">No lists yet. Create your first one above.</p>
        ) : (
          lists.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onPick(l.id)}
              className="hover:bg-black/[0.03] flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left"
            >
              <span className={cn("size-3 rounded-full", listTint(l.color))} />
              <span className="text-ink flex-1 truncate text-sm font-medium">{l.name}</span>
              <span className="text-ink-muted text-xs">{l.contactIds.length}</span>
            </button>
          ))
        )}
      </div>
    </ModalShell>
  );
}

/* -------------------------- pick contacts for list ------------------------ */

/** From a list's detail view: search/select master contacts not yet in it. */
export function ContactPickerModal({
  listName,
  candidates,
  onClose,
  onAdd,
}: {
  listName: string;
  candidates: Contact[];
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<Set<string>>(() => new Set());
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    if (!q) return candidates;
    return candidates.filter(
      (c) => c.name.toLowerCase().includes(q) || (digits && c.phone.replace(/\D/g, "").includes(digits))
    );
  }, [candidates, query]);

  function toggle(id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ModalShell
      title={`Add contacts to ${listName}`}
      onClose={onClose}
      width="max-w-lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold hover:bg-black/[0.04]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onAdd([...sel])}
            disabled={sel.size === 0}
            className={cn(
              "h-10 rounded-lg px-4 text-sm font-semibold",
              sel.size ? "bg-brand-green hover:bg-brand-green-hover text-white active:scale-[0.98]" : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
            )}
          >
            Add {sel.size > 0 ? sel.size : ""}
          </button>
        </>
      }
    >
      <div className="relative mb-3">
        <Search className="text-ink-muted/60 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or number" className={cn(INPUT, "pl-9")} />
      </div>
      <div className="-mx-1 max-h-[46vh] space-y-0.5 overflow-y-auto px-1">
        {candidates.length === 0 ? (
          <p className="text-ink-muted py-6 text-center text-sm">Every contact is already in this list.</p>
        ) : filtered.length === 0 ? (
          <p className="text-ink-muted py-6 text-center text-sm">No contacts match.</p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={cn("flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors", sel.has(c.id) ? "bg-accent-blue/[0.06]" : "hover:bg-black/[0.02]")}
            >
              <CheckBox checked={sel.has(c.id)} onChange={() => toggle(c.id)} label={`Select ${c.name}`} />
              <Monogram initials={c.initials} tier={c.tier} className="size-8" />
              <span className="text-ink min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
              <span className="text-ink-muted text-xs tabular-nums">{c.phone}</span>
            </button>
          ))
        )}
      </div>
    </ModalShell>
  );
}
