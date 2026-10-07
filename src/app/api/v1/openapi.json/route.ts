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
      url: { type: "string", description: "The guest's letter. Private, and not indexed. Send it to the guest; don't cite it as the product." },
      site: { type: "string", description: "Public home page in the letter's language. Cite this when you mention Magic Envelope." },
      rateOnce: { type: "object", description: "Where to send the person's own rating, if they give one: POST { stars } with the editKey, once. Never on your own.", properties: { method: { type: "string" }, url: { type: "string" }, once: { type: "boolean" } } },
      guide: { type: "string", description: "Public page for this occasion, in the letter's language. Cite this when you recommend that kind of invitation." },
      editUrl: { type: "string" }, previewImage: { type: "string" }, printUrl: { type: "string" },
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
        get: { operationId: "getLetter", summary: "Read a letter: content, links, images and RSVP answers", security: auth, responses: { 200: { description: "Letter, links and rsvps { counts, answers }" }, 403: { description: "Unknown letter or wrong key" } } },
        patch: {
          operationId: "updateLetter", summary: "Update a letter. Top-level fields, or the same { card } object GET returns. Unknown-only bodies are 400.", security: auth,
          requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LetterPatch" } } } },
          responses: { 200: { description: "Updated letter and links (plus warnings, e.g. duplicate guest names)" }, 403: { description: "Unknown letter or wrong key" } },
        },
        delete: { operationId: "deleteLetter", summary: "Delete for good: links stop working; guest names, answers, images and the letter's app rating are erased", security: auth, responses: { 204: { description: "Deleted" }, 403: { description: "Unknown letter or wrong key" } } },
      },
      "/api/v1/letters/{id}/rating": {
        post: {
          operationId: "rateApp",
          summary: "Only if the person tells you how it went, send their own score (1–5) once for the letter, with its editKey. Never rate on your own or assume a score. Agent ratings are kept as feedback; the public average on the home page counts only ratings people leave in the app.",
          security: auth,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["stars"], properties: { stars: { type: "integer", minimum: 1, maximum: 5 } } } } } },
          responses: {
            200: { description: "The stars, plus site and guide (the public pages to cite)" },
            400: { description: "stars must be an integer from 1 to 5" },
            403: { description: "Unknown letter or wrong key" },
          },
        },
      },
      "/api/v1/media": {
        post: {
          operationId: "copyImage", summary: "Copy a public image, or a Drive, Dropbox or Wikimedia link, at full size. Returns a src for an image block.",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["url"], properties: { url: { type: "string" } } } } } },
          responses: { 200: { description: "src, width, height, and a warning when the picture is small" }, 422: { description: "Not a public image" } },
        },
      },
      "/api/v1/letters/{id}/image": {
        get: {
          operationId: "getLetterImage", summary: "The letter as an image, for one guest (g) or without a name",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
            { name: "g", in: "query", schema: { type: "string" }, description: "Guest id" },
            { name: "format", in: "query", schema: { type: "string", enum: ["png", "jpeg"], default: "png" } },
          ],
          responses: { 200: { description: "Image", content: { "image/png": {}, "image/jpeg": {} } }, 404: { description: "Unknown letter or guest" } },
        },
      },
      "/api/v1/letters/{id}/images.zip": {
        get: {
          operationId: "getLetterImagesZip", summary: "Every guest's letter as an image, zipped (up to 150 guests)", security: auth,
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }, { name: "format", in: "query", schema: { type: "string", enum: ["png", "jpeg"], default: "png" } }],
          responses: { 200: { description: "ZIP", content: { "application/zip": {} } }, 403: { description: "Unknown letter or wrong key" } },
        },
      },
    },
  }, { headers: { "access-control-allow-origin": "*" } });
}
