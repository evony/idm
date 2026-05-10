import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    ".space-z.ai",
    "localhost",
  ],
  images: {
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'recharts',
      'framer-motion',
      '@tanstack/react-table',
    ],
  },
};

export default nextConfig;
