import styles from './agent.module.css'

export default function LabourAgentLoading() {
  return (
    <div className={styles.loadingPage} aria-hidden="true">
      <div className={styles.loadingHeaderRow}>
        <div className={`${styles.skeletonBox} ${styles.loadingBrand}`} />
        <div className={styles.loadingHeaderActions}>
          <div className={`${styles.skeletonBox} ${styles.loadingControl}`} />
          <div className={`${styles.skeletonBox} ${styles.loadingBell}`} />
        </div>
      </div>

      <div className={styles.loadingGreeting}>
        <div className={`${styles.skeletonBox} ${styles.loadingGreetingTitle}`} />
        <div className={`${styles.skeletonBox} ${styles.loadingGreetingMeta}`} />
      </div>

      <div className={`${styles.skeletonBox} ${styles.loadingHero}`} />

      <div className={styles.loadingMetricGrid}>
        <div className={`${styles.skeletonBox} ${styles.loadingMetricCard}`} />
        <div className={`${styles.skeletonBox} ${styles.loadingMetricCard}`} />
        <div className={`${styles.skeletonBox} ${styles.loadingMetricCard}`} />
        <div className={`${styles.skeletonBox} ${styles.loadingMetricCard}`} />
      </div>

      <div className={styles.loadingQuickActionGrid}>
        <div className={`${styles.skeletonBox} ${styles.loadingQuickActionCard}`} />
        <div className={`${styles.skeletonBox} ${styles.loadingQuickActionCard}`} />
        <div className={`${styles.skeletonBox} ${styles.loadingQuickActionCard}`} />
      </div>
    </div>
  )
}
