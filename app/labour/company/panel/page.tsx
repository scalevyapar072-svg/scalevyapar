import styles from '../company-site.module.css'
import { CompanyPanelClient } from './company-panel-client'

export default async function LabourCompanyPanelPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <CompanyPanelClient />
      </div>
    </div>
  )
}
