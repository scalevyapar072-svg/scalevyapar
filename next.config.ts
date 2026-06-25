import type { NextConfig } from "next";
import path from "path";

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = []
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

if (supabaseUrl) {
  const parsedSupabaseUrl = new URL(supabaseUrl)

  remotePatterns.push({
    protocol: parsedSupabaseUrl.protocol.replace(':', '') as 'http' | 'https',
    hostname: parsedSupabaseUrl.hostname,
    port: parsedSupabaseUrl.port || undefined,
    pathname: '/storage/v1/object/public/**'
  })
}

const rozgarHostMatch = [{ type: 'host' as const, value: 'rozgar.scalevyapar.in' }]

const nextConfig: NextConfig = {
  serverExternalPackages: ['lowdb'],
  images: {
    remotePatterns
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', has: rozgarHostMatch, destination: '/labour/company' },
        { source: '/about', has: rozgarHostMatch, destination: '/labour/company/about' },
        { source: '/pricing', has: rozgarHostMatch, destination: '/labour/company/pricing' },
        { source: '/search', has: rozgarHostMatch, destination: '/labour/company/search' },
        { source: '/contact', has: rozgarHostMatch, destination: '/labour/company/contact' },
        { source: '/panel', has: rozgarHostMatch, destination: '/labour/company/panel' },
        { source: '/panel/:path*', has: rozgarHostMatch, destination: '/labour/company/panel/:path*' },
        { source: '/job-post', has: rozgarHostMatch, destination: '/labour/company/job-post' },
        { source: '/company-registration', has: rozgarHostMatch, destination: '/labour/company/company-registration' },
        { source: '/signin', has: rozgarHostMatch, destination: '/labour/company/signin' },
        { source: '/reset-password', has: rozgarHostMatch, destination: '/labour/company/reset-password' },
        { source: '/checkout', has: rozgarHostMatch, destination: '/labour/company/checkout' },
        { source: '/privacy-policy', has: rozgarHostMatch, destination: '/labour/company/privacy-policy' },
        { source: '/terms-of-service', has: rozgarHostMatch, destination: '/labour/company/terms-of-service' },
        { source: '/user-data-deletion', has: rozgarHostMatch, destination: '/labour/company/user-data-deletion' }
      ]
    }
  },
  turbopack: {
    root: path.resolve(__dirname)
  }
};

export default nextConfig;
