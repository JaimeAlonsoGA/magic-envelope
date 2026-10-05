import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev badge sits over the bottom sheet's controls on phones; errors still show in the overlay.
  devIndicators: false,
  // the image renderer ships its own Chromium; keep it out of the bundle so its binary is traced as-is
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: { "/api/v1/letters/**": ["./node_modules/@sparticuz/chromium/bin/**"] },
  async redirects() {
    // link previews moved to a route that can read the guest (?g=)
    return [{ source: "/c/:id/opengraph-image", destination: "/c/:id/preview.png", permanent: true }];
  },
};

export default nextConfig;
