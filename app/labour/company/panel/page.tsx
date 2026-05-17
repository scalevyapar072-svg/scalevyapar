import { CompanySiteShell } from '../company-site-shell'
import styles from '../company-site.module.css'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { CompanyPanelClient } from './company-panel-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LabourCompanyPanelPage() {
  const { content } = await getLabourCompanyWebsiteContent()

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/panel" showHeader={false}>
      <section className={styles.stack}>
        <CompanyPanelClient content={content.companyPanel} />
      </section>
    </CompanySiteShell>
  )
}
