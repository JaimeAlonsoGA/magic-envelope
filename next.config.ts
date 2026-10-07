import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev badge sits over the bottom sheet's controls on phones; errors still show in the overlay.
  devIndicators: false,
  // Chromium stays out of the server bundle so the binary is traced as a file, and only into the
  // two routes that render a letter. A broader include put the ~70MB binary on the shared function
  // that also serves .well-known, the API, and the link preview (about 160MB, twice per deployment).
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  compiler: {
    // Turbopack writes route traces and skips outputFileTracingIncludes. The Vercel adapter then
    // reads those traces, so the patch has to land in this hook.
    async runAfterProductionCompile({ distDir }) {
      const { createRequire } = await import("node:module");
      const { join } = await import("node:path");
      const require = createRequire(join(process.cwd(), "package.json"));
      const { tightenServerTraces } = require(join(process.cwd(), "scripts/tighten-traces.cjs"));
      await tightenServerTraces(distDir);
    },
  },
  outputFileTracingIncludes: {
    // The real package path, beside the traced JavaScript. The node_modules/@sparticuz symlink is the same
    // files again, and listing both is what doubled the binary.
    "/api/v1/letters/[id]/image": ["./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**"],
    "/api/v1/letters/[id]/images.zip": ["./node_modules/.pnpm/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**"],
  },
  outputFileTracingExcludes: {
    // every route except the two renderers (the braces are one picomatch pattern; [id] is literal)
    "!{/api/v1/letters/\\[id\\]/image,/api/v1/letters/\\[id\\]/images.zip}": [
      "./node_modules/@sparticuz/chromium/**",
      "./node_modules/.pnpm/@sparticuz+chromium@*/**",
      "./node_modules/puppeteer-core/**",
      "./node_modules/.pnpm/puppeteer-core@*/**",
    ],
    // local letters and uploads; production reads Blob. Never ship a dev .data directory.
    "*": ["./.data/**"],
  },
  async redirects() {
    // link previews moved to a route that can read the guest (?g=)
    return [{ source: "/c/:id/opengraph-image", destination: "/c/:id/preview.png", permanent: true }];
  },
};

export default nextConfig;
