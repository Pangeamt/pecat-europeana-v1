/** @type {import('next').NextConfig} */
const nextConfig = {
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
