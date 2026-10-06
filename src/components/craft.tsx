"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { shade } from "@/lib/color";
import { ENV, envelopePalette, parseSeal, sealOutline, sealPalette, type SealMark, type SealShape } from "@/lib/craft";
import { SLOT_LIMIT, STAMPS, type StampId, type Trim } from "@/lib/mail";
import type { EnvSlot } from "@/lib/model";
import { SEAL_ICON } from "./seal-icons";

/* ───────────── Wax seal ─────────────
 * Symmetric, fully opaque wax in one of four shapes (lib/craft.ts). The mark is drawn from vector
 * icons on a fixed 24-grid (never font glyphs), so every mark is centred and weighted the same, and
 * engraved twice — a lit lip + the recess — in colours chosen to read on any wax.
 */

/** The pressed mark, drawn once per layer (upper shadow, lit lip, recess). */
function Mark({ mark, color, dx = 0 }: { mark: SealMark; color: string; dx?: number }) {
  const text = (t: string, x: number, size: number) => (
    <text x={x + dx} y={51 + dx} textAnchor="middle" dominantBaseline="central" fill={color} fontSize={size} style={{ fontFamily: "var(--font-fell)" }}>{t}</text>
  );
  switch (mark.kind) {
    case "icon":
      return <g transform={`translate(${32 + dx} ${32 + dx}) scale(1.5)`}>{SEAL_ICON[mark.icon](color)}</g>;
    case "initials":
      return text(mark.text, 50, [0, 34, 27, 21][[...mark.text].length] ?? 21);
    case "couple":
      return (
        <>
          {text(mark.a, 33, 24)}
          <g transform={`translate(${44 + dx} ${45 + dx}) scale(.5)`}>{SEAL_ICON.heart(color)}</g>
          {text(mark.b, 67, 24)}
        </>
      );
    default:
      return null;
  }
}

export function Seal({ value, shape = "scallop", color, size = 72, className = "", style }: {
  value: string; shape?: SealShape; color: string; size?: number; className?: string; style?: CSSProperties;
}) {
  const gid = `seal${useId().replace(/\W/g, "")}`;
  const p = sealPalette(color);
  const mark = parseSeal(value);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={{ filter: "drop-shadow(0 2px 2px rgb(0 0 0 / .22))", ...style }} aria-hidden>
      <defs>
        <radialGradient id={gid} cx="38%" cy="32%" r="72%">
          <stop offset="0" stopColor={p.light} />
          <stop offset=".55" stopColor={p.base} />
          <stop offset="1" stopColor={p.dark} />
        </radialGradient>
      </defs>
      <path d={sealOutline(50, 50, 46, shape)} fill={`url(#${gid})`} />
      {/* pressed face: lit lower-right lip + shadowed upper-left lip read as an impression */}
      <circle cx="50.8" cy="50.8" r="31" fill="none" stroke={p.rimLight} strokeWidth="1.6" />
      <circle cx="50" cy="50" r="31" fill={p.face} stroke={p.rim} strokeWidth="2.2" />
      <Mark mark={mark} color={p.markShadow} dx={-0.7} />
      <Mark mark={mark} color={p.markEdge} dx={1} />
      <Mark mark={mark} color={p.mark} />
    </svg>
  );
}

/* ───────────── Postage stamp ───────────── */

