import { limited } from "@/lib/ratelimit.server";
import { ingestRemoteImage } from "@/lib/media.server";

/** Same-origin full-size copy of a remote image. Letters point <img> here so a thumbnail or a CORS block never reaches the guest. */
export async function GET(req: Request) {
  if (limited(req, "media", 240, 60 * 60 * 1000)) return new Response("rate", { status: 429 });
  const raw = new URL(req.url).searchParams.get("url") ?? "";
  try {
    const { src } = await ingestRemoteImage(raw);
    return Response.redirect(new URL(src, req.url), 302);
  } catch {
    return new Response("unavailable", { status: 422 });
  }
}
