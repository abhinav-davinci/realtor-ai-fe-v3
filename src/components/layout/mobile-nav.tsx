"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Settings, LogOut, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { NAV, PocPeriodCard, VideoGeneratingCard } from "./content-studio-sidebar";
import { PRIMARY } from "./icon-rail";

/**
 * Mobile navigation: a hamburger button (shown below `lg`) that opens a
 * slide-in drawer combining the icon-rail's app sections and the Content
 * Studio sub-nav. On `lg`+ the persistent sidebars are used instead.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="text-ink hover:bg-black/[0.05] grid size-10 shrink-0 place-items-center rounded-lg lg:hidden"
      >
        <Menu className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
            style={{ animation: "fade-in 180ms ease-out both" }}
          />
          <aside
            className="bg-cream absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col shadow-2xl"
            style={{ animation: "slide-in-left 260ms cubic-bezier(0.22,1,0.36,1) both" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="text-ink flex items-center text-xl font-extrabold tracking-tight">
                <span>TryThat</span>
                <span className="ml-1 rounded-md bg-[#34528c] px-1.5 py-0.5 text-white">.ai</span>
              </div>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="text-ink-muted hover:text-ink grid size-9 place-items-center rounded-lg"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
              {/* App sections (icon rail) */}
              <div className="grid grid-cols-5 gap-1 px-1 pb-3">
                {PRIMARY.map(({ label, icon: Icon, active }) => (
                  <span
                    key={label}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg py-2 text-center",
                      active ? "bg-rail text-white" : "text-ink-muted"
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                    <span className="text-[10px] leading-tight font-medium">{label}</span>
                  </span>
                ))}
              </div>

              {/* Content Studio sub-nav */}
              <div className="flex items-center gap-2.5 px-3 pt-2 pb-2">
                <h2 className="text-ink text-base font-bold">Content Studio</h2>
                <Badge className="bg-brand-orange rounded-md px-2 text-[11px] font-semibold text-white">
                  Marketing
                </Badge>
              </div>
              <nav className="flex flex-col gap-1">
                {NAV.map(({ label, icon: Icon, href }) => {
                  const active = href === "/" ? pathname === "/" : !!href && pathname.startsWith(href);
                  return (
                    <Link
                      key={label}
                      href={href ?? "#"}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "text-ink bg-surface shadow-sm ring-1 ring-black/[0.06]"
                          : "text-[#3f4656] hover:bg-black/[0.04]"
                      )}
                    >
                      <Icon className="size-[18px]" strokeWidth={1.75} />
                      {label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-4 space-y-3 px-1">
                <VideoGeneratingCard />
                <PocPeriodCard />
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-2 border-t border-black/[0.07] px-4 py-3">
              <button className="text-ink-muted hover:text-ink flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium">
                <Settings className="size-4" /> Settings
              </button>
              <Button
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                variant="outline"
                className="text-rail-active h-9 gap-2 rounded-lg border-black/10 px-3 text-sm font-semibold"
              >
                <LogOut className="size-4" /> Logout
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
