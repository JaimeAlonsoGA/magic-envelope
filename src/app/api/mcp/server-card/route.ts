import { discoveryHeaders, serverCard } from "@/lib/agents";

export const dynamic = "force-static";

/** MCP Server Card (SEP-2127), at the location the spec reserves: <mcp-url>/server-card. */
export function GET() {
  return new Response(JSON.stringify(serverCard(), null, 2), { headers: discoveryHeaders("application/mcp-server-card+json") });
}
