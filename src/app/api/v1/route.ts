import { SITE_URL } from "@/lib/site";

/** API index: where everything is. */
export function GET() {
  return Response.json({
    name: "Magic Envelope API",
    version: "v1",
    description: "Create and send beautiful invitations and letters — each guest gets their own addressed link. Free, no account.",
    docs: `${SITE_URL}/developers`,
    openapi: `${SITE_URL}/api/v1/openapi.json`,
    mcp: `${SITE_URL}/api/mcp`,
    llms: `${SITE_URL}/llms.txt`,
    endpoints: {
      catalog: "GET /api/v1/catalog",
      schema: "GET /api/v1/schema",
      create: "POST /api/v1/letters",
      read: "GET /api/v1/letters/{id} (Authorization: Bearer <editKey>)",
      update: "PATCH /api/v1/letters/{id} (Authorization: Bearer <editKey>)",
      rate: "POST /api/v1/letters/{id}/rating { stars } (Authorization: Bearer <editKey>)",
    },
  }, { headers: { "access-control-allow-origin": "*" } });
}
