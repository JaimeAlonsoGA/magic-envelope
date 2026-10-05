/**
 * Guest personalization. Any text block may contain the {name} token; it resolves to the guest's
 * name on their own link/image, or to the letter's fallback ("dear guest") everywhere else.
 */
import { t } from "./i18n";
import type { Card } from "./model";

export const NAME_TOKEN = "{name}";

export const hasName = (s: string) => s.includes(NAME_TOKEN);

export const fallbackName = (card: Card) => card.nameFallback?.trim() || t(card.lang).guest.friend;

/** Plain-text resolution (titles, metadata, messages). */
export const fillName = (text: string, card: Card, guestName?: string) =>
  text.replaceAll(NAME_TOKEN, guestName?.trim() || fallbackName(card));

/** Split text around the token, for renderers that style the name. */
export const splitName = (text: string) => text.split(NAME_TOKEN);

/** Does any block of this letter address the guest by name? */
export const usesName = (card: Card) =>
  card.blocks.some((b) => (b.type === "heading" || b.type === "text" || b.type === "signature") && hasName(b.text));

