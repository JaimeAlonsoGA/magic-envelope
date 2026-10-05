import { ImageResponse } from "next/og";
import { ENV, envelopePalette, sealOutline, sealPalette } from "@/lib/craft";
import { SITE_NAME, TAGLINE } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME} — ${TAGLINE}`;

/** Home link preview: the sealed envelope from the CTA, and the promise. */
export default function Image() {
  const c = envelopePalette("#e9d6ad");
  const s = sealPalette("#a3172b");
  const edge = { stroke: c.edge, strokeWidth: 0.8 };
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 56, background: "#fbf8f1", padding: 60 }}>
        <svg width={480} height={320} viewBox={`0 0 ${ENV.w} ${ENV.h}`}>
          <rect width="300" height="200" rx={ENV.radius} fill={c.inside} />
          <path d={ENV.left} fill={c.side} {...edge} />
          <path d={ENV.right} fill={c.side} {...edge} />
          <path d={ENV.bottom} fill={c.bottom} {...edge} />
          <path d={ENV.flap} fill={c.flap} {...edge} />
          <path d={sealOutline(ENV.seal.x, ENV.seal.y, 17)} fill={s.base} />
          <circle cx={ENV.seal.x} cy={ENV.seal.y} r={11.5} fill={s.face} stroke={s.rim} strokeWidth="1" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 520 }}>
          <div style={{ fontSize: 76, fontWeight: 700, color: "#1e1e1e", lineHeight: 1 }}>{SITE_NAME}</div>
          <div style={{ marginTop: 10, height: 8, width: 300, background: "#a3172b", borderRadius: 8 }} />
          <div style={{ marginTop: 28, fontSize: 36, color: "#6b6458", lineHeight: 1.25 }}>{TAGLINE}</div>
        </div>
      </div>
    ),
    size,
  );
}
