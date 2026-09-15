import { CompanySiteShell } from '../../company-site-shell'
import styles from '../../company-site.module.css'
import { getPublicLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { CompanyPanelClient } from '../company-panel-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type PageProps = {
  params: Promise<{
    jobId: string
  }>
}

export default async function LabourCompanyPanelJobPage({ params }: PageProps) {
  const [{ content }, resolvedParams] = await Promise.all([
    getPublicLabourCompanyWebsiteContent(),
    params
  ])

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/panel">
      <section className={styles.stack}>
        <CompanyPanelClient jobId={resolvedParams.jobId} content={content.companyPanel} />
      </section>
    </CompanySiteShell>
  )
}
