import { catalog } from "@/lib/api.server";
import { KINDS } from "@/lib/model";
import { SITE_URL } from "@/lib/site";
import { KIND_LABEL } from "@/lib/ui";

export const dynamic = "force-static";

/** llms.txt: how an AI agent uses Magic Envelope, end to end, without a browser. */
export function GET() {
  const c = catalog();
  const body = `# Magic Envelope

> Free invitations and letters that arrive in a sealed envelope. Pick a style, write it with typed blocks (date, place with map, RSVP, schedule, dress code, gifts, music, QR…), and send it: each guest gets their own link with their name on the envelope and in the text. No account.

Agents can do everything through the API, without a browser.

## Use it as an agent

- [MCP server](${SITE_URL}/api/mcp): tools get_catalog, create_letter, get_letter, update_letter (Streamable HTTP)
- [REST API](${SITE_URL}/api/v1): POST /api/v1/letters to create and publish; GET/PATCH /api/v1/letters/{id} with "Authorization: Bearer <editKey>"
- [OpenAPI](${SITE_URL}/api/v1/openapi.json): full schema
- [Catalog](${SITE_URL}/api/v1/catalog): styles, presets, block types with examples, envelope slots, stamps, seals
- [Developer docs](${SITE_URL}/developers)

Minimal request:

\`\`\`json
POST ${SITE_URL}/api/v1/letters
{ "lang": "es", "style": "romance", "preset": "wedding",
  "blocks": [
    { "type": "heading", "text": "{name}, ¡nos casamos!" },
    { "type": "date", "start": "2026-11-14T18:00" },
    { "type": "place", "name": "Finca La Alameda", "address": "Calle Mayor 1, Madrid" },
    { "type": "rsvp", "channel": "whatsapp", "contacts": { "whatsapp": "+34600123123", "sms": "", "email": "" } }
  ],
  "guests": [{ "name": "Lucía" }, { "name": "Tom" }] }
\`\`\`

The response has \`url\`, one \`guests[].url\` per guest (send each guest their own), \`previewImage\` and a secret \`editKey\`.

## Styles

${c.styles.map((s) => `- ${s.id}: ${s.name} (${s.group})`).join("\n")}

## Occasions (presets)

${KINDS.map((k) => `- ${k}: ${KIND_LABEL[k]} — [make one](${SITE_URL}/for/${k})`).join("\n")}

## Rules

- ${c.personalization}
- Blocks may be partial: missing fields take the editor's defaults. Dates are local ISO, e.g. 2026-11-14T18:00.
- Envelope slots have fixed block types and limits: ${c.envelope.slots.map((s) => `${s.slot} (${s.role}: ${s.block}${s.maxChars ? `, ≤${s.maxChars} chars` : ""})`).join("; ")}.
- Languages: ${c.languages.map((l) => l.id).join(", ")}.

## Support

- [Buy me a coffee](https://buymeacoffee.com/jaimehuman)
- Made by [Jaime Alonso](https://jaimealonso.dev)
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
