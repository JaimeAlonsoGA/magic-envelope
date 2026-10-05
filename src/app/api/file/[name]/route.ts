import { readLocalImage } from "@/lib/store.server";

/** Local-dev only: serves images saved under .data/img when Blob isn't configured. */
export async function GET(_req: Request, ctx: RouteContext<"/api/file/[name]">) {
  const { name } = await ctx.params;
  const data = await readLocalImage(name);
  if (!data) return new Response("Not found", { status: 404 });
  const ext = name.split(".").pop();
  const type = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  return new Response(new Uint8Array(data), { headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" } });
}
