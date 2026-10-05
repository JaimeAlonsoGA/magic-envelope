import { z } from "zod";
import { SEAL_SHAPES } from "./craft";
import { STAMP_IDS, type StampId } from "./mail";
import { FONT_IDS, STYLE_IDS, type FontId, type StyleId } from "./styles";

/* ───────────── Card languages (the app UI itself is always English) ───────────── */

export const LANGS = ["es", "en", "fr", "pt", "it", "de"] as const;
export type Lang = (typeof LANGS)[number];

/* ───────────── Kinds of letter ───────────── */

export const KINDS = ["birthday", "wedding", "party", "baby", "dinner", "graduation", "event", "letter"] as const;
export type Kind = (typeof KINDS)[number];

/* ───────────── Styles (design systems live in lib/styles.ts) ───────────── */

const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
const styleId = z.enum(STYLE_IDS as [StyleId, ...StyleId[]]);
const fontId = z.enum(FONT_IDS as [FontId, ...FontId[]]);
/** Per-letter overrides on top of the style. */
export const Custom = z.object({ accent: hex.optional(), paper: hex.optional(), ink: hex.optional(), envelope: hex.optional(), head: fontId.optional(), body: fontId.optional() });

/* ───────────── Blocks ─────────────
 * Every piece of a card is a typed block. Adding a block type means:
 *   1. a schema here (+ migration below if an existing shape changes)
 *   2. a factory/icon in lib/blocks.ts and copy in lib/ui.ts
 *   3. a renderer in components/card/blocks.tsx and an editor in components/editor/block-editor.tsx
 * Field values are validated with lib/fields.ts on both sides.
 */

const id = z.string().min(1).max(32);
const short = z.string().max(200);
const long = z.string().max(4000);
const url = z.string().max(2048);
const when = z.string().max(40); // local ISO "2026-11-14T19:30"

export const HeadingBlock = z.object({ id, type: z.literal("heading"), text: short, size: z.enum(["md", "lg", "xl"]).default("xl") });
export const TextBlock = z.object({ id, type: z.literal("text"), text: long, align: z.enum(["left", "center"]).default("center") });
export const ImageBlock = z.object({ id, type: z.literal("image"), src: url, shape: z.enum(["wide", "square", "round"]).default("wide") });
/**
 * Blocks with guest actions (calendar, directions, RSVP buttons, links) carry `interactive`.
 * Off → they render flat even online. Image/PDF exports always render flat.
 */
const interactive = z.boolean().default(true);

export const DateBlock = z.object({ id, type: z.literal("date"), start: when, end: when.optional(), title: short.optional(), interactive });
/** Only the address drives maps/directions; the name is just a label. */
export const PlaceBlock = z.object({ id, type: z.literal("place"), name: short, address: short, interactive });
/** Empty `to` follows the card's first date block, so the two can never disagree. */
export const CountdownBlock = z.object({ id, type: z.literal("countdown"), to: when.default("") });
export const LinkBlock = z.object({
  id, type: z.literal("link"), label: short, href: url,
  icon: z.enum(["link", "gift", "music", "video", "map", "camera"]).default("link"), interactive,
});
export const QrBlock = z.object({ id, type: z.literal("qr"), data: url, caption: short.optional() });

export const RSVP_CHANNELS = ["whatsapp", "sms", "email"] as const;
export type RsvpChannel = (typeof RSVP_CHANNELS)[number];
/** One contact per channel: switching channel never reuses a value typed for another format. */
export const RsvpBlock = z.object({
  id, type: z.literal("rsvp"),
  channel: z.enum(RSVP_CHANNELS),
  contacts: z.object({ whatsapp: short.default(""), sms: short.default(""), email: short.default("") }),
  deadline: when.optional(),
  interactive,
});
export const AgendaBlock = z.object({
  id, type: z.literal("agenda"),
  items: z.array(z.object({ time: z.string().max(10), what: short })).max(20),
});

/** A moodboard of references: colors, emojis, words and pictures. */
export const BoardItem = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("color"), value: hex }),
  z.object({ kind: z.literal("emoji"), value: z.string().max(16) }),
  z.object({ kind: z.literal("text"), value: z.string().max(60) }),
  z.object({ kind: z.literal("image"), value: url }),
]);
export type BoardItem = z.infer<typeof BoardItem>;
export const DressBlock = z.object({ id, type: z.literal("dress"), text: short, board: z.array(BoardItem).max(12).default([]) });

export const GiftBlock = z.object({ id, type: z.literal("gift"), text: short, iban: short.optional(), href: url.optional(), interactive });
export const SignatureBlock = z.object({ id, type: z.literal("signature"), text: short });
export const DividerBlock = z.object({ id, type: z.literal("divider"), style: z.enum(["flourish", "stars", "line"]).default("flourish") });
export const MusicBlock = z.object({ id, type: z.literal("music"), href: url });
/** Postage stamp ("" = not chosen yet). Lives on the envelope. */
export const StampBlock = z.object({ id, type: z.literal("stamp"), stamp: z.union([z.enum(STAMP_IDS as [StampId, ...StampId[]]), z.literal("")]) });

export const Block = z.discriminatedUnion("type", [
  HeadingBlock, TextBlock, ImageBlock, DateBlock, PlaceBlock, CountdownBlock,
  LinkBlock, QrBlock, RsvpBlock, AgendaBlock, DressBlock, GiftBlock,
  SignatureBlock, DividerBlock, MusicBlock, StampBlock,
]);
export type Block = z.infer<typeof Block>;
export type BlockType = Block["type"];
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;

