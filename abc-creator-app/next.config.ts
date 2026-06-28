import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "./diagrams/DiagramRenderer": path.resolve(
        __dirname,
        "components/diagrams/DiagramRendererClean.tsx"
      ),
    };

    return config;
  },
};

export default nextConfig;
