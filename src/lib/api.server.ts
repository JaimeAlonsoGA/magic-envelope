import "server-only";
import { nanoid } from "nanoid";
import { z } from "zod";
import { PRESETS, blankCard, fromPreset, newBlock } from "./blocks";
import { SEAL_ICONS, SEAL_SHAPES } from "./craft";
import { t } from "./i18n";
import { SLOT_LIMIT, SLOT_ROLE, STAMP_IDS } from "./mail";
import { Block, Card, Custom, ENV_SLOTS, Envelope, KINDS, LANGS, SLOT_TYPE, type BlockType } from "./model";
import { SITE_URL } from "./site";
import { loadCardForEdit, loadGuests, saveCard } from "./store.server";
import { FONTS, STYLES, STYLE_IDS, type StyleId } from "./styles";
import { BLOCK_LABEL, KIND_LABEL } from "./ui";

/**
 * The agent-facing service layer. The REST API (/api/v1) and the MCP server (/api/mcp) are thin
 * adapters over these functions, and both validate with the very schemas the app uses — so whatever
 * an agent builds is a letter the editor could have built.
 */

/* ───────────── Input ───────────── */

/** Blocks may be partial: `{ type: "date", start: "2026-11-14T19:00" }`. Missing fields come from the editor's defaults. */
const BLOCK_TYPES = Object.keys(BLOCK_LABEL) as BlockType[];
const PartialBlock = z.preprocess((b) => {
  const type = (b as { type?: BlockType })?.type;
  if (!b || typeof b !== "object" || !type || !BLOCK_TYPES.includes(type)) return b; // let Block report the error
  return { ...newBlock(type), ...b, id: (b as { id?: string }).id ?? nanoid(8) };
}, Block);

export const LetterInput = z.object({
  lang: z.enum(LANGS).default("en").describe("Language guests read the letter in"),
  style: z.enum(STYLE_IDS as [StyleId, ...StyleId[]]).default("parchment").describe("Look of the letter and envelope (see catalog.styles)"),
  preset: z.enum(KINDS).optional().describe("Start from an occasion preset (pre-filled blocks). Omit for a blank letter."),
  blocks: z.array(PartialBlock).max(60).optional().describe("Letter blocks, top to bottom. Replaces the preset's blocks. Use {name} in text to address each guest."),
  custom: Custom.optional().describe("Overrides on top of the style: accent/paper/ink/envelope colours, head/body fonts"),
  seal: z.string().max(16).optional().describe('Wax seal mark: "" none, "_" plain, "icon:<id>", "ini:ABC", "duo:A|J"'),
  sealShape: z.enum(SEAL_SHAPES).optional(),
  envelope: Envelope.optional().describe("Envelope slot blocks (see catalog.envelope)"),
  nameFallback: z.string().max(60).optional().describe('What {name} reads as without a guest (default: "Dear Guest" in the letter language)'),
  guests: z.array(z.object({ name: z.string().trim().min(1).max(80) })).max(1000).default([]).describe("Each guest gets their own addressed link"),
});
export type LetterInput = z.input<typeof LetterInput>;

export const LetterPatch = LetterInput.partial().extend({
  guests: z.array(z.object({ id: z.string().optional(), name: z.string().trim().min(1).max(80) })).max(1000).optional(),
});

/* ───────────── Output ───────────── */

function links(id: string, key: string, guests: { id: string; name: string }[]) {
  return {
    id,
    editKey: key,
    url: `${SITE_URL}/c/${id}`,
    editUrl: `${SITE_URL}/e/${id}#${key}`,
    previewImage: `${SITE_URL}/c/${id}/opengraph-image`,
    printUrl: `${SITE_URL}/c/${id}?print=1`,
    guests: guests.map((g) => ({ id: g.id, name: g.name, url: `${SITE_URL}/c/${id}?g=${g.id}` })),
  };
}
export type LetterLinks = ReturnType<typeof links>;

function build(input: z.output<typeof LetterInput>, base?: Card): Card {
  const start = base ?? (input.preset ? fromPreset(input.preset, input.style, input.lang) : blankCard(input.style, input.lang));
  return Card.parse({
    ...start,
    lang: input.lang ?? start.lang,
    style: input.style ?? start.style,
    ...(input.blocks ? { blocks: input.blocks } : {}),
    ...(input.custom ? { custom: input.custom } : {}),
    ...(input.seal !== undefined ? { seal: input.seal } : {}),
    ...(input.sealShape ? { sealShape: input.sealShape } : {}),
    ...(input.envelope ? { envelope: input.envelope } : {}),
    ...(input.nameFallback ? { nameFallback: input.nameFallback } : {}),
  });
}

