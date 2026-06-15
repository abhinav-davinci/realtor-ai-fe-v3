"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setSession } from "@/lib/api";
import { OnboardingAside } from "./onboarding-aside";

/* --------------------------------- config --------------------------------- */

const STEPS = ["phone", "otp", "about", "reach", "rera", "projects", "done"] as const;
type Step = (typeof STEPS)[number];
const PROFILE_STEPS: Step[] = ["about", "reach", "rera", "projects"];
const SHORT_STEPS: Step[] = ["phone", "otp", "done"];

type ProfType = "builder" | "broker" | "channel" | "other";
type Rera = "own" | "firm" | "none";

const TYPES: { key: ProfType; label: string; icon: LucideIcon }[] = [
  { key: "builder", label: "Builder / Developer", icon: Building2 },
  { key: "broker", label: "Broker Firm", icon: Briefcase },
  { key: "channel", label: "Channel Partner", icon: Users },
  { key: "other", label: "Other Professional", icon: User },
];

const RERAS: { key: Rera; title: string; sub: string; icon: LucideIcon }[] = [
  { key: "own", title: "Own RERA", sub: "I have an individual RERA number", icon: ShieldCheck },
  { key: "firm", title: "Firm RERA", sub: "My company holds the RERA", icon: Building2 },
  { key: "none", title: "No RERA", sub: "I operate without one", icon: ShieldOff },
];

const CITIES = [
  "Mumbai", "Navi Mumbai", "Thane", "Pune", "Delhi", "Gurugram", "Noida",
  "Bengaluru", "Hyderabad", "Chennai", "Ahmedabad", "Kolkata", "Jaipur",
];

const empty6 = (): string[] => ["", "", "", "", "", ""];

/* --------------------------------- flow ----------------------------------- */

