import { redirect } from 'next/navigation'
import { requireLabourAgentPageSession } from '@/lib/labour-agent-session'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { buildReferralDashboard } from '@/lib/labour-referral-dashboard'
import type { AgentPageData } from './agent-types'

export async function getLabourAgentPageData(): Promise<AgentPageData> {
  const session = await requireLabourAgentPageSession()
  const snapshot = await getLabourMarketplaceSnapshot()
  const dashboard = await buildReferralDashboard(session.workerId, {
    marketplace: snapshot,
  })

  const worker = snapshot.workers.find(item => item.id === session.workerId)
  if (!dashboard.enabled) {
    redirect('/labour/agent/login?disabled=1')
  }

  return {
    session: {
      workerId: session.workerId,
      mobile: session.mobile,
    },
    agentName: worker?.fullName?.trim() || session.mobile,
    agentStatus: 'active',
    workerWalletBalance: Math.round(Number(worker?.walletBalance || 0) * 100) / 100,
    dashboard,
  }
}
