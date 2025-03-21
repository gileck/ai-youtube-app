/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // disables type checking during build
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = withPWA(nextConfig);
