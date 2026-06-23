"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ListPlus, Pencil, PhoneCall, Plus, Search, Trash2, Upload, UserPlus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addContactsToList,
  CONTACTS_CHANGED_EVENT,
  deleteContacts,
  deleteContactList,
  listContactLists,
  listContacts,
  removeContactsFromList,
  saveContact,
  saveContactList,
  seedContactsIfNeeded,
  type Contact,
  type ContactList,
} from "@/lib/contacts";
import { ContactTable } from "./contact-table";
import { ContactModal } from "./contact-modal";
import { UploadContactsModal } from "./upload-contacts-modal";
import { ContactCallModal } from "./contact-call-modal";
import { AddToListModal, ContactPickerModal, ListModal } from "./list-modals";
import { ConfirmDialog, FilterSelect, INPUT, listTint } from "./ui";

type ListModalState = { mode: "create" | "rename"; list: ContactList | null; addIds?: string[] };
type ConfirmState =
  | { kind: "contacts"; ids: string[] }
  | { kind: "list"; list: ContactList }
  | null;

export function ContactsHub() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(() => {
    setContacts(listContacts());
    setLists(listContactLists());
  }, []);

  useEffect(() => {
    // Hydrate from localStorage on mount (external store, unavailable during SSR).
    seedContactsIfNeeded();
    /* eslint-disable react-hooks/set-state-in-effect */
    setContacts(listContacts());
    setLists(listContactLists());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Re-read when a background write lands (e.g. a calling run syncs outcomes
  // back). Registering a listener only — no synchronous setState here.
  useEffect(() => {
    window.addEventListener(CONTACTS_CHANGED_EVENT, reload);
    return () => window.removeEventListener(CONTACTS_CHANGED_EVENT, reload);
  }, [reload]);

  // filters + selection
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [listFilter, setListFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  // modals
  const [contactModal, setContactModal] = useState<{ contact: Contact | null } | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [listModal, setListModal] = useState<ListModalState | null>(null);
  const [addToList, setAddToList] = useState<{ ids: string[] } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  const activeList = listFilter === "all" ? null : lists.find((l) => l.id === listFilter) ?? null;

  const base = useMemo(
    () => (activeList ? contacts.filter((c) => activeList.contactIds.includes(c.id)) : contacts),
    [contacts, activeList]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return base.filter((c) => {
      if (tagFilter !== "all" && !c.tags.includes(tagFilter)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (digits && c.phone.replace(/\D/g, "").includes(digits)) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [base, query, tagFilter]);

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return [{ value: "all", label: "All tags" }, ...[...set].sort().map((t) => ({ value: t, label: t }))];
  }, [contacts]);
  const listOptions = useMemo(
    () => [
      { value: "all", label: `All contacts (${contacts.length})` },
      ...lists.map((l) => ({ value: l.id, label: `${l.name} (${l.contactIds.length})` })),
    ],
    [contacts.length, lists]
  );
  const filtersOn = query.trim() !== "" || tagFilter !== "all";

  /* --------------------------------- actions -------------------------------- */

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSel = filtered.length > 0 && filtered.every((c) => next.has(c.id));
      filtered.forEach((c) => (allSel ? next.delete(c.id) : next.add(c.id)));
      return next;
    });
  }
  const clearSel = () => setSelected(new Set());

  function onSaveContact(c: Contact) {
    saveContact(c);
    setContactModal(null);
    reload();
  }
  function doDelete(ids: string[]) {
    deleteContacts(ids);
    setConfirm(null);
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    reload();
  }

  function onSaveList(l: ContactList) {
    saveContactList(l);
    const addIds = listModal?.addIds;
    if (addIds?.length) {
      addContactsToList(l.id, addIds);
      clearSel();
    }
    const wasCreate = listModal?.mode === "create";
    setListModal(null);
    setAddToList(null);
    reload();
    if (wasCreate && !addIds) setListFilter(l.id);
  }
  function pickListFor(ids: string[], listId: string) {
    addContactsToList(listId, ids);
    setAddToList(null);
    clearSel();
    reload();
  }
  function addToActiveList(ids: string[]) {
    if (!activeList) return;
    addContactsToList(activeList.id, ids);
    setPickerOpen(false);
    reload();
  }
  function removeFromActive(id: string) {
    if (!activeList) return;
    removeContactsFromList(activeList.id, [id]);
    reload();
  }
  function onDeleteList(l: ContactList) {
    deleteContactList(l.id);
    setConfirm(null);
    setListFilter("all");
    reload();
  }

  const hasContacts = contacts.length > 0;

  if (!ready) return <div className="h-full" aria-hidden />;

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-ink text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-ink-muted mt-1 text-sm">
            Your single source of truth. Upload, organise into lists, and call with an AI agent.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setContactModal({ contact: null })} className="text-ink h-9 rounded-lg border-black/15 px-3 text-sm font-semibold">
            <Plus className="size-4" /> Add Contact
          </Button>
          <Button variant="outline" onClick={() => setUploadOpen(true)} className="text-ink h-9 rounded-lg border-black/15 px-3 text-sm font-semibold">
            <Upload className="size-4" /> Upload
          </Button>
          <Button
            onClick={() => setCallOpen(true)}
            disabled={!hasContacts}
            className="bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-3.5 text-sm font-semibold text-white"
          >
            <PhoneCall className="size-4" /> Start AI Calling
          </Button>
        </div>
      </header>

      {hasContacts ? (
        <>
          {/* toolbar */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="text-ink-muted/60 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, number, or tag"
                className={cn(INPUT, "h-9 pl-9")}
              />
            </div>
            <FilterSelect label="Tags" value={tagFilter} options={tagOptions} onChange={setTagFilter} />
            <FilterSelect label="List" value={listFilter} options={listOptions} onChange={(v) => { setListFilter(v); clearSel(); }} />
            <button
              type="button"
              onClick={() => setListModal({ mode: "create", list: null })}
              className="text-ink-muted hover:border-accent-blue/40 hover:text-accent-blue inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-black/20 px-3 text-sm font-semibold transition-colors"
            >
              <ListPlus className="size-4" /> Create list
            </button>
          </div>

          {/* active-list management strip */}
          {activeList && (
            <div
              className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-black/[0.07] bg-black/[0.015] px-3.5 py-2.5"
              style={{ animation: "fade-in-up 200ms cubic-bezier(0.23,1,0.32,1) both" }}
            >
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", listTint(activeList.color))}>
                {activeList.name}
              </span>
              <span className="text-ink-muted text-xs">{activeList.contactIds.length} contact{activeList.contactIds.length === 1 ? "" : "s"}</span>
              <div className="ml-auto flex items-center gap-1.5">
                <button type="button" onClick={() => setPickerOpen(true)} className="text-accent-blue hover:bg-accent-blue/[0.08] inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors">
                  <UserPlus className="size-3.5" /> Add contacts
                </button>
                <button type="button" onClick={() => setListModal({ mode: "rename", list: activeList })} aria-label="Rename list" className="text-ink-muted hover:bg-black/[0.05] hover:text-ink grid size-8 place-items-center rounded-lg transition-colors">
                  <Pencil className="size-4" />
                </button>
                <button type="button" onClick={() => setConfirm({ kind: "list", list: activeList })} aria-label="Delete list" className="text-ink-muted hover:bg-red-50 hover:text-red-500 grid size-8 place-items-center rounded-lg transition-colors">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* bulk bar */}
          {selected.size > 0 && (
            <div
              className="bg-ink mt-3 flex flex-wrap items-center gap-2 rounded-xl px-3.5 py-2.5 text-white"
              style={{ animation: "fade-in-up 180ms cubic-bezier(0.23,1,0.32,1) both" }}
            >
              <span className="text-sm font-semibold tabular-nums">{selected.size} selected</span>
              <div className="ml-auto flex items-center gap-1.5">
                <button type="button" onClick={() => setAddToList({ ids: [...selected] })} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-xs font-semibold hover:bg-white/25">
                  <ListPlus className="size-3.5" /> Add to list
                </button>
                <button type="button" onClick={() => setConfirm({ kind: "contacts", ids: [...selected] })} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-xs font-semibold hover:bg-white/25">
                  <Trash2 className="size-3.5" /> Delete
                </button>
                <button type="button" onClick={clearSel} aria-label="Clear selection" className="grid size-8 place-items-center rounded-lg hover:bg-white/15">
                  <X className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* table or filtered-empty */}
          <div className="mt-4">
            {filtered.length > 0 ? (
              <ContactTable
                contacts={filtered}
                lists={lists}
                selected={selected}
                onToggle={toggle}
                onToggleAll={toggleAll}
                onEdit={(c) => setContactModal({ contact: c })}
                onDelete={(id) => setConfirm({ kind: "contacts", ids: [id] })}
                activeListId={activeList?.id ?? null}
                onRemoveFromList={activeList ? removeFromActive : undefined}
              />
            ) : activeList && base.length === 0 ? (
              <EmptyCard
                icon={Users}
                title="This list is empty"
                body="Add contacts from your book to start organising this list."
                action={<Button onClick={() => setPickerOpen(true)} className="bg-brand-blue hover:bg-brand-blue-hover h-9 rounded-lg px-3.5 text-sm font-semibold text-white"><UserPlus className="size-4" /> Add contacts</Button>}
              />
            ) : (
              <EmptyCard
                icon={Search}
                title="No contacts match"
                body="Try a different search or clear the filters."
                action={
                  <Button variant="outline" onClick={() => { setQuery(""); setTagFilter("all"); }} className="text-ink h-9 rounded-lg border-black/15 px-3.5 text-sm font-semibold">
                    Clear filters
                  </Button>
                }
              />
            )}
          </div>

          {filtered.length > 0 && (
            <p className="text-ink-muted mt-3 text-xs">
              Showing {filtered.length} of {contacts.length} contact{contacts.length === 1 ? "" : "s"}
              {filtersOn && " (filtered)"}.
            </p>
          )}
        </>
      ) : (
        /* zero contacts */
        <div className="mt-10">
          <EmptyCard
            icon={Users}
            title="No contacts yet"
            body="Upload an Excel or CSV and AI will extract and de-duplicate them, or add one by hand. This becomes your single source of truth for AI calling."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={() => setUploadOpen(true)} className="bg-brand-blue hover:bg-brand-blue-hover h-10 rounded-lg px-4 text-sm font-semibold text-white">
                  <Upload className="size-4" /> Upload contacts
                </Button>
                <Button variant="outline" onClick={() => setContactModal({ contact: null })} className="text-ink h-10 rounded-lg border-black/15 px-4 text-sm font-semibold">
                  <Plus className="size-4" /> Add one manually
                </Button>
              </div>
            }
          />
        </div>
      )}

      {/* ------------------------------- modals ------------------------------- */}
      {contactModal && <ContactModal contact={contactModal.contact} onClose={() => setContactModal(null)} onSave={onSaveContact} />}
      {uploadOpen && <UploadContactsModal onClose={() => setUploadOpen(false)} onImported={() => reload()} />}
      {callOpen && <ContactCallModal onClose={() => setCallOpen(false)} />}
      {listModal && <ListModal list={listModal.list} onClose={() => setListModal(null)} onSave={onSaveList} />}
      {addToList && (
        <AddToListModal
          count={addToList.ids.length}
          lists={lists}
          onClose={() => setAddToList(null)}
          onPick={(listId) => pickListFor(addToList.ids, listId)}
          onCreate={() => setListModal({ mode: "create", list: null, addIds: addToList.ids })}
        />
      )}
      {pickerOpen && activeList && (
        <ContactPickerModal
          listName={activeList.name}
          candidates={contacts.filter((c) => !activeList.contactIds.includes(c.id))}
          onClose={() => setPickerOpen(false)}
          onAdd={addToActiveList}
        />
      )}
      <ConfirmDialog
        open={confirm?.kind === "contacts"}
        title={`Delete ${confirm?.kind === "contacts" ? confirm.ids.length : 0} contact${confirm?.kind === "contacts" && confirm.ids.length === 1 ? "" : "s"}?`}
        message="They will be removed from your book and every list. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => confirm?.kind === "contacts" && doDelete(confirm.ids)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.kind === "list"}
        title="Delete this list?"
        message="The list is removed. The contacts in it stay in your book."
        confirmLabel="Delete list"
        onConfirm={() => confirm?.kind === "list" && onDeleteList(confirm.list)}
        onCancel={() => setConfirm(null)}
      />
    </div>
    </div>
  );
}

/* -------------------------------- empty card ------------------------------- */

function EmptyCard({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof Users;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div
      className="grid place-items-center rounded-2xl border border-dashed border-black/12 bg-white px-6 py-14 text-center"
      style={{ animation: "fade-in-up 240ms cubic-bezier(0.23,1,0.32,1) both" }}
    >
      <span className="bg-accent-blue/10 text-accent-blue grid size-14 place-items-center rounded-2xl">
        <Icon className="size-7" />
      </span>
      <h2 className="text-ink mt-4 text-lg font-bold">{title}</h2>
      <p className="text-ink-muted mx-auto mt-1.5 max-w-md text-sm leading-relaxed">{body}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}
