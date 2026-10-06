import { nanoid } from "nanoid";
import {
  AlignCenter, CalendarDays, Clock3, Gift, Heading1, Hourglass, Image as ImageIcon, Link2,
  MapPin, Mail, Music, PenLine, QrCode, SeparatorHorizontal, Shirt, Stamp as StampIcon, type LucideIcon,
} from "lucide-react";
import { musicEmbed } from "./actions";
import { val } from "./fields";
import { t } from "./i18n";
import { NAME_TOKEN, fillName } from "./personalize";
import type { Block, BlockOf, BlockType, Card, Kind, Lang } from "./model";
import type { StyleId } from "./styles";
import { parseWhen } from "./when";

export const BLOCK_ICON: Record<BlockType, LucideIcon> = {
  heading: Heading1, text: AlignCenter, image: ImageIcon, date: CalendarDays, place: MapPin,
  countdown: Hourglass, link: Link2, qr: QrCode, rsvp: Mail, agenda: Clock3,
  dress: Shirt, gift: Gift, signature: PenLine, divider: SeparatorHorizontal, music: Music, stamp: StampIcon,
};

/** Order of blocks in the "+" palette. */
export const PALETTE: BlockType[] = [
  "heading", "text", "image", "date", "place", "countdown", "rsvp", "agenda",
  "dress", "gift", "link", "qr", "music", "signature", "divider",
];

export const KIND_EMOJI: Record<Kind, string> = {
  birthday: "🎂", wedding: "💍", party: "🎉", baby: "🍼", dinner: "🍷", graduation: "🎓", event: "📣", letter: "✉️",
};

const uid = () => nanoid(8);

