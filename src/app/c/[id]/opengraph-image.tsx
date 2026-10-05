import { ImageResponse } from "next/og";
import { cardTitle } from "@/lib/blocks";
import { ENV, envelopePalette, sealOutline, sealPalette } from "@/lib/craft";
import { envelopeLine } from "@/lib/mail";
import { loadCard } from "@/lib/store.server";
import { resolveStyle } from "@/lib/styles";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Magic Envelope";

/** Link preview (WhatsApp, iMessage, Telegram…): the same sealed envelope the guest will open. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const card = await loadCard((await params).id);
  const th = card ? resolveStyle(card.style, card.custom) : resolveStyle("parchment");
  const title = card ? cardTitle(card) : "Magic Envelope";
  const to = card ? envelopeLine(card) ?? "" : "";
  const c = envelopePalette(th.envelope);
  const s = sealPalette(th.wax);
  const W = 720, H = 480; // 3:2 like the app envelope
  const edge = { stroke: c.edge, strokeWidth: 0.8 };

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fbf8f1", gap: 28 }}>
        <div style={{ fontSize: 44, color: "#1e1e1e", maxWidth: 1000, textAlign: "center", display: "flex" }}>{title}</div>
        <div style={{ position: "relative", width: W, height: H, display: "flex" }}>
          <svg width={W} height={H} viewBox={`0 0 ${ENV.w} ${ENV.h}`}>
            <rect width="300" height="200" rx={ENV.radius} fill={c.inside} />
            <path d={ENV.left} fill={c.side} {...edge} />
            <path d={ENV.right} fill={c.side} {...edge} />
            <path d={ENV.bottom} fill={c.bottom} {...edge} />
            <path d={ENV.flap} fill={c.flap} {...edge} />
            {card?.seal !== "" && <path d={sealOutline(ENV.seal.x, ENV.seal.y, 36 * 0.46)} fill={s.base} />}
            {card?.seal !== "" && <circle cx={ENV.seal.x} cy={ENV.seal.y} r={36 * 0.31} fill={s.base} stroke={s.rim} strokeWidth="1" />}
          </svg>
          {to && <div style={{ position: "absolute", bottom: 36, left: 0, right: 0, display: "flex", justifyContent: "center", fontSize: 34, color: th.ink }}>{to}</div>}
        </div>
      </div>
    ),
    size,
  );
}
