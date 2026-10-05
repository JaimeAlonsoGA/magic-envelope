import { generateImage } from "ai";
import { nanoid } from "nanoid";
import { z } from "zod";
import { limited } from "@/lib/ratelimit.server";
import { saveImage } from "@/lib/store.server";

const MODEL = process.env.IMAGE_MODEL ?? "bfl/flux-2-klein-4b";

const STYLE = {
  storybook: "whimsical storybook watercolor illustration, soft paper texture",
  medieval: "illuminated medieval manuscript illustration, gold leaf, parchment",
  sketch: "hand-drawn ink sketch, excalidraw-like doodle, white background",
  photo: "warm natural photograph, shallow depth of field",
} as const;

const Body = z.object({
  prompt: z.string().trim().min(3).max(400),
  style: z.enum(["storybook", "medieval", "sketch", "photo"]).default("storybook"),
  shape: z.enum(["wide", "square", "round"]).default("wide"),
});

export async function POST(req: Request) {
  if (limited(req, "imagine", 8, 60 * 60 * 1000)) return Response.json({ error: "rate" }, { status: 429 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad" }, { status: 400 });
  const { prompt, style, shape } = parsed.data;

  try {
    const { image } = await generateImage({
      model: MODEL,
      prompt: `${prompt}. ${STYLE[style]}. For a celebration invitation card. No text, no letters.`,
      aspectRatio: shape === "wide" ? "16:9" : "1:1",
    });
    const ext = image.mediaType.split("/")[1] ?? "png";
    const src = await saveImage(`${nanoid(12)}.${ext}`, image.uint8Array, image.mediaType);
    return Response.json({ src });
  } catch (e) {
    console.error("imagine failed", e);
    return Response.json({ error: "failed" }, { status: 502 });
  }
}
