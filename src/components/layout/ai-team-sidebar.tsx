"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, BookOpen, Sparkles, Headphones, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { listAgents } from "@/lib/agents";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { label: "Launch AI Agents", icon: Sparkles, href: "/ai-team", exact: true },
  { label: "My Agents", icon: Bot, href: "/ai-team/agents" },
  { label: "Knowledge Base", icon: BookOpen, href: "/ai-team/knowledge" },
];

export function AiTeamSidebar() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  // Live count of built agents for the "My Agents" badge.
  useEffect(() => {
    setCount(listAgents().length);
  }, [pathname]);

  return (
    <aside className="bg-cream hidden w-[272px] shrink-0 flex-col border-r border-black/[0.06] lg:flex">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <h2 className="text-ink text-lg font-bold">AI Team</h2>
        <Badge className="bg-brand-blue relative rounded-md px-2 text-[11px] font-semibold text-white after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/45 after:to-transparent after:content-[''] motion-safe:after:animate-shimmer">
          <span className="inline-block motion-safe:animate-float">Agents</span>
        </Badge>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV.map(({ label, icon: Icon, href, exact }) => {
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
              {label === "My Agents" && count != null && count > 0 && (
                <span className="bg-accent-blue/15 text-accent-blue grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Support / education card */}
      <div className="mt-auto p-4">
        <div className="rounded-xl bg-surface p-4 shadow-sm ring-1 ring-black/[0.06]">
          <div className="flex items-center gap-2">
            <span className="bg-brand-blue/10 text-brand-blue grid size-8 place-items-center rounded-lg">
              <Headphones className="size-4" />
            </span>
            <p className="text-ink text-sm font-semibold">New to AI agents?</p>
          </div>
          <p className="text-ink-muted mt-2 text-xs leading-snug">
            Agents work best when they know your projects, pricing, and FAQs. Add a knowledge base while building so yours can answer like you would.
          </p>
          <Link
            href="/ai-team/knowledge"
            className="text-brand-blue mt-3 inline-block text-xs font-semibold hover:underline"
          >
            Learn how it works →
          </Link>
        </div>
      </div>
    </aside>
  );
}
