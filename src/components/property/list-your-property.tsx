import Link from "next/link";
import { Building2, Upload, Mic, FileText, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkProgressBanner } from "./bulk-progress-banner";

interface InputMethod {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
}

const METHODS: InputMethod[] = [
  {
    icon: Upload,
    title: "Bulk Upload",
    description: "Upload Excel, PDF or Word Document with multiple properties at once",
    href: "/add-property/bulk",
  },
  {
    icon: Mic,
    title: "Voice Note",
    description:
      "Record a voice message with property details - our AI will extract the information",
    href: "/add-property/voice",
  },
  {
    icon: FileText,
    title: "Manual Form",
    description: "Fill in property details using a structured form for complete accuracy",
    href: "/add-property/manual",
  },
];

export function ListYourProperty() {
  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
      {/* Header: title + back-to-properties */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#fcdfbd] from-[60%] to-[#f7af73] text-2xl">
            <span className="inline-block origin-bottom motion-safe:animate-wiggle">🗣️</span>
          </span>
          <div>
            <h1 className="text-ink text-2xl font-bold">List Your Property</h1>
            <p className="text-ink-muted text-sm">
              List your property in{" "}
              <span className="text-brand-orange font-semibold">60 sec.</span>
            </p>
          </div>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/" />}
          className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-xl px-4 text-sm font-semibold text-white"
        >
          <Building2 className="size-4" />
          My Properties
        </Button>
      </div>

      {/* Choose Input Method panel */}
      <div className="mt-6 rounded-2xl border border-black/[0.07] bg-white p-6">
        <h2 className="text-ink text-lg font-bold">Choose Input Method</h2>
        <p className="text-ink-muted mt-1 text-sm">
          Select how you&apos;d like to input your property details
        </p>

        <div className="mt-5 grid max-w-3xl grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METHODS.map(({ icon: Icon, title, description, href }) => {
            const className =
              "group hover:border-accent-blue/50 hover:bg-accent-blue/[0.05] flex cursor-pointer flex-col items-start rounded-xl border border-black/[0.06] bg-white p-5 text-left shadow-sm transition-all hover:shadow-md";
            const inner = (
              <>
                <span className="bg-accent-blue/10 text-accent-blue grid size-11 place-items-center rounded-full">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="text-ink mt-4 text-lg font-semibold">{title}</h3>
                <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">{description}</p>
              </>
            );
            return href ? (
              <Link key={title} href={href} className={className}>
                {inner}
              </Link>
            ) : (
              <div key={title} className={className}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      {/* In-progress bulk upload */}
      <BulkProgressBanner />
    </div>
  );
}
