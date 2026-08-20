import { AgentPayoutDetailsView } from '../_components/agent-views'
import { getLabourAgentPageData } from '../_lib/agent-page-data'

export default async function LabourAgentPayoutDetailsPage() {
  const data = await getLabourAgentPageData()
  return <AgentPayoutDetailsView data={data} />
}
