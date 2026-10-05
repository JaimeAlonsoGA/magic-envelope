import { aiCatalog, discoveryHeaders } from "@/lib/agents";

export const dynamic = "force-static";

/** AI Catalog: domain-level discovery of this site's MCP server. */
export function GET() {
  return new Response(JSON.stringify(aiCatalog(), null, 2), { headers: discoveryHeaders("application/ai-catalog+json") });
}
