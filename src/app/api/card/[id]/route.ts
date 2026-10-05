import { limited } from "@/lib/ratelimit.server";
import { loadCardForEdit, loadGuests } from "@/lib/store.server";

/** Returns a card and its guest list only to holders of its edit key (the "edit on another device" link). */
export async function GET(req: Request, ctx: RouteContext<"/api/card/[id]">) {
  if (limited(req, "card", 30, 60 * 60 * 1000)) return Response.json({ error: "rate" }, { status: 429 });
  const key = req.headers.get("x-edit-key") ?? "";
  const { id } = await ctx.params;
  const card = await loadCardForEdit(id, key);
  return card ? Response.json({ card, guests: (await loadGuests(id)) ?? [] }) : Response.json({ error: "forbidden" }, { status: 403 });
}
