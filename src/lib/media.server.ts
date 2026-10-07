import "server-only";
import { createHash } from "crypto";
import { lookup } from "dns";
import { isIP, type LookupFunction } from "net";
import { Agent, fetch } from "undici";
import { hostOf, safeUrl } from "./actions";
import { directImageUrl, isOwnImage } from "./media";
import type { Block, Card } from "./model";
import { deleteImage, readImage, saveImage } from "./store.server";

const MAX_BYTES = 8_000_000;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

function isPrivate(ip: string): boolean {
  const v = ip.toLowerCase().replace(/^::ffff:/, "");
  if (v.includes(":")) return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  const [a, b] = v.split(".").map(Number);
  if (Number.isNaN(a) || Number.isNaN(b)) return true;
  if (a === 10 || a === 127 || a === 0 || a >= 224) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

function blockedHost(host: string) {
  const h = host.toLowerCase().replace(/\.$/, "");
  return h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || h === "metadata.google.internal" || h === "0.0.0.0";
}

/** Width and height from the file header, when the format is one we know. */
export function imageSize(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (buf.length > 10 && buf[0] === 0x47 && buf[1] === 0x49) return { width: buf[6] | (buf[7] << 8), height: buf[8] | (buf[9] << 8) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) break;
      const marker = buf[i + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) return { width: (buf[i + 7] << 8) | buf[i + 8], height: (buf[i + 5] << 8) | buf[i + 6] };
      i += 2 + ((buf[i + 2] << 8) | buf[i + 3]);
    }
  }
  return null;
}

function sniff(buf: Uint8Array): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0x47 && buf[1] === 0x49) return "image/gif";
  if (buf.length > 12 && buf[0] === 0x52 && buf[8] === 0x57) return "image/webp";
  return null;
}

/**
 * Every connection resolves through here, so the address checked is the address connected to: a
 * name that answers public for a pre-check and private for the fetch (DNS rebinding) gets nowhere.
 */
const publicOnly: LookupFunction = (hostname, options, callback) =>
  lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 4);
    const list = addresses as unknown as { address: string; family: number }[];
    if (!list.length || list.some((a) => isPrivate(a.address))) return callback(new Error("blocked address"), "", 4);
    if (options.all) (callback as unknown as (e: null, a: typeof list) => void)(null, list);
    else callback(null, list[0].address, list[0].family);
  });
const publicAgent = new Agent({ connect: { lookup: publicOnly } });

/** The body, stopping as soon as it passes `max` (a declared or an endless size never reaches memory). */
async function readCapped(res: Awaited<ReturnType<typeof fetch>>, max: number) {
  if (Number(res.headers.get("content-length") ?? 0) > max) throw new Error("too big");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of res.body ?? []) {
    size += chunk.byteLength;
    if (size > max) throw new Error("too big");
    chunks.push(chunk);
  }
  const buf = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { buf.set(c, at); at += c.byteLength; }
  return buf;
}

/** Fetch one public image. Refuses private hosts, odd ports and anything that isn't a picture. */
async function fetchPublicImage(raw: string, hops = 0): Promise<{ buf: Uint8Array; type: string }> {
  const u = new URL(raw);
  if (u.username || u.password || (u.protocol !== "https:" && u.protocol !== "http:")) throw new Error("bad url");
  if (u.port && u.port !== "80" && u.port !== "443") throw new Error("bad port");
  if (blockedHost(u.hostname)) throw new Error("blocked host");
  if (isIP(u.hostname) && isPrivate(u.hostname)) throw new Error("blocked address");
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 12_000);
  try {
    const res = await fetch(u, {
      dispatcher: publicAgent, redirect: "manual", signal: ac.signal,
      headers: {
        accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
        // A product-only token is refused by several image hosts. This still names us.
        "user-agent": "Mozilla/5.0 (compatible; MagicEnvelope/1.0; +https://magic-envelope.com)",
      },
    });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc || hops >= 3) throw new Error("redirect");
      return fetchPublicImage(new URL(loc, u).href, hops + 1);
    }
    if (!res.ok) throw new Error(String(res.status));
    const buf = await readCapped(res, MAX_BYTES);
    const type = sniff(buf);
    if (!type || !EXT[type]) throw new Error("not an image");
    return { buf, type };
  } finally {
    clearTimeout(timer);
  }
}

async function cached(hash: string) {
  for (const ext of ["jpg", "png", "webp", "gif"]) {
    const name = `remote-${hash}.${ext}`;
    if (await readImage(name)) return name;
  }
  return null;
}

