/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Add static export option
  distDir: 'out',   // Output to 'out' directory
  // Remove redirects as they're not compatible with static exports
  // Add performance optimizations
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for static export
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};

module.exports = nextConfig;