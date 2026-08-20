import { redirect } from 'next/navigation'
import { getLabourAgentSession } from '@/lib/labour-agent-session'
import { AgentAuthCard, AgentDisabledState } from '../_components/agent-views'

type AgentLoginPageProps = {
  searchParams: Promise<{
    disabled?: string
  }>
}

export default async function LabourAgentLoginPage({
  searchParams,
}: AgentLoginPageProps) {
  const { disabled } = await searchParams

  if (disabled) {
    return <AgentDisabledState />
  }

  const session = await getLabourAgentSession()
  if (session) {
    redirect('/labour/agent')
  }

  return <AgentAuthCard />
}
