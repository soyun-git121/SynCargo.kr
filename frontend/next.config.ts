import path from "node:path";
import type { NextConfig } from "next";

// 모노레포 루트 (npm workspaces: backend, frontend)
const root = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // backend 패키지는 TypeScript 소스 그대로 가져와 Next가 같이 빌드한다
  transpilePackages: ["@syncargo/backend"],
  turbopack: { root },
  outputFileTracingRoot: root,
};

export default nextConfig;
