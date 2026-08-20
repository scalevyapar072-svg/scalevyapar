import { AgentCategoriesView } from '../_components/agent-views'
import { getLabourAgentPageData } from '../_lib/agent-page-data'

export default async function LabourAgentCategoriesPage() {
  const data = await getLabourAgentPageData()
  return <AgentCategoriesView data={data} />
}
