import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { MCP_NAME, MCP_VERSION } from "@/lib/agents";
import { ApiError, LetterInput, catalog, createLetter, deleteLetter, getLetter, updateLetter } from "@/lib/api.server";

/**
 * MCP server: the same operations as /api/v1, as tools. Agents can make and send invitations
 * end-to-end without anyone opening the web app.
 */
const json = (v: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(v, null, 2) }] });

const handler = createMcpHandler((server) => {
  server.registerTool("get_catalog", {
    title: "Magic Envelope catalog",
    description: "Styles, occasion presets, block types (with examples), envelope slots, stamps and seal options. Call this first to compose a letter.",
    inputSchema: z.object({}),
  }, async () => json(catalog()));

  server.registerTool("create_letter", {
    title: "Create a letter",
    description: "Create and publish an invitation or letter. Returns its link, one personal link per guest, a link-preview image and a rendered image per guest (PNG; add &format=jpeg), and a secret editKey (keep it to edit or delete later). Use {name} in texts to address each guest. Dates are local: \"2026-11-14\" (whole day) or \"2026-11-14T18:00\".",
    inputSchema: LetterInput,
  }, async (input) => json(await createLetter(input)));

  server.registerTool("get_letter", {
    title: "Read a letter",
    description: "Read a letter you created (needs its editKey): its content, links, images, and the guests' RSVP answers (yes / maybe / no, plus who hasn't answered).",
    inputSchema: z.object({ id: z.string(), editKey: z.string() }),
  }, async ({ id, editKey }) => {
    const out = await getLetter(id, editKey);
    return out ? json(out) : { content: [{ type: "text" as const, text: "Unknown letter or wrong editKey." }], isError: true };
  });

  server.registerTool("update_letter", {
    title: "Update a letter",
    description: "Change a letter. Only the fields you send change (lang, style… are kept). Links keep working. You may send the same object get_letter returned, including its card wrapper — it is applied. A body with no letter fields is an error, not a silent success. `guests` replaces the list but keeps each existing guest's id and link (matched by id, then by name); `addGuests` appends without touching anyone else. Image URLs are copied at full size. Text has no character limit; italic: true (or fontStyle: \"italic\"); custom.frame is none | rule | ornate.",
    inputSchema: z.object({ id: z.string(), editKey: z.string() }).passthrough(),
  }, async ({ id, editKey, ...patch }) => {
    try {
      const out = await updateLetter(id, editKey, patch);
      return out ? json(out) : { content: [{ type: "text" as const, text: "Unknown letter or wrong editKey." }], isError: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : e instanceof z.ZodError ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") : "The update was rejected.";
      return { content: [{ type: "text" as const, text: message }], isError: true };
    }
  });

  server.registerTool("delete_letter", {
    title: "Delete a letter",
    description: "Delete a letter for good (needs its editKey): its links stop working, and guest names, RSVP answers and images are erased.",
    inputSchema: z.object({ id: z.string(), editKey: z.string() }),
  }, async ({ id, editKey }) => (await deleteLetter(id, editKey))
    ? { content: [{ type: "text" as const, text: "Deleted." }] }
    : { content: [{ type: "text" as const, text: "Unknown letter or wrong editKey." }], isError: true });
}, { serverInfo: { name: MCP_NAME, version: MCP_VERSION } });

export { handler as GET, handler as POST, handler as DELETE };
