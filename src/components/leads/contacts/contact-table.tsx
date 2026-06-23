"use client";

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
                  <div className="flex max-w-[220px] flex-wrap items-center gap-1">
                    {c.tags.slice(0, 3).map((t) => (
                      <span key={t} className="bg-tag text-tag-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">{t}</span>
                    ))}
                    {c.tags.length > 3 && <span className="text-ink-muted/70 text-[11px]">+{c.tags.length - 3}</span>}
                    {c.tags.length === 0 && <span className="text-ink-muted/40 text-xs">—</span>}
                  </div>
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex max-w-[200px] flex-wrap items-center gap-1">
                    {memberships.map((l) => (
                      <ListChip key={l.id} name={l.name} color={l.color} />
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
