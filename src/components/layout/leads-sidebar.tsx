"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Contact, History, Radar, KanbanSquare, CalendarCheck, MessagesSquare, Headphones, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { listScoredLeads } from "@/lib/lead-intelligence";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
  soon?: boolean;
}

const NAV: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, href: "/leads/overview" },
  { label: "Contacts", icon: Contact, href: "/leads/contacts" },
  { label: "AI Call History", icon: History, href: "/leads/call-history" },
  { label: "Lead Intelligence", icon: Radar, href: "/leads/intelligence" },
  { label: "Sales Pipeline", icon: KanbanSquare, href: "/leads/pipeline", soon: true },
  { label: "Site Visits", icon: CalendarCheck, href: "/leads/site-visits", soon: true },
  { label: "Conversations", icon: MessagesSquare, href: "/leads/conversations", soon: true },
];

export function LeadsSidebar() {
  const pathname = usePathname();
  // "Needs attention" count: new + hot leads. Deterministic static data, so it's
  // safe to compute during render (no localStorage, no hydration mismatch).
  const count = useMemo(
    () => listScoredLeads().filter((l) => l.status === "new" || l.tier === "hot" || l.tier === "very-hot").length,
    []
  );

  return (
    <aside className="bg-cream hidden w-[272px] shrink-0 flex-col border-r border-black/[0.06] lg:flex">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <h2 className="text-ink text-lg font-bold">Leads</h2>
        <Badge className="bg-brand-green relative rounded-md px-2 text-[11px] font-semibold text-white after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/45 after:to-transparent after:content-[''] motion-safe:after:animate-shimmer">
          <span className="inline-block motion-safe:animate-float">Live</span>
        </Badge>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV.map(({ label, icon: Icon, href, exact, soon }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-ink bg-surface shadow-sm ring-1 ring-black/[0.06]"
                  : "text-[#3f4656] hover:bg-black/[0.04]"
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              {label === "Lead Intelligence" && count > 0 && (
                <span className="bg-accent-blue/15 text-accent-blue grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold">
                  {count}
                </span>
              )}
              {soon && (
                <span className="bg-black/[0.05] text-ink-muted rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* education footer card */}
      <div className="mt-auto p-4">
        <div className="rounded-xl bg-surface p-4 shadow-sm ring-1 ring-black/[0.06]">
          <div className="flex items-center gap-2">
            <span className="bg-brand-green/10 text-brand-green grid size-8 place-items-center rounded-lg">
              <Headphones className="size-4" />
            </span>
            <p className="text-ink text-sm font-semibold">Work hot leads first</p>
          </div>
          <p className="text-ink-muted mt-2 text-xs leading-snug">
            Every lead is scored automatically from its conversation. HOT leads are ready to buy, so call them today.
          </p>
        </div>
      </div>
    </aside>
  );
}
