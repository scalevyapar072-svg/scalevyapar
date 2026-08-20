import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Script from 'next/script'
import './globals.css'
import FloatingWhatsApp from '@/components/FloatingWhatsApp'
import MobileBottomBar from '@/components/MobileBottomBar'
import SplashScreen from '@/components/SplashScreen'
import { isLabourAgentSubdomainHost, LABOUR_AGENT_CANONICAL_PREFIX } from '@/lib/labour-agent-host'
import { isRozgarSubdomainHost } from '@/lib/labour-company-host'

const rozgarIconVersion = '20260627'
const rozgarIconBasePath = '/images/rozgar/icons'
const mainFaviconVersion = '20260812-main-favicon-preserved'
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()

export const metadata: Metadata = {
  title: 'ScaleVyapar — Business Automation Platform',
  description: 'All-in-one business automation platform for lead generation, CRM, WhatsApp automation, AI photos and inventory management.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headerStore = await headers()
  const forwardedHost = headerStore.get('x-forwarded-host')?.split(',')[0]?.trim() || ''
  const headerHost = headerStore.get('host')?.trim() || ''
  const hostname = (forwardedHost.split(':')[0] || headerHost.split(':')[0] || '').toLowerCase()
  const publicPathname = headerStore.get('x-public-pathname') || ''
  const resolvedPathname = headerStore.get('x-resolved-pathname') || ''
  const effectivePathname = publicPathname || resolvedPathname
  const isRozgarHost = isRozgarSubdomainHost(hostname)
  const isAgentHost = isLabourAgentSubdomainHost(hostname)
  const isCanonicalRozgarPath =
    effectivePathname === '/labour/company' ||
    effectivePathname.startsWith('/labour/company/')
  const isCanonicalAgentPath =
    effectivePathname === LABOUR_AGENT_CANONICAL_PREFIX ||
    effectivePathname.startsWith(`${LABOUR_AGENT_CANONICAL_PREFIX}/`)
  const isRozgarHomePage =
    effectivePathname === '/labour/company' ||
    (isRozgarHost && publicPathname === '/')
  const isSearchPath =
    publicPathname === '/search' ||
    publicPathname.startsWith('/search/') ||
    effectivePathname === '/labour/company/search' ||
    effectivePathname.startsWith('/labour/company/search/')
  const isAdminRoute =
    publicPathname === '/admin' ||
    publicPathname.startsWith('/admin/') ||
    effectivePathname === '/admin' ||
    effectivePathname.startsWith('/admin/')
  const isLoginRoute =
    publicPathname === '/login' ||
    publicPathname.startsWith('/login/') ||
    effectivePathname === '/login' ||
    effectivePathname.startsWith('/login/')
  const isPublicReferralRoute =
    publicPathname === '/r' ||
    publicPathname.startsWith('/r/') ||
    effectivePathname === '/r' ||
    effectivePathname.startsWith('/r/')
  const isAppReferralRoute =
    publicPathname === '/app/referral' ||
    publicPathname.startsWith('/app/referral?') ||
    effectivePathname === '/app/referral' ||
    effectivePathname.startsWith('/app/referral?')
  const isReferEarnPayoutQaRoute =
    publicPathname === '/qa/refer-earn-payout' ||
    publicPathname.startsWith('/qa/refer-earn-payout?') ||
    effectivePathname === '/qa/refer-earn-payout' ||
    effectivePathname.startsWith('/qa/refer-earn-payout?')
  const isAgentRoute = isAgentHost || isCanonicalAgentPath
  const showFloatingWhatsApp =
    !isAgentRoute &&
    !isAdminRoute &&
    !isSearchPath &&
    !isRozgarHomePage &&
    !isPublicReferralRoute &&
    !isAppReferralRoute &&
    !isReferEarnPayoutQaRoute
  const showMobileBottomBar =
    !isAgentRoute &&
    !isAdminRoute &&
    !isRozgarHost &&
    !isPublicReferralRoute &&
    !isAppReferralRoute &&
    !isReferEarnPayoutQaRoute
  const isRozgarRoute = isRozgarHost || isCanonicalRozgarPath
  const isRozgarHomeRoute = publicPathname === '/' || effectivePathname === '/labour/company'
  const loadMetaPixel = Boolean(metaPixelId) && isRozgarRoute && !isAdminRoute && !isLoginRoute

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {!isAgentRoute ? (
          <link rel="icon" href={`/favicon-main.ico?v=${mainFaviconVersion}`} sizes="any" />
        ) : null}
        {isRozgarRoute && !isAgentRoute ? (
          <>
            <link rel="icon" type="image/png" sizes="16x16" href={`${rozgarIconBasePath}/rozgar-icon-16.png?v=${rozgarIconVersion}`} />
            <link rel="icon" type="image/png" sizes="32x32" href={`${rozgarIconBasePath}/rozgar-icon-32.png?v=${rozgarIconVersion}`} />
            <link rel="icon" type="image/png" sizes="48x48" href={`${rozgarIconBasePath}/rozgar-icon-48.png?v=${rozgarIconVersion}`} />
            <link rel="shortcut icon" type="image/png" href={`${rozgarIconBasePath}/rozgar-icon-32.png?v=${rozgarIconVersion}`} />
            <link rel="apple-touch-icon" sizes="180x180" href={`${rozgarIconBasePath}/rozgar-icon-180.png?v=${rozgarIconVersion}`} />
            <link rel="manifest" href={`/manifest.webmanifest?v=${rozgarIconVersion}`} />
            <meta name="theme-color" content="#0a2f75" />
          </>
        ) : null}
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        {loadMetaPixel ? (
          <>
            <Script
              id="rozgar-meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${metaPixelId}');
                  fbq('track', 'PageView');
                `
              }}
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        ) : null}
        <SplashScreen />
        {children}
        {showFloatingWhatsApp ? (
          <FloatingWhatsApp
            isRozgarRoute={isRozgarRoute}
            isRozgarHomeRoute={isRozgarHomeRoute}
          />
        ) : null}
        {showMobileBottomBar ? <MobileBottomBar /> : null}
      </body>
    </html>
  )
}
