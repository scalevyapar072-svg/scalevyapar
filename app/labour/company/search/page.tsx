import { CompanySiteShell } from '../company-site-shell'
import { LabourSearchClient } from './labour-search-client'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'

export default async function LabourCompanySearchPage() {
  const [website, snapshot] = await Promise.all([
    getLabourCompanyWebsiteContent(),
    getLabourMarketplaceSnapshot()
  ])

  const content = website.content
  const activeWorkers = snapshot.workers
    .filter(worker => worker.status === 'active' && worker.isVisible)
    .map(worker => ({
      id: worker.id,
      fullName: worker.fullName,
      city: worker.city,
      experienceYears: worker.experienceYears,
      expectedDailyWage: worker.expectedDailyWage,
      availability: worker.availability,
      categoryLabels: worker.categoryIds
        .map(categoryId => snapshot.categories.find(category => category.id === categoryId)?.name)
        .filter((value): value is string => Boolean(value))
    }))

  const cities = Array.from(new Set(activeWorkers.map(worker => worker.city).filter(Boolean))).sort()
  const categories = Array.from(new Set(activeWorkers.flatMap(worker => worker.categoryLabels))).sort()

  return (
    <CompanySiteShell content={content} currentPath="/labour/company/search">
      <LabourSearchClient
        workers={activeWorkers}
        categories={categories}
        cities={cities}
        eyebrow={content.searchPage.eyebrow}
        title={content.searchPage.title}
        subtitle={content.searchPage.subtitle}
        helperText={content.searchPage.helperText}
        emptyTitle={content.searchPage.emptyTitle}
        emptyDescription={content.searchPage.emptyDescription}
        accentColor={content.theme.accentColor}
        highlightColor={content.theme.highlightColor}
      />
    </CompanySiteShell>
  )
}
