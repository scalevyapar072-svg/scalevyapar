import styles from '../company-site.module.css'
import { CompanySiteShell } from '../company-site-shell'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { CompanyPanelClient } from './company-panel-client'

export default async function LabourCompanyPanelPage() {
  const { content } = await getLabourCompanyWebsiteContent()

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/panel">
      <section className={styles.stack}>
        <CompanyPanelClient />
      </section>
    </CompanySiteShell>
  )
}
