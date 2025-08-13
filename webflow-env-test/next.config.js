/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Webflow Cloud deployment
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/env-test',
  trailingSlash: true,
  output: 'standalone',
  
  // Environment variables for client-side
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
}

module.exports = nextConfig