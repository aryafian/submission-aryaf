import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // NOTE: 'standalone' requires symlink permission on Windows.
  // Enable Developer Mode or run terminal as Administrator to use it.
  // output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['pino'],
}

export default nextConfig
