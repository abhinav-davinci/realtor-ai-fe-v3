"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  PanelLeft,
  LayoutGrid,
  Megaphone,
  Sparkles,
  Radar,
  LineChart,
  Spline,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export interface RailItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  active?: boolean;
  accent?: boolean; // render in the blue accent color (e.g. Logout)
  onClick?: () => void;
}

export const PRIMARY: RailItem[] = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Leads", icon: Radar, href: "/leads" },
  { label: "Content Studio", icon: Megaphone, href: "/" },
  { label: "AI Team", icon: Sparkles, href: "/ai-team" },
  { label: "Insights", icon: LineChart },
  { label: "Build Workflow", icon: Spline },
];

function RailButton({ label, icon: Icon, active, accent, onClick }: RailItem) {
  // Selected = light full-width band with blue icon/text; accent (Logout) = blue
  // text on the navy; everything else = light-gray, brightening on hover.
  const tone = active
    ? "text-rail-active"
    : accent
      ? "text-rail-active group-hover:text-rail-active"
      : "text-rail-foreground group-hover:text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col items-center gap-2 py-4 transition-colors",
        active ? "bg-rail-active-bg" : "hover:bg-white/[0.06]"
      )}
    >
      <Icon className={cn("size-6 transition-colors", tone)} strokeWidth={1.75} />
      <span className={cn("px-1 text-center text-[13px] leading-tight font-medium transition-colors", tone)}>
        {label}
      </span>
    </button>
  );
}

export function IconRail() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  // Each section owns its href prefix (/ai-team, /leads, ...); Content Studio
  // ("/") is the fallback that owns every route not claimed by a section.
  const sectionHrefs = PRIMARY.map((i) => i.href).filter((h): h is string => !!h && h !== "/");
  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/") return !sectionHrefs.some((h) => pathname.startsWith(h));
    return pathname === href || pathname.startsWith(href + "/");
  };
  const primary = PRIMARY.map((item) => ({
    ...item,
    active: isActive(item.href),
    onClick: item.href ? () => router.push(item.href!) : undefined,
  }));

  const secondary: RailItem[] = [
    { label: "Settings", icon: Settings },
    {
      label: "Logout",
      icon: LogOut,
      accent: true,
      onClick: () => {
        logout();
        router.replace("/login");
      },
    },
  ];

  return (
    <aside className="bg-rail hidden w-[116px] shrink-0 flex-col py-5 lg:flex">
      <div className="flex justify-center px-3">
        <button
          type="button"
          aria-label="Collapse sidebar"
          className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <PanelLeft className="size-[18px]" strokeWidth={1.75} />
        </button>
      </div>

      {/* Scrolls internally on short screens so Settings/Logout stay pinned and visible. */}
      <nav className="mt-6 flex w-full min-h-0 flex-1 flex-col gap-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {primary.map((item) => (
          <RailButton key={item.label} {...item} />
        ))}
      </nav>

      <div className="mt-4 flex w-full shrink-0 flex-col gap-2 border-t border-white/10 pt-4">
        {secondary.map((item) => (
          <RailButton key={item.label} {...item} />
        ))}
      </div>
    </aside>
  );
}
