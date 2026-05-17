import type { Metadata } from 'next'
import './globals.css'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import TestimonialsSlider from '@/components/TestimonialsSlider'
import AnnouncementBar from '@/components/AnnouncementBar'
import MobileBottomBar from '@/components/MobileBottomBar'
import SplashScreen from '@/components/SplashScreen'

export const metadata: Metadata = {
  title: 'ScaleVyapar — Business Automation Platform',
  description: 'All-in-one business automation platform for lead generation, CRM, WhatsApp automation, AI photos and inventory management.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <SplashScreen />
        <AnnouncementBar />
        {children}
        <FloatingWhatsApp />
        <TestimonialsSlider />
        <MobileBottomBar />
      </body>
    </html>
  )
}