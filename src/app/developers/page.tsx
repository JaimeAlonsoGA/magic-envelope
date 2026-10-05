import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SITE_NAME } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "API & MCP for agents",
  description: "Create and send Magic Envelope invitations from any AI agent or script: a public REST API, an MCP server, OpenAPI and llms.txt. Free, no key.",
  alternates: { canonical: "/developers" },
};

const Code = ({ children }: { children: string }) => (
  <pre className="overflow-x-auto rounded-lg bg-ink/[.06] p-4 font-mono text-sm leading-relaxed">{children}</pre>
);

/** Human-readable API docs (the machine-readable ones are /api/v1/openapi.json and /llms.txt). */
export default function DevelopersPage() {
  const example = `curl -X POST ${SITE_URL}/api/v1/letters \\
  -H "content-type: application/json" \\
  -d '{
    "lang": "en", "style": "romance", "preset": "wedding",
    "blocks": [
      { "type": "heading", "text": "{name}, we're getting married!" },
      { "type": "date", "start": "2026-11-14T18:00" },
      { "type": "place", "name": "The Orangery", "address": "Kew Gardens, London" },
      { "type": "rsvp", "channel": "email", "contacts": { "email": "us@example.com", "whatsapp": "", "sms": "" } }
    ],
    "guests": [{ "name": "Lucía" }, { "name": "Tom" }]
  }'`;
  const response = `{
  "id": "st5kRZNzyW",
  "editKey": "…keep it secret…",
  "url": "${SITE_URL}/c/st5kRZNzyW",
  "previewImage": "${SITE_URL}/c/st5kRZNzyW/opengraph-image",
  "guests": [
    { "id": "IpPK42", "name": "Lucía", "url": "${SITE_URL}/c/st5kRZNzyW?g=IpPK42" },
    { "id": "1hWcrt", "name": "Tom",   "url": "${SITE_URL}/c/st5kRZNzyW?g=1hWcrt" }
  ]
}`;
  const mcp = `{
  "mcpServers": {
    "magic-envelope": { "url": "${SITE_URL}/api/mcp" }
  }
}`;
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <nav className="font-hand"><Link href="/" className="text-muted hover:text-ink">← {SITE_NAME}</Link></nav>
      <h1 className="mt-10 font-hand text-4xl font-bold">For agents &amp; developers</h1>
      <p className="mt-4 text-lg text-muted">
        Everything a person can do in {SITE_NAME}, an agent can do through the API: compose a letter from typed blocks,
        pick a style, add guests and publish. Every guest gets their own addressed link. Free and keyless — the
        <code className="mx-1 rounded bg-ink/[.06] px-1">editKey</code> returned on creation is the only credential, and only for editing.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="font-hand text-2xl">MCP server</h2>
        <p className="text-muted">Tools: <code>get_catalog</code>, <code>create_letter</code>, <code>get_letter</code>, <code>update_letter</code>. Streamable HTTP:</p>
        <Code>{mcp}</Code>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-hand text-2xl">REST</h2>
        <ul className="list-inside list-disc text-muted">
          <li><code>GET /api/v1/catalog</code> — styles, presets, block types with examples, envelope slots, stamps, seals</li>
          <li><code>POST /api/v1/letters</code> — create and publish</li>
          <li><code>GET /api/v1/letters/:id</code> and <code>PATCH /api/v1/letters/:id</code> — with <code>Authorization: Bearer &lt;editKey&gt;</code></li>
          <li><a className="underline" href="/api/v1/openapi.json">OpenAPI 3.1</a> · <a className="underline" href="/api/v1/schema">JSON Schemas</a> · <a className="underline" href="/llms.txt">llms.txt</a></li>
        </ul>
        <Code>{example}</Code>
        <Code>{response}</Code>
      </section>

      <section className="mt-10 space-y-2 text-muted">
        <h2 className="font-hand text-2xl text-ink">Good to know</h2>
        <p>Write <code>{"{name}"}</code> in a title, text, signature or envelope line to address each guest. Blocks may be partial — missing fields take the editor&apos;s defaults. Dates are local ISO (<code>2026-11-14T18:00</code>). Guest names are stored server-side and each guest page only ever receives its own name.</p>
      </section>

      <SiteFooter />
    </main>
  );
}
