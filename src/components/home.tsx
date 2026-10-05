"use client";

import { CopyPlus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cardTitle } from "@/lib/blocks";
import { deleteDraft, duplicateDraft, useDrafts } from "@/lib/drafts";
import { envelopeOf } from "@/lib/envelope";
import { useFlash } from "@/lib/hooks";
import { useLang, useUI } from "@/lib/locale";
import type { Draft } from "@/lib/model";
import { haptic } from "@/lib/native";
import { EnvelopeBack, envelopeLift, envelopeStill, type EnvModel } from "./craft";
import { Assistant } from "./assistant";
import { SiteFooter } from "./site-footer";
import { RoughUnderline } from "./sketch";

/** The home CTA: a classic sealed envelope. */
const CTA_ENVELOPE: EnvModel = { paper: "#e9d6ad", letter: "#f6ecd3", wax: "#a3172b", ink: "#3b2a1a", seal: "icon:sparkle", sealShape: "scallop", trim: "none", hand: "var(--font-kalam)", slots: {} };

const focusRing = "rounded-md focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-8 focus-visible:outline-violet";

/** A letter in the list: the same envelope, sealed once published. */
function DraftTile({ dr }: { dr: Draft }) {
  const ui = useUI();
  const router = useRouter();
  const [armed, arm] = useFlash(2500);
  const del = () => {
    if (!armed) { arm(); haptic("warn"); return; }
    deleteDraft(dr.id);
  };
  return (
    <li className="group/tile">
      <Link href={`/edit/${dr.id}`} className={`group block ${focusRing}`}>
        <div className={envelopeLift}>
          {/* list envelopes show the sealed back only: handwriting doesn't read at thumbnail size */}
          <EnvelopeBack env={{ ...envelopeOf(dr.card), slots: {} }} />
        </div>
      </Link>
      <div className="mt-2 flex items-center gap-1">
        <Link href={`/edit/${dr.id}`} className="min-w-0 flex-1 truncate text-lg leading-tight hover:text-wax">
          {cardTitle(dr.card)}
          {!!dr.guests?.length && <span className="ml-1.5 text-sm text-muted">· {ui.guests.count(dr.guests.length)}</span>}
          {dr.publishedId && <span className="ml-1.5 text-sm text-violet">· live</span>}
        </Link>
        <div className="flex shrink-0 transition-opacity sm:opacity-0 sm:group-focus-within/tile:opacity-100 sm:group-hover/tile:opacity-100">
          <button type="button" aria-label={ui.duplicate} title={ui.duplicate}
            onClick={() => { const id = duplicateDraft(dr.id); if (id) router.push(`/edit/${id}`); }}
            className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-ink">
            <CopyPlus size={16} />
          </button>
          <button type="button" aria-label={armed ? (dr.publishedId ? ui.confirmUnpublish : ui.confirmDelete) : ui.delete} title={armed ? (dr.publishedId ? ui.confirmUnpublish : ui.confirmDelete) : ui.delete} onClick={del}
            className={`grid h-9 w-9 place-items-center rounded-md transition-colors ${armed ? "bg-wax text-on-wax" : "text-muted hover:bg-ink/5 hover:text-wax"}`}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
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
