import { discoveryHeaders, serverCard } from "@/lib/agents";

export const dynamic = "force-static";

/** Copy of the Server Card at /.well-known/mcp.json, still probed by some clients. */
export function GET() {
  return new Response(JSON.stringify(serverCard(), null, 2), { headers: discoveryHeaders("application/mcp-server-card+json") });
}
