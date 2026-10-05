import { schemas } from "@/lib/api.server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/** OpenAPI 3.1, generated from the same Zod schemas the app validates with. */
export function GET() {
  const s = schemas();
  const error = { type: "object", properties: { error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" } } } } };
  const links = {
    type: "object",
    properties: {
      id: { type: "string" }, editKey: { type: "string", description: "Secret: needed to read/update. Keep it." },
      url: { type: "string" }, editUrl: { type: "string" }, previewImage: { type: "string" }, printUrl: { type: "string" },
      guests: { type: "array", items: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, url: { type: "string" } } } },
    },
  };
  const auth = [{ editKey: [] }];
  return Response.json({
    openapi: "3.1.0",
    info: { title: "Magic Envelope API", version: "1.0.0", description: "Create and send beautiful invitations and letters. Free, no account. Each guest gets a personal link; use {name} in texts to address them." },
    servers: [{ url: SITE_URL }],
    components: {
      securitySchemes: { editKey: { type: "http", scheme: "bearer", description: "The letter's editKey, returned on creation." } },
      schemas: { LetterInput: s.letterInput, LetterPatch: s.letterPatch, Block: s.block, Card: s.card, LetterLinks: links, Error: error },
    },
    paths: {
      "/api/v1/catalog": { get: { operationId: "getCatalog", summary: "Styles, presets, block types, envelope slots, stamps, seals", responses: { 200: { description: "Catalog" } } } },
      "/api/v1/letters": {
        post: {
          operationId: "createLetter", summary: "Create and publish a letter",
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LetterInput" } } } },
          responses: { 201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/LetterLinks" } } } }, 400: { description: "Invalid input", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } } },
        },
      },
      "/api/v1/letters/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        get: { operationId: "getLetter", summary: "Read a letter", security: auth, responses: { 200: { description: "Letter and links" }, 403: { description: "Unknown letter or wrong key" } } },
        patch: {
          operationId: "updateLetter", summary: "Update a letter (links keep working)", security: auth,
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LetterPatch" } } } },
          responses: { 200: { description: "Updated letter and links" }, 403: { description: "Unknown letter or wrong key" } },
        },
      },
    },
  }, { headers: { "access-control-allow-origin": "*" } });
}
