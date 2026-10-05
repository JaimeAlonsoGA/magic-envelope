import { ApiError, apiError, deleteLetter, getLetter, updateLetter } from "@/lib/api.server";
import { limited } from "@/lib/ratelimit.server";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, authorization", "access-control-allow-methods": "GET, PATCH, DELETE, OPTIONS" };
export const OPTIONS = () => new Response(null, { headers: CORS });

/** The edit key proves ownership (the same key the web editor keeps). */
const keyOf = (req: Request) => req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
const forbidden = () => new ApiError(403, "forbidden", "Unknown letter or wrong edit key.");

export async function GET(req: Request, ctx: RouteContext<"/api/v1/letters/[id]">) {
  if (limited(req, "api-read", 300, 60 * 60 * 1000)) return Response.json({ error: { code: "rate_limited" } }, { status: 429, headers: CORS });
  try {
    const out = await getLetter((await ctx.params).id, keyOf(req));
    if (!out) throw forbidden();
    return Response.json(out, { headers: CORS });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/v1/letters/[id]">) {
  if (limited(req, "api-update", 120, 60 * 60 * 1000)) return Response.json({ error: { code: "rate_limited" } }, { status: 429, headers: CORS });
  try {
    const out = await updateLetter((await ctx.params).id, keyOf(req), await req.json().catch(() => ({})));
    if (!out) throw forbidden();
    return Response.json(out, { headers: CORS });
  } catch (e) {
    return apiError(e);
  }
}

/** Delete for good: links stop working; guest names, answers and images are erased. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/v1/letters/[id]">) {
  if (limited(req, "api-update", 120, 60 * 60 * 1000)) return Response.json({ error: { code: "rate_limited" } }, { status: 429, headers: CORS });
  try {
    if (!(await deleteLetter((await ctx.params).id, keyOf(req)))) throw forbidden();
    return new Response(null, { status: 204, headers: CORS });
  } catch (e) {
    return apiError(e);
  }
}