/** Perforated postage stamp: paper edge with punched holes, a coloured plate, motif and value. */
export function Stamp({ id, className = "", style }: { id: StampId; className?: string; style?: CSSProperties }) {
  const st = STAMPS[id];
  const mid = `st${useId().replace(/\W/g, "")}`;
  const W = 80, H = 98, r = 2.6, step = 8;
  const holes: [number, number][] = [];
  for (let x = step / 2; x < W; x += step) holes.push([x, 0], [x, H]);
  for (let y = step / 2 + 1; y < H; y += step) holes.push([0, y], [W, y]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} style={{ filter: "drop-shadow(0 1px 1.5px rgb(0 0 0 / .25))", ...style }} aria-hidden>
      <defs>
        <mask id={mid}>
          <rect width={W} height={H} rx="2" fill="#fff" />
          {holes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={r} fill="#000" />)}
        </mask>
      </defs>
      <g mask={`url(#${mid})`}>
        <rect width={W} height={H} rx="2" fill="#fbf8f1" />
        <rect x="7" y="7" width={W - 14} height={H - 14} rx="2" fill={st.bg} />
        <rect x="9.5" y="9.5" width={W - 19} height={H - 19} rx="1.5" fill="none" stroke={st.ink} strokeOpacity=".35" strokeWidth=".8" />
        <text x={W / 2} y={H / 2 - 2} textAnchor="middle" dominantBaseline="central" fontSize="30">{st.motif}</text>
        <text x={W - 14} y={H - 14} textAnchor="end" fontSize="11" fontWeight="700" fill={st.ink} style={{ fontFamily: "var(--font-fell)" }}>{st.value}</text>
      </g>
    </svg>
  );
}

