import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Reveal } from "@/components/card/reveal";
import { cardTitle } from "@/lib/blocks";
import { t } from "@/lib/i18n";
import { envelopeLine } from "@/lib/mail";
import { SITE_URL } from "@/lib/site";
import { loadPublished } from "@/lib/store.server";

const get = cache(loadPublished);
const guestParam = (v: string | string[] | undefined) => (typeof v === "string" && /^[\w-]{4,16}$/.test(v) ? v : undefined);

export async function generateMetadata({ params, searchParams }: PageProps<"/c/[id]">): Promise<Metadata> {
  const data = await get((await params).id, guestParam((await searchParams).g));
  if (!data) return {};
  const { card, guestName } = data;
  const to = envelopeLine(card, guestName);
  return {
    title: cardTitle(card, guestName),
    description: `✉ ${to ? `${to} · ` : ""}${t(card.lang).guest.tapToOpen}`,
    robots: { index: false, follow: false }, // invitations are private-by-link
  };
}

/** `/c/<id>` is the generic letter; `/c/<id>?g=<guest>` is that guest's own, addressed letter. */
export default async function CardPage({ params, searchParams }: PageProps<"/c/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const g = guestParam(sp.g);
  const data = await get(id, g);
  if (!data) notFound();
  const shareUrl = `${SITE_URL}/c/${id}${data.guestName ? `?g=${g}` : ""}`;
  return <Reveal card={data.card} guestName={data.guestName} shareUrl={shareUrl} print={sp.print === "1"} />;
}
