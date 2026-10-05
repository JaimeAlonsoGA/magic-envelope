import { schemas } from "@/lib/api.server";

export const dynamic = "force-static";
export function GET() {
  return Response.json(schemas(), { headers: { "access-control-allow-origin": "*" } });
}