/* ───────────── Operations ───────────── */

/** Create and publish a letter. Returns its links (and one per guest) and the secret edit key. */
export async function createLetter(raw: unknown): Promise<LetterLinks> {
  const input = LetterInput.parse(raw);
  const card = build(input);
  const id = nanoid(10), key = nanoid(32);
  const guests = input.guests.map((g) => ({ id: nanoid(6), name: g.name }));
  await saveCard(id, card, key, guests);
  return links(id, key, guests);
}

export async function getLetter(id: string, key: string) {
  const card = await loadCardForEdit(id, key);
  if (!card) return null;
  const guests = (await loadGuests(id)) ?? [];
  return { card, ...links(id, key, guests) };
}

/** Change a published letter (the same links keep working). Guests keep their id (and link) when passed back. */
export async function updateLetter(id: string, key: string, raw: unknown) {
  const card = await loadCardForEdit(id, key);
  if (!card) return null;
  const patch = LetterPatch.parse(raw);
  const next = build({ ...LetterInput.parse({ lang: card.lang, style: card.style }), ...patch } as z.output<typeof LetterInput>, card);
  const current = (await loadGuests(id)) ?? [];
  const guests = patch.guests ? patch.guests.map((g) => ({ id: g.id && current.some((c) => c.id === g.id) ? g.id : nanoid(6), name: g.name })) : current;
  await saveCard(id, next, key, guests);
  return { card: next, ...links(id, key, guests) };
}

/** Everything an agent needs to compose a good letter, in one call. */
export function catalog() {
  return {
    languages: LANGS.map((l) => ({ id: l, name: t(l).langName })),
    styles: (Object.keys(STYLES) as StyleId[]).map((id) => ({
      id, name: STYLES[id].name, group: STYLES[id].group, fonts: { head: STYLES[id].head, body: STYLES[id].body },
      colors: { paper: STYLES[id].paper, ink: STYLES[id].ink, accent: STYLES[id].accent, envelope: STYLES[id].envelope },
    })),
    fonts: Object.entries(FONTS).map(([id, f]) => ({ id, label: f.label })),
    presets: KINDS.map((k) => ({ id: k, name: KIND_LABEL[k], blocks: PRESETS[k] })),
    blocks: (Object.keys(BLOCK_LABEL) as BlockType[]).filter((b) => b !== "stamp").map((type) => ({ type, label: BLOCK_LABEL[type], example: newBlock(type) })),
    envelope: {
      slots: ENV_SLOTS.map((s) => ({ slot: s, role: SLOT_ROLE[s], block: SLOT_TYPE[s], maxChars: SLOT_LIMIT[s].chars, maxLines: SLOT_LIMIT[s].lines })),
      stamps: STAMP_IDS,
    },
    seal: { icons: SEAL_ICONS, shapes: SEAL_SHAPES, formats: ['"" none', '"_" plain', '"icon:<icon>"', '"ini:ABC"', '"duo:A|J"'] },
    personalization: "Write {name} in heading, text, signature or envelope text: each guest's link shows their name.",
  };
}

/** JSON Schemas of the inputs (for tool definitions and validation on the agent side). */
export function schemas() {
  const opts = { io: "input", unrepresentable: "any" } as const;
  return {
    letterInput: z.toJSONSchema(LetterInput, opts),
    letterPatch: z.toJSONSchema(LetterPatch, opts),
    block: z.toJSONSchema(Block, opts),
    card: z.toJSONSchema(Card, opts),
  };
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

/** Uniform JSON error responses for the REST adapter. */
export function apiError(e: unknown) {
  if (e instanceof z.ZodError) return Response.json({ error: { code: "invalid_input", message: "The input doesn't match the schema.", issues: e.issues } }, { status: 400 });
  if (e instanceof ApiError) return Response.json({ error: { code: e.code, message: e.message } }, { status: e.status });
  console.error(e);
  return Response.json({ error: { code: "internal", message: "Something went wrong." } }, { status: 500 });
}
