import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { LetterInput, LetterPatch, catalog, createLetter, getLetter, updateLetter } from "@/lib/api.server";

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
    description: "Create and publish an invitation or letter. Returns its link, one personal link per guest, a preview image and a secret editKey (keep it to edit later). Use {name} in texts to address each guest.",
    inputSchema: LetterInput,
  }, async (input) => json(await createLetter(input)));

  server.registerTool("get_letter", {
    title: "Read a letter",
    description: "Read a published letter you created (needs its editKey).",
    inputSchema: z.object({ id: z.string(), editKey: z.string() }),
  }, async ({ id, editKey }) => {
    const out = await getLetter(id, editKey);
    return out ? json(out) : { content: [{ type: "text" as const, text: "Unknown letter or wrong editKey." }], isError: true };
  });

  server.registerTool("update_letter", {
    title: "Update a letter",
    description: "Change a published letter (texts, blocks, style, guests…). Its links keep working; pass guests back with their id to keep their links.",
    inputSchema: LetterPatch.extend({ id: z.string(), editKey: z.string() }),
  }, async ({ id, editKey, ...patch }) => {
    const out = await updateLetter(id, editKey, patch);
    return out ? json(out) : { content: [{ type: "text" as const, text: "Unknown letter or wrong editKey." }], isError: true };
  });
}, { serverInfo: { name: "magic-envelope", version: "1.0.0" } });

export { handler as GET, handler as POST, handler as DELETE };
