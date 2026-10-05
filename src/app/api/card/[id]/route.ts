import { limited } from "@/lib/ratelimit.server";
import { rsvpSummary } from "@/lib/api.server";
import { deleteCard, loadCardForEdit, loadGuests } from "@/lib/store.server";

/** Returns a card, its guest list and their RSVP answers, only to holders of its edit key. */
export async function GET(req: Request, ctx: RouteContext<"/api/card/[id]">) {
  if (limited(req, "card", 30, 60 * 60 * 1000)) return Response.json({ error: "rate" }, { status: 429 });
  const key = req.headers.get("x-edit-key") ?? "";
  const { id } = await ctx.params;
  const card = await loadCardForEdit(id, key);
  if (!card) return Response.json({ error: "forbidden" }, { status: 403 });
  const guests = (await loadGuests(id)) ?? [];
  return Response.json({ card, guests, rsvps: await rsvpSummary(id, guests) });
}

/** Unpublish for good (deleting a published letter from the app). */
export async function DELETE(req: Request, ctx: RouteContext<"/api/card/[id]">) {
  if (limited(req, "card", 30, 60 * 60 * 1000)) return Response.json({ error: "rate" }, { status: 429 });
  const ok = await deleteCard((await ctx.params).id, req.headers.get("x-edit-key") ?? "");
  return ok ? new Response(null, { status: 204 }) : Response.json({ error: "forbidden" }, { status: 403 });
}
