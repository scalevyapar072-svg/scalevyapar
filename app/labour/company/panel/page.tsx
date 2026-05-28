import styles from '../company-site.module.css'
import { CompanyPanelClient } from './company-panel-client'

export default async function LabourCompanyPanelPage() {
  return (
    <CompanySiteShell content={content} currentPath="/labour/company/panel">
      <section className={styles.stack}>
        <CompanyPanelClient />
      </div>
    </div>
  )
}
