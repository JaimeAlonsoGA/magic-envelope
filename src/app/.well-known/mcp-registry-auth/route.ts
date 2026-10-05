export const dynamic = "force-static";

/**
 * Proves to the official MCP Registry that magic-envelope.com publishes com.magic-envelope/*.
 * Public key only; the private key stays with the owner (~/.config/magic-envelope).
 */
export function GET() {
  return new Response("v=MCPv1; k=ed25519; p=nlBUBUU0hB6dqQoAzoux3R8LY2hiLfSlDpJ4Iv52kjU=\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
}
