/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/%C3%B1a',
        destination: '/',
        permanent: true,
      },
    ];
  },
  // Add performance optimizations
  reactStrictMode: true,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};

module.exports = nextConfig;