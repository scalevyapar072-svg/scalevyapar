import { AgentProfileView } from '../_components/agent-views'
import { getLabourAgentPageData } from '../_lib/agent-page-data'

export default async function LabourAgentProfilePage() {
  const data = await getLabourAgentPageData()
  return <AgentProfileView data={data} />
}
