import { z } from "zod";
import { apiError } from "@/lib/api.server";
import { ingestRemoteImage } from "@/lib/media.server";
import { limited } from "@/lib/ratelimit.server";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS" };
export const OPTIONS = () => new Response(null, { headers: CORS });

/** Copy a public image (or a Drive/Dropbox share link) and return a src that drops straight into an image block. */
export async function POST(req: Request) {
  if (limited(req, "media", 40, 60 * 60 * 1000)) return Response.json({ error: { code: "rate_limited" } }, { status: 429, headers: CORS });
  try {
    const { url } = z.object({ url: z.string().trim().min(1).max(2048) }).parse(await req.json().catch(() => ({})));
    const { src, width, height } = await ingestRemoteImage(url);
    const soft = width > 0 && Math.max(width, height) < 900;
    return Response.json({ src, width, height, ...(soft ? { warning: `This image is ${width}×${height}px and will look soft on the letter.` } : {}) }, { headers: CORS });
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e);
    return Response.json({ error: { code: "unavailable", message: "That URL is not a public image we can copy. Upload the file, or share a public Google Drive / Dropbox link." } }, { status: 422, headers: CORS });
  }
}
