"use client";

/**
 * The signed-in account chip in the top bar and its menu (account settings,
 * user management, credit and usage, log out). A client leaf so top-bar.tsx
 * stays a server component, the same way NotificationsBell is wired.
 *
 * The menu is scoped to the viewer: a User has no organization-level
 * destinations, so they see their own settings and nothing else.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, CreditCard, Eye, LogOut, Settings, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { ROLE_META } from "@/lib/team";
import { useViewer } from "@/lib/use-viewer";
import { ViewAsModal } from "./view-as-modal";

const ITEM =
  "text-ink focus:bg-accent-blue/[0.07] focus:text-ink gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium [&_svg]:text-ink-muted";

export function AccountMenu() {
  const router = useRouter();
  const { logout } = useAuth();
  const viewer = useViewer();
  const [switching, setSwitching] = useState(false);

  const roleLabel =
    viewer.role === "super-admin" ? "Super Admin" : viewer.role === "admin" ? ROLE_META.admin.name : ROLE_META.user.name;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="group text-ink flex h-11 items-center gap-2 rounded-full px-1 transition-[background-color,transform] duration-150 ease-out outline-none hover:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98] sm:pr-3 sm:pl-1.5 data-popup-open:bg-black/[0.05]"
        >
          <span className="bg-brand-orange grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white">
            {viewer.initials}
          </span>
          <span className="hidden max-w-[140px] truncate text-sm font-semibold sm:block">{viewer.name}</span>
          <ChevronDown className="text-ink-muted hidden size-4 shrink-0 transition-transform duration-200 ease-out group-data-popup-open:rotate-180 sm:block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl p-1.5 duration-150 ease-out">
          <DropdownMenuItem className={ITEM} render={<Link href="/account/settings" />}>
            <Settings /> Account Settings
          </DropdownMenuItem>

          {viewer.can("team.manage") && (
            <DropdownMenuItem className={ITEM} render={<Link href="/account/users" />}>
              <Users /> User Management
            </DropdownMenuItem>
          )}

          {viewer.can("billing.view") && (
            <DropdownMenuItem className={ITEM} render={<Link href="/account/usage" />}>
              <CreditCard /> Credit & Usage
            </DropdownMenuItem>
          )}

          {/* Design-mode only: borrow a team member's view. Owner-only, and the
              banner is how you get back. */}
          {!viewer.impersonating && viewer.role === "super-admin" && (
            <>
              <DropdownMenuSeparator className="mx-0 my-1.5" />
              <DropdownMenuItem className={ITEM} onClick={() => setSwitching(true)}>
                <Eye /> View as team member
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator className="mx-0 my-1.5" />

          <div className="px-2.5 pt-0.5 pb-1.5">
            <p className="text-ink-muted text-[11px]">
              Signed in as <span className="text-ink font-semibold">{roleLabel}</span>
            </p>
          </div>

          <DropdownMenuItem
            variant="destructive"
            className="gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut /> Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {switching && <ViewAsModal onClose={() => setSwitching(false)} />}
    </>
  );
}