export function OnboardingFlow() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(empty6());
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState<ProfType | "">("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sameAsPrimary, setSameAsPrimary] = useState(true);
  const [rera, setRera] = useState<Rera | "">("");
  const [ownReraId, setOwnReraId] = useState("");
  const [companyReraId, setCompanyReraId] = useState("");
  const [projectReraId, setProjectReraId] = useState("");
  const [reraMobile, setReraMobile] = useState("");
  const [feeConfirmed, setFeeConfirmed] = useState(false);
  const [projectLinks, setProjectLinks] = useState("");

  // Resend countdown ticks while the OTP step is showing. setState runs in the
  // interval callback, not the effect body.
  useEffect(() => {
    if (step !== "otp") return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [step]);

  const go = (to: Step) => setI(STEPS.indexOf(to));
  const next = () => setI((x) => Math.min(STEPS.length - 1, x + 1));
  const back = () => setI((x) => Math.max(0, x - 1));

  function sendCode() {
    setOtp(empty6());
    setResendIn(30);
    go("otp");
  }
  function resend() {
    setOtp(empty6());
    setResendIn(30);
  }
  function finish() {
    setSubmitting(true);
    // Design mode: drop a mock session so the app opens, then head to the AI Team.
    setSession("mock-onboarding-token", "mock-org");
    setTimeout(() => router.push("/ai-team"), 500);
  }

  const phoneOk = /^\d{10}$/.test(phone);
  const otpOk = otp.every((c) => c !== "");
  const aboutOk = fullName.trim() !== "" && company.trim() !== "" && type !== "";
  const reachOk = sameAsPrimary || /^\d{10}$/.test(whatsapp);
  const reraOk =
    rera === "none"
      ? feeConfirmed
      : rera === "own"
        ? ownReraId.trim() !== "" && reraMobile.trim() !== ""
        : rera === "firm"
          ? companyReraId.trim() !== "" && reraMobile.trim() !== ""
          : false;

  const showBack = step === "otp" || step === "reach" || step === "rera" || step === "projects";
  const isProfile = PROFILE_STEPS.includes(step);
  const profileIdx = PROFILE_STEPS.indexOf(step); // 0-based
  const short = SHORT_STEPS.includes(step);

  return (
    <div className="bg-cream flex h-screen w-full overflow-hidden">
      <OnboardingAside />

      <main className="flex h-screen flex-1 flex-col overflow-y-auto">
        {/* mobile brand header (aside is hidden under lg) */}
        <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-6 py-3.5 lg:hidden">
          <span className="text-ink text-lg font-bold tracking-tight">
            TryThat<span className="bg-accent-blue ml-0.5 rounded-md px-1.5 py-0.5 text-sm text-white">.ai</span>
          </span>
          <span className="h-4 w-px bg-black/15" />
          <span className="text-ink-muted text-[11px] font-semibold tracking-[0.18em]">FOR REALTORS</span>
        </div>

        <div className={cn("mx-auto flex w-full max-w-xl flex-1 flex-col px-6 sm:px-10", short ? "justify-center py-8" : "py-9 sm:py-12")}>
          {showBack && (
            <button
              type="button"
              onClick={back}
              className="text-ink-muted hover:text-ink mb-5 inline-flex w-fit items-center gap-1.5 text-sm font-medium outline-none"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
          )}

          {isProfile && (
            <div className="mb-5">
              <p className="text-brand-orange text-xs font-bold tracking-wide uppercase">Step {profileIdx + 1} of {PROFILE_STEPS.length}</p>
              <div className="mt-2 flex gap-1.5">
                {PROFILE_STEPS.map((s, k) => (
                  <span key={s} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", k <= profileIdx ? "bg-brand-orange" : "bg-black/10")} />
                ))}
              </div>
            </div>
          )}

          {/* ---- step bodies ---- */}
          {step === "phone" && (
            <Section
              icon={
                <span className="bg-brand-blue/10 text-brand-blue grid size-11 place-items-center rounded-2xl">
                  <Sparkles className="size-5 motion-safe:animate-[welcome-spark_2.6s_ease-in-out_infinite]" />
                </span>
              }
              title={
                <>
                  <span className="text-ink-muted mb-1.5 block text-base font-semibold tracking-wide">Welcome to</span>
                  <span className="block text-[30px] leading-[1.1] sm:text-[34px]">
                    TryThat.ai
                    <br />
                    <span className="text-brand-blue">for Realtors</span>
                  </span>
                </>
              }
              subtitle="Set up your AI sales team in a few quick steps, and start turning every enquiry into a qualified lead. Enter your mobile number to begin."
            >
              <Field label="Mobile number">
                <PhoneInput value={phone} onChange={setPhone} autoFocus />
              </Field>
              <Button onClick={sendCode} disabled={!phoneOk} className="bg-brand-blue hover:bg-brand-blue-hover h-12 w-full rounded-lg text-sm font-semibold text-white">
                Send verification code
              </Button>
            </Section>
          )}

          {step === "otp" && (
            <Section title="Verify your number" subtitle={<>We sent a 6-digit code to <span className="text-ink font-semibold">+91 {phone}</span>.</>}>
              <OtpBoxes value={otp} onChange={setOtp} />
              <div className="text-ink-muted flex items-center gap-1.5 text-xs">
                <Clock className="size-3.5" />
                {resendIn > 0 ? (
                  <span>Resend code in 0:{String(resendIn).padStart(2, "0")}</span>
                ) : (
                  <button type="button" onClick={resend} className="text-accent-blue font-semibold outline-none hover:underline">
                    Resend code
                  </button>
                )}
              </div>
              <Button onClick={() => go("about")} disabled={!otpOk} className="bg-brand-blue hover:bg-brand-blue-hover h-12 w-full rounded-lg text-sm font-semibold text-white">
                Verify &amp; continue
              </Button>
            </Section>
          )}

          {step === "about" && (
            <Section title="Tell us about you" subtitle="Your agent introduces itself with this, speaks for you, and qualifies buyers on your behalf.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your full name">
                  <Input value={fullName} onChange={setFullName} placeholder="e.g. Rahul Sharma" autoFocus />
                </Field>
                <Field label="Company or firm name">
                  <Input value={company} onChange={setCompany} placeholder="e.g. Sharma Realtors" />
                </Field>
              </div>
              <Field label="You are a...">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {TYPES.map((t) => (
                    <SelectTile key={t.key} selected={type === t.key} onClick={() => setType(t.key)} icon={t.icon} label={t.label} />
                  ))}
                </div>
              </Field>
              <Button onClick={next} disabled={!aboutOk} className="bg-brand-blue hover:bg-brand-blue-hover mt-1 h-12 w-full rounded-lg text-sm font-semibold text-white">
                Continue <ArrowRight className="size-4" />
              </Button>
            </Section>
          )}

          {step === "reach" && (
            <Section title="How buyers reach you" subtitle="We route every qualified lead to your WhatsApp, so you never miss one.">
              <Field label="City you primarily operate in" optional>
                <CitySelect value={city} onChange={setCity} />
              </Field>
              <Field label="Your WhatsApp number">
                <PhoneInput value={sameAsPrimary ? phone : whatsapp} onChange={setWhatsapp} disabled={sameAsPrimary} whatsapp />
              </Field>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={sameAsPrimary}
                  onChange={(e) => setSameAsPrimary(e.target.checked)}
                  className="accent-accent-blue size-4 rounded"
                />
                <span className="text-ink text-sm">Same as my verified number</span>
              </label>
              <p className="text-ink-muted flex items-center gap-1.5 text-xs">
                <Clock className="size-3.5" /> Your onboarding specialist will reach you within 4 hours.
              </p>
              <Button onClick={next} disabled={!reachOk} className="bg-brand-blue hover:bg-brand-blue-hover mt-1 h-12 w-full rounded-lg text-sm font-semibold text-white">
                Continue <ArrowRight className="size-4" />
              </Button>
            </Section>
          )}

          {step === "rera" && (
            <Section title="RERA & compliance" subtitle="This keeps your agent's claims compliant. Pick what applies to you.">
              <div className="grid gap-3 sm:grid-cols-3">
                {RERAS.map((r) => (
                  <ReraTile key={r.key} selected={rera === r.key} onClick={() => setRera(r.key)} icon={r.icon} title={r.title} sub={r.sub} />
                ))}
              </div>

              {(rera === "own" || rera === "firm") && (
                <div className="space-y-4 rounded-xl border border-black/[0.08] bg-white p-4" style={{ animation: "fade-in-up 320ms cubic-bezier(0.23,1,0.32,1) both" }}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={rera === "own" ? "Your RERA ID" : "Company RERA ID"}>
                      <Input
                        value={rera === "own" ? ownReraId : companyReraId}
                        onChange={rera === "own" ? setOwnReraId : setCompanyReraId}
                        placeholder="MH/01/BLD/1234"
                      />
                    </Field>
                    <Field label="Project RERA ID" optional>
                      <Input value={projectReraId} onChange={setProjectReraId} placeholder="P51700012345" />
                    </Field>
                  </div>
                  <Field label="Mobile registered with RERA" hint="We'll verify it matches the RERA portal.">
                    <Input value={reraMobile} onChange={setReraMobile} placeholder="98765 43210" inputMode="numeric" />
                  </Field>
                </div>
              )}

              {rera === "none" && (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-black/[0.08] bg-white p-4" style={{ animation: "fade-in-up 320ms cubic-bezier(0.23,1,0.32,1) both" }}>
                  <input type="checkbox" checked={feeConfirmed} onChange={(e) => setFeeConfirmed(e.target.checked)} className="accent-accent-blue mt-0.5 size-4 rounded" />
                  <span className="text-ink text-sm">I confirm the onboarding fee has been paid, or will be settled within 48 hours.</span>
                </label>
              )}

              <Button onClick={next} disabled={!reraOk} className="bg-brand-blue hover:bg-brand-blue-hover mt-1 h-12 w-full rounded-lg text-sm font-semibold text-white">
                Continue <ArrowRight className="size-4" />
              </Button>
            </Section>
          )}

          {step === "projects" && (
            <Section title="Add your projects" subtitle="Paste any links your agent can learn from. You can skip this and add them later.">
              <Field label="Project links" optional hint="Website, video walkthrough, or brochure URL. One per line.">
                <textarea
                  value={projectLinks}
                  onChange={(e) => setProjectLinks(e.target.value)}
                  rows={4}
                  placeholder="https://your-project-site.com"
                  className="text-ink placeholder:text-ink-muted/55 focus:border-accent-blue/60 w-full resize-none rounded-lg border border-black/15 bg-white px-3.5 py-3 text-sm outline-none transition-colors"
                />
              </Field>
              <Button onClick={() => go("done")} className="bg-brand-blue hover:bg-brand-blue-hover mt-1 h-12 w-full rounded-lg text-sm font-semibold text-white">
                Finish setup <ArrowRight className="size-4" />
              </Button>
              <button type="button" onClick={() => go("done")} className="text-ink-muted hover:text-ink mx-auto text-sm font-medium outline-none">
                Skip for now
              </button>
            </Section>
          )}

          {step === "done" && (
            <div className="text-center">
              <span
                className="bg-brand-green/10 text-brand-green mx-auto grid size-16 place-items-center rounded-2xl"
                style={{ animation: "scale-in 360ms cubic-bezier(0.23,1,0.32,1) both" }}
              >
                <CheckCircle2 className="size-9" />
              </span>
              <h1 className="text-ink mt-5 text-2xl font-bold">You&apos;re all set, {fullName.split(" ")[0] || "there"}</h1>
              <p className="text-ink-muted mx-auto mt-2 max-w-sm text-sm">
                Your AI agent is being prepared. Your onboarding specialist will reach you within 4 hours to take it live.
              </p>
              <Button
                onClick={finish}
                disabled={submitting}
                className="bg-brand-green hover:bg-brand-green-hover mx-auto mt-6 h-12 w-full max-w-xs rounded-lg text-sm font-semibold text-white"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Enter your dashboard
              </Button>
              <p className="text-ink-muted/70 mt-4 text-xs">By continuing you agree to TryThat.ai&apos;s Terms &amp; Privacy Policy.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ------------------------------- primitives ------------------------------- */

function Section({ icon, title, subtitle, children }: { icon?: React.ReactNode; title: React.ReactNode; subtitle: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ animation: "fade-in-up 420ms cubic-bezier(0.23,1,0.32,1) both" }}>
      {icon && <div className="mb-4">{icon}</div>}
      <h1 className="text-ink text-2xl font-bold sm:text-[28px]">{title}</h1>
      <p className="text-ink-muted mt-2 text-sm">{subtitle}</p>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, optional, hint, children }: { label: string; optional?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-ink mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        {label}
        {optional && <span className="text-ink-muted/60 text-xs font-normal">(Optional)</span>}
      </span>
      {children}
      {hint && <span className="text-ink-muted/70 mt-1.5 block text-xs">{hint}</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  autoFocus,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  inputMode?: "text" | "numeric";
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      inputMode={inputMode}
      className="text-ink placeholder:text-ink-muted/50 focus:border-accent-blue/60 h-11 w-full rounded-lg border border-black/15 bg-white px-3.5 text-sm outline-none transition-colors"
    />
  );
}

function PhoneInput({
  value,
  onChange,
  disabled,
  whatsapp,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  whatsapp?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className={cn("flex h-11 items-stretch overflow-hidden rounded-lg border border-black/15 bg-white transition-colors focus-within:border-accent-blue/60", disabled && "opacity-70")}>
      <span className="text-ink flex items-center gap-1.5 border-r border-black/10 bg-black/[0.03] px-3 text-sm font-medium">
        {whatsapp && <span className="bg-brand-green grid size-4 place-items-center rounded-full text-[9px] font-bold text-white">W</span>}
        +91
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        placeholder="98765 43210"
        inputMode="numeric"
        disabled={disabled}
        autoFocus={autoFocus}
        className="text-ink placeholder:text-ink-muted/50 min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}

function OtpBoxes({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const edit = (i: number, ch: string) => {
    const nextArr = [...value];
    nextArr[i] = ch;
    onChange(nextArr);
  };
  return (
    <div className="flex gap-2 sm:gap-2.5">
      {value.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={c}
          inputMode="numeric"
          maxLength={1}
          autoFocus={i === 0}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            edit(i, d);
            if (d && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) {
              refs.current[i - 1]?.focus();
              edit(i - 1, "");
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
            if (!txt.length) return;
            const nextArr = [...value];
            txt.forEach((d, k) => { if (k < 6) nextArr[k] = d; });
            onChange(nextArr);
            refs.current[Math.min(txt.length, 5)]?.focus();
          }}
          className={cn(
            "size-12 rounded-xl border bg-white text-center text-lg font-semibold text-ink outline-none transition-colors focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20",
            c ? "border-black/25" : "border-black/12"
          )}
        />
      ))}
    </div>
  );
}

function CitySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "focus:border-accent-blue/60 h-11 w-full appearance-none rounded-lg border border-black/15 bg-white px-3.5 pr-9 text-sm outline-none transition-colors",
          value ? "text-ink" : "text-ink-muted/55"
        )}
      >
        <option value="">Select your city</option>
        {CITIES.map((c) => (
          <option key={c} value={c} className="text-ink">{c}</option>
        ))}
      </select>
      <ArrowRight className="text-ink-muted/60 pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 rotate-90" />
    </div>
  );
}

