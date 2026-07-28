"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Contact, History, Radar, Share2, KanbanSquare, CalendarCheck, MessagesSquare, PhoneCall, Headphones, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { listScoredLeads, type ScoredLead } from "@/lib/lead-intelligence";
import { LEADS_CHANGED_EVENT, listDistributedLeads } from "@/lib/lead-promotion";
import { useViewer } from "@/lib/use-viewer";


interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
  soon?: boolean;
}

/** Everything, for the people who run the organization. */
const ADMIN_NAV: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, href: "/leads/overview" },
  { label: "Contacts", icon: Contact, href: "/leads/contacts" },
  { label: "AI Call History", icon: History, href: "/leads/call-history" },
  { label: "Lead Intelligence", icon: Radar, href: "/leads/intelligence" },
  { label: "Lead Distribution", icon: Share2, href: "/leads/distribution" },
  { label: "Sales Pipeline", icon: KanbanSquare, href: "/leads/pipeline", soon: true },
  { label: "Site Visits", icon: CalendarCheck, href: "/leads/site-visits", soon: true },
  { label: "Conversations", icon: MessagesSquare, href: "/leads/conversations", soon: true },
];

/** A User's whole app: the people they have to call, and the visits they are
 * running. Deliberately two items, not a filtered version of the admin list. */
const USER_NAV: NavItem[] = [
  { label: "My Calling List", icon: PhoneCall, href: "/leads/my-calls" },
  { label: "My Site Visits", icon: CalendarCheck, href: "/leads/site-visits", soon: true },
];

export function LeadsSidebar() {
  const pathname = usePathname();
  const viewer = useViewer();
  // "Needs attention": new + hot leads. The seed set is deterministic and so is
  // safe during render, but a User must only be counted their own, which means
  // reading localStorage and therefore waiting for mount.
  const [scoped, setScoped] = useState<ScoredLead[] | null>(null);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (viewer.can("leads.viewAll")) {
      setScoped(null);
      return;
    }
    const load = () => setScoped(listDistributedLeads().filter((l) => l.assigneeId === viewer.id));
    load();
    /* eslint-enable react-hooks/set-state-in-effect */
    window.addEventListener(LEADS_CHANGED_EVENT, load);
    return () => window.removeEventListener(LEADS_CHANGED_EVENT, load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer.id, viewer.role]);

  const needsAttention = (scoped ?? listScoredLeads()).filter(
    (l) => l.status === "new" || l.tier === "hot" || l.tier === "very-hot"
  ).length;

  return (
    <aside className="bg-cream hidden w-[272px] shrink-0 flex-col border-r border-black/[0.06] lg:flex">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <h2 className="text-ink text-lg font-bold">Leads</h2>
        <Badge className="bg-brand-green relative rounded-md px-2 text-[11px] font-semibold text-white after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/45 after:to-transparent after:content-[''] motion-safe:after:animate-shimmer">
          <span className="inline-block motion-safe:animate-float">Live</span>
        </Badge>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {(viewer.can("leads.intelligence") ? ADMIN_NAV : USER_NAV).map(({ label, icon: Icon, href, exact, soon }) => {
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
              {(label === "Lead Intelligence" || label === "My Calling List") && needsAttention > 0 && (
                <span className="bg-accent-blue/15 text-accent-blue grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold">
                  {needsAttention}
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
