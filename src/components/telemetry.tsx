"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Letter and draft URLs are private (a guest id in ?g=, an edit key after #). Every URL is reduced
 * to its route before it leaves the browser: /c/abc?g=x → /c/[id].
 */
const ROUTES: [RegExp, string][] = [[/^\/c\/[^/]+/, "/c/[id]"], [/^\/e\/[^/]+/, "/e/[id]"], [/^\/edit\/[^/]+/, "/edit/[id]"]];

function anonymous<E extends { url: string }>(event: E): E {
  const url = new URL(event.url);
  const path = ROUTES.reduce((p, [re, to]) => p.replace(re, to), url.pathname);
  return { ...event, url: `${url.origin}${path}` };
}

/** Traffic and Core Web Vitals (Vercel Web Analytics + Speed Insights). No cookies, no personal data. */
export function Telemetry() {
  return (
    <>
      <Analytics beforeSend={anonymous} />
      <SpeedInsights beforeSend={anonymous} />
    </>
  );
}
