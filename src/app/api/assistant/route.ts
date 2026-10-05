import { z } from "zod";
import { planLetter } from "@/lib/assistant.server";
import { limited } from "@/lib/ratelimit.server";

export const maxDuration = 60;

const Body = z.object({
  text: z.string().trim().min(8).max(2000),
  today: z.string().max(40), // the person's own date, e.g. "Tuesday 2026-10-06", to resolve "this Saturday"
});

/** Describe the occasion → a letter ready to edit (not published; the app opens it as a draft). */
export async function POST(req: Request) {
  if (limited(req, "assistant", 10, 60 * 60 * 1000)) return Response.json({ error: "rate" }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad" }, { status: 400 });
  try {
    return Response.json(await planLetter(parsed.data.text, parsed.data.today));
  } catch (e) {
    console.error("assistant failed", e);
    return Response.json({ error: "failed" }, { status: 502 });
  }
}
