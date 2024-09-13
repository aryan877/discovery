/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      Object.defineProperty(config, "devtool", {
        get() {
          return "cheap-source-map";
        },
        set() {},
      });
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              connect-src 'self' https://api.devnet.solana.com https://api.dscvr.one https://api1.stg.dscvr.one https://*.helius-rpc.com https://*.dscvr.one;
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
