import { limited } from "@/lib/ratelimit.server";
import { loadCardForEdit } from "@/lib/store.server";

/** Returns a card's JSON only to holders of its edit key (used by the "edit on another device" link). */
export async function GET(req: Request, ctx: RouteContext<"/api/card/[id]">) {
  if (limited(req, "card", 30, 60 * 60 * 1000)) return Response.json({ error: "rate" }, { status: 429 });
  const key = req.headers.get("x-edit-key") ?? "";
  const card = await loadCardForEdit((await ctx.params).id, key);
  return card ? Response.json({ card }) : Response.json({ error: "forbidden" }, { status: 403 });
}
