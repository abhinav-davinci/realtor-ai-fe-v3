"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ListPlus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContactList } from "@/lib/contacts";
import { listDot } from "./ui";

const EASE = "cubic-bezier(0.23,1,0.32,1)";
/** How many list chips show beside "All contacts" before the rest fold into the menu. */
const VISIBLE = 4;

/**
 * Lists as first-class, always-visible chips: All contacts + the most-recently
 * used lists, then an "All lists" button that opens a searchable menu holding
 * every list. The visible part is capped so the rail never crowds, while the
 * menu scales to any number of lists.
 */
export function ListsRail({
  lists,
  activeId,
  totalContacts,
  recents,
  onSelect,
  onCreate,
}: {
  lists: ContactList[];
  activeId: string;
  totalContacts: number;
  recents: string[];
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Rank by recency (recents first), newest-created as the tiebreak.
  const ranked = useMemo(() => {
    const rank = (id: string) => {
      const i = recents.indexOf(id);
      return i === -1 ? Number.POSITIVE_INFINITY : i;
    };
    return [...lists].sort((a, b) => {
      const ra = rank(a.id);
      const rb = rank(b.id);
      return ra !== rb ? ra - rb : b.createdAt - a.createdAt;
    });
  }, [lists, recents]);

  // Take the top few, but display them in a stable order so chips don't reshuffle.
  const quick = useMemo(() => ranked.slice(0, VISIBLE).sort((a, b) => b.createdAt - a.createdAt), [ranked]);
  const quickIds = new Set(quick.map((l) => l.id));
  // Always offer the searchable "All lists" menu when any list exists, so there's
  // a consistent place to browse/search/manage regardless of count (it also
  // absorbs overflow as lists grow past the quick chips).
  const showAllLists = lists.length > 0;

  const activeList = activeId === "all" ? null : lists.find((l) => l.id === activeId) ?? null;
  const activeHidden = !!activeList && !quickIds.has(activeList.id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? lists.filter((l) => l.name.toLowerCase().includes(q)) : ranked;
  }, [lists, ranked, query]);

  function pick(id: string) {
    onSelect(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      <Chip selected={activeId === "all"} onClick={() => pick("all")} label="All contacts" count={totalContacts} />

      {quick.map((l) => (
        <Chip key={l.id} selected={activeId === l.id} onClick={() => pick(l.id)} label={l.name} count={l.contactIds.length} dot={l.color} />
      ))}

      {showAllLists && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/30",
              activeHidden ? "border-transparent bg-ink text-white" : "text-ink-muted hover:text-ink border-black/10 hover:border-black/25"
            )}
          >
            {activeHidden && <span className={cn("size-2 rounded-full", activeHidden ? "bg-white/80" : listDot(activeList.color))} />}
            <span className="max-w-[140px] truncate">{activeHidden ? activeList.name : "All lists"}</span>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] tabular-nums", activeHidden ? "bg-white/20 text-white" : "bg-black/[0.06] text-ink-muted")}>
              {lists.length}
            </span>
            <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => { setOpen(false); setQuery(""); }} aria-hidden />
              <div
                role="listbox"
                className="absolute left-0 z-40 mt-2 w-72 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1 shadow-lg shadow-black/[0.08]"
                style={{ animation: `scale-in 160ms ${EASE} both`, transformOrigin: "top left" }}
              >
                <div className="relative p-1">
                  <Search className="text-ink-muted/60 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Find a list"
                    className="text-ink placeholder:text-ink-muted/55 focus:border-accent-blue/50 h-9 w-full rounded-lg border border-black/10 bg-white pr-3 pl-9 text-sm outline-none transition-colors"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {filtered.length === 0 ? (
                    <p className="text-ink-muted px-3 py-4 text-center text-sm">No lists match.</p>
                  ) : (
                    filtered.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        role="option"
                        aria-selected={activeId === l.id}
                        onClick={() => pick(l.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors",
                          activeId === l.id ? "bg-accent-blue/[0.06]" : "hover:bg-black/[0.03]"
                        )}
                      >
                        <span className={cn("size-2.5 shrink-0 rounded-full", listDot(l.color))} />
                        <span className="text-ink min-w-0 flex-1 truncate font-medium">{l.name}</span>
                        <span className="text-ink-muted text-xs tabular-nums">{l.contactIds.length}</span>
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onCreate(); }}
                  className="text-accent-blue hover:bg-accent-blue/[0.06] flex w-full items-center gap-2 rounded-lg border-t border-black/[0.06] px-2.5 py-2.5 text-sm font-semibold outline-none"
                >
                  <ListPlus className="size-4" /> Create list
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onCreate}
        className="text-accent-blue hover:border-accent-blue/40 hover:bg-accent-blue/[0.05] border-accent-blue/30 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-xs font-semibold transition-colors"
      >
        <ListPlus className="size-3.5" /> Create list
      </button>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  label,
  count,
  dot,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent-blue/30",
        selected ? "border-transparent bg-ink text-white" : "text-ink-muted hover:text-ink border-black/10 hover:border-black/25"
      )}
    >
      {dot && <span className={cn("size-2 rounded-full", selected ? "bg-white/80" : listDot(dot))} />}
      <span className="max-w-[140px] truncate">{label}</span>
      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] tabular-nums", selected ? "bg-white/20 text-white" : "bg-black/[0.06] text-ink-muted")}>
        {count}
      </span>
    </button>
  );
}
