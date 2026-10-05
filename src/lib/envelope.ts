/**
 * A letter's resolved look and its envelope, shared by the app (client) and the server (link
 * previews), so a WhatsApp preview shows exactly the envelope the guest will open.
 */
import type { EnvModel } from "@/components/craft";
import { isEmpty } from "./blocks";
import { luminance, shade } from "./color";
import { STYLE_MAIL, envelopeBlocks } from "./mail";
import type { Block, Card, EnvSlot } from "./model";
import { fillName } from "./personalize";
import { FONTS, resolveStyle } from "./styles";

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

