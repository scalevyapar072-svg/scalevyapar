import type { Metadata } from 'next'
import './globals.css'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import TestimonialsSlider from '@/components/TestimonialsSlider'
import AnnouncementBar from '@/components/AnnouncementBar'
import MobileBottomBar from '@/components/MobileBottomBar'
import SplashScreen from '@/components/SplashScreen'
import { getSafeMainWebsiteContent } from '@/lib/main-website-content'

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getSafeMainWebsiteContent()

  return {
    metadataBase: new URL('https://www.scalevyapar.in'),
    title: content.seo.siteTitle,
    description: content.seo.siteDescription,
    keywords: content.seo.keywords
      .split(',')
      .map(item => item.trim())
      .filter(Boolean),
    openGraph: {
      title: content.seo.siteTitle,
      description: content.seo.siteDescription,
      siteName: content.theme.brandName,
      images: content.seo.openGraphImage ? [{ url: content.seo.openGraphImage }] : undefined
    },
    icons: content.theme.faviconSrc ? {
      icon: content.theme.faviconSrc
    } : undefined
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { content } = await getSafeMainWebsiteContent()

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: content.theme.fontFamily || 'system-ui, sans-serif' }}>
        <SplashScreen />
        <AnnouncementBar content={content} />
        {children}
        <FloatingWhatsApp content={content} />
        <TestimonialsSlider content={content} />
        <MobileBottomBar content={content} />
      </body>
    </html>
  )
}
