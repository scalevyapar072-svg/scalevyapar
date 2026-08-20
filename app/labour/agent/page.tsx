import { AgentHomeView } from './_components/agent-views'
import { getLabourAgentPageData } from './_lib/agent-page-data'

export default async function LabourAgentHomePage() {
  const data = await getLabourAgentPageData()
  return <AgentHomeView data={data} />
}
