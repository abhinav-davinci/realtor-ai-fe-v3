"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { contactIdFor, initialsOf, type Contact } from "@/lib/contacts";
import { INPUT, ModalShell, TagEditor } from "./ui";

/** Add or edit a single contact. Phone is required and is the dedupe key. */
export function ContactModal({
  contact,
  onClose,
  onSave,
}: {
  contact: Contact | null;
  onClose: () => void;
  onSave: (c: Contact) => void;
}) {
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [tags, setTags] = useState<string[]>(contact?.tags ?? []);
  const ok = phone.trim().length >= 6;

  function save() {
    if (!ok) return;
    const display = name.trim() || phone.trim();
    onSave({
      id: contact?.id ?? contactIdFor(phone),
      name: display,
      initials: initialsOf(display),
      phone: phone.trim(),
      tags,
      tier: contact?.tier ?? "new",
      source: contact?.source ?? "Manual",
      lastContacted: contact?.lastContacted ?? null,
      addedAt: contact?.addedAt ?? Date.now(),
    });
  }

  return (
    <ModalShell
      title={contact ? "Edit contact" : "Add contact"}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="text-ink h-10 rounded-lg border border-black/15 px-4 text-sm font-semibold transition-colors hover:bg-black/[0.04] active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!ok}
            className={cn(
              "h-10 rounded-lg px-4 text-sm font-semibold transition-[background-color,transform] duration-150",
              ok ? "bg-brand-green hover:bg-brand-green-hover text-white active:scale-[0.98]" : "text-ink-muted cursor-not-allowed bg-black/[0.06]"
            )}
          >
            {contact ? "Save Changes" : "Add Contact"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-ink mb-1.5 block text-sm font-medium">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ketan Mehta" className={INPUT} />
        </div>
        <div>
          <label className="text-ink mb-1.5 block text-sm font-medium">
            Phone <span className="text-red-500">*</span>
          </label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+91 98765 43210" className={INPUT} />
        </div>
        <div>
          <label className="text-ink mb-1.5 block text-sm font-medium">Tags</label>
          <TagEditor value={tags} onChange={setTags} />
        </div>
      </div>
    </ModalShell>
  );
}
