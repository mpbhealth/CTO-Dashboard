/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,

  // Skip TypeScript errors during build (existing codebase has some issues)
  // TODO: Fix all TypeScript errors and remove this
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Experimental features for App Router
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Environment variables to expose to the client
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
    ],
  },

  // Redirects for legacy routes
  async redirects() {
    return [
      // Legacy Vite routes to new Next.js routes
      {
        source: '/ceod/:path*',
        destination: '/ceo/:path*',
        permanent: true,
      },
      {
        source: '/ctod/:path*',
        destination: '/cto/:path*',
        permanent: true,
      },
    ];
  },

  // Webpack configuration for compatibility
  webpack: (config) => {
    // Handle node: protocol imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

export default nextConfig;

