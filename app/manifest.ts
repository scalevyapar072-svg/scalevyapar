import type { MetadataRoute } from 'next'

const iconBasePath = '/images/rozgar/icons'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ScaleVyapar Rozgar',
    short_name: 'Rozgar',
    description: 'Rozgar labour exchange for companies and workers.',
    start_url: '/labour/company',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a2f75',
    icons: [
      {
        src: `${iconBasePath}/rozgar-icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${iconBasePath}/rozgar-icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: `${iconBasePath}/rozgar-icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${iconBasePath}/rozgar-icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}
