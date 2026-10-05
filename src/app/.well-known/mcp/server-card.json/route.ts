import { discoveryHeaders, serverCard } from "@/lib/agents";

export const dynamic = "force-static";

/** Copy of the Server Card at the path earlier clients (SEP-1649) look for. */
export function GET() {
  return new Response(JSON.stringify(serverCard(), null, 2), { headers: discoveryHeaders("application/mcp-server-card+json") });
}
