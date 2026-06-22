import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationsBell } from "./notifications-panel";
import { MobileNav } from "./mobile-nav";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/trythat-logo.svg" alt="TryThat.ai — Real Estate SuperApp" className="h-8 w-auto shrink-0 lg:h-9" />
      <span className="hidden h-5 w-px bg-black/15 sm:block" />
      <span className="text-ink-muted hidden text-sm font-medium sm:inline">Sellers</span>
    </div>
  );
}

export function TopBar() {
  return (
    <header className="bg-cream flex h-16 shrink-0 items-stretch border-b border-black/[0.06] lg:h-20">
      <div className="flex shrink-0 items-center gap-1 pl-2 pr-3 sm:pl-4 lg:w-[272px] lg:gap-0 lg:border-r lg:border-black/[0.06] lg:px-5">
        <MobileNav />
        <Logo />
      </div>

      <div className="flex flex-1 items-center gap-3 px-3 sm:px-4 lg:gap-6 lg:px-6">
        <div className="relative hidden flex-1 sm:block">
          <Search className="text-ink-muted pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search project title, location ..."
            className="h-11 w-full rounded-full border-black/10 bg-white pl-11 text-sm shadow-sm"
          />
        </div>

        <div className="ml-auto flex items-center gap-4 sm:gap-5">
          <button
            aria-label="Search"
            className="text-ink-muted hover:text-ink grid size-9 place-items-center rounded-full sm:hidden"
          >
            <Search className="size-[20px]" />
          </button>
          <NotificationsBell />
          <Avatar className="size-9">
            <AvatarFallback className="bg-brand-orange font-semibold text-white">AR</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
