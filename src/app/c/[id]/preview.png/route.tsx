import { ImageResponse } from "next/og";
import { cardStyle, envelopeOf } from "@/lib/envelope";
import { STAMPS } from "@/lib/mail";
import { ogFont } from "@/lib/og-fonts.server";
import { loadPublished } from "@/lib/store.server";

const W = 1200, H = 630;
const EW = 840, EH = 560; // the app's 3:2 envelope, as large as the frame allows

/**
 * Link preview (WhatsApp, iMessage, Telegram…): the front of the envelope the guest will open,
 * addressed to them (?g=), in the style's own colours and handwriting, with its stamp.
 * Large, centred type, so it stays legible even in a small square crop.
 */
export async function GET(req: Request, ctx: RouteContext<"/c/[id]/preview.png">) {
  const { id } = await ctx.params;
  const g = new URL(req.url).searchParams.get("g") ?? undefined;
  const data = await loadPublished(id, g);
  if (!data) return new Response("Not found", { status: 404 });
  const env = envelopeOf(data.card, data.guestName);
  const hand = cardStyle(data.card).sign;
  const slots = env.slots;
  const name = slots["front-center"]?.kind === "heading" ? slots["front-center"].text : "";
  const sender = slots["front-tl"]?.kind === "text" ? slots["front-tl"].text : "";
  const note = slots["front-bl"]?.kind === "text" ? slots["front-bl"].text : "";
  const stamp = slots["front-tr"]?.kind === "stamp" ? STAMPS[slots["front-tr"].id] : null;
  const font = await ogFont(hand, `${name}${sender}${note}${stamp?.value ?? ""}`);
  const size = Math.max(56, Math.min(120, Math.floor(1500 / Math.max(6, name.length + 2))));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3eee3" }}>
        <div style={{
          position: "relative", width: EW, height: EH, display: "flex", alignItems: "center", justifyContent: "center",
          background: env.paper, borderRadius: 14, boxShadow: "0 2px 4px rgba(0,0,0,.08), 0 30px 60px -24px rgba(0,0,0,.35)",
          fontFamily: font ? hand : undefined, color: env.ink,
        }}>
          {sender && <div style={{ position: "absolute", top: 36, left: 44, fontSize: 30, maxWidth: 420, opacity: 0.85, display: "flex" }}>{sender}</div>}
          {stamp && (
            <div style={{ position: "absolute", top: 32, right: 40, display: "flex", alignItems: "center", gap: 12 }}>
              {/* postmark: rings and waves in the envelope's ink */}
              <svg width="150" height="90" viewBox="0 0 150 90" style={{ opacity: 0.45 }}>
                <circle cx="45" cy="45" r="34" fill="none" stroke={env.ink} strokeWidth="3" />
                <circle cx="45" cy="45" r="25" fill="none" stroke={env.ink} strokeWidth="2" />
                {[30, 45, 60].map((y) => <path key={y} d={`M80 ${y} q 9 -7 18 0 t 18 0 t 18 0`} fill="none" stroke={env.ink} strokeWidth="3" />)}
              </svg>
              <div style={{ width: 128, height: 150, background: "#fffdf8", padding: 9, display: "flex", borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,.18)" }}>
                <div style={{ flex: 1, background: stamp.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", border: `2px solid ${stamp.ink}33` }}>
                  <div style={{ fontSize: 64, display: "flex" }}>{stamp.motif}</div>
                  <div style={{ position: "absolute", right: 6, bottom: 2, fontSize: 20, color: stamp.ink, display: "flex" }}>{stamp.value}</div>
                </div>
              </div>
            </div>
          )}
          {name && <div style={{ fontSize: size, lineHeight: 1.1, maxWidth: EW - 120, textAlign: "center", display: "flex", marginTop: 40 }}>{name}</div>}
          {note && <div style={{ position: "absolute", bottom: 34, left: 44, fontSize: 28, maxWidth: 520, opacity: 0.85, display: "flex" }}>{note}</div>}
        </div>
      </div>
    ),
    {
      width: W, height: H, emoji: "twemoji",
      fonts: font ? [font] : undefined,
      headers: { "cache-control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
