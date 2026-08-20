import { AgentEarningsView } from '../_components/agent-views'
import { getLabourAgentPageData } from '../_lib/agent-page-data'

export default async function LabourAgentEarningsPage() {
  const data = await getLabourAgentPageData()
  return <AgentEarningsView data={data} />
}
