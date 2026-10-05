"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createDraft, setLastLang } from "@/lib/drafts";
import { useUI } from "@/lib/locale";
import type { Card } from "@/lib/model";

/** The assistant's note travels with the new draft to the editor (this tab only). */
export const noteKey = (draftId: string) => `me:note:${draftId}`;

/**
 * Say what you're celebrating, get a letter: the server turns the description into a draft
 * (occasion, style, language, blocks, guests) and the editor opens on it with a note on what's left.
 */
export function Assistant() {
  const ui = useUI();
  const a = ui.assistant;
  const router = useRouter();
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "failed" | "limited">("idle");

  const go = async () => {
    if (text.trim().length < 8 || state === "busy") return;
    setState("busy");
    try {
      const now = new Date();
      const today = `${now.toLocaleDateString("en", { weekday: "long" })} ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const r = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, today }) });
      if (r.status === 429) return setState("limited");
      if (!r.ok) throw new Error(String(r.status));
      const { card, guests, notes } = (await r.json()) as { card: Card; guests: { id: string; name: string }[]; notes: string };
      setLastLang(card.lang);
      const id = createDraft(card, { guests });
      try { sessionStorage.setItem(noteKey(id), notes); } catch {}
      router.push(`/edit/${id}`);
    } catch {
      setState("failed");
    }
  };

  return (
    <form className="w-full max-w-xl" onSubmit={(e) => { e.preventDefault(); void go(); }}>
      <div className="rounded-2xl border border-dashed border-ink/25 bg-sheet/60 p-2 focus-within:border-violet">
        <textarea value={text} onChange={(e) => { setText(e.target.value); if (state !== "busy") setState("idle"); }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void go(); } }}
          rows={3} maxLength={2000} placeholder={a.placeholder} aria-label={a.label} disabled={state === "busy"}
          className="block w-full resize-none bg-transparent px-2 py-1.5 font-hand text-lg outline-none placeholder:text-muted/70" />
        <div className="flex items-center justify-end gap-3 px-1">
          {state === "failed" && <span className="text-sm text-wax">{a.failed}</span>}
          {state === "limited" && <span className="text-sm text-wax">{a.limited}</span>}
          <button type="submit" disabled={text.trim().length < 8 || state === "busy"}
            className="inline-flex items-center gap-2 rounded-full bg-violet px-4 py-1.5 font-hand text-lg text-white transition-opacity disabled:opacity-40">
            {state === "busy" ? <><Loader2 size={17} className="animate-spin" /> {a.working}</> : <><Sparkles size={17} /> {a.go}</>}
          </button>
        </div>
      </div>
    </form>
  );
}

/** What the assistant prepared and what's left to fill in, on top of the letter it made. Closed for good with ×. */
export function AssistantNote({ draftId }: { draftId: string }) {
  const ui = useUI();
  const [note, setNote] = useState(() => {
    try { return typeof window === "undefined" ? null : sessionStorage.getItem(noteKey(draftId)); } catch { return null; }
  });
  if (!note) return null;
  const close = () => {
    try { sessionStorage.removeItem(noteKey(draftId)); } catch {}
    setNote(null);
  };
  return (
    <aside className="relative mx-auto mb-4 max-w-[36rem] rounded-xl border border-dashed border-violet/40 bg-violet-soft/40 p-4 pr-10 font-hand" aria-label={ui.assistant.note}>
      <p className="flex gap-2 text-lg leading-snug"><Sparkles size={18} className="mt-1 shrink-0 text-violet" /> {note}</p>
      <button type="button" onClick={close} aria-label={ui.thanks.close} title={ui.thanks.close}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink">
        <X size={16} />
      </button>
    </aside>
  );
}
