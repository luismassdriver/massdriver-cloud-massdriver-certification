import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
  // Screenshots under public/training are pre-sized JPEGs; skip the sharp-based optimizer in the container image.
  images: { unoptimized: true },
};

export default nextConfig;
