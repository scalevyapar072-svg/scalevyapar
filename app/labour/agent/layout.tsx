import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { AgentLocaleProvider, AgentShell } from './_components/agent-chrome'
import { LABOUR_AGENT_CANONICAL_PREFIX } from '@/lib/labour-agent-host'

export const dynamic = 'force-dynamic'
export const revalidate = 0
const agentIconVersion = '20260812-agent-r-mark-v2'
const agentIconBasePath = '/images/rozgar/icons'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Rozgar Agent',
  description: 'Mobile-first referral dashboard for Rozgar agents.',
  manifest: `${LABOUR_AGENT_CANONICAL_PREFIX}/manifest.webmanifest?v=${agentIconVersion}`,
  icons: {
    icon: [
      {
        url: `${agentIconBasePath}/agent-r-favicon-16.png?v=${agentIconVersion}`,
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: `${agentIconBasePath}/agent-r-favicon-32.png?v=${agentIconVersion}`,
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: `${agentIconBasePath}/agent-r-favicon-48.png?v=${agentIconVersion}`,
        sizes: '48x48',
        type: 'image/png',
      },
    ],
    shortcut: [
      {
        url: `${agentIconBasePath}/agent-r-favicon-32.png?v=${agentIconVersion}`,
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: `${agentIconBasePath}/agent-r-favicon-180.png?v=${agentIconVersion}`,
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

export default async function LabourAgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headerStore = await headers()
  const publicPathname = headerStore.get('x-public-pathname') || ''
  const resolvedPathname = headerStore.get('x-resolved-pathname') || ''
  const effectivePathname = publicPathname || resolvedPathname
  const isLoginRoute =
    publicPathname === '/login' ||
    publicPathname.startsWith('/login/') ||
    effectivePathname === `${LABOUR_AGENT_CANONICAL_PREFIX}/login` ||
    effectivePathname.startsWith(`${LABOUR_AGENT_CANONICAL_PREFIX}/login/`)

  return (
    <AgentLocaleProvider>
      {isLoginRoute ? children : <AgentShell>{children}</AgentShell>}
    </AgentLocaleProvider>
  )
}
