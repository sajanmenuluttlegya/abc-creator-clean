import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@imgly/background-removal-node", "onnxruntime-node"],
  turbopack: {
    resolveAlias: {
      "@/lib/tools/server-prompts": "./lib/tools/server-prompts-visual-plus.ts",
      "@/lib/ai/routeToImage": "./lib/ai/routeToImagePlus.ts",
    },
  },
};

export default nextConfig;
