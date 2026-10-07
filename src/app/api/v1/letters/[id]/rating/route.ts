import { ApiError, apiError, rateLetter } from "@/lib/api.server";
import { limited } from "@/lib/ratelimit.server";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, authorization", "access-control-allow-methods": "POST, OPTIONS" };
export const OPTIONS = () => new Response(null, { headers: CORS });

/** The edit key proves ownership (the same key the web editor keeps). */
const keyOf = (req: Request) => req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";

/** One rating of the app per letter. Sending again replaces it. */
export async function POST(req: Request, ctx: RouteContext<"/api/v1/letters/[id]/rating">) {
  if (limited(req, "api-rate", 30, 24 * 60 * 60 * 1000)) return Response.json({ error: { code: "rate_limited" } }, { status: 429, headers: CORS });
  try {
    const out = await rateLetter((await ctx.params).id, keyOf(req), await req.json().catch(() => null));
    if (!out) throw new ApiError(403, "forbidden", "Unknown letter or wrong edit key.");
    return Response.json(out, { headers: CORS });
  } catch (e) {
    return apiError(e);
  }
}
