"use client";

/**
 * Secondary nav for the account cluster, reached from the rail's Settings item.
 * The header carries the workspace identity (name + your role), which is why
 * the account pages no longer repeat it in a bar of their own.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Settings, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CURRENT_USER, TEAM_CHANGED_EVENT, WORKSPACE_NAME, listMembers } from "@/lib/team";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

const NAV: NavItem[] = [
  { label: "Account Settings", icon: Settings, href: "/account/settings" },
  { label: "User Management", icon: Users, href: "/account/users" },
  { label: "Credit & Usage", icon: CreditCard, href: "/account/usage" },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  // Team size lives in localStorage, so it can only be counted after mount.
  // Server and first client render both show no badge, so hydration matches.
  const [members, setMembers] = useState(0);

  const reload = useCallback(() => setMembers(listMembers().length), []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    reload();
    window.addEventListener(TEAM_CHANGED_EVENT, reload);
    return () => window.removeEventListener(TEAM_CHANGED_EVENT, reload);
  }, [reload]);

  return (
    <aside className="bg-cream hidden w-[272px] shrink-0 flex-col border-r border-black/[0.06] lg:flex">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <h2 className="text-ink truncate text-lg font-bold">{WORKSPACE_NAME}</h2>
        <Badge className="bg-brand-orange relative shrink-0 rounded-md px-2 text-[11px] font-semibold text-white after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/45 after:to-transparent after:content-[''] motion-safe:after:animate-shimmer">
          <span className="inline-block motion-safe:animate-float">{CURRENT_USER.role}</span>
        </Badge>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname.startsWith(href);
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
              {label === "User Management" && members > 0 && (
                <span className="bg-accent-blue/15 text-accent-blue grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold">
                  {members}
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
            <span className="bg-accent-blue/10 text-accent-blue grid size-8 place-items-center rounded-lg">
              <ShieldCheck className="size-4" />
            </span>
            <p className="text-ink text-sm font-semibold">Give the least access</p>
          </div>
          <p className="text-ink-muted mt-2 text-xs leading-snug">
            Admins can invite, remove, and see the whole organization. Keep that for the people who run it, and give
            everyone else the User role.
          </p>
        </div>
      </div>
    </aside>
  );
}
