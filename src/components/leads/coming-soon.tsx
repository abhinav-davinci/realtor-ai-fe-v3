import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

/** Placeholder screen for the Leads cluster items that aren't built yet. */
export function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3 sm:px-6 lg:px-8">
        <div>
          <p className="text-ink font-bold">{title}</p>
          <p className="text-ink-muted text-xs">Part of your Leads workspace</p>
        </div>
      </div>
      <div className="grid flex-1 place-items-center p-8">
        <div className="grid max-w-sm place-items-center text-center">
          <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl">
            <Icon className="size-7" />
          </span>
          <p className="text-ink mt-4 text-lg font-bold">{title}</p>
          <span className="bg-brand-orange/10 text-brand-orange mt-2 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            Coming soon
          </span>
          <p className="text-ink-muted mt-3 text-sm">{description}</p>
          <Link
            href="/leads"
            className="text-accent-blue mt-5 inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            Go to Lead Intelligence <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
