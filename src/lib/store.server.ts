import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";
import { Card, PublicGuest } from "./model";

/**
 * Storage for published cards and images.
 * - With BLOB_READ_WRITE_TOKEN (or Vercel OIDC + BLOB_STORE_ID): Vercel Blob.
 *   Cards are private (they can hold phone numbers); images are public.
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

export async function loadCardForEdit(id: string, editKey: string): Promise<Card | null> {
  if (!/^[\w-]{6,32}$/.test(id) || !editKey) return null;
  const raw = (await readJson(`cards/${id}.json`)) as Stored | null;
  if (!raw || !timingSafeEqual(Buffer.from(raw.key), Buffer.from(hashKey(editKey)))) return null;
  const parsed = Card.safeParse(raw.card);
  return parsed.success ? parsed.data : null;
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
  if (existing && !timingSafeEqual(Buffer.from(existing.key), Buffer.from(hashKey(editKey)))) return false;
  const now = Date.now();
  await writeJson(`cards/${id}.json`, {
    card, guests, key: hashKey(editKey), createdAt: existing?.createdAt ?? now, updatedAt: now,
  } satisfies Stored);
  return true;
}

/** Store an image and return a URL usable in <img src>. */
export async function saveImage(name: string, data: Uint8Array | Blob, contentType: string) {
  if (useBlob) {
    const blob = await put(`img/${name}`, data instanceof Blob ? data : Buffer.from(data), { access: "public", contentType, addRandomSuffix: true });
    return blob.url;
  }
  const file = path.join(LOCAL, "img", name);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data);
  return `/api/file/${name}`;
}

export async function readLocalImage(name: string) {
  if (!/^[\w.-]+$/.test(name)) return null;
  try {
    return await readFile(path.join(LOCAL, "img", name));
  } catch {
    return null;
  }
}
