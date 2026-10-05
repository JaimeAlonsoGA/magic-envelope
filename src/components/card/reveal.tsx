"use client";

import { Check, PenLine, Printer, Share2, Sparkles } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cardTitle } from "@/lib/blocks";
import { useFlash, useLetterWidth } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import type { Card } from "@/lib/model";
import { hasFront } from "@/lib/mail";
import { share } from "@/lib/native";
import { EnvelopeOpener } from "../craft";
import { SketchButton, SketchLink } from "../sketch";
import { CardView, cardStyle, envelopeOf } from "./card-view";

/**
 * Hand-off from the paper in the envelope to the letter. The letter is the SAME element all along:
 * it's laid out (hidden) from the first render, so its QR, map and images are ready, and at hand-off
 * it is only moved: it starts exactly on the paper (same position, width and visible height) and
 * unfolds into place.
 *  - the paper is the letter folded: what's below the fold is clipped, and the fold line (.letter-fold)
 *    starts where the paper's was and fades as the letter opens — one sheet, never two
 *  - the clip only ever cuts the bottom; the other sides leave room for the shadow, so it never pops
 *  - the shadow starts as the paper's and grows into the letter's own
 *  - the easing moves from the first frame (an ease-in start reads as a stall) and lands softly
 */
const MORPH = "560ms cubic-bezier(.3,.1,.2,1)";
const ROOM = 140; // px of clip slack for the shadow
const FOLD = 0.12; // fold shading, as a share of the paper's height (same as in the envelope)

function useHandoff(ref: React.RefObject<HTMLDivElement | null>, from: DOMRect | null, onDone: () => void) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !from) return;
    const to = el.getBoundingClientRect();
    const k = from.width / to.width;
    const shown = from.height / k; // visible height, in the letter's own pixels
    const folded = Math.max(0, to.height - shown);
    const fold = Object.assign(document.createElement("div"), { className: "letter-fold pointer-events-none absolute inset-x-0 z-10" });
    Object.assign(fold.style, { top: `${shown * (1 - FOLD)}px`, height: `${shown * FOLD}px`, transition: "opacity 300ms ease-out" });
    el.append(fold);
    el.classList.add("morph-start");
    el.style.transformOrigin = "0 0";
    el.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${k})`;
    el.style.clipPath = `inset(-${ROOM}px -${ROOM}px ${folded}px -${ROOM}px)`;
    el.getBoundingClientRect(); // commit the start state
    el.classList.replace("morph-start", "morph-run");
    el.style.transition = `transform ${MORPH}, clip-path ${MORPH}`;
    el.style.transform = "none";
    el.style.clipPath = `inset(-${ROOM}px)`;
    fold.style.opacity = "0";
    let done = false;
    const end = (e?: TransitionEvent) => {
      if (done || (e && e.target !== el)) return; // ignore transitions bubbling up from inside the letter
      done = true;
      el.style.cssText = "";
      el.classList.remove("morph-run");
      fold.remove();
      onDone();
    };
    el.addEventListener("transitionend", end);
    const fallback = setTimeout(end, 720);
    return () => { clearTimeout(fallback); el.removeEventListener("transitionend", end); };
  }, [from]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Guest experience: sealed envelope → opens → the same letter unfolds into place with live actions. */
/** `bare`: no footer (the preview page brings its own controls). */
export function Reveal({ card, guestName, shareUrl, print = false, ownerHref, bare = false }: { card: Card; guestName?: string; shareUrl: string; print?: boolean; ownerHref?: string; bare?: boolean }) {
  const [phase, setPhase] = useState<"sealed" | "handoff" | "open">(print ? "open" : "sealed");
  const [from, setFrom] = useState<DOMRect | null>(null);
  const [copied, flash] = useFlash();
  const letterRef = useRef<HTMLDivElement>(null);
  const g = t(card.lang).guest;
  const s = cardStyle(card);
  const letterWidth = useLetterWidth();
  useHandoff(letterRef, from, () => setPhase("open"));

  useEffect(() => {
    if (!print) return;
    const id = setTimeout(() => window.print(), 700); // let fonts & QR settle
    return () => clearTimeout(id);
  }, [print]);

  const onShare = async () => {
    if ((await share({ title: cardTitle(card, guestName), text: cardTitle(card, guestName), url: shareUrl })) === "copied") flash();
  };
  const sealed = phase === "sealed";

  return (
    <div className="relative min-h-dvh" style={s.page && !bare ? { background: s.page } : undefined}>
      {/* the envelope floats over the page; the letter underneath is already laid out */}
      {phase !== "open" && (
        <div className="fixed inset-0 z-30">
          <EnvelopeOpener env={envelopeOf(card, guestName)} startFront={hasFront(card)} label={g.open} leaving={phase === "handoff"} letterWidth={letterWidth}
            letterContent={<CardView card={card} shareUrl={shareUrl} style={s} guestName={guestName} className="!shadow-none" />}
            onOpen={(rect) => { setFrom(rect); setPhase("handoff"); }} />
        </div>
      )}
      {/* a letter shorter than the screen sits centred (safe: a longer one starts at the top and scrolls).
          While sealed it's laid out but invisible and the page doesn't scroll. */}
      <div aria-hidden={sealed || undefined}
        className={`flex min-h-dvh flex-col [justify-content:safe_center] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-6 sm:py-16 ${sealed ? "invisible h-dvh overflow-hidden" : ""}`}>
        <div ref={letterRef} className="relative z-[35]">
          <CardView card={card} shareUrl={shareUrl} style={s} guestName={guestName} flat={print} />
        </div>
        {!bare && <footer className={`no-print mx-auto mt-10 flex max-w-[36rem] flex-wrap items-center justify-center gap-2 transition-opacity duration-300 ${phase === "open" ? "" : "opacity-0"}`}
          style={s.page && s.dark ? ({ color: "#f4f1ea", "--ink": "#f4f1ea" } as React.CSSProperties) : undefined}>
          <SketchButton size="icon" onClick={onShare} aria-label={g.share}>{copied ? <Check size={18} /> : <Share2 size={18} />}</SketchButton>
          <SketchButton size="icon" onClick={() => window.print()} aria-label={g.print}><Printer size={18} /></SketchButton>
          {ownerHref
            ? <SketchLink href={ownerHref} tone="primary"><PenLine size={18} /> Edit</SketchLink>
            : <SketchLink href="/new" tone="primary"><Sparkles size={18} /> {g.makeYourOwn}</SketchLink>}
        </footer>}
      </div>
    </div>
  );
}
