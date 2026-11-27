/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.build_dist',
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:8000/api/v1/:path*',
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Increase chunk loading timeout in dev mode to 5 minutes to prevent
      // ChunkLoadError timeouts during initial cold compilation on Windows
      config.output = config.output || {};
      config.output.chunkLoadTimeout = 300000;
    }
    return config;
  },
};

module.exports = nextConfig;

