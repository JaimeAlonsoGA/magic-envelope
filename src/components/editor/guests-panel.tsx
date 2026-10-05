"use client";

import { ClipboardList, Contact, Eye, Plus, Trash2, TriangleAlert } from "lucide-react";
import { nanoid } from "nanoid";
import { useState } from "react";
import { newBlock } from "@/lib/blocks";
import { val } from "@/lib/fields";
import type { Card, Draft, Guest } from "@/lib/model";
import { NAME_TOKEN, fallbackName, usesName } from "@/lib/personalize";
import { UI } from "@/lib/ui";
import { SketchButton } from "../sketch";

const G = UI.guests;

/** "Lucía, +34 600…, lucia@x.com" → a guest. Contact bits are recognised by the shared field validators. */
function parseGuest(line: string): Guest | null {
  const parts = line.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
  const name = parts.find((p) => !val("phone", p) && !val("email", p));
  if (!name) return null;
  const phone = parts.map((p) => val("phone", p)).find(Boolean) ?? undefined;
  const email = parts.map((p) => val("email", p)).find(Boolean) ?? undefined;
  return { id: nanoid(6), name: name.slice(0, 80), phone, email };
}

/** One "phone or email" input mapped onto the guest's typed contact fields. */
function setContact(g: Guest, raw: string): Guest {
  const v = raw.trim();
  return v.includes("@") ? { ...g, email: v || undefined, phone: undefined } : { ...g, phone: v || undefined, email: undefined };
}

type ContactsApi = { select: (props: string[], opts: { multiple: boolean }) => Promise<{ name?: string[]; tel?: string[]; email?: string[] }[]> };

export function GuestsPanel({ draft, setGuests, setCard, previewId, setPreviewId }: {
  draft: Draft;
  setGuests: (g: Guest[]) => void;
  setCard: (p: Partial<Card>) => void;
  previewId: string | null;
  setPreviewId: (id: string | null) => void;
}) {
  const guests = draft.guests ?? [];
  const card = draft.card;
  const [name, setName] = useState("");
  const [pasting, setPasting] = useState(false);
  const [list, setList] = useState("");
  const contacts = typeof navigator !== "undefined" && "contacts" in navigator ? (navigator as unknown as { contacts: ContactsApi }).contacts : null;

  const add = (more: Guest[]) => setGuests([...guests, ...more].slice(0, 1000));
  const addOne = () => {
    const g = parseGuest(name);
    if (g) add([g]);
    setName("");
  };
  const fromContacts = async () => {
    const picked = await contacts!.select(["name", "tel", "email"], { multiple: true }).catch(() => []);
    add(picked.filter((c) => c.name?.[0]).map((c) => ({
      id: nanoid(6), name: c.name![0].slice(0, 80),
      phone: c.tel?.map((x) => val("phone", x)).find(Boolean) ?? undefined,
      email: c.email?.map((x) => val("email", x)).find(Boolean) ?? undefined,
    })));
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">{G.hint}</p>

      {guests.length > 0 && !usesName(card) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-highlight/60 px-3 py-2 text-sm">
          <TriangleAlert size={16} className="shrink-0" /> {G.notUsed}
          <button type="button" className="ml-auto font-bold underline underline-offset-4"
            onClick={() => setCard({ blocks: [{ ...newBlock("heading"), text: NAME_TOKEN, size: "md" } as Card["blocks"][number], ...card.blocks] })}>
            {G.addGreeting}
          </button>
        </div>
      )}

      {/* add */}
      <div className="flex gap-2">
        <input className="field text-lg" value={name} placeholder={G.namePh} aria-label={G.namePh} maxLength={120}
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOne())} />
        <SketchButton tone="primary" size="icon" aria-label={G.add} title={G.add} disabled={!name.trim()} onClick={addOne}><Plus size={20} /></SketchButton>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <SketchButton size="sm" active={pasting} onClick={() => setPasting(!pasting)}><ClipboardList size={16} /> {G.paste}</SketchButton>
        {contacts && <SketchButton size="sm" onClick={fromContacts}><Contact size={16} /> {G.contacts}</SketchButton>}
      </div>
      {pasting && (
        <div className="space-y-2">
          <textarea className="field min-h-28 resize-y" value={list} placeholder={G.pastePh} onChange={(e) => setList(e.target.value)} />
          <SketchButton size="sm" tone="primary" disabled={!list.trim()}
            onClick={() => { add(list.split("\n").map(parseGuest).filter((g): g is Guest => !!g)); setList(""); setPasting(false); }}>
            {G.importList}
          </SketchButton>
        </div>
      )}

      {/* list */}
      {guests.length > 0 && (
        <ul className="divide-y divide-ink/10">
          {guests.map((g) => {
            const contact = g.email ?? g.phone ?? "";
            const bad = !!contact && !val("phone", contact) && !val("email", contact);
            const watching = previewId === g.id;
            return (
              <li key={g.id} className="flex items-center gap-1.5 py-1.5">
                <input className="field min-w-0 flex-[1.2] text-base" value={g.name} aria-label={G.namePh} maxLength={80}
                  onChange={(e) => setGuests(guests.map((x) => (x.id === g.id ? { ...x, name: e.target.value } : x)))} />
                <input className={`field min-w-0 flex-1 text-sm ${bad ? "!border-wax" : ""}`} value={contact} placeholder={G.contactPh} aria-label={G.contactPh}
                  aria-invalid={bad || undefined} inputMode="email"
                  onChange={(e) => setGuests(guests.map((x) => (x.id === g.id ? setContact(x, e.target.value) : x)))} />
                {/* exactly one example guest: the editor and preview show the letter as they'd receive it */}
                <button type="button" role="radio" aria-checked={watching} aria-label={`${G.previewAs} ${g.name}`} title={watching ? "Example guest" : "Use as example"}
                  onClick={() => setPreviewId(g.id)}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${watching ? "bg-violet-soft text-violet" : "text-muted/60 hover:bg-ink/5 hover:text-muted"}`}>
                  <Eye size={16} />
                </button>
                <button type="button" aria-label={UI.delete} onClick={() => { setGuests(guests.filter((x) => x.id !== g.id)); if (watching) setPreviewId(null); /* falls back to the first guest */ }}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-wax">
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <label className="flex items-center gap-2 text-sm text-muted">
        <span className="shrink-0">{G.fallback}</span>
        <input className="field text-base text-ink" value={card.nameFallback ?? ""} placeholder={fallbackName({ ...card, nameFallback: undefined })} maxLength={60}
          onChange={(e) => setCard({ nameFallback: e.target.value || undefined })} />
      </label>
    </div>
  );
}
