import { apiError, createLetter } from "@/lib/api.server";
import { limited } from "@/lib/ratelimit.server";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, authorization", "access-control-allow-methods": "POST, OPTIONS" };
export const OPTIONS = () => new Response(null, { headers: CORS });

/** Create and publish a letter. */
export async function POST(req: Request) {
  if (limited(req, "api-create", 60, 60 * 60 * 1000)) return Response.json({ error: { code: "rate_limited", message: "Too many letters; try again later." } }, { status: 429, headers: CORS });
  try {
    const body = await req.json().catch(() => ({}));
    return Response.json(await createLetter(body), { status: 201, headers: CORS });
  } catch (e) {
    return apiError(e);
  }
}
