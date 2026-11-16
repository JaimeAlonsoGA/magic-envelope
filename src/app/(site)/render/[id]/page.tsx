import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardView } from "@/components/card/card-view";
import { cardStyle } from "@/lib/envelope";
import { exportMat } from "@/lib/styles";
import { SITE_URL } from "@/lib/site";
import { loadPublished } from "@/lib/store.server";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * The flat letter alone, for the server-side image renderer (lib/render.server.ts) to capture:
 * the same CardView the editor exports, at the letter's own width, with nothing around it.
 */
export default async function RenderPage({ params, searchParams }: PageProps<"/render/[id]">) {
  const { id } = await params;
  const g = (await searchParams).g;
  const guestId = typeof g === "string" && /^[\w-]{4,16}$/.test(g) ? g : undefined;
  const data = await loadPublished(id, guestId);
  if (!data) notFound();
  const shareUrl = `${SITE_URL}/c/${id}${data.guestName ? `?g=${guestId}` : ""}`;
  return (
    <div className="w-[36rem]">
      <style>{"html,body{background:transparent!important}"}</style>
      {/* The mat shows through the letter's radius, so an export is a finished rectangle rather than a sticker with white corners. */}
      <div id="letter" style={{ background: exportMat(cardStyle(data.card)) }}>
        <CardView card={data.card} shareUrl={shareUrl} guestName={data.guestName} flat className="!shadow-none" />
      </div>
    </div>
  );
}
