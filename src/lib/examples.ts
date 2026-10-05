/**
 * Copy-ready integration examples for agents and automations (rendered on /developers).
 * Every snippet targets the live endpoints; nothing needs a key.
 */
import { MCP_URL } from "./agents";
import { SITE_URL } from "./site";

export type Example = { id: string; title: string; intro: string; snippets: { label?: string; code: string }[] };

const LETTER = `{
  "lang": "en",
  "style": "romance",
  "preset": "wedding",
  "seal": "duo:L|T",
  "blocks": [
    { "type": "heading", "text": "{name}, we're getting married!" },
    { "type": "date", "start": "2026-11-14T18:00" },
    { "type": "place", "name": "The Orangery", "address": "Kew Gardens, London" },
    { "type": "rsvp", "channel": "email", "contacts": { "email": "us@example.com", "whatsapp": "", "sms": "" } },
    { "type": "signature", "text": "Lucía & Tom" }
  ],
  "guests": [{ "name": "Emma" }, { "name": "Noah" }]
}`;

const mcpServers = (entry: object) => JSON.stringify({ mcpServers: { "magic-envelope": entry } }, null, 2);

export const EXAMPLES: Example[] = [
  {
    id: "prompt",
    title: "Just ask your agent",
    intro: "Once Magic Envelope is connected (below), plain language is enough. The agent reads the catalog, builds the letter and hands back one link per guest.",
    snippets: [{ code: `Using Magic Envelope, make a Spanish invitation for Ana's 8th birthday:
Saturday 14 November at 17:00, Parque del Retiro (Madrid), RSVP by WhatsApp to +34 600 123 123.
Playful style. Give me one link for each guest: Lucía, Tom, Marco.` }],
  },
  {
    id: "claude",
    title: "Claude",
    intro: "Claude Code: one command. Claude apps (web, desktop, mobile): Settings → Connectors → Add custom connector, and paste the URL.",
    snippets: [
      { label: "Terminal", code: `claude mcp add --transport http magic-envelope ${MCP_URL}` },
      { label: "Custom connector URL", code: MCP_URL },
    ],
  },
  {
    id: "chatgpt",
    title: "ChatGPT",
    intro: "Add it as an app with developer mode on (Settings → Apps), using the MCP URL and no authentication. For a custom GPT, add an Action and import the OpenAPI schema from its URL.",
    snippets: [
      { label: "MCP server URL", code: MCP_URL },
      { label: "GPT Action → Import from URL", code: `${SITE_URL}/api/v1/openapi.json` },
    ],
  },
  {
    id: "editors",
    title: "Cursor, VS Code, Windsurf",
    intro: "Add the server to the editor's MCP config file.",
    snippets: [
      { label: "~/.cursor/mcp.json", code: mcpServers({ url: MCP_URL }) },
      { label: ".vscode/mcp.json", code: JSON.stringify({ servers: { "magic-envelope": { type: "http", url: MCP_URL } } }, null, 2) },
      { label: "~/.codeium/windsurf/mcp_config.json", code: mcpServers({ serverUrl: MCP_URL }) },
    ],
  },
  {
    id: "stdio",
    title: "Clients that only speak stdio",
    intro: "Bridge the remote server with mcp-remote.",
    snippets: [{ label: "mcp config", code: mcpServers({ command: "npx", args: ["-y", "mcp-remote", MCP_URL] }) }],
  },
  {
    id: "curl",
    title: "curl",
    intro: "Create and publish a letter. The response has the letter's link, one link and one image per guest, and the editKey (keep it to make changes or delete it).",
    snippets: [
      { label: "Create", code: `curl -X POST ${SITE_URL}/api/v1/letters \\\n  -H "content-type: application/json" \\\n  -d '${LETTER}'` },
      { label: "Change it later (only what you send changes; same links)", code: `curl -X PATCH ${SITE_URL}/api/v1/letters/LETTER_ID \\\n  -H "authorization: Bearer EDIT_KEY" \\\n  -H "content-type: application/json" \\\n  -d '{ "style": "midnight", "addGuests": [{ "name": "Olivia" }] }'` },
      { label: "Who's coming", code: `curl ${SITE_URL}/api/v1/letters/LETTER_ID -H "authorization: Bearer EDIT_KEY" | jq .rsvps` },
      { label: "Every guest's letter as an image", code: `curl -o letters.zip "${SITE_URL}/api/v1/letters/LETTER_ID/images.zip?format=jpeg" \\\n  -H "authorization: Bearer EDIT_KEY"` },
      { label: "Delete it", code: `curl -X DELETE ${SITE_URL}/api/v1/letters/LETTER_ID -H "authorization: Bearer EDIT_KEY"` },
    ],
  },
  {
    id: "javascript",
    title: "JavaScript / TypeScript",
    intro: "Works in Node 18+, Deno, Bun, browsers and edge functions (CORS is open).",
    snippets: [{ code: `const res = await fetch("${SITE_URL}/api/v1/letters", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(${LETTER.replaceAll("\n", "\n  ")}),
});
if (!res.ok) throw new Error(JSON.stringify(await res.json()));
const letter = await res.json();
for (const guest of letter.guests) console.log(guest.name, guest.url);` }],
  },
  {
    id: "python",
    title: "Python",
    intro: "With requests.",
    snippets: [{ code: `import requests

letter = requests.post(
    "${SITE_URL}/api/v1/letters",
    json={
        "lang": "en", "style": "parchment", "preset": "birthday",
        "blocks": [
            {"type": "heading", "text": "{name}, come to my party!"},
            {"type": "date", "start": "2026-11-14T17:00"},
            {"type": "place", "name": "Home", "address": "221B Baker Street, London"},
        ],
        "guests": [{"name": "Emma"}, {"name": "Noah"}],
    },
    timeout=30,
).json()

for guest in letter["guests"]:
    print(guest["name"], guest["url"])` }],
  },
  {
    id: "sheets",
    title: "Google Sheets",
    intro: "Guest names in column A (row 1 is a header). Extensions → Apps Script, paste, run: each guest's personal link lands in column B.",
    snippets: [{ code: `function sendInvitations() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  const guests = rows.map(([name]) => ({ name: String(name).trim() })).filter((g) => g.name);

  const res = UrlFetchApp.fetch("${SITE_URL}/api/v1/letters", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      lang: "en", style: "botanical", preset: "dinner",
      blocks: [
        { type: "heading", text: "{name}, dinner at ours?" },
        { type: "date", start: "2026-11-21T20:30" },
      ],
      guests,
    }),
  });
  const letter = JSON.parse(res.getContentText());
  sheet.getRange(2, 2, letter.guests.length, 1).setValues(letter.guests.map((g) => [g.url]));
}` }],
  },
  {
    id: "n8n",
    title: "n8n",
    intro: "In an AI Agent workflow, add an MCP Client Tool with the endpoint below (HTTP Streamable, no auth). Without an agent, use an HTTP Request node: POST, body JSON.",
    snippets: [
      { label: "MCP Client Tool → Endpoint", code: MCP_URL },
      { label: "HTTP Request → URL", code: `${SITE_URL}/api/v1/letters` },
      { label: "HTTP Request → JSON body", code: LETTER },
    ],
  },
  {
    id: "zapier",
    title: "Zapier / Make",
    intro: "Webhooks by Zapier → Custom Request (or Make's HTTP → Make a request): method POST, header content-type: application/json, raw body below. Map guest names from your trigger into \"guests\".",
    snippets: [
      { label: "URL", code: `${SITE_URL}/api/v1/letters` },
      { label: "Body", code: LETTER },
    ],
  },
];
