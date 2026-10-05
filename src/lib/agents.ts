/**
 * How agents discover Magic Envelope: the MCP Server Card (SEP-2127), the AI Catalog that points
 * to it, and the registry entry. One source, served from every place clients look.
 */
import { SITE_URL } from "./site";

export const MCP_NAME = "com.magic-envelope/invitations";
export const MCP_VERSION = "1.0.0";
export const MCP_URL = `${SITE_URL}/api/mcp`;
export const SERVER_CARD_URL = `${MCP_URL}/server-card`;
export const REPO_URL = "https://github.com/JaimeAlonsoGA/magic-envelope";
export const MCP_DESCRIPTION = "Create and send invitations and letters in a sealed envelope, one personal link per guest.";

export const serverCard = () => ({
  $schema: "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
  name: MCP_NAME,
  version: MCP_VERSION,
  title: "Magic Envelope",
  description: MCP_DESCRIPTION,
  websiteUrl: SITE_URL,
  repository: { url: REPO_URL, source: "github" },
  icons: [
    { src: `${SITE_URL}/icon-512.png`, mimeType: "image/png", sizes: ["512x512"] },
    { src: `${SITE_URL}/icon.svg`, mimeType: "image/svg+xml", sizes: ["any"] },
  ],
  remotes: [{ type: "streamable-http", url: MCP_URL, supportedProtocolVersions: ["2025-11-25", "2025-06-18", "2025-03-26"] }],
});

/** AI Catalog (/.well-known/ai-catalog.json): the domain's index of agent-facing artifacts. */
export const aiCatalog = () => ({
  specVersion: "1.0",
  entries: [{ identifier: "urn:air:magic-envelope.com:mcp:invitations", type: "application/mcp-server-card+json", url: SERVER_CARD_URL }],
});

/** Public, read-only metadata: open to browser clients and cacheable (spec: CORS + Cache-Control). */
export const discoveryHeaders = (type: string) => ({
  "content-type": type,
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET",
  "access-control-allow-headers": "Content-Type, If-None-Match",
  "access-control-expose-headers": "ETag",
  "cache-control": "public, max-age=3600",
});
