"use client";

import { Check, Download, PenLine, Share2, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { cardTitle } from "@/lib/blocks";
import { cardStyle, envelopeOf } from "@/lib/envelope";
import { useFlash } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { useUI } from "@/lib/locale";
import { homePath, occasionCopy, occasionPath } from "@/lib/seo";
import type { Card } from "@/lib/model";
import { hasFront } from "@/lib/mail";
import { share } from "@/lib/native";
import { EnvelopeOpener, LAYER, POCKET } from "../craft";
import { SketchButton, SketchLink } from "../sketch";
import { CardView } from "./card-view";

/* ───────────── The opening ─────────────
 * ONE sheet of paper from start to end: the letter on the page *is* the paper in the envelope. It is
 * laid out in its final place from the first render (hidden while sealed); on opening it is moved into
 * the pocket — between the envelope's inside and its pockets (craft.tsx LAYER) — and travels back to
 * where it already is. Nothing re-lays out at the end: the last frame is the page itself.
 *
 *   0–620     the flap swings open in 3D (the seal is pressed on it and goes with it); it drops
 *             behind the letter when it's edge-on
 *   340–1000  the letter rises out of the pocket
 *   800–1720  the letter grows into its place while the envelope, grown alongside it (as if we leant in),
 *             slides down and out of view: the rest of the letter is drawn out of the pocket
 *
 * The part of the letter still in the envelope is clipped on a line the pockets always cover, so the
 * cut is never seen; the clip leaves room on the other sides for the shadow, which grows from the
 * paper's into the letter's own. Everything is sampled from one clock into Web Animations
 * (transforms + clip only), so it runs off the main thread and every frame is deterministic.
 */
const TOTAL = 1720;
const ROOM = 160; // px of clip slack for the shadow

/** CSS cubic-bezier as a function (bisection on x: plenty for 100 samples). */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const f = (a: number, b: number, s: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1;
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (f(x1, x2, m) < x) lo = m; else hi = m; }
    return f(y1, y2, (lo + hi) / 2);
  };
}
const swing = bezier(0.3, 0, 0.2, 1); // the flap: lifted at once, settling open
const rise = bezier(0.3, 0, 0.2, 1); // the letter sliding up
const settle = bezier(0.42, 0, 0.12, 1); // the letter to its place: leaves gently, lands softly
const fall = bezier(0.5, 0, 0.85, 0.55); // the envelope going away: gathers speed and is gone
const span = (t: number, a: number, b: number, e: (x: number) => number) => e(Math.min(1, Math.max(0, (t - a) / (b - a))));

function playOpening(envelope: HTMLElement, sheet: HTMLElement): Animation[] {
  const pieces = [...envelope.querySelectorAll<HTMLElement>("[data-env-piece]")];
  const flap = envelope.querySelector<HTMLElement>("[data-env-flap]")!;
  const hinge = envelope.querySelector<HTMLElement>("[data-env-hinge]")!;

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // a quiet crossfade, the letter already in place: the envelope goes, then the letter comes
    const o = { duration: 240, easing: "ease-out", fill: "both" } as const;
    return [...pieces.map((p) => p.animate([{ opacity: 1 }, { opacity: 0 }], o)), sheet.animate([{ opacity: 0 }, { opacity: 1 }], { ...o, delay: 140 })];
  }

  const E = envelope.getBoundingClientRect();
  const L = sheet.getBoundingClientRect(); // where the letter is, and stays
  const vh = innerHeight;
  const k0 = (POCKET.w * E.width) / L.width; // the letter's scale in the pocket
  const x0 = E.left + POCKET.x * E.width, y0 = E.top + POCKET.y * E.height; // its top-left there
  const lift = 0.5 * E.height; // how far it rises before it moves to its place
  const fallTo = vh + (0.6 * E.height) / k0 + 24; // the envelope ends below the screen, open flap included

  const at = (t: number) => {
    const u1 = span(t, 340, 1000, rise), u2 = span(t, 800, TOTAL, settle), u3 = span(t, 800, 1560, fall);
    const k = k0 + (1 - k0) * u2;
    const c = k / k0; // the envelope keeps its size relative to the letter, so the pockets always cover the cut
    const x = x0 + (L.left - x0) * u2;
    const y = (y0 - lift * u1) * (1 - u2) + L.top * u2;
    const ey = E.top + (fallTo - E.top) * u3;
    const ex = x - c * POCKET.x * E.width;
    // the hidden line, in the letter's own pixels
    const line = ey + c * POCKET.hidden * E.height;
    const cut = line >= vh ? -ROOM : Math.max(0, L.height - (line - y) / k);
    return {
      angle: 180 * span(t, 0, 620, swing),
      sheet: { transform: `translate(${x - L.left}px, ${y - L.top}px) scale(${k})`, clipPath: `inset(-${ROOM}px -${ROOM}px ${cut}px -${ROOM}px)` },
      envelope: `translate(${ex - E.left}px, ${ey - E.top}px) scale(${c})`,
    };
  };

  const N = Math.ceil(TOTAL / 12);
  const frames = Array.from({ length: N + 1 }, (_, i) => ({ offset: i / N, ...at((i / N) * TOTAL) }));
  frames[N].sheet = { transform: "none", clipPath: `inset(-${ROOM}px)` };
  const o = { duration: TOTAL, easing: "linear", fill: "both" } as const;

  // the flap changes layer when it's edge-on (90°), where the switch can't be seen
  let lo = 0, hi = 620;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (at(m).angle < 90) lo = m; else hi = m; }
  const edgeOn = hi / TOTAL;

  // the shadow: the paper's in the envelope, the letter's own once it's out
  const own = getComputedStyle(sheet).boxShadow;
  const small = "0 1px 2px 0 rgb(0 0 0 / .14), 0 1px 2px -2px rgb(0 0 0 / 0), 0 2px 4px -4px rgb(0 0 0 / 0)";

  sheet.style.transformOrigin = "0 0";
  return [
    sheet.animate(frames.map((f) => ({ offset: f.offset, ...f.sheet })), o),
    sheet.animate([{ boxShadow: small }, { boxShadow: small, offset: 800 / TOTAL }, { boxShadow: own }], { ...o, easing: "ease-in-out" }),
    ...pieces.map((p) => p.animate(frames.map((f) => ({ offset: f.offset, transform: f.envelope })), o)),
    hinge.animate(frames.map((f) => ({ offset: f.offset, transform: `rotateX(${f.angle}deg)` })), o),
    flap.animate([
      { zIndex: LAYER.flapClosed }, { zIndex: LAYER.flapClosed, offset: edgeOn },
      { zIndex: LAYER.flapOpen, offset: edgeOn }, { zIndex: LAYER.flapOpen },
    ], o),
  ];
}

