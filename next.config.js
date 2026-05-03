/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // disables lint check at build time
  },
}

module.exports = nextConfig