/** File id of a Drive share link or an lh3 /d/<id> address, when there is one. */
function driveFileId(raw: string): string | null {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "drive.google.com" || host === "docs.google.com")
      return u.pathname.match(/\/d\/([^/]+)/)?.[1] ?? u.searchParams.get("id");
    if (host.endsWith("googleusercontent.com") || host.endsWith("ggpht.com"))
      return u.pathname.match(/\/d\/([^/=?#]+)/)?.[1] ?? null;
  } catch { /* caller treats this as a normal URL */ }
  return null;
}

/**
 * Drive's lh3 address often answers with a small preview even at =s0. The download URL is the file
 * itself. Use that whenever it is a real image; only fall back to the preview hosts if it isn't.
 */
async function fetchBest(raw: string): Promise<{ buf: Uint8Array; type: string }> {
  const direct = directImageUrl(raw);
  const id = driveFileId(raw) ?? driveFileId(direct);
  const urls = id
    ? [
        `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`,
        `https://lh3.googleusercontent.com/d/${id}=s0`,
        `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w2400`,
      ]
    : [direct];
  let best: { buf: Uint8Array; type: string; edge: number } | null = null;
  let last: unknown;
  for (const url of urls) {
    try {
      const got = await fetchPublicImage(url);
      const size = imageSize(got.buf);
      const edge = size ? Math.max(size.width, size.height) : 10_000;
      if (!best || edge > best.edge) best = { ...got, edge };
      const original = url.includes("export=download");
      if (edge >= 1600 || (original && edge >= 400)) break;
    } catch (e) {
      last = e;
    }
  }
  if (!best) throw last instanceof Error ? last : new Error("not an image");
  return best;
}

/**
 * Copy a remote image onto our file store and return its same-origin URL.
 * The same source URL always maps to the same file, so repeat publishes don't duplicate it.
 */
export async function ingestRemoteImage(raw: string): Promise<{ src: string; width: number; height: number }> {
  const safe = safeUrl(raw);
  if (!safe) throw new Error("bad url");
  if (isOwnImage(safe)) {
    const path = safe.startsWith("/") ? safe : new URL(safe).pathname;
    return { src: path, width: 0, height: 0 };
  }
  const direct = directImageUrl(safe);
  const hash = createHash("sha256").update(direct).digest("hex").slice(0, 24);
  const drive = !!(driveFileId(safe) ?? driveFileId(direct));
  const hit = await cached(hash);
  if (hit) {
    const buf = (await readImage(hit))!;
    const size = imageSize(buf);
    const edge = size ? Math.max(size.width, size.height) : 1600;
    // A previous copy of a Drive link may be the tiny preview. Replace it when we can.
    if (!drive || edge >= 900) return { src: `/api/file/${hit}`, width: size?.width ?? 0, height: size?.height ?? 0 };
  }
  const got = await fetchBest(safe);
  const name = `remote-${hash}.${EXT[got.type]}`;
  if (hit && hit !== name) await deleteImage(hit);
  const src = await saveImage(name, got.buf, got.type);
  const size = imageSize(got.buf);
  return { src, width: size?.width ?? 0, height: size?.height ?? 0 };
}

/**
 * Replace every remote picture on a letter with a copy we host, so guests and exports never depend
 * on another site's CORS or thumbnail size. A picture we can't copy is left as-is (the page still
 * tries it through /api/media) and reported.
 */
export async function copyCardImages(card: Card): Promise<{ card: Card; warnings: string[] }> {
  const warnings: string[] = [];
  const copy = async (src: string, label: string) => {
    if (!/^https?:\/\//i.test(src) || isOwnImage(src)) return src;
    try {
      const got = await ingestRemoteImage(src);
      if (got.width > 0 && Math.max(got.width, got.height) < 900)
        warnings.push(`${label} is only ${got.width}×${got.height}px, so it will look soft. Upload a larger file, or a public Google Drive link — those are copied at full size.`);
      return got.src;
    } catch {
      warnings.push(`${label} could not be copied from ${hostOf(src)}. Upload the file, or use a link that is public and points at the image itself.`);
      return src;
    }
  };
  const blocks: Block[] = [];
  for (const b of card.blocks) {
    if (b.type === "image" && b.src.trim()) blocks.push({ ...b, src: await copy(b.src, "An image") });
    else if (b.type === "dress") {
      const board = [];
      for (const it of b.board) board.push(it.kind === "image" && it.value.trim() ? { ...it, value: await copy(it.value, "A dress-code image") } : it);
      blocks.push({ ...b, board });
    } else blocks.push(b);
  }
  return { card: { ...card, blocks }, warnings };
}
