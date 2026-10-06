import type { Metadata } from "next";
import Link from "next/link";
import { CopyCode } from "@/components/copy-code";
import { SiteFooter } from "@/components/site-footer";
import { MCP_URL, SERVER_CARD_URL } from "@/lib/agents";
import { EXAMPLES } from "@/lib/examples";
import { SITE_NAME } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "API & MCP for agents",
  description: "Create and send Magic Envelope invitations from any AI agent or script: an MCP server, a public REST API, OpenAPI and copy-ready examples for Claude, ChatGPT, Cursor, n8n, Zapier and Google Sheets. Free, no key.",
  alternates: { canonical: "/developers" },
};

/** Human-readable API docs with copy-ready examples (machine-readable: OpenAPI, llms.txt, the Server Card). */
export default function DevelopersPage() {
  const specs: [string, string][] = [
    ["OpenAPI 3.1", `${SITE_URL}/api/v1/openapi.json`],
    ["JSON Schemas", `${SITE_URL}/api/v1/schema`],
    ["Catalog", `${SITE_URL}/api/v1/catalog`],
    ["MCP Server Card", SERVER_CARD_URL],
    ["AI Catalog", `${SITE_URL}/.well-known/ai-catalog.json`],
    ["llms.txt", `${SITE_URL}/llms.txt`],
  ];
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <nav className="font-hand"><Link href="/" className="text-muted hover:text-ink">← {SITE_NAME}</Link></nav>
      <h1 className="mt-10 font-hand text-4xl font-bold">For agents &amp; developers</h1>
      <p className="mt-4 text-lg text-muted">
        Everything a person can do in {SITE_NAME}, an agent can do: compose a letter from typed blocks, pick a style,
        add guests and publish. Every guest gets their own addressed link. Free and keyless — the
        <code className="mx-1 rounded bg-ink/[.06] px-1">editKey</code> returned on creation is the only credential, and only for editing.
      </p>
      <div className="mt-6"><CopyCode label="MCP server (Streamable HTTP)" code={MCP_URL} /></div>

      <nav aria-label="Examples" className="mt-8 flex flex-wrap gap-2 font-hand">
        {EXAMPLES.map((e) => <a key={e.id} href={`#${e.id}`} className="rounded-full bg-ink/[.06] px-3 py-1 hover:bg-ink/10">{e.title}</a>)}
      </nav>

      {EXAMPLES.map((e) => (
        <section key={e.id} id={e.id} className="mt-12 scroll-mt-6 space-y-3">
          <h2 className="font-hand text-2xl">{e.title}</h2>
          <p className="text-muted">{e.intro}</p>
          {e.snippets.map((s, i) => <CopyCode key={i} label={s.label} code={s.code} />)}
        </section>
      ))}

      <section className="mt-12 space-y-3">
        <h2 className="font-hand text-2xl">Reference</h2>
        <ul className="list-inside list-disc text-muted">
          <li><code>get_catalog</code>, <code>create_letter</code>, <code>get_letter</code>, <code>update_letter</code>, <code>delete_letter</code> — the MCP tools</li>
          <li><code>GET /api/v1/catalog</code> — styles, presets, block types with examples, envelope slots, stamps, seals</li>
          <li><code>POST /api/v1/letters</code> — create and publish</li>
          <li><code>GET</code>, <code>PATCH</code> and <code>DELETE /api/v1/letters/:id</code> — with <code>Authorization: Bearer &lt;editKey&gt;</code>. PATCH takes the fields you want to change, or the same object GET returns. GET includes guests&apos; RSVP answers</li>
          <li><code>POST /api/v1/media</code> — copy a public image, or a Drive, Dropbox or Wikimedia link, and get a <code>src</code></li>
          <li><code>GET /api/v1/letters/:id/image?g=&lt;guest&gt;&amp;download=1</code> and <code>/images.zip</code> — one PNG per guest; the ZIP is named after the letter</li>
        </ul>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {specs.map(([label, href]) => <li key={href}><a className="underline underline-offset-4" href={href}>{label}</a></li>)}
        </ul>
      </section>

      <section className="mt-12 space-y-2 text-muted">
        <h2 className="font-hand text-2xl text-ink">Good to know</h2>
        <p>Write <code>{"{name}"}</code> in a title, text, signature or envelope line to address each guest. Blocks may be partial — missing fields take the editor&apos;s defaults. A text block has no character limit; set <code>italic: true</code> or <code>fontStyle: &quot;italic&quot;</code> for italics, and <code>custom.frame</code> to <code>none</code>, <code>rule</code> or <code>ornate</code>. Dates are the local time at the venue: <code>2026-11-14T18:00</code>, or <code>2026-11-14</code> for a whole day. Guest names are stored server-side and each guest page only ever receives its own name. Letters are in English, Spanish, French, Portuguese, Italian or German (<code>lang</code>).</p>
      </section>

      <SiteFooter />
    </main>
  );
}
