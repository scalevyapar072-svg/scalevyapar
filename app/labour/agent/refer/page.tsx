import { AgentReferView } from '../_components/agent-views'
import { getLabourAgentPageData } from '../_lib/agent-page-data'

export default async function LabourAgentReferPage() {
  const data = await getLabourAgentPageData()
  return <AgentReferView data={data} />
}
