import JSZip from "jszip";
import { fileSlug, listTitle } from "@/lib/blocks";
import { limited } from "@/lib/ratelimit.server";
import { renderLetters, type ImageFormat } from "@/lib/render.server";
import { loadCardForEdit, loadGuests } from "@/lib/store.server";

// Hobby allows at most 300, and routes that share a timeout are one function.
// 240 keeps Chromium off the shared 300s routes and off the image route (90).
export const maxDuration = 240;
const MAX = 150;

/**
 * Every guest's letter as an image, zipped: GET /api/v1/letters/:id/images.zip?format=png|jpeg
 * Owner only (Authorization: Bearer <editKey>): it holds every guest's name.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/v1/letters/[id]/images.zip">) {
  if (limited(req, "api-zip", 10, 60 * 60 * 1000)) return Response.json({ error: { code: "rate_limited" } }, { status: 429 });
  const { id } = await ctx.params;
  const key = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  const card = await loadCardForEdit(id, key);
  if (!card) return Response.json({ error: { code: "forbidden", message: "Unknown letter or wrong edit key." } }, { status: 403 });
  const guests = (await loadGuests(id)) ?? [];
  if (guests.length > MAX) return Response.json({ error: { code: "too_many", message: `Up to ${MAX} guests per ZIP; use /image?g= for each guest.` } }, { status: 422 });
  const format: ImageFormat = new URL(req.url).searchParams.get("format") === "jpeg" ? "jpeg" : "png";
  const ext = format === "jpeg" ? "jpg" : "png";
  const targets = guests.length ? guests : [null];
  const imgs = await renderLetters(id, targets.map((g) => g?.id ?? null), format);
  const zip = new JSZip();
  const used = new Set<string>();
  imgs.forEach((img, i) => {
    let name = fileSlug(targets[i]?.name ?? listTitle(card));
    for (let n = 2; used.has(name); n++) name = `${fileSlug(targets[i]?.name ?? "letter")}-${n}`;
    used.add(name);
    zip.file(`${name}.${ext}`, img);
  });
  const body = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });
  return new Response(new Uint8Array(body), {
    headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="${fileSlug(listTitle(card))}.zip"`, "cache-control": "no-store" },
  });
}
