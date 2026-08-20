import { AgentReferralsView } from '../_components/agent-views'
import { getLabourAgentPageData } from '../_lib/agent-page-data'

export default async function LabourAgentReferralsPage() {
  const data = await getLabourAgentPageData()
  return <AgentReferralsView data={data} />
}
