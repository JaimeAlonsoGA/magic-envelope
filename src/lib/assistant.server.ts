import "server-only";
import { Output, generateText } from "ai";
import { nanoid } from "nanoid";
import { z } from "zod";
import { fromPreset, newBlock } from "./blocks";
import { Card, KINDS, LANGS, type Block, type Lang } from "./model";
import { STYLE_IDS, type StyleId } from "./styles";
import { parseWhen } from "./when";

/**
 * The assistant: a few sentences about an occasion become a letter ready to edit — the right
 * occasion, style, language, texts, date, place, links/QR, RSVP and guests — plus a short note on
 * anything the person still has to fill in. The model fills a small plan; the letter itself is
 * built and validated here with the editor's own schemas, so it can't produce something the app
 * couldn't.
 */

const MODEL = process.env.ASSISTANT_MODEL ?? "google/gemini-3.5-flash-lite";

/** What each style feels like, for choosing one that fits the description. */
const STYLE_MOOD: Record<StyleId, string> = {
  parchment: "old parchment, medieval, storybook, rustic",
  midnight: "dark navy and gold, night, elegant evening",
  romance: "soft pink serif, romantic, weddings",
  botanical: "sage green, nature, garden, countryside, forest",
  notebook: "handwritten notebook, casual, friendly",
  minimal: "clean white, modern, simple",
  launch: "dark tech, product launch, meetups, talks",
  groovy: "70s/80s retro, colourful, disco",
  deco: "black and gold art deco, Gatsby, glamour",
  ivory: "ivory, refined, understated elegance",
  brutal: "bold brutalist, loud, design-y",
  bubblegum: "pink playful, kids, baby showers",
  confetti: "colourful confetti, birthdays, parties",
  typewriter: "typewriter, personal letter, nostalgic",
  pocket: "8-bit pixel game, gamers, geeky",
};

const nullable = <T extends z.ZodType>(t: T) => t.nullable();

const Plan = z.object({
  lang: z.enum(LANGS).describe("Language of the person's message: the letter is written in it"),
  kind: z.enum(KINDS),
  style: z.enum(STYLE_IDS as [StyleId, ...StyleId[]]),
  title: z.string().describe("Letter title. Use {name} where each guest's name should go when there are or will be several guests, e.g. \"{name}, ¡cumplo años!\""),
  message: z.string().describe("One to three warm sentences in the person's voice, using the details they gave (setting, mood). No date, address or links here: those get their own blocks."),
  date: nullable(z.object({
    start: z.string().describe('Local date "YYYY-MM-DD", or "YYYY-MM-DDTHH:mm" only if a time was given. Resolve weekdays like "el sábado 17 de octubre" using today\'s date.'),
    end: nullable(z.string()),
  })),
  place: nullable(z.object({ name: z.string().describe("Short name of the place"), address: z.string().describe("What a map can find: town, address or landmark. Empty if unknown.") })),
  link: nullable(z.object({ label: z.string(), href: z.string().describe("Exact URL given by the person, or empty if they only described it") })).describe("A link the guests should open (e.g. a WhatsApp group, a playlist, a gift list)"),
  qr: nullable(z.object({ data: z.string().describe("Exact URL to encode, or empty if not given yet"), caption: z.string() })).describe("A QR code, when the person asks for one or the letter is likely printed"),
  rsvp: nullable(z.object({ channel: z.enum(["whatsapp", "sms", "email"]), contact: z.string().describe("Phone or email given, or empty") })),
  schedule: nullable(z.array(z.object({ time: z.string().describe("HH:mm"), what: z.string() }))),
  dressCode: nullable(z.string()),
  gifts: nullable(z.string()),
  signature: nullable(z.string().describe("The host's name, if known")),
  initials: nullable(z.string().describe("1-3 letters for the wax seal, from the host's name")),
  guests: z.array(z.string()).describe("Guest names mentioned (empty if none were given)"),
  notes: z.string().describe("Two or three short sentences to the person, in their language: what you prepared, and exactly what they still need to fill in (e.g. paste the WhatsApp group link into the QR block, add guests' names). Answer their questions about how to do things in the app."),
});
type Plan = z.infer<typeof Plan>;

