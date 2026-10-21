/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/seragam-jai',
  allowedDevOrigins: ['192.168.56.1'],
  agentRules: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,
}

export default nextConfig
