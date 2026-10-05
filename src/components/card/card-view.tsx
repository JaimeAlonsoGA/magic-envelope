"use client";

import { useEffect, useRef } from "react";
import { cardTitle } from "@/lib/blocks";
import { luminance, shade } from "@/lib/color";
import { isEmpty } from "@/lib/blocks";
import { STYLE_MAIL, envelopeBlocks } from "@/lib/mail";
import type { Block, EnvSlot } from "@/lib/model";
import { fillName } from "@/lib/personalize";
import type { EnvModel } from "../craft";
import type { Card } from "@/lib/model";
import { FONTS, RADIUS, resolveStyle, styleVars, type Frame, type Resolved, type Texture } from "@/lib/styles";
import { selectableClass, selectableStyle } from "../selectable";
import { RenderBlock, type Ctx } from "./blocks";

export const cardStyle = (card: Card) => resolveStyle(card.style, card.custom);

/**
 * Everything an envelope needs for a letter, in one place: colors from its style, its seal ("" = none),
 * and what's written on it for a given guest. Every envelope in the app renders from this.
 */
export function envelopeOf(card: Card, guestName?: string): EnvModel {
  const s = cardStyle(card);
  const slots: EnvModel["slots"] = {};
  for (const [slot, b] of Object.entries(envelopeBlocks(card)) as [EnvSlot, Block][]) {
    if (isEmpty(b, card)) continue; // same rule as the letter: blank slots draw nothing for guests
    if (b.type === "heading") slots[slot] = { kind: "heading", text: fillName(b.text.trim(), card, guestName), size: b.size };
    else if (b.type === "text") slots[slot] = { kind: "text", text: fillName(b.text.trim(), card, guestName), align: b.align };
    else if (b.type === "stamp" && b.stamp) slots[slot] = { kind: "stamp", id: b.stamp };
  }
  return {
    paper: s.envelope, letter: s.paper, wax: s.wax,
    ink: luminance(s.envelope) < 0.3 ? "#f4f1ea" : shade(s.envelope, -0.72), // legible on its own stock
    seal: card.seal,
    sealShape: card.sealShape,
    trim: STYLE_MAIL[card.style].trim,
    hand: FONTS[s.sign].css,
    slots,
  };
}

/** Paper texture overlays. Static, subtle, and never interactive. */
function TextureLayer({ texture }: { texture: Texture }) {
  if (texture === "none") return null;
  const cls = { parchment: "tex-parchment", dots: "tex-dots opacity-[.06]", grain: "tex-grain opacity-[.08]", scanlines: "tex-scanlines opacity-[.18]" }[texture];
  return <div className={`pointer-events-none absolute inset-0 rounded-[inherit] ${cls}`} aria-hidden />;
}

/** The letter's frame, drawn from style tokens. Letters never use the app's hand-drawn outline. */
function FrameLayer({ frame }: { frame: Frame }) {
  const inset = "pointer-events-none absolute inset-3 sm:inset-4";
  switch (frame) {
    case "ornate": {
      const lozenge = "absolute h-[7px] w-[7px] rotate-45 -translate-x-1/2 -translate-y-1/2 bg-[var(--c-accent)]";
      return (
        <div className={inset} aria-hidden>
          <div className="absolute inset-0 rounded-[2px] border border-[var(--c-accent)] opacity-80" />
          <div className="absolute inset-[4px] rounded-[1px] border-[0.5px] border-[var(--c-accent)] opacity-50" />
          <span className={`${lozenge} left-0 top-0`} /><span className={`${lozenge} left-full top-0`} />
          <span className={`${lozenge} left-0 top-full`} /><span className={`${lozenge} left-full top-full`} />
        </div>
      );
    }
    case "rule":
      return <div className={`${inset} rounded-[2px] border border-[var(--c-accent)] opacity-60`} aria-hidden />;
    case "glow":
      return <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_rgb(255_255_255/.08)] ring-1 ring-inset ring-white/10" aria-hidden />;
    case "pixel":
      return <div className={`${inset} rounded-[4px] border-4 border-[var(--c-ink)] shadow-[inset_0_0_0_4px_var(--c-paper),inset_0_0_0_6px_var(--c-accent)]`} aria-hidden />;
    case "groovy":
      return (
        <div className={inset} aria-hidden>
          <div className="absolute inset-0 rounded-[30px] border-4 border-[var(--c-accent)]" />
          <div className="absolute inset-[9px] rounded-[22px] border-2 border-[var(--c-wax)]" />
        </div>
      );
    case "none":
    case "soft": // shape only (rounded corners), no lines
      return null;
  }
}

type Props = {
  card: Card;
  shareUrl: string;
  /** Editor mode: blocks are tappable, inert, and empty ones show placeholders. */
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** Show placeholders for empty blocks without being editable (previews). */
  ghosts?: boolean;
  className?: string;
  style?: Resolved; // pass when already resolved by the parent
  /** Render for an image/print: no buttons, maps, embeds or live counters. */
  flat?: boolean;
  guestName?: string;
};

/** The letter: a sheet of paper in its style, stacking typed blocks. */
export function CardView({ card, shareUrl, selected, onSelect, ghosts, className = "", style, flat = false, guestName }: Props) {
  const s = style ?? cardStyle(card);
  const place = card.blocks.find((b) => b.type === "place");
  const ctx: Ctx = {
    card, style: s, title: cardTitle(card, guestName), shareUrl, flat, guestName, editing: !!onSelect,
    where: place?.type === "place" ? place.address.trim() || undefined : undefined,
  };
  const selRef = useRef<HTMLDivElement>(null);

  // Keep the block being edited visible above the bottom sheet.
  useEffect(() => {
    selRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selected]);

  return (
    <article
      lang={card.lang}
      style={styleVars(s)}
      className={`print-card relative mx-auto w-full max-w-[36rem] ${RADIUS[s.frame]} shadow-[0_1px_2px_rgb(0_0_0/.08),0_2px_6px_-2px_rgb(0_0_0/.08),0_24px_48px_-20px_rgb(0_0_0/.35)] ${className}`}
    >
      <TextureLayer texture={s.texture} />
      <FrameLayer frame={s.frame} />
      <div className="relative space-y-8 px-8 py-14 sm:px-14 sm:py-16">
        {card.blocks.map((b) =>
          onSelect ? (
            <div
              key={b.id}
              ref={selected === b.id ? selRef : undefined}
              role="button"
              tabIndex={0}
              aria-pressed={selected === b.id}
              onClick={() => onSelect(b.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(b.id))}
              className={`-mx-3 px-3 py-2 ${selectableClass(selected === b.id)}`}
              style={selectableStyle(selected === b.id)}
            >
              <div inert><RenderBlock b={b} ctx={ctx} ghost /></div>
            </div>
          ) : (
            <RenderBlock key={b.id} b={b} ctx={ctx} ghost={ghosts} />
          ),
        )}
      </div>
    </article>
  );
}