/** Guest experience: sealed envelope → opens → the letter comes out of it into its place, with live actions. */
/** `bare`: no footer (the preview page brings its own controls). */
/** A guest who liked this letter starts at the home page, in the letter's language. */
const makeYourOwn = (card: Card) => homePath(card.lang);

const GUEST_RATE = "me:guest-rate";

/** A star already left on this device, as a guest or as a host. 0 if none yet. */
function starsLeft(): number {
  try {
    const guest = JSON.parse(localStorage.getItem(GUEST_RATE) ?? "{}") as { rated?: number };
    const host = JSON.parse(localStorage.getItem("me:thanks") ?? "{}") as { rated?: number };
    return guest.rated || host.rated || 0;
  } catch {
    return 0;
  }
}

/** One row of stars after the letter is open. A guest's rating counts with the host's, on the home page. */
function GuestRate({ g }: { g: ReturnType<typeof t>["guest"] }) {
  const known = useSyncExternalStore(() => () => {}, starsLeft, () => 0);
  const [picked, setPicked] = useState(0);
  const [hover, setHover] = useState(0);
  if (known > 0 && !picked) return null;
  if (picked > 0) return <p className="w-full text-center font-hand text-lg">{g.rated}</p>;
  const rate = (n: number) => {
    setPicked(n);
    try { localStorage.setItem(GUEST_RATE, JSON.stringify({ rated: n })); } catch { /* private mode */ }
    void fetch("/api/rate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stars: n }) }).catch(() => {});
  };
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1">
      <span className="font-hand text-lg">{g.rate}</span>
      <div className="flex" role="radiogroup" aria-label={g.rate} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={false} aria-label={g.stars(n)} title={g.stars(n)}
            onMouseEnter={() => setHover(n)} onFocus={() => setHover(n)} onClick={() => rate(n)}
            className="grid h-9 w-9 place-items-center rounded-md text-[#d29a12] hover:bg-black/5">
            <Star size={20} fill={n <= hover ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Reveal({ card, guestName, shareUrl, print = false, ownerHref, bare = false, rsvpKey }: { card: Card; guestName?: string; shareUrl: string; print?: boolean; ownerHref?: string; bare?: boolean; rsvpKey?: { id: string; g?: string } }) {
  // sealed: letter hidden · ready: the letter waits in the pocket, behind the closed flap · opening · open
  const [phase, setPhase] = useState<"sealed" | "ready" | "opening" | "open">(print ? "open" : "sealed");
  const [envelope, setEnvelope] = useState<HTMLDivElement | null>(null);
  const [copied, flash] = useFlash();
  const letterRef = useRef<HTMLDivElement>(null);
  const anims = useRef<Animation[]>([]);
  const g = t(card.lang).guest;
  const ui = useUI();
  const s = cardStyle(card);

  // As soon as the back shows, slip the letter into the pocket (first frame of the opening, paused): it's
  // drawn while nothing moves, so the opening starts on the very frame of the tap. Re-measured on resize.
  useLayoutEffect(() => {
    const sheet = letterRef.current?.querySelector<HTMLElement>(".print-card");
    if (!envelope || !sheet) return;
    const build = () => {
      if (anims.current.some((a) => a.playState !== "paused")) return; // already opening
      anims.current.forEach((a) => a.cancel());
      anims.current = playOpening(envelope, sheet);
      anims.current.forEach((a) => a.pause());
    };
    build();
    setPhase("ready");
    addEventListener("resize", build);
    return () => removeEventListener("resize", build);
  }, [envelope]);

  const open = () => {
    if (phase !== "ready") return;
    setPhase("opening");
    const list = anims.current;
    list.forEach((a) => a.play());
    Promise.all(list.map((a) => a.finished)).then(() => setPhase("open"), () => {});
  };

  // the last frame is the page itself, so letting go of the animations changes nothing on screen
  useLayoutEffect(() => {
    if (phase !== "open") return;
    anims.current.forEach((a) => a.cancel());
    letterRef.current?.querySelector<HTMLElement>(".print-card")?.style.removeProperty("transform-origin");
  }, [phase]);
  useEffect(() => () => anims.current.forEach((a) => a.cancel()), []);

  useEffect(() => {
    if (!print) return;
    const id = setTimeout(() => window.print(), 700); // let fonts & QR settle
    return () => clearTimeout(id);
  }, [print]);

  const onShare = async () => {
    if ((await share({ title: cardTitle(card, guestName), text: cardTitle(card, guestName), url: shareUrl })) === "copied") flash();
  };

  return (
    <div className="reveal relative min-h-dvh" style={s.page && !bare ? { background: s.page } : undefined}>
      {/* The envelope sits over the page, its layers interleaved with the letter's (no stacking context
          on the way: absolute, not fixed — the page can't scroll until the letter is out). */}
      {phase !== "open" && (
        <div className="absolute inset-x-0 top-0 h-dvh overflow-hidden">
          <EnvelopeOpener env={envelopeOf(card, guestName)} startFront={hasFront(card)} label={g.open}
            onReady={setEnvelope} onOpen={open} />
        </div>
      )}
      {/* The letter is laid out in its final place from the start (centred if shorter than the screen,
          from the top if longer): sealed, it's hidden and the page doesn't scroll. */}
      <div aria-hidden={phase !== "open" || undefined} inert={phase !== "open"}
        className={`flex flex-col [justify-content:safe_center] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-6 sm:py-16 ${phase === "open" ? "min-h-dvh" : "h-dvh overflow-hidden"} ${phase === "sealed" ? "invisible" : ""}`}>
        <div ref={letterRef} className="relative" style={{ zIndex: LAYER.letter }}>
          <CardView card={card} shareUrl={shareUrl} style={s} guestName={guestName} flat={print} rsvpKey={rsvpKey} />
        </div>
        {!bare && <footer inert={phase !== "open"} className={`no-print mx-auto mt-10 flex max-w-[36rem] flex-wrap items-center justify-center gap-2 transition-opacity duration-300 ${phase === "open" ? "" : "opacity-0"}`}
          style={s.page && s.dark ? ({ color: "#f4f1ea", "--ink": "#f4f1ea" } as React.CSSProperties) : undefined}>
          {!ownerHref && <GuestRate g={g} />}
          <SketchButton size="icon" onClick={onShare} aria-label={g.share}>{copied ? <Check size={18} /> : <Share2 size={18} />}</SketchButton>
          {rsvpKey && <SketchLink file href={`/api/v1/letters/${rsvpKey.id}/image?download=1${rsvpKey.g ? `&g=${rsvpKey.g}` : ""}`} size="icon" aria-label={g.print}><Download size={18} /></SketchLink>}
          {ownerHref
            ? <SketchLink href={ownerHref} tone="primary"><PenLine size={18} /> {ui.edit}</SketchLink>
            : <SketchLink href={makeYourOwn(card)} tone="primary"><Sparkles size={18} /> {g.makeYourOwn}</SketchLink>}
          {!ownerHref && (
            <Link href={occasionPath(card.lang, card.kind)} className="basis-full pt-2 text-center font-hand text-lg opacity-70 underline-offset-4 hover:underline hover:opacity-100">
              {occasionCopy(card.lang, card.kind).h1}
            </Link>
          )}
        </footer>}
      </div>
    </div>
  );
}
