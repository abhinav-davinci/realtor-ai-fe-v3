"use client";

/**
 * Borrow a team member's view. Design-mode only: with no real auth, this is the
 * only way to show what an Admin or a User actually sees.
 */
import { useEffect, useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalShell } from "@/components/leads/contacts/ui";
import { ROLE_META, initialsOf, listActiveMembers, setViewAs, type Member } from "@/lib/team";

export function ViewAsModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setMembers(listActiveMembers());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }, [members, query]);

  return (
    <ModalShell title="View as team member" onClose={onClose} width="max-w-md">
      <p className="text-ink-muted text-sm leading-relaxed">
        See the app exactly as one of your team does. Admins see the whole organization; Users see only the leads
        assigned to them.
      </p>

      {members.length > 3 && (
        <div className="relative mt-4">
          <Search className="text-ink-muted/60 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the team"
            aria-label="Search the team"
            className="text-ink placeholder:text-ink-muted/55 focus:border-accent-blue/50 h-9 w-full rounded-lg border border-black/15 bg-white pr-3 pl-9 text-sm outline-none transition-colors"
          />
        </div>
      )}

      <div className="mt-3 space-y-1.5">
        {filtered.map((m) => {
          const meta = ROLE_META[m.role];
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setViewAs(m.id);
                onClose();
              }}
              className="group hover:border-accent-blue/40 hover:bg-accent-blue/[0.03] flex w-full items-center gap-2.5 rounded-xl border border-black/[0.08] p-2.5 text-left outline-none transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.99]"
            >
              <span className="bg-accent-blue/10 text-accent-blue grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold">
                {initialsOf(m.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-ink block truncate text-sm font-semibold">{m.name}</span>
                <span className="text-ink-muted block truncate text-xs">{m.email}</span>
              </span>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", meta.badge)}>
                {meta.name}
              </span>
              <Eye className="text-ink-muted/40 group-hover:text-accent-blue size-4 shrink-0 transition-colors" />
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-ink-muted rounded-xl border border-dashed border-black/15 py-8 text-center text-sm">
            {members.length === 0 ? "Nobody has accepted an invitation yet." : "No one matches that search."}
          </p>
        )}
      </div>
    </ModalShell>
  );
}
