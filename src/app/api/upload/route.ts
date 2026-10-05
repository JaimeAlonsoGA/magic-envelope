import { nanoid } from "nanoid";
import { limited } from "@/lib/ratelimit.server";
import { saveImage } from "@/lib/store.server";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** Images are resized client-side (≤1600px), so they stay well under the 4.5 MB body limit. */
export async function POST(req: Request) {
  if (limited(req, "upload", 40, 60 * 60 * 1000)) return Response.json({ error: "rate" }, { status: 429 });
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof Blob) || !TYPES[file.type] || file.size > 4 * 1024 * 1024)
    return Response.json({ error: "bad" }, { status: 400 });
  const src = await saveImage(`${nanoid(12)}.${TYPES[file.type]}`, file, file.type);
  return Response.json({ src });
}
