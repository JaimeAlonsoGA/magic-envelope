import { z } from "zod";
import { limited } from "@/lib/ratelimit.server";
import { RSVP_ANSWERS, loadPublished, saveRsvp } from "@/lib/store.server";

const Body = z.object({ id: z.string().regex(/^[\w-]{6,32}$/), g: z.string().regex(/^[\w-]{4,16}$/).optional(), answer: z.enum(RSVP_ANSWERS) });

/** A guest tapped an RSVP answer: keep it so the host sees who's coming (the message still goes out on the host's channel). */
export async function POST(req: Request) {
  if (limited(req, "rsvp", 30, 60 * 60 * 1000)) return new Response(null, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const { id, g, answer } = parsed.data;
  const letter = await loadPublished(id, g);
  if (!letter) return new Response(null, { status: 404 });
  await saveRsvp(id, g && letter.guestName ? g : null, answer);
  return new Response(null, { status: 204 });
}
