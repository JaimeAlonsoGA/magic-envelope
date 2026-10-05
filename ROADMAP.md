# Roadmap

## Later

### Public API for agents (native agent access)
First-class access for AI agents, so an assistant can create and send invitations for a user without the UI.

- Public, versioned REST API over the same typed model (`Card`, `Block` in `src/lib/model.ts`): create draft, add/update blocks, set theme, publish, fetch RSVP links.
- The Zod schemas are the single source of truth: export them as JSON Schema / OpenAPI so agents get exact tool definitions.
- An MCP server exposing the same operations as tools (`create_letter`, `add_block`, `publish`, …).
- Auth: per-user API keys or OAuth; rate limits per key; the published-card edit key stays the ownership proof.
- Agent-friendly docs: `llms.txt`, examples per block type.

### Animated backgrounds (opt-in style extra)
Optional moving backgrounds per style (slow gradient drift for Launch, sun/grid for Groovy 80s, dither for Pocket 8-bit).
- Off by default; a per-letter toggle in the Style panel. Respect `prefers-reduced-motion` and pause off-screen.
- Implement as a `motion` token on the style (CSS-only where possible) so it stays data, not per-style code.
