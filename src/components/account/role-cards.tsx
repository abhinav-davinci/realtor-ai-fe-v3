"use client";

/**
 * The two role cards, in their two forms: read-only education on the empty
 * state, and selectable in the invite and change-role modals. Both render the
 * same ROLE_META / ROLE_PERMISSIONS data, so the permission copy can never
 * drift between where it is taught and where it is chosen.
 */
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_META, ROLE_ORDER, ROLE_PERMISSIONS, type MemberRole } from "@/lib/team";
import { RoleGlyph } from "./team-ui";

/* ------------------------------ education --------------------------------- */

export function RoleInfoCard({ role, delay = 0 }: { role: MemberRole; delay?: number }) {
  const meta = ROLE_META[role];
  return (
    <div
      className="bg-cream-panel rounded-2xl border border-black/[0.06] p-5 motion-safe:opacity-0 motion-safe:animate-[fade-in-up_320ms_ease-out_both]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2.5">
        <RoleGlyph role={role} className="bg-white" />
        <p className="text-ink text-sm font-bold">{meta.name}</p>
      </div>
      <ul className="mt-3.5 space-y-1.5">
        {ROLE_PERMISSIONS[role].map((p) => (
          <li key={p} className="text-ink-muted flex gap-2 text-[13px] leading-relaxed">
            <span className="bg-ink-muted/40 mt-[7px] size-1 shrink-0 rounded-full" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Both roles side by side, as shown under "Understand User Roles". */
export function RoleInfoCards() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {ROLE_ORDER.map((role, i) => (
        <RoleInfoCard key={role} role={role} delay={i * 60} />
      ))}
    </div>
  );
}

/* ------------------------------- selectable ------------------------------- */

export function RoleSelectCard({
  role,
  selected,
  onSelect,
}: {
  role: MemberRole;
  selected: boolean;
  onSelect: () => void;
}) {
  const meta = ROLE_META[role];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-start gap-2.5 rounded-xl border p-3.5 text-left outline-none transition-[border-color,background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]",
        selected
          ? "border-accent-blue bg-accent-blue/[0.06]"
          : "bg-cream-panel border-black/[0.08] hover:border-black/20"
      )}
    >
      <RoleGlyph role={role} className={cn("mt-0.5", selected ? "bg-white text-accent-blue" : "bg-white")} />
      <span className="min-w-0 flex-1">
        <span className="text-ink block text-sm font-semibold">{meta.name}</span>
        <span className="text-ink-muted mt-0.5 block text-xs leading-relaxed">{meta.blurb}</span>
      </span>
      <span
        className={cn(
          "grid size-4.5 shrink-0 place-items-center rounded-full border transition-colors duration-150 ease-out",
          selected ? "bg-accent-blue border-accent-blue text-white" : "border-black/20 bg-white"
        )}
        aria-hidden
      >
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
    </button>
  );
}

/** The Admin / User chooser used by the invite and change-role modals. */
export function RoleChooser({
  value,
  onChange,
  label = "Select Role",
}: {
  value: MemberRole;
  onChange: (r: MemberRole) => void;
  label?: string;
}) {
  return (
    <div>
      <p className="text-ink mb-2 text-sm font-semibold">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={label}>
        {ROLE_ORDER.map((role) => (
          <RoleSelectCard key={role} role={role} selected={value === role} onSelect={() => onChange(role)} />
        ))}
      </div>
    </div>
  );
}
