/** @type {import('next').NextConfig} */
const nextConfig = {
  // BullMQ (and its ioredis dependency) must be required at runtime, not
  // bundled: webpack cannot resolve their internal deep imports.
  serverExternalPackages: ["bullmq", "ioredis"],
  experimental: {
    optimizePackageImports: [
      "antd",
      "@ant-design/icons",
      "@ant-design/nextjs-registry",
      "dayjs",
    ],
  },
};

export default nextConfig;
