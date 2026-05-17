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

const nextConfig: NextConfig = {
  serverExternalPackages: ['lowdb'],
  images: {
    remotePatterns
  },
  turbopack: {
    root: path.resolve(__dirname)
  }
};

export default nextConfig;