/** Postmark: a ring and wavy cancellation lines in thin, solid ink. */
function Postmark({ ink, className = "" }: { ink: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 50" className={className} aria-hidden>
      <circle cx="25" cy="25" r="18" fill="none" stroke={ink} strokeWidth="1.4" />
      <circle cx="25" cy="25" r="13" fill="none" stroke={ink} strokeWidth=".8" />
      {[14, 22, 30, 38].map((y) => (
        <path key={y} d={`M46 ${y} q8 -5 16 0 t16 0 t16 0 t16 0`} fill="none" stroke={ink} strokeWidth="1.3" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/* ───────────── Envelope model ───────────── */

/** A filled slot, resolved for drawing (same properties as the letter's block of that type). */
export type SlotView =
  | { kind: "heading"; text: string; size: "md" | "lg" | "xl" }
  | { kind: "text"; text: string; align: "left" | "center" }
  | { kind: "stamp"; id: StampId };

/** Everything needed to draw an envelope (built by envelopeOf() from a letter + guest). */
export type EnvModel = {
  paper: string; // envelope stock
  letter: string; // letter paper colour
  wax: string;
  ink: string; // handwriting on the envelope
  seal: string; // seal value (lib/craft.ts); "" = no seal
  sealShape: SealShape;
  trim: Trim;
  hand: string; // CSS font for addresses
  slots: Partial<Record<EnvSlot, SlotView>>; // filled slots only
};

/** Where each slot sits (percent of the envelope). Shared by rendering and the editor's tap targets. */
export const SLOT_BOX: Record<EnvSlot, CSSProperties> = {
  "front-tl": { left: "7%", top: "9%", width: "42%", height: "26%" },
  "front-tr": { right: "6%", top: "8%", width: "17%", height: "34%" },
  "front-center": { left: "18%", top: "37%", width: "64%", height: "26%" }, // centred on the envelope
  "front-bl": { left: "7%", bottom: "8%", width: "30%", height: "16%" },
  "back-center": { left: "20%", bottom: "6%", width: "60%", height: "15%" },
};

/** Text size per slot (small in the corners, larger under the seal); titles scale with their own size. */
const TEXT_SIZE: Record<EnvSlot, string> = {
  "front-tl": "clamp(.6rem, 2.4vw, .85rem)", "front-tr": "clamp(.6rem, 2.4vw, .85rem)",
  "front-center": "clamp(.9rem, 3.6vw, 1.25rem)", "front-bl": "clamp(.6rem, 2.4vw, .85rem)",
  "back-center": "clamp(.75rem, 3vw, 1rem)",
};
const TITLE_SIZE = { md: "clamp(1.05rem, 5vw, 1.7rem)", lg: "clamp(1.25rem, 6vw, 2.1rem)", xl: "clamp(1.45rem, 7vw, 2.5rem)" };
/** Where in its box a slot's content sits vertically. */
const V_ALIGN: Record<EnvSlot, string> = {
  "front-tl": "items-start", "front-tr": "items-start justify-end", "front-center": "items-center", "front-bl": "items-end", "back-center": "items-center",
};

/** One filled slot. */
function SlotItem({ slot, item, env }: { slot: EnvSlot; item: SlotView; env: EnvModel }) {
  const align = item.kind === "text" && item.align === "left" ? "justify-start text-left" : "justify-center text-center";
  return (
    <div className={`absolute flex ${V_ALIGN[slot]} ${item.kind === "stamp" ? "" : align}`} style={SLOT_BOX[slot]}>
      {item.kind !== "stamp" && (
        // clamped to the slot's line budget; single-line slots truncate (a long {name} ends in "…")
        <span className={`min-w-0 max-w-full leading-tight ${SLOT_LIMIT[slot].lines === 1 ? "truncate" : "whitespace-pre-line"}`}
          style={{
            fontFamily: env.hand, color: env.ink, fontSize: item.kind === "heading" ? TITLE_SIZE[item.size] : TEXT_SIZE[slot],
            ...(SLOT_LIMIT[slot].lines > 1 ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: SLOT_LIMIT[slot].lines, overflow: "hidden" } : {}),
          }}>
          {item.text}
        </span>
      )}
      {item.kind === "stamp" && <Stamp id={item.id} className="h-full max-h-full w-auto" />}
    </div>
  );
}

/* ───────────── Envelope front (address side) ───────────── */

function TrimLayer({ trim, paper, ink }: { trim: Trim; paper: string; ink: string }) {
  switch (trim) {
    case "airmail":
      return (
        <div className="absolute inset-0 rounded-[6px]"
          style={{ background: "repeating-linear-gradient(135deg, #c8312f 0 10px, #fbf8f1 10px 18px, #2a56c6 18px 28px, #fbf8f1 28px 36px)" }}>
          <div className="absolute inset-[7px] rounded-[3px]" style={{ background: paper }} />
        </div>
      );
    case "gold":
      return <div className="absolute inset-[5%] rounded-[3px] border border-[#cfae62] shadow-[inset_0_0_0_3px_transparent,inset_0_0_0_4px_#cfae62]" />;
    case "pixel":
      return <div className="absolute inset-[4%] rounded-[3px] border-4" style={{ borderColor: ink }} />;
    case "dashed":
      return <div className="absolute inset-[4%] rounded-[3px] border-2 border-dashed" style={{ borderColor: ink }} />;
    case "none":
      return null;
  }
}

export function EnvelopeFront({ env, className = "" }: { env: EnvModel; className?: string }) {
  const c = envelopePalette(env.paper);
  const stamp = env.slots["front-tr"]?.kind === "stamp";
  return (
    <div className={`relative aspect-[3/2] w-full overflow-hidden rounded-[6px] ${className}`} style={{ background: env.paper, boxShadow: `inset 0 0 0 .8px ${c.edge}` }}>
      <TrimLayer trim={env.trim} paper={env.paper} ink={env.ink} />
      {(Object.keys(env.slots) as EnvSlot[]).filter((s) => s.startsWith("front")).map((s) => (
        <SlotItem key={s} slot={s} item={env.slots[s]!} env={env} />
      ))}
      {/* the postmark is inked like the handwriting, so it reads on any paper */}
      {stamp && <Postmark ink={env.ink} className="absolute right-[15%] top-[20%] w-[24%] opacity-80" />}
    </div>
  );
}

/* ───────────── Envelope back (flap side) ───────────── */

/**
 * The back is built from flat layers with their own z-index and NO stacking context around them, so
 * when the guest opens it the real letter (components/card/reveal.tsx, z = LAYER.letter) slides
 * between them: in front of the inside and the open flap, behind the pockets. Every layer covers the
 * same box, so one transform (data-env-piece) moves the whole envelope.
 */
export const LAYER = { shadow: 30, inside: 31, flapOpen: 32, letter: 35, pockets: 37, flapClosed: 38 } as const;

/** Where the letter sits in the pocket (fractions of the envelope), shared with the opening timeline. */
export const POCKET = { x: 0.06, y: 0.05, w: 0.88, hidden: 0.9 } as const; // below `hidden` the pockets cover it

/** Rounded like the SVG's rx (6 of 300×200), as a CSS radius on a box of the same proportions. */
const ENV_RADIUS = `${(ENV.radius / ENV.w) * 100}% / ${(ENV.radius / ENV.h) * 100}%`;

export function EnvelopeBack({ env, opener = false, ref, className = "" }: {
  env: EnvModel;
  /** For the opener: the layers join the page's stacking context (elsewhere they're isolated) and the
   *  envelope draws its own shadow as a layer (a filter around it would trap the layers). */
  opener?: boolean;
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
}) {
  const c = envelopePalette(env.paper);
  const clip = `env${useId().replace(/\W/g, "")}`;
  const edge = { stroke: c.edge, strokeWidth: 0.8, strokeLinejoin: "round" as const };
  const under = env.slots["back-center"];
  const piece = "absolute inset-0 origin-top-left";

  return (
    <div ref={ref} className={`relative aspect-[3/2] w-full ${opener ? "" : "isolate"} ${className}`}>
      {opener && <div data-env-piece className={piece} style={{ zIndex: LAYER.shadow, borderRadius: ENV_RADIUS, boxShadow: "0 6px 10px rgb(0 0 0 / .14)" }} aria-hidden />}

      {/* inside of the envelope: light falls in from the opening, the bottom of the pocket is in shade */}
      <svg data-env-piece viewBox="0 0 300 200" className={`${piece} h-full w-full`} style={{ zIndex: LAYER.inside }} aria-hidden>
        <defs>
          <linearGradient id={`${clip}in`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={shade(c.inside, 0.1)} /><stop offset="1" stopColor={shade(c.inside, -0.22)} />
          </linearGradient>
        </defs>
        <rect x=".4" y=".4" width="299.2" height="199.2" rx={ENV.radius} fill={`url(#${clip}in)`} stroke={c.edge} strokeWidth=".8" />
      </svg>

      {/* front pockets (+ what's written on them) */}
      <div data-env-piece className={piece} style={{ zIndex: LAYER.pockets }}>
        <svg viewBox="0 0 300 200" className="absolute inset-0 h-full w-full" aria-hidden>
          <defs><clipPath id={clip}><rect width="300" height="200" rx={ENV.radius} /></clipPath></defs>
          <g clipPath={`url(#${clip})`}>
            <path d={ENV.left} fill={c.side} {...edge} />
            <path d={ENV.right} fill={c.side} {...edge} />
            <path d={ENV.bottom} fill={c.bottom} {...edge} />
          </g>
        </svg>
        {under && <SlotItem slot="back-center" item={under} env={env} />}
      </div>

      {/* top flap, hinged on the top edge: outer face (with the seal pressed on it) + the inside on its back */}
      <div data-env-piece data-env-flap className={piece} style={{ zIndex: LAYER.flapClosed, perspective: 1400 }}>
        <div data-env-hinge className="absolute inset-0 origin-top [transform-style:preserve-3d]">
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <svg viewBox="0 0 300 200" className="absolute inset-0 h-full w-full" aria-hidden>
              <path d={ENV.flap} fill={c.flap} {...edge} />
            </svg>
            {env.seal && (
              <Seal value={env.seal} shape={env.sealShape} color={env.wax} className="absolute w-[26%] -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${(ENV.seal.x / ENV.w) * 100}%`, top: `${(ENV.seal.y / ENV.h) * 100}%`, height: "auto" }} />
            )}
          </div>
          {/* The back face is turned around its own centre, so its flap is drawn pre-mirrored
              (y → h − y); both flips then compose into a flap hinged on the top edge. */}
          <svg viewBox="0 0 300 200" className="absolute inset-0 h-full w-full [backface-visibility:hidden]" style={{ transform: "rotateX(180deg)" }} aria-hidden>
            <defs>
              <linearGradient id={`${clip}fl`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor={shade(c.inside, -0.12)} /><stop offset="1" stopColor={shade(c.inside, 0.08)} />
              </linearGradient>
            </defs>
            <path d={ENV.flap} transform={`translate(0 ${ENV.h}) scale(1 -1)`} fill={`url(#${clip}fl)`} {...edge} />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Both faces ───────────── */

/** The envelope with both faces; `side` turns it over with a 3D flip. */
export function EnvelopeFlip({ env, side, className = "", overlay }: { env: EnvModel; side: "front" | "back"; className?: string; overlay?: { front?: ReactNode; back?: ReactNode } }) {
  return (
    <div className={`relative aspect-[3/2] w-full ${className}`} style={{ perspective: 1600 }}>
      <div className="absolute inset-0 transition-transform duration-[650ms] ease-[cubic-bezier(.4,0,.2,1)]"
        style={{ transformStyle: "preserve-3d", transform: side === "back" ? "rotateY(180deg)" : "none" }}>
        {/* a turned-away face is hidden *and* inert: backface-visibility alone still lets it catch taps */}
        <div className="absolute inset-0 [backface-visibility:hidden]" inert={side === "back"}>
          <EnvelopeFront env={env} />
          {overlay?.front}
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: "rotateY(180deg)" }} inert={side === "front"}>
          <EnvelopeBack env={env} />
          {overlay?.back}
        </div>
      </div>
    </div>
  );
}

const shadow = "[filter:drop-shadow(0_6px_10px_rgb(0_0_0/.14))] group-hover:[filter:drop-shadow(0_12px_22px_rgb(0_0_0/.2))]";
/** Primary CTA envelope: never moves. Hover only deepens the shadow. */
export const envelopeStill = `transition-[filter] duration-300 ease-out ${shadow}`;
/** Envelopes in a list: may lift slightly on hover. */
export const envelopeLift = `transition-[transform,filter] duration-300 ease-out ${shadow} group-hover:-translate-y-1 group-active:translate-y-0`;

const FLIP_MS = 700;
/** The envelope's resting shadow (same as the CTA's, without the hover). */
const ENV_SHADOW = "[filter:drop-shadow(0_6px_10px_rgb(0_0_0/.14))]";

/**
 * Guest-facing envelope, centred in its box. Like real mail, in two gestures: the first tap turns the
 * addressed front over; the second opens it. The opening itself is played by the caller (reveal.tsx):
 * `onReady` hands it the layered back as soon as it shows (so the letter can be slipped into the pocket
 * ahead of time), `onOpen` says go. Nothing moves until tapped.
 */
export function EnvelopeOpener({ env, startFront, label, onReady, onOpen }: {
  env: EnvModel; startFront: boolean; label: string; onReady: (envelope: HTMLDivElement) => void; onOpen: () => void;
}) {
  const [phase, setPhase] = useState<"front" | "flipping" | "back" | "open">(startFront ? "front" : "back");
  const backRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const back = phase === "back" || phase === "open";
  useEffect(() => {
    if (back && backRef.current) onReady(backRef.current);
  }, [back]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = () => {
    if (phase === "front") {
      setPhase("flipping");
      // the flip ends on the back face; swap in the layered (identical) back, closed, and wait for the next tap
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      timer.current = setTimeout(() => setPhase("back"), reduced ? 0 : FLIP_MS);
    } else if (phase === "back") {
      setPhase("open");
      onOpen();
    }
  };

  return (
    // no transform / opacity / filter around this box: any of those would trap the flap's layers,
    // and the letter (a higher layer on the page) would paint on top of the sealed envelope.
    <div className="flex h-full items-center justify-center px-6">
      <div role="button" tabIndex={0} onClick={go} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go())}
        aria-label={label} aria-disabled={phase === "flipping" || phase === "open"}
        className={`w-[min(100%,32rem,56dvh)] rounded-md focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-dashed focus-visible:outline-violet ${phase === "open" ? "" : "cursor-pointer"}`}>
        {back
          ? <EnvelopeBack ref={backRef} env={env} opener />
          : <div className={ENV_SHADOW}><EnvelopeFlip env={env} side={phase === "flipping" ? "back" : "front"} /></div>}
      </div>
    </div>
  );
}
