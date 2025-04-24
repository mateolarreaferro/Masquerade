/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Change from 'export' to 'standalone' for better server-side usage
  distDir: '.next',    // Use the default Next.js output directory
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