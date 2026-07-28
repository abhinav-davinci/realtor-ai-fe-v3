"use client";

/**
 * Inviting someone, in two beats on one surface: the form, then the
 * confirmation. Sending is a rare, deliberate act, so the confirmation earns a
 * small celebration (the same confetti recipe as the other one-shot successes).
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check, CircleAlert, UserRoundPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { INVITE_TTL_DAYS, type MemberRole } from "@/lib/team";
import { EASE, INPUT, RolePill } from "./team-ui";
import { RoleChooser } from "./role-cards";

/** A few colours for the success burst (rare moment, so a little delight). */
const CONFETTI: { tx: number; r: number; color: string }[] = [
  { tx: -46, r: -90, color: "bg-brand-orange" },
  { tx: -16, r: 40, color: "bg-accent-blue" },
  { tx: 18, r: -40, color: "bg-brand-green" },
  { tx: 48, r: 100, color: "bg-brand-orange" },
];

export interface SentInvite {
  name: string;
  email: string;
  role: MemberRole;
}

export function InviteMemberModal({
  seatsRemaining,
  onClose,
  onSend,
  onDone,
}: {
  seatsRemaining: number;
  onClose: () => void;
  /** Returns an error message to show inline, or null when it went through. */
  onSend: (input: SentInvite) => string | null;
  /** Closing via "Back to Team" after at least one invitation went out. */
  onDone: () => void;
}) {
  const [sent, setSent] = useState<SentInvite | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (sent ? onDone() : onClose());
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sent, onClose, onDone]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={sent ? "Invitation sent" : "Invite new member"}
    >
      {/* One backdrop across both beats, so the surface reads as transforming
          rather than as two separate dialogs. */}
      <div
        className="bg-ink/40 absolute inset-0"
        style={{ animation: `fade-in 150ms ${EASE} both` }}
        onClick={sent ? onDone : onClose}
        aria-hidden
      />
      {sent ? (
        <SuccessCard invite={sent} onAnother={() => setSent(null)} onDone={onDone} />
      ) : (
        <InviteForm seatsRemaining={seatsRemaining} onClose={onClose} onSend={onSend} onSent={setSent} />
      )}
    </div>
  );
}

/* ---------------------------------- form ---------------------------------- */

function InviteForm({
  seatsRemaining,
  onClose,
  onSend,
  onSent,
}: {
  seatsRemaining: number;
  onClose: () => void;
  onSend: (input: SentInvite) => string | null;
  onSent: (input: SentInvite) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("admin");
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const ok = name.trim().length > 0 && email.trim().length > 0;

  function submit() {
    if (!ok) return;
    const invite = { name: name.trim(), email: email.trim(), role };
    const err = onSend(invite);
    if (err) {
      setError(err);
      return;
    }
    onSent(invite);
  }

  return (
    <div className="modal-pop relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl shadow-black/25">
      <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="bg-accent-blue/10 text-accent-blue grid size-9 shrink-0 place-items-center rounded-full">
            <UserRoundPlus className="size-[18px]" />
          </span>
          <h2 className="text-ink text-base font-bold">Invite New Member</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-muted hover:bg-black/[0.05] hover:text-ink grid size-8 place-items-center rounded-lg transition-colors"
        >
          <X className="size-4.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <p className="text-brand-orange bg-brand-orange/[0.07] flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-relaxed">
          <CircleAlert className="mt-px size-4 shrink-0" />
          An email invitation will be sent. Once accepted, the member can log in and is audit-logged automatically.
        </p>

        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div>
            <label htmlFor="invite-name" className="text-ink mb-2 block text-sm font-semibold">
              Full Name
            </label>
            <input
              id="invite-name"
              ref={nameRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="Enter member name"
              className={cn(INPUT, "bg-cream-panel")}
            />
          </div>
          <div>
            <label htmlFor="invite-email" className="text-ink mb-2 block text-sm font-semibold">
              Email Address
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Enter email address"
              aria-describedby={error ? "invite-error" : undefined}
              className={cn(INPUT, "bg-cream-panel", error && "border-red-300")}
            />
          </div>
          <button type="submit" className="hidden" aria-hidden />
        </form>

        <div className="mt-5">
          <RoleChooser value={role} onChange={setRole} />
        </div>

        {error && (
          <p
            id="invite-error"
            className="mt-3 text-xs font-medium text-red-600"
            style={{ animation: `fade-in-up 200ms ${EASE} both` }}
          >
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] px-5 py-3.5">
        <p className="text-ink-muted text-xs tabular-nums">
          1 seat will be used. {Math.max(0, seatsRemaining - 1)} will remain.
        </p>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!ok}
            className={cn(
              "h-10 rounded-lg px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40",
              ok
                ? "bg-brand-blue hover:bg-brand-blue-hover text-white active:scale-[0.98]"
                : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
            )}
          >
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- success --------------------------------- */

function SuccessCard({
  invite,
  onAnother,
  onDone,
}: {
  invite: SentInvite;
  onAnother: () => void;
  onDone: () => void;
}) {
  const doneRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    doneRef.current?.focus();
  }, []);

  return (
    <div className="modal-pop relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl shadow-black/25">
      <div className="relative mx-auto size-16">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              "absolute top-1/2 left-1/2 size-1.5 rounded-[2px] opacity-0 motion-safe:animate-[confetti-pop_1100ms_ease-out_forwards]",
              c.color
            )}
            style={
              {
                "--tx": `${c.tx}px`,
                "--peak-y": "-50px",
                "--fall-y": "92px",
                "--r": `${c.r}deg`,
                animationDelay: `${120 + i * 50}ms`,
              } as CSSProperties
            }
          />
        ))}
        <span className="bg-brand-green relative grid size-full place-items-center rounded-full text-white motion-safe:animate-[success-pop_460ms_cubic-bezier(0.23,1,0.32,1)_both]">
          <Check className="size-9" strokeWidth={3} />
        </span>
      </div>

      <h2
        className="text-ink mt-4 text-lg font-bold motion-safe:opacity-0 motion-safe:animate-[fade-in-up_360ms_ease-out_both]"
        style={{ animationDelay: "140ms" }}
      >
        Invitation Sent Successfully
      </h2>
      <p
        className="text-ink-muted mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-pretty motion-safe:opacity-0 motion-safe:animate-[fade-in-up_360ms_ease-out_both]"
        style={{ animationDelay: "210ms" }}
      >
        <span className="text-ink font-semibold">{invite.name}</span> will receive an email at{" "}
        <span className="text-accent-blue font-medium">{invite.email}</span> to join your team.{" "}
        <span className="text-brand-orange font-semibold">It expires in {INVITE_TTL_DAYS} days.</span>
      </p>

      <div
        className="mt-3 flex items-center justify-center gap-2 motion-safe:opacity-0 motion-safe:animate-[fade-in-up_360ms_ease-out_both]"
        style={{ animationDelay: "260ms" }}
      >
        <RolePill role={invite.role} />
        <span className="text-ink-muted text-xs">Access assigned</span>
      </div>

      <div
        className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center motion-safe:opacity-0 motion-safe:animate-[fade-in-up_360ms_ease-out_both]"
        style={{ animationDelay: "310ms" }}
      >
        <button
          type="button"
          onClick={onAnother}
          className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
        >
          Invite another member
        </button>
        <button
          ref={doneRef}
          type="button"
          onClick={onDone}
          className="group bg-brand-blue hover:bg-brand-blue-hover inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
        >
          Back to Team
          <ArrowRight className="size-4 transition-transform duration-150 ease-out motion-safe:group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

/** Shown instead of the form when the plan has no seat left. */
export function SeatLimitModal({
  used,
  total,
  planName,
  onClose,
  onRemoveMember,
}: {
  used: number;
  total: number;
  planName: string;
  onClose: () => void;
  onRemoveMember: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="seat-limit-title">
      <div className="bg-ink/40 absolute inset-0" style={{ animation: `fade-in 150ms ${EASE} both` }} onClick={onClose} aria-hidden />
      <div className="modal-pop relative w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl shadow-black/25">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-muted hover:bg-black/[0.05] hover:text-ink absolute top-3.5 right-3.5 grid size-8 place-items-center rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40"
        >
          <X className="size-4.5" />
        </button>

        <span className="mx-auto grid size-14 place-items-center rounded-full bg-red-50 text-red-500">
          <CircleAlert className="size-7" />
        </span>

        <h2 id="seat-limit-title" className="text-ink mt-4 text-lg font-bold">
          Seat limit reached
        </h2>
        <p className="text-ink mt-1.5 text-sm">
          Your {planName} plan has reached its limit of <span className="font-bold tabular-nums">{total}</span> members.
        </p>
        <p className="text-ink-muted mx-auto mt-1.5 max-w-sm text-xs leading-relaxed">
          To add a new team member, first remove an existing member or upgrade to a plan with more seats.
        </p>

        <p className="text-brand-orange bg-brand-orange/[0.08] mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tabular-nums">
          <span className="bg-brand-orange size-1.5 rounded-full" aria-hidden />
          Current plan: {planName} &middot; {used} / {total} seats used
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onRemoveMember}
            className="text-ink h-11 flex-1 rounded-lg border border-black/15 text-sm font-semibold transition-[background-color,transform] duration-150 ease-out outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-accent-blue/40 active:scale-[0.98]"
          >
            Remove a Member
          </button>
          <button
            type="button"
            className="bg-brand-orange hover:bg-brand-orange-hover h-11 flex-1 rounded-lg text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 active:scale-[0.98]"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
