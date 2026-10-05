import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, list, put } from "@vercel/blob";
import { Card, PublicGuest, RSVP_ANSWERS, type RsvpAnswer } from "./model";

export { RSVP_ANSWERS, type RsvpAnswer };

/**
 * Storage for published cards and images.
 * - With BLOB_READ_WRITE_TOKEN (or Vercel OIDC + BLOB_STORE_ID): a private Vercel Blob store.
 *   Cards can hold phone numbers; images are served by /api/file under unguessable names.
 * - Without it (local dev): files under .data/ served by /api/file.
 */
const useBlob = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const LOCAL = path.join(process.cwd(), ".data");

type Stored = { card: Card; key: string; createdAt: number; updatedAt: number; guests?: PublicGuest[] };

export const hashKey = (k: string) => createHash("sha256").update(k).digest("hex");

async function readJson(pathname: string): Promise<unknown | null> {
  if (useBlob) {
    const res = await get(pathname, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text());
  }
  try {
    return JSON.parse(await readFile(path.join(LOCAL, pathname), "utf8"));
  } catch {
    return null;
  }
}

async function writeJson(pathname: string, data: unknown) {
  const body = JSON.stringify(data);
  if (useBlob) {
    await put(pathname, body, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  const file = path.join(LOCAL, pathname);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

export async function loadCard(id: string): Promise<Card | null> {
  return (await loadPublished(id))?.card ?? null;
}

/**
 * A published letter as one guest sees it: the card plus *only* that guest's name.
 * The guest list itself never leaves the server.
 */
export async function loadPublished(id: string, guestId?: string): Promise<{ card: Card; guestName?: string } | null> {
  if (!/^[\w-]{6,32}$/.test(id)) return null;
  const raw = (await readJson(`cards/${id}.json`)) as Stored | null;
  const parsed = Card.safeParse(raw?.card);
  if (!parsed.success) return null;
  const guest = guestId ? raw?.guests?.find((g) => g.id === guestId) : undefined;
  return { card: parsed.data, guestName: guest?.name };
}

const keyMatches = (raw: Stored, editKey: string) => !!editKey && timingSafeEqual(Buffer.from(raw.key), Buffer.from(hashKey(editKey)));

/** The stored letter, only for the holder of its edit key. */
async function owned(id: string, editKey: string): Promise<Stored | null> {
  if (!/^[\w-]{6,32}$/.test(id) || !editKey) return null;
  const raw = (await readJson(`cards/${id}.json`)) as Stored | null;
  return raw && keyMatches(raw, editKey) ? raw : null;
}

export async function loadCardForEdit(id: string, editKey: string): Promise<Card | null> {
  const raw = await owned(id, editKey);
  const parsed = Card.safeParse(raw?.card);
  return raw && parsed.success ? parsed.data : null;
}

/** When the letter last changed (cache key for rendered images). */
export async function letterVersion(id: string): Promise<number | null> {
  if (!/^[\w-]{6,32}$/.test(id)) return null;
  const raw = (await readJson(`cards/${id}.json`)) as Stored | null;
  return raw ? raw.updatedAt : null;
}

/* ───────────── Deleting ───────────── */

/** Uploaded/generated images a letter uses (they're per-upload, so they go with it). */
function imagesOf(card: unknown): string[] {
  const names = new Set<string>();
  JSON.stringify(card ?? {}, (_k, v) => {
    const m = typeof v === "string" && v.match(/^\/api\/file\/([\w-]+\.\w+)$/);
    if (m) names.add(m[1]);
    return v;
  });
  return [...names];
}

async function removePaths(paths: string[]) {
  if (!paths.length) return;
  if (useBlob) await del(paths);
  else await Promise.all(paths.map((p) => rm(path.join(LOCAL, p), { force: true })));
}

/** Delete a published letter for good: the card, its guest list, its RSVP answers and its images. */
export async function deleteCard(id: string, editKey: string): Promise<boolean> {
  const raw = await owned(id, editKey);
  if (!raw) return false;
  const answers = (await listPaths(`rsvp/${id}/`)).map((a) => a.pathname);
  await removePaths([...answers, ...imagesOf(raw.card).map((n) => `img/${n}`), `cards/${id}.json`]);
  return true;
}

/* ───────────── RSVP answers ─────────────
 * One file per guest: rsvp/<letter>/<guest>~<answer>. The answer lives in the name, so the whole
 * log is a single listing (no reads, no read-modify-write races); answering again replaces it.
 */
export type RsvpRecord = { guestId: string | null; answer: RsvpAnswer; at: string };

async function listPaths(prefix: string): Promise<{ pathname: string; at: Date }[]> {
  if (useBlob) {
    const out: { pathname: string; at: Date }[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      out.push(...page.blobs.map((b) => ({ pathname: b.pathname, at: b.uploadedAt })));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return out;
  }
  const dir = path.join(LOCAL, prefix);
  const files = await readdir(dir).catch(() => [] as string[]);
  return Promise.all(files.map(async (f) => ({ pathname: `${prefix}${f}`, at: (await stat(path.join(dir, f))).mtime })));
}

/** Record a guest's answer (guestId null = someone on the generic link). */
export async function saveRsvp(id: string, guestId: string | null, answer: RsvpAnswer) {
  const who = guestId ?? `anon-${randomBytes(5).toString("hex")}`;
  const prefix = `rsvp/${id}/${who}~`;
  const old = (await listPaths(`rsvp/${id}/`)).filter((p) => p.pathname.startsWith(prefix)).map((p) => p.pathname);
  await removePaths(old);
  const pathname = `${prefix}${answer}`;
  if (useBlob) await put(pathname, new Date().toISOString(), { access: "private", contentType: "text/plain", addRandomSuffix: false, allowOverwrite: true });
  else {
    await mkdir(path.join(LOCAL, `rsvp/${id}`), { recursive: true });
    await writeFile(path.join(LOCAL, pathname), new Date().toISOString());
  }
}

export async function listRsvps(id: string): Promise<RsvpRecord[]> {
  return (await listPaths(`rsvp/${id}/`)).flatMap(({ pathname, at }) => {
    const [who, answer] = pathname.slice(`rsvp/${id}/`.length).split("~");
    if (!RSVP_ANSWERS.includes(answer as RsvpAnswer)) return [];
    return [{ guestId: who.startsWith("anon-") ? null : who, answer: answer as RsvpAnswer, at: at.toISOString() }];
  });
}

/** A published letter's guest list (names + ids). Server-side only: never sent to a guest page. */
export async function loadGuests(id: string): Promise<PublicGuest[] | null> {
  if (!/^[\w-]{6,32}$/.test(id)) return null;
  const raw = (await readJson(`cards/${id}.json`)) as Stored | null;
  return raw ? raw.guests ?? [] : null;
}

/** Create (no existing) or overwrite (matching edit key) a published card. */
export async function saveCard(id: string, card: Card, editKey: string, guests: PublicGuest[] = []) {
  const existing = (await readJson(`cards/${id}.json`)) as Stored | null;
  if (existing && !keyMatches(existing, editKey)) return false;
  const now = Date.now();
  await writeJson(`cards/${id}.json`, {
    card, guests, key: hashKey(editKey), createdAt: existing?.createdAt ?? now, updatedAt: now,
  } satisfies Stored);
  return true;
}

/** Store an image and return a URL usable in <img src>. Names are random, so the URL is the capability. */
export async function saveImage(name: string, data: Uint8Array | Blob, contentType: string) {
  if (useBlob) {
    // one private store for everything; images are served through /api/file like in local dev
    await put(`img/${name}`, data instanceof Blob ? data : Buffer.from(data), { access: "private", contentType, addRandomSuffix: false });
  } else {
    const file = path.join(LOCAL, "img", name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data);
  }
  return `/api/file/${name}`;
}

export async function readImage(name: string): Promise<Uint8Array | null> {
  if (!/^[\w-]+\.\w+$/.test(name)) return null;
  if (useBlob) {
    const res = await get(`img/${name}`, { access: "private" });
    if (!res || res.statusCode !== 200) return null;
    return new Uint8Array(await new Response(res.stream).arrayBuffer());
  }
  try {
    return await readFile(path.join(LOCAL, "img", name));
  } catch {
    return null;
  }
}

/* ───────────── App ratings ─────────────
 * One file per rating (ratings/<stars>~<random>); the summary is a single listing. Real ratings
 * from people who just finished a letter: they back the aggregateRating in the home's structured data.
 */
export async function saveRating(stars: number) {
  const pathname = `ratings/${stars}~${randomBytes(6).toString("hex")}`;
  const at = new Date().toISOString();
  if (useBlob) await put(pathname, at, { access: "private", contentType: "text/plain", addRandomSuffix: false });
  else {
    await mkdir(path.join(LOCAL, "ratings"), { recursive: true });
    await writeFile(path.join(LOCAL, pathname), at);
  }
}

export async function ratingSummary(): Promise<{ count: number; average: number }> {
  const stars = (await listPaths("ratings/")).map((p) => Number(p.pathname.slice("ratings/".length).split("~")[0])).filter((n) => n >= 1 && n <= 5);
  return { count: stars.length, average: stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0 };
}
