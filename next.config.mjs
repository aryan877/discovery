/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
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
              connect-src 'self' https://api.devnet.solana.com https://api.dscvr.one https://api1.stg.dscvr.one https://*.helius-rpc.com;
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
