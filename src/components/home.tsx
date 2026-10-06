"use client";

import { CalendarDays, CopyPlus, Eye, Link2, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { eventDate, listTitle } from "@/lib/blocks";
import { deleteDraft, duplicateDraft, useDrafts } from "@/lib/drafts";
import { envelopeOf } from "@/lib/envelope";
import { useFlash } from "@/lib/hooks";
import { useLang, useUI } from "@/lib/locale";
import type { Draft } from "@/lib/model";
import { haptic } from "@/lib/native";
import { Assistant } from "./assistant";
import { EnvelopeBack, envelopeLift, envelopeStill, type EnvModel } from "./craft";
import { SiteFooter } from "./site-footer";
import { RoughUnderline } from "./sketch";

/** The home CTA: a classic sealed envelope. */
const CTA_ENVELOPE: EnvModel = { paper: "#e9d6ad", letter: "#f6ecd3", wax: "#a3172b", ink: "#3b2a1a", seal: "icon:sparkle", sealShape: "scallop", trim: "none", hand: "var(--font-kalam)", slots: {} };

const focusRing = "rounded-md focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-8 focus-visible:outline-violet";

/** "17 Oct" this year, "17 Oct 2027" otherwise. */
const shortDate = (d: Date, lang: string) =>
  d.toLocaleDateString(lang, { day: "numeric", month: "short", ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}) });

/** "2 hours ago", in the reader's language. */
function relative(at: number, now: number, lang: string) {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const s = (at - now) / 1000;
  for (const [unit, size] of [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]] as const)
    if (Math.abs(s) >= size) return rtf.format(Math.round(s / size), unit);
  return rtf.format(0, "minute");
}

/** A letter in the list: the same envelope, sealed once published. */
function DraftTile({ dr }: { dr: Draft }) {
  const ui = useUI();
  const router = useRouter();
  const lang = useLang();
  const [armed, arm] = useFlash(2500);
  const [now] = useState(() => Date.now());
  const when = eventDate(dr.card);
  const guests = dr.guests?.filter((g) => g.name.trim()).length ?? 0;
  const del = () => {
    if (!armed) { arm(); haptic("warn"); return; }
    deleteDraft(dr.id);
  };
  return (
    <li className="group/tile relative">
      <Link href={`/edit/${dr.id}`} className={`group block ${focusRing}`}>
        <div className={envelopeLift}>
          {/* list envelopes show the sealed back only: handwriting doesn't read at thumbnail size */}
          <EnvelopeBack env={{ ...envelopeOf(dr.card), slots: {} }} />
        </div>
      </Link>
      {/* actions sit on the envelope's corner, so the title and details below get the full width */}
      <div className="absolute right-1.5 top-1.5 flex gap-0.5 rounded-lg bg-bg/85 p-0.5 shadow-sm backdrop-blur transition-opacity sm:opacity-0 sm:group-focus-within/tile:opacity-100 sm:group-hover/tile:opacity-100">
        <Link href={`/edit/${dr.id}/preview`} aria-label={ui.preview} title={ui.preview}
          className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink">
          <Eye size={15} />
        </Link>
        <button type="button" aria-label={ui.duplicate} title={ui.duplicate}
          onClick={() => { const id = duplicateDraft(dr.id); if (id) router.push(`/edit/${id}`); }}
          className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink">
          <CopyPlus size={15} />
        </button>
        <button type="button" aria-label={armed ? (dr.publishedId ? ui.confirmUnpublish : ui.confirmDelete) : ui.delete} title={armed ? (dr.publishedId ? ui.confirmUnpublish : ui.confirmDelete) : ui.delete} onClick={del}
          className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${armed ? "bg-wax text-on-wax" : "text-muted hover:bg-ink/5 hover:text-wax"}`}>
          <Trash2 size={15} />
        </button>
      </div>
      <Link href={`/edit/${dr.id}`} className="mt-2 block hover:text-wax">
        <span className="line-clamp-2 text-lg leading-tight">{listTitle(dr.card)}</span>
        {/* when it is, who it's for, whether it's out */}
        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-sm text-muted">
          {when
            ? <span className="inline-flex items-center gap-1 whitespace-nowrap"><CalendarDays size={13} />{shortDate(when, lang)}</span>
            : <span>{ui.tile.edited(relative(dr.updatedAt, now, lang))}</span>}
          {!!guests && <span className="inline-flex items-center gap-1"><Users size={13} />{guests}</span>}
          {dr.publishedId && <span className="inline-flex items-center gap-1 text-violet"><Link2 size={13} />{ui.tile.published}</span>}
        </span>
      </Link>
    </li>
  );
}

export function Home() {
  const ui = useUI();
  const lang = useLang();
  const drafts = useDrafts();

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col items-center px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(.75rem,env(safe-area-inset-top))]">
      {/* browsers offer "Install" themselves; the top stays clear */}
      <div className="h-11" />

      {/* wordmark in the app's own hand: Kalam + a hand-drawn wax-red stroke (letters keep their own styles) */}
      <h1 className="mt-6 text-center font-hand text-5xl font-bold leading-none tracking-tight sm:text-7xl">
        Magic <span className="relative inline-block">Envelope<RoughUnderline seed="wordmark" stroke="var(--wax)" /></span>
      </h1>
      <p className="mt-5 text-center font-hand text-lg text-muted">{ui.site.tagline}</p>

      {/* the fastest way in: say what it's for (on once the model provider is set up) */}
      {process.env.NEXT_PUBLIC_ASSISTANT === "on" && <div className="mt-10 flex w-full justify-center"><Assistant /></div>}

      {/* the CTA is the envelope itself: still, solid, and it answers the pointer */}
      <Link href="/new" className={`group mt-14 block w-60 sm:w-80 ${focusRing}`}>
        <div className={envelopeStill}>
          <EnvelopeBack env={CTA_ENVELOPE} />
        </div>
        <span className="mt-6 flex items-center justify-center gap-2 font-hand text-2xl transition-colors group-hover:text-wax">
          <Plus size={22} /> {ui.create}
        </span>
      </Link>

      {drafts.length > 0 && (
        <section className="mt-20 w-full">
          <h2 className="mb-5 font-hand text-xl text-muted">{ui.letters}</h2>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {drafts.map((dr) => <DraftTile key={dr.id} dr={dr} />)}
          </ul>
        </section>
      )}

      <div className="mt-auto w-full"><SiteFooter lang={lang} /></div>
    </div>
  );
}