/** A date ~3 weeks from now at 19:00 local, as "YYYY-MM-DDTHH:mm". */
export function soon(days = 21, hour = 19) {
  const d = new Date(Date.now() + days * 864e5);
  d.setHours(hour, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00`;
}

/** A fresh, empty block. Empty blocks show a labelled placeholder in the editor and nothing to guests. */
export function newBlock(type: BlockType): Block {
  const id = uid();
  switch (type) {
    case "heading": return { id, type, text: "", size: "xl", italic: false };
    case "text": return { id, type, text: "", align: "center", italic: false };
    case "image": return { id, type, src: "", shape: "wide" };
    case "date": return { id, type, start: soon(), interactive: true };
    case "place": return { id, type, name: "", address: "", interactive: true };
    case "countdown": return { id, type, to: "" };
    case "link": return { id, type, label: "", href: "", icon: "link", interactive: true };
    case "qr": return { id, type, data: "" };
    case "rsvp": return { id, type, channel: "whatsapp", contacts: { whatsapp: "", sms: "", email: "" }, interactive: true };
    case "agenda": return { id, type, items: [{ time: "", what: "" }] };
    case "dress": return { id, type, text: "", board: [] };
    case "gift": return { id, type, text: "", interactive: true };
    case "signature": return { id, type, text: "" };
    case "divider": return { id, type, style: "flourish" };
    case "music": return { id, type, href: "" };
    case "stamp": return { id, type, stamp: "" };
  }
}

/* ───────────── Starting points ─────────────
 * Style (how it looks) and preset (what's in it) are independent: any preset works in any style.
 */

/** Seal glyph that suits each occasion. */
const SEAL: Record<Kind, string> = {
  birthday: "icon:cake", wedding: "icon:ring", party: "icon:cheers", baby: "icon:moon", dinner: "icon:flower",
  graduation: "icon:cap", event: "icon:star", letter: "icon:heart",
};

/** Default start: a blank letter (title + text placeholders). */
export function blankCard(style: StyleId, lang: Lang): Card {
  return { v: 1, lang, kind: "letter", style, seal: "icon:sparkle", sealShape: "scallop", blocks: [newBlock("heading"), newBlock("text")] };
}

/** Optional presets: one ready-made layout per occasion, pre-filled in the letter's language. */
export const PRESETS: Record<Kind, BlockType[]> = {
  birthday: ["image", "heading", "text", "date", "place", "countdown", "rsvp", "signature"],
  wedding: ["heading", "divider", "text", "image", "date", "place", "agenda", "dress", "gift", "rsvp", "signature"],
  party: ["heading", "image", "text", "date", "place", "dress", "music", "rsvp"],
  baby: ["image", "heading", "text", "date", "place", "gift", "rsvp", "signature"],
  dinner: ["heading", "divider", "text", "date", "place", "agenda", "rsvp", "signature"],
  graduation: ["heading", "image", "text", "countdown", "date", "place", "rsvp"],
  event: ["heading", "text", "date", "place", "agenda", "link", "qr", "rsvp"],
  letter: ["heading", "text", "divider", "signature"],
};

export function fromPreset(kind: Kind, style: StyleId, lang: Lang): Card {
  const copy = t(lang).tpl[kind];
  const blocks = PRESETS[kind].map((type) => {
    const b = newBlock(type);
    if (b.type === "heading") b.text = copy.h;
    if (b.type === "text") b.text = copy.t;
    if (b.type === "signature") b.text = copy.sign;
    return b;
  });
  return { v: 1, lang, kind, style, seal: SEAL[kind], sealShape: "scallop", blocks };
}

export function cardTitle(card: Card, guestName?: string) {
  const h = card.blocks.find((b) => b.type === "heading" && b.text.trim());
  return (h?.type === "heading" && fillName(h.text.trim(), card, guestName)) || t(card.lang).kinds[card.kind];
}

/**
 * The letter's title for lists, without the per-guest name: "{name}, ¡ven a mi cumple!" reads
 * "¡Ven a mi cumple!" rather than "Querido Invitado, ¡ven…".
 */
/** A filename from a title: ASCII, lowercase, no guest-name fallback. */
export const fileSlug = (s: string) =>
  s.normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "letter";

export function listTitle(card: Card) {
  const h = card.blocks.find((b) => b.type === "heading" && b.text.trim());
  const bare = h?.type === "heading" ? h.text.replaceAll(NAME_TOKEN, "").replace(/^[\s,;:.·—–-]+|[\s,;:—–-]+$/g, "").replace(/\s{2,}/g, " ") : "";
  // capitalise the first letter, past any opening "¡", "¿" or quote
  const i = bare.search(/\p{L}/u);
  return bare ? (i < 0 ? bare : bare.slice(0, i) + bare[i].toLocaleUpperCase(card.lang) + bare.slice(i + 1)) : t(card.lang).kinds[card.kind];
}

/** The letter's event date (its first date block), if it has one. */
export const eventDate = (card: Card) => {
  const d = card.blocks.find((b) => b.type === "date");
  return d?.type === "date" ? parseWhen(d.start)?.date ?? null : null;
};

/** Effective countdown target: its own date, or the card's first event date. */
export function countdownTarget(card: Card, to: string) {
  if (to) return to;
  const date = card.blocks.find((b) => b.type === "date");
  return date?.type === "date" ? date.start : "";
}

/* ───────────── Emptiness: the single rule for "has nothing a guest can use" ───────────── */

export const rsvpContact = (b: BlockOf<"rsvp">) => val(b.channel === "email" ? "email" : "phone", b.contacts[b.channel]);

/** Digital-only blocks have nothing to show in an image. */
export const DIGITAL_ONLY = new Set<Block["type"]>(["countdown", "music"]);

export function isEmpty(b: Block, card: Card, flat = false) {
  if (flat && DIGITAL_ONLY.has(b.type)) return true;
  switch (b.type) {
    case "heading": case "text": case "signature": return !b.text.trim();
    case "image": return !val("url", b.src);
    case "place": return !b.name.trim() && !b.address.trim();
    case "link": return !val("url", b.href);
    case "rsvp": return !rsvpContact(b);
    case "agenda": return !b.items.some((i) => i.what.trim());
    case "dress": return !b.text.trim() && b.board.length === 0;
    case "gift": return !b.text.trim() && !b.iban?.trim() && !val("url", b.href);
    case "music": return !musicEmbed(b.href);
    case "date": return !val("datetime", b.start);
    case "countdown": return !val("datetime", countdownTarget(card, b.to));
    case "stamp": return !b.stamp;
    default: return false;
  }
}