const instructions = (today: string) => `You set up invitations and letters in Magic Envelope, a free app where a letter arrives in a sealed envelope and each guest gets their own link with their name.
Today is ${today}.

What the app can do (so you can answer "can it…?" questions and use it):
- Blocks: title, text, date (with add-to-calendar), place (map + directions), countdown, link button, QR code, RSVP (guests reply by WhatsApp, SMS or email with one tap), schedule, dress code, gifts, music, signature.
- Guests: one personal link per guest; {name} in the title/text becomes each guest's name. Letters can also be exported as images (one per guest, or a ZIP) to send or print.
- Styles (choose the one that best fits the occasion and the setting described):
${Object.entries(STYLE_MOOD).map(([id, mood]) => `  - ${id}: ${mood}`).join("\n")}

Rules:
- Only use facts the person gave. Never invent phone numbers, emails, links, times or addresses: leave them empty and say in notes what to fill in.
- Write in the person's language, warmly and briefly, like the host would.
- If they'll invite several people or ask for a template with different names, put {name} in the title.
- In notes, never write {name}: say that each guest's name appears on their own letter once they add guests in "Guests".`;

/** Plan → a validated letter (not published: it opens in the editor as a draft). */
export function letterFrom(p: Plan): { card: Card; guests: { id: string; name: string }[]; notes: string } {
  const lang: Lang = p.lang;
  const base = fromPreset(p.kind, p.style, lang); // the occasion's seal and envelope; blocks are replaced below
  const block = <T extends Block["type"]>(type: T, fields: object) => ({ ...newBlock(type), ...fields, id: nanoid(8) }) as Block;
  const blocks: Block[] = [block("heading", { text: p.title.slice(0, 200) })];
  if (p.message) blocks.push(block("text", { text: p.message.slice(0, 2000) }));
  if (p.date && parseWhen(p.date.start)) blocks.push(block("date", { start: p.date.start, ...(p.date.end && parseWhen(p.date.end) ? { end: p.date.end } : {}) }));
  if (p.date && parseWhen(p.date.start) && (p.kind === "birthday" || p.kind === "party" || p.kind === "wedding")) blocks.push(block("countdown", { to: "" }));
  if (p.place) blocks.push(block("place", { name: p.place.name.slice(0, 200), address: p.place.address.slice(0, 200) }));
  if (p.schedule?.length) blocks.push(block("agenda", { items: p.schedule.slice(0, 20).map((s) => ({ time: s.time.slice(0, 10), what: s.what.slice(0, 200) })) }));
  if (p.dressCode) blocks.push(block("dress", { text: p.dressCode.slice(0, 200) }));
  if (p.link) blocks.push(block("link", { label: p.link.label.slice(0, 200), href: p.link.href.slice(0, 2048) }));
  if (p.qr) blocks.push(block("qr", { data: p.qr.data.slice(0, 2048), caption: p.qr.caption.slice(0, 200) }));
  if (p.gifts) blocks.push(block("gift", { text: p.gifts.slice(0, 200) }));
  if (p.rsvp) blocks.push(block("rsvp", { channel: p.rsvp.channel, contacts: { whatsapp: "", sms: "", email: "", [p.rsvp.channel]: p.rsvp.contact.slice(0, 200) } }));
  // always signed: an unknown host leaves an empty signature to fill (guests never see empty blocks)
  blocks.push(block("signature", { text: (p.signature ?? "").slice(0, 200) }));
  const seal = p.initials?.replace(/[^\p{L}]/gu, "").slice(0, 3).toUpperCase();
  const card = Card.parse({ ...base, lang, kind: p.kind, style: p.style, blocks, ...(seal ? { seal: `ini:${seal}` } : {}) });
  const guests = p.guests.map((n) => n.trim()).filter(Boolean).slice(0, 200).map((name) => ({ id: nanoid(6), name: name.slice(0, 80) }));
  return { card, guests, notes: p.notes.slice(0, 600) };
}

export async function planLetter(description: string, today: string) {
  const { output } = await generateText({
    model: MODEL,
    instructions: instructions(today),
    prompt: description,
    output: Output.object({ schema: Plan }),
    maxOutputTokens: 1500,
  });
  return letterFrom(output);
}
