import { catalog } from "@/lib/api.server";

export const dynamic = "force-static";
export function GET() {
  return Response.json(catalog(), { headers: { "access-control-allow-origin": "*" } });
}
