"use client";

/**
 * Shown across the top whenever the owner is looking through a team member's
 * eyes. Impersonation without a visible way out is a trap, so this is
 * deliberately loud and the exit is always one click away.
 */
import { Eye, X } from "lucide-react";
import { ROLE_META, setViewAs } from "@/lib/team";
import { useViewer } from "@/lib/use-viewer";

export function ViewingAsBanner() {
  const viewer = useViewer();
  if (!viewer.impersonating) return null;

  const role = viewer.role === "admin" ? ROLE_META.admin.name : ROLE_META.user.name;

  return (
    <div
      className="bg-brand-orange flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-white"
      style={{ animation: "fade-in 180ms cubic-bezier(0.23,1,0.32,1) both" }}
    >
      <span className="inline-flex items-center gap-2 text-sm font-semibold">
        <Eye className="size-4 shrink-0" />
        Viewing as {viewer.name}
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold">{role}</span>
      </span>
      <span className="hidden text-xs text-white/80 sm:inline">You are seeing only what they can see.</span>
      <button
        type="button"
        onClick={() => setViewAs(null)}
        className="inline-flex h-7 items-center gap-1 rounded-full bg-white/15 px-2.5 text-xs font-semibold outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/60 active:scale-[0.97]"
      >
        <X className="size-3.5" /> Exit view
      </button>
    </div>
  );
}
