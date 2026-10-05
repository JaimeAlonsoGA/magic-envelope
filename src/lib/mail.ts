/**
 * The envelope as an editable object. Two faces with fixed slots (like a real envelope):
 *   front: recipient (centre), sender (top-left), postage (top-right), a note (bottom-left)
 *   back:  flap + wax seal, and a line under the seal
 * Each slot holds a typed item (text with {name}, emoji or a postage stamp). Styles ship a default
 * envelope; once the user edits one, the letter keeps its own. Envelopes only exist for link letters.
 */
import { isEmpty } from "./blocks";
import { ENV_SLOTS, SLOT_TYPE, type Block, type Card, type EnvSlot } from "./model";
import { fillName } from "./personalize";
import type { StyleId } from "./styles";

/* ───────────── Postage stamps ───────────── */

export const STAMPS = {
  love: { motif: "💌", bg: "#ffd6e0", ink: "#9b2c4b", value: "1" },
  rose: { motif: "🌹", bg: "#f6d2cb", ink: "#7a2a22", value: "2" },
  dove: { motif: "🕊️", bg: "#d4e5f7", ink: "#2c4f78", value: "1" },
  castle: { motif: "🏰", bg: "#ecdfc2", ink: "#6b4b22", value: "3" },
  moon: { motif: "🌙", bg: "#262c52", ink: "#f2d58a", value: "5" },
  cake: { motif: "🎂", bg: "#fde3b6", ink: "#8a4b12", value: "1" },
  sunflower: { motif: "🌻", bg: "#fff0a6", ink: "#7a5b00", value: "2" },
  shell: { motif: "🐚", bg: "#f9e2d4", ink: "#8a4b33", value: "1" },
  butterfly: { motif: "🦋", bg: "#d9f2e6", ink: "#1f6b4a", value: "2" },
  star: { motif: "⭐", bg: "#1f2a44", ink: "#ffd66b", value: "5" },
  key: { motif: "🗝️", bg: "#1a1816", ink: "#d4b26a", value: "10" },
  rocket: { motif: "🚀", bg: "#1d1d29", ink: "#c4b5fd", value: "∞" },
  disco: { motif: "🪩", bg: "#4a0e6b", ink: "#ffe45e", value: "80" },
  invader: { motif: "👾", bg: "#8bac0f", ink: "#0f380f", value: "8" },
} as const;
export type StampId = keyof typeof STAMPS;
export const STAMP_IDS = Object.keys(STAMPS) as StampId[];

/* ───────────── Envelope papers ─────────────
 * A curated set of real envelope stocks. Free colour pickers make ugly envelopes; these are all
 * papers that look right with any letter (handwriting ink and seal contrast adapt automatically).
 */
export const ENVELOPE_PAPERS: { id: string; label: string; color: string }[] = [
  { id: "kraft", label: "Kraft", color: "#c9a87c" }, { id: "ivory", label: "Ivory", color: "#f3ead8" },
  { id: "cream", label: "Cream", color: "#e9d6ad" }, { id: "blush", label: "Blush", color: "#f2d3d4" },
  { id: "sage", label: "Sage", color: "#cdd9c0" }, { id: "sky", label: "Sky", color: "#cfe0f2" },
  { id: "lilac", label: "Lilac", color: "#ddd4ef" }, { id: "terracotta", label: "Terracotta", color: "#c47a5d" },
  { id: "navy", label: "Navy", color: "#262d4b" }, { id: "forest", label: "Forest", color: "#2e4734" },
  { id: "black", label: "Black", color: "#1d1d22" }, { id: "gold", label: "Gold", color: "#d2b26a" },
];

/* ───────────── Envelope styles ───────────── */

export type Trim = "none" | "airmail" | "gold" | "pixel" | "dashed";

/** Each style's envelope: front trim and its default postage stamp. */
export const STYLE_MAIL: Record<StyleId, { trim: Trim; stamp: StampId }> = {
  parchment: { trim: "none", stamp: "castle" },
  midnight: { trim: "gold", stamp: "moon" },
  romance: { trim: "none", stamp: "rose" },
  botanical: { trim: "none", stamp: "butterfly" },
  deco: { trim: "gold", stamp: "key" },
  ivory: { trim: "gold", stamp: "dove" },
  notebook: { trim: "airmail", stamp: "love" },
  minimal: { trim: "none", stamp: "star" },
  launch: { trim: "none", stamp: "rocket" },
  brutal: { trim: "dashed", stamp: "star" },
  bubblegum: { trim: "none", stamp: "love" },
  confetti: { trim: "airmail", stamp: "cake" },
  groovy: { trim: "none", stamp: "disco" },
  typewriter: { trim: "airmail", stamp: "dove" },
  pocket: { trim: "pixel", stamp: "invader" },
};

/* ───────────── Slots ───────────── */

/** What each slot is for (its block type comes from SLOT_TYPE in the model). */
export const SLOT_ROLE: Record<EnvSlot, string> = {
  "front-center": "Recipient", "front-tl": "Sender", "front-tr": "Postage", "front-bl": "Note", "back-center": "Under the seal",
};
export const FRONT_SLOTS: EnvSlot[] = ["front-tl", "front-tr", "front-center", "front-bl"];

/** The style's default block for a slot: addressed to the guest, its postage stamp, the rest blank. */
function defaultBlock(slot: EnvSlot, style: StyleId): Block {
  const id = slot;
  switch (SLOT_TYPE[slot]) {
    case "heading": return { id, type: "heading", text: "{name}", size: "md" };
    case "stamp": return { id, type: "stamp", stamp: STYLE_MAIL[style].stamp };
    case "text": return { id, type: "text", text: "", align: slot === "back-center" ? "center" : "left" };
  }
}

/** Every slot's block: the letter's own where edited, the style's default elsewhere. Always all slots. */
export function envelopeBlocks(card: Card): Record<EnvSlot, Block> {
  const own = card.envelope?.blocks ?? {};
  return Object.fromEntries(ENV_SLOTS.map((slot) => {
    const b = own[slot];
    return [slot, b && b.type === SLOT_TYPE[slot] ? b : defaultBlock(slot, card.style)];
  })) as Record<EnvSlot, Block>;
}

/**
 * How much each slot can hold. The editor enforces it and the envelope clamps to it, so no text can
 * ever spill over or crowd the envelope (the letter itself grows, so it needs no such limit).
 */
export const SLOT_LIMIT: Record<EnvSlot, { chars: number; lines: number }> = {
  "front-center": { chars: 36, lines: 1 }, // recipient
  "front-tl": { chars: 90, lines: 3 }, // sender + address
  "front-tr": { chars: 0, lines: 0 }, // stamp
  "front-bl": { chars: 60, lines: 2 }, // note
  "back-center": { chars: 40, lines: 1 }, // under the seal
};

/** Is anything written or stuck on the front? (Same emptiness rule as the letter's blocks.) */
export const hasFront = (card: Card) => {
  const all = envelopeBlocks(card);
  return FRONT_SLOTS.some((s) => !isEmpty(all[s], card));
};

/** Plain text of a slot for a guest (metadata, link previews). */
export function slotText(card: Card, slot: EnvSlot, guestName?: string) {
  const b = envelopeBlocks(card)[slot];
  return (b.type === "heading" || b.type === "text") && b.text.trim() ? fillName(b.text.trim(), card, guestName) : undefined;
}

/** One line describing the envelope: the recipient line, else the line under the seal. */
export const envelopeLine = (card: Card, guestName?: string) =>
  slotText(card, "front-center", guestName) ?? slotText(card, "back-center", guestName);
