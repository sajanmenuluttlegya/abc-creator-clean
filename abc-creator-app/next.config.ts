import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "@/lib/tools/server-prompts": "./lib/tools/server-prompts-plus.ts",
      "@/lib/ai/routeToImage": "./lib/ai/routeToImagePlus.ts",
    },
  },
};

export default nextConfig;