/* ───────────── Envelope (see lib/mail.ts) ─────────────
 * Every slot of the envelope holds a real block of a fixed type: same schema, editor and emptiness
 * rule as on the letter. Slots are always there; fill them or leave them blank.
 */

export const ENV_SLOTS = ["front-center", "front-tl", "front-tr", "front-bl", "back-center"] as const;
export type EnvSlot = (typeof ENV_SLOTS)[number];
export const SLOT_TYPE = {
  "front-center": "heading", // recipient
  "front-tl": "text", // sender
  "front-tr": "stamp", // postage
  "front-bl": "text", // note
  "back-center": "text", // under the seal
} as const satisfies Record<EnvSlot, BlockType>;
export type SlotBlock<S extends EnvSlot> = BlockOf<(typeof SLOT_TYPE)[S]>;
export const Envelope = z.object({ blocks: z.partialRecord(z.enum(ENV_SLOTS), Block) });

/* ───────────── Migrations ─────────────
 * Stored drafts and published cards may predate a schema change. Upgrade them here, once,
 * before validation — components only ever see the current shape.
 */
type Raw = Record<string, unknown>;
function migrateBlock(b: Raw): Raw {
  if (b.type === "rsvp" && !b.contacts) {
    const channel = (b.channel as string) ?? "whatsapp";
    return { ...b, contacts: { whatsapp: "", sms: "", email: "", [channel]: b.to ?? "" } };
  }
  if (b.type === "dress" && !b.board) {
    return { ...b, board: ((b.palette as string[]) ?? []).map((value) => ({ kind: "color", value })) };
  }
  return b;
}
/**
 * Envelope history → slot blocks: v1 "to" / v2 free text → the line under the seal; v3 typed items
 * (text/stamp/emoji, + liner) → blocks of each slot's fixed type. Anything that doesn't fit its slot is dropped.
 */
function migrateEnvelope(e: unknown) {
  if (e && typeof e === "object" && (e as Raw).blocks) return e;
  const items: Raw = typeof e === "string" ? { "back-center": { kind: "text", value: e } } : ((e as Raw)?.items as Raw) ?? null;
  if (!items) return e;
  const blocks: Raw = {};
  for (const [slot, it] of Object.entries(items) as [EnvSlot, Raw][]) {
    const type = SLOT_TYPE[slot];
    if (!type) continue;
    if (type === "stamp" && it?.kind === "stamp") blocks[slot] = { id: slot, type, stamp: it.value };
    if (type === "heading" && it?.kind === "text") blocks[slot] = { id: slot, type, text: it.value, size: "md" };
    if (type === "text" && it?.kind === "text") blocks[slot] = { id: slot, type, text: it.value, align: slot === "back-center" ? "center" : "left" };
  }
  return { blocks };
}

/** v1 "theme" ids → styles. */
const THEME_TO_STYLE: Record<string, StyleId> = { parchment: "parchment", midnight: "midnight", rose: "romance", forest: "botanical", sky: "notebook", ink: "minimal" };
function migrateCard(c: unknown) {
  if (!c || typeof c !== "object" || !Array.isArray((c as Raw).blocks)) return c;
  const { theme, to, ...rest } = c as Raw;
  return {
    ...rest,
    envelope: migrateEnvelope(rest.envelope ?? to),
    style: rest.style ?? THEME_TO_STYLE[theme as string] ?? "parchment",
    blocks: ((c as Raw).blocks as Raw[]).map(migrateBlock),
  };
}

/* ───────────── Card ───────────── */

export const Card = z.preprocess(
  migrateCard,
  z.object({
    v: z.literal(1),
    lang: z.enum(LANGS),
    kind: z.enum(KINDS),
    style: styleId,
    custom: Custom.optional(),
    seal: z.string().max(16).default("icon:sparkle"), // the seal's mark, see lib/craft.ts ("" = no seal)
    sealShape: z.enum(SEAL_SHAPES).default("scallop"),
    envelope: Envelope.optional(), // absent = the style's default envelope (lib/mail.ts)
    nameFallback: z.string().max(60).optional(), // replaces {name} when there is no guest (generic link/image)
    blocks: z.array(Block).max(60),
  }),
);
export type Card = z.infer<typeof Card>;

/* ───────────── Guests ─────────────
 * The audience of a letter, kept apart from its design. Contacts stay on this device; only
 * `{ id, name }` is published, stored next to the card and served one guest per link.
 */
export const Guest = z.object({
  id: z.string().regex(/^[\w-]{4,16}$/),
  name: z.string().trim().min(1).max(80),
  phone: z.string().max(40).optional(),
  email: z.string().max(120).optional(),
});
export type Guest = z.infer<typeof Guest>;
export const PublicGuest = Guest.pick({ id: true, name: true });
export type PublicGuest = z.infer<typeof PublicGuest>;

export type Draft = {
  id: string;
  updatedAt: number;
  card: Card;
  guests?: Guest[];
  sent?: Record<string, number>; // guest id → when their link/image was sent from this device
  /** How this letter is previewed (editor + preview page share it). */
  view?: "link" | "image";
  previewGuest?: string; // guest id to preview as
  publishedId?: string;
  editKey?: string; // lets this device re-publish to the same link
  publishedAt?: number;
};
