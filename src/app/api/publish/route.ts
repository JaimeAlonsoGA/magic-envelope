import { nanoid } from "nanoid";
import { z } from "zod";
import { copyCardImages } from "@/lib/media.server";
import { Card, PublicGuest } from "@/lib/model";
import { limited } from "@/lib/ratelimit.server";
import { saveCard } from "@/lib/store.server";

const Body = z.object({
  card: Card,
  id: z.string().regex(/^[\w-]{6,32}$/).optional(), // present when re-publishing
  key: z.string().min(16).max(64).optional(),
  guests: z.array(PublicGuest).max(1000).default([]), // names only: contacts never leave the device
});

export async function POST(req: Request) {
  if (limited(req, "publish", 60, 60 * 60 * 1000)) return Response.json({ error: "rate" }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad" }, { status: 400 });

  let { id, key } = parsed.data;
  if (!id || !key) {
    id = nanoid(10);
    key = nanoid(32);
  }
  const { card: stored } = await copyCardImages(parsed.data.card);
  const { guests } = parsed.data;
  if (!(await saveCard(id, stored, key, guests))) {
    // Edit key doesn't match: publish as a brand-new card instead.
    id = nanoid(10);
    key = nanoid(32);
    await saveCard(id, stored, key, guests);
  }
  return Response.json({ id, key, card: stored });
}
