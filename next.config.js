/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Changed to 'export' for static file generation
  distDir: 'out',   // Set output directory to 'out' to match server expectations
  // Performance optimizations
  reactStrictMode: true,
  images: {
    unoptimized: true, // Required for static export
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  // Make sure trailing slashes are consistent
  trailingSlash: true,
  // Handle base path if needed
  basePath: '',
};

module.exports = nextConfig;