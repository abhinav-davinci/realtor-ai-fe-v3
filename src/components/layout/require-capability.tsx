"use client";

/**
 * Hides a whole screen from viewers who should not have it. Navigation already
 * omits these routes, so this only catches a typed or bookmarked URL: it says
 * plainly that the screen exists and is not theirs, rather than failing oddly.
 */
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import type { Capability } from "@/lib/team";
import { useViewer } from "@/lib/use-viewer";

export function RequireCapability({
  needs,
  title,
  children,
}: {
  needs: Capability;
  /** What they tried to open, so the message is about something specific. */
  title: string;
  children: React.ReactNode;
}) {
  const viewer = useViewer();

  // Until the viewer is read from localStorage, render nothing rather than
  // flashing either the screen or the refusal.
  if (!viewer.ready) return <div className="h-full" aria-hidden />;
  if (viewer.can(needs)) return <>{children}</>;

  return (
    <div className="grid h-full place-items-center p-8">
      <div
        className="grid max-w-md place-items-center text-center"
        style={{ animation: "fade-in-up 240ms cubic-bezier(0.23,1,0.32,1) both" }}
      >
        <span className="text-ink-muted/50 grid size-14 place-items-center rounded-2xl bg-black/[0.04]">
          <Lock className="size-7" />
        </span>
        <h1 className="text-ink mt-4 text-lg font-bold">{title} is for admins</h1>
        <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">
          Your account has the User role, which covers the leads assigned to you. Ask an admin if you need this.
        </p>
        <Link
          href="/leads/overview"
          className="text-accent-blue group mt-5 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
        >
          Go to my leads
          <ArrowRight className="size-4 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
