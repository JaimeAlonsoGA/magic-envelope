import { fileSlug, listTitle } from "@/lib/blocks";
import { limited } from "@/lib/ratelimit.server";
import { renderLetters, type ImageFormat } from "@/lib/render.server";
import { letterVersion, loadPublished } from "@/lib/store.server";

export const maxDuration = 60;

/**
 * One letter as an image: GET /api/v1/letters/:id/image?g=<guestId>&format=png|jpeg
 * The same capability as the guest's link (whoever has the link can see the letter). Versioned URLs
 * (?v=, as returned by the API) are cached for good; a letter change gives them a new version.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/v1/letters/[id]/image">) {
  if (limited(req, "api-image", 120, 60 * 60 * 1000)) return Response.json({ error: { code: "rate_limited" } }, { status: 429 });
  const { id } = await ctx.params;
  const q = new URL(req.url).searchParams;
  const g = q.get("g") ?? undefined;
  const format: ImageFormat = q.get("format") === "jpeg" ? "jpeg" : "png";
  const [data, version] = await Promise.all([loadPublished(id, g), letterVersion(id)]);
  if (!data || (g && !data.guestName)) return Response.json({ error: { code: "not_found", message: "Unknown letter or guest." } }, { status: 404 });
  const [img] = await renderLetters(id, [g ?? null], format);
  const current = q.get("v") === String(version);
  const ext = format === "jpeg" ? "jpg" : "png";
  const filename = fileSlug(data.guestName ? `${listTitle(data.card)}-${data.guestName}` : listTitle(data.card));
  return new Response(new Uint8Array(img), {
    headers: {
      "content-type": `image/${format}`,
      "access-control-allow-origin": "*",
      "cache-control": current ? "public, max-age=31536000, immutable" : "public, max-age=60",
      ...(q.get("download") ? { "content-disposition": `attachment; filename="${filename}.${ext}"` } : {}),
    },
  });
}
