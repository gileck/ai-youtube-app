/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // 👈 disables type checking during build
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
