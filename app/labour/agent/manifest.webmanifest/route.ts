import { NextResponse } from 'next/server'

const iconBasePath = '/images/rozgar/icons'
const agentManifestIconVersion = '20260812-agent-r-mark-v2'

export function GET() {
  return NextResponse.json(
    {
      name: 'Rozgar Agent',
      short_name: 'Rozgar Agent',
      description: 'Rozgar Agent mobile referral dashboard.',
      start_url: '/labour/agent',
      scope: '/labour/agent/',
      display: 'standalone',
      background_color: '#f3f7fb',
      theme_color: '#123f7b',
      icons: [
        {
          src: `${iconBasePath}/agent-r-favicon-192.png?v=${agentManifestIconVersion}`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${iconBasePath}/agent-r-favicon-192.png?v=${agentManifestIconVersion}`,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: `${iconBasePath}/agent-r-favicon-512.png?v=${agentManifestIconVersion}`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: `${iconBasePath}/agent-r-favicon-512.png?v=${agentManifestIconVersion}`,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    }
  )
}