function SelectTile({ selected, onClick, icon: Icon, label }: { selected: boolean; onClick: () => void; icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        selected ? "border-accent-blue bg-accent-blue/[0.05] ring-1 ring-accent-blue/30" : "border-black/10 bg-white hover:border-black/25"
      )}
    >
      <span className={cn("grid size-9 place-items-center rounded-full transition-colors", selected ? "bg-accent-blue text-white" : "bg-black/[0.04] text-ink-muted")}>
        <Icon className="size-4" />
      </span>
      <span className={cn("text-xs font-semibold", selected ? "text-ink" : "text-ink-muted")}>{label}</span>
    </button>
  );
}

function ReraTile({ selected, onClick, icon: Icon, title, sub }: { selected: boolean; onClick: () => void; icon: LucideIcon; title: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3.5 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-accent-blue/40",
        selected ? "border-accent-blue bg-accent-blue/[0.05] ring-1 ring-accent-blue/30" : "border-black/10 bg-white hover:border-black/25"
      )}
    >
      <span className={cn("grid size-8 place-items-center rounded-full transition-colors", selected ? "bg-accent-blue text-white" : "bg-black/[0.04] text-ink-muted")}>
        <Icon className="size-4" />
      </span>
      <span className="text-ink text-sm font-semibold">{title}</span>
      <span className="text-ink-muted text-xs leading-snug">{sub}</span>
    </button>
  );
}
