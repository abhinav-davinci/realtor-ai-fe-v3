"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ONB_SLIDES } from "./onboarding-slides";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="text-xl font-bold tracking-tight text-white">
        TryThat<span className="bg-accent-blue ml-0.5 rounded-md px-1.5 py-0.5 text-base">.ai</span>
      </span>
      <span className="h-4 w-px bg-white/20" />
      <span className="text-[11px] font-semibold tracking-[0.18em] text-white/55">FOR REALTORS</span>
    </div>
  );
}

export function OnboardingAside() {
  const [active, setActive] = useState(0);
  const n = ONB_SLIDES.length;

  // Auto-advance the value-prop carousel, but stay put under reduced motion so
  // nothing changes unprompted. setState runs in the interval callback, not the
  // effect body. Dots remain clickable in both cases.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), 5200);
    return () => clearInterval(t);
  }, [n]);

  const slide = ONB_SLIDES[active];

  return (
    <aside className="from-rail via-brand-blue/90 to-brand-blue relative hidden shrink-0 flex-col overflow-hidden bg-gradient-to-b px-10 py-9 lg:flex lg:w-[44%] xl:w-[42%]">
      {/* faint depth rings */}
      <span aria-hidden className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full border border-white/[0.06]" />
      <span aria-hidden className="pointer-events-none absolute right-[-10%] bottom-[12%] size-80 rounded-full border border-white/[0.05]" />

      <BrandLogo />

      <div key={slide.id} className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center py-8">
          <slide.Illustration />
        </div>

        <div style={{ animation: "fade-in-up 520ms cubic-bezier(0.23,1,0.32,1) 80ms both" }}>
          <h2 className="text-[26px] leading-tight font-bold text-white">
            {slide.title.map((seg, i) => (
              <span key={i} className={seg.accent ? "text-brand-orange" : undefined}>
                {seg.t}
              </span>
            ))}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">{slide.text}</p>
        </div>
      </div>

      {/* progress dots */}
      <div className="mt-8 flex items-center gap-2">
        {ONB_SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active}
            className={cn(
              "h-1.5 rounded-full outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white/40",
              i === active ? "bg-brand-orange w-7" : "w-1.5 bg-white/30 hover:bg-white/50"
            )}
          />
        ))}
      </div>
    </aside>
  );
}
