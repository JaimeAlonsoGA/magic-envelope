import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev badge sits over the bottom sheet's controls on phones; errors still show in the overlay.
  devIndicators: false,
};

export default nextConfig;
