import { z } from "zod";
import { limited } from "@/lib/ratelimit.server";
import { saveRating } from "@/lib/store.server";

/** A host, after sending, or a guest, after opening. One per device; a few per network per day. */
export async function POST(req: Request) {
  if (limited(req, "rate", 3, 24 * 60 * 60 * 1000)) return new Response(null, { status: 429 });
  const parsed = z.object({ stars: z.number().int().min(1).max(5) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  await saveRating(parsed.data.stars);
  return new Response(null, { status: 204 });
}
