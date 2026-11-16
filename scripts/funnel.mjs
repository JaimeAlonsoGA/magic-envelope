// What people actually do, week by week, read from the store itself: letters published (from the web app
// or by an agent through the API/MCP), how many name their guests, RSVP answers, and ratings.
// Web Analytics counts visits; custom events and Custom Metrics need a paid plan. This needs neither,
// and it counts outcomes, not clicks. Nothing personal is printed.
//
//   vercel env pull .env.production.local --environment=production
//   node --env-file=.env.production.local scripts/funnel.mjs [weeks=8]
import { get, list } from "@vercel/blob";

const WEEKS = Number(process.argv[2] ?? 8);
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN is missing: run with --env-file (see the top of this file).");
  process.exit(1);
}

async function paths(prefix) {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

/** Monday of the week, as 2026-11-09. */
const week = (t) => {
  const d = new Date(t);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const since = Date.now() - WEEKS * 7 * 86400e3;
const rows = new Map();
const row = (t) => {
  const k = week(t);
  if (!rows.has(k)) rows.set(k, { app: 0, api: 0, older: 0, named: 0, rsvp: 0, people: 0, agents: 0, stars: [] });
  return rows.get(k);
};

const cards = (await paths("cards/")).filter((b) => b.uploadedAt.getTime() >= since - 365 * 86400e3);
// a card's own createdAt and via; a few at a time
for (let i = 0; i < cards.length; i += 8) {
  await Promise.all(cards.slice(i, i + 8).map(async (b) => {
    const res = await get(b.pathname, { access: "private", useCache: false }).catch(() => null);
    if (!res?.stream) return;
    const c = JSON.parse(await new Response(res.stream).text());
    if ((c.createdAt ?? 0) < since) return;
    const r = row(c.createdAt);
    r[c.via ?? "older"]++; // "older": published before the store recorded where from
    if (c.guests?.length) r.named++;
  }));
}
for (const b of await paths("rsvp/")) if (b.uploadedAt.getTime() >= since) row(b.uploadedAt).rsvp++;
for (const b of await paths("ratings/")) {
  if (b.uploadedAt.getTime() < since) continue;
  const r = row(b.uploadedAt);
  const m = /^ratings\/([1-5])~(L?)/.exec(b.pathname);
  if (!m) continue;
  if (m[2]) r.agents++; // ratings/<n>~L<id>: sent through the API with a letter's key
  else { r.people++; r.stars.push(Number(m[1])); }
}

const table = [...rows.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([w, r]) => ({
  week: w,
  "letters (app)": r.app,
  "letters (agents)": r.api,
  "letters (before via)": r.older,
  "with guest names": r.named,
  "RSVP answers": r.rsvp,
  "ratings (people)": r.people,
  "avg ★ (people)": r.stars.length ? (r.stars.reduce((a, b) => a + b, 0) / r.stars.length).toFixed(1) : "",
  "ratings (agents)": r.agents,
}));
console.table(table);
