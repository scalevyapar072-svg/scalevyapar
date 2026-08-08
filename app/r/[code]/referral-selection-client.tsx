'use client'

import { useMemo, useState } from 'react'

type ReferralCategory = {
  slug: string
  name: string
  rewardAmount: number
}

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

export default function ReferralSelectionClient({
  referralCode,
  categories
}: {
  referralCode: string
  categories: ReferralCategory[]
}) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])
  const selectedCategories = useMemo(
    () => categories.filter(category => selectedSlugs.includes(category.slug)),
    [categories, selectedSlugs]
  )
  const continueHref = useMemo(() => {
    if (selectedCategories.length === 0) {
      return ''
    }

    const params = new URLSearchParams()
    selectedCategories.forEach(category => params.append('category', category.slug))
    return `/r/${encodeURIComponent(referralCode)}/continue?${params.toString()}`
  }, [referralCode, selectedCategories])

  const toggleCategory = (slug: string) => {
    setSelectedSlugs(current =>
      current.includes(slug)
        ? current.filter(item => item !== slug)
        : [...current, slug]
    )
  }

  return (
    <section style={{ display: 'grid', gap: '16px' }}>
      <p style={{ margin: 0, color: '#475569', fontSize: '14px', fontWeight: 800 }}>
        {selectedCategories.length === 0
          ? 'Select at least one category to continue'
          : `${selectedCategories.length} ${selectedCategories.length === 1 ? 'category' : 'categories'} selected`}
      </p>
      <div style={{ display: 'grid', gap: '10px' }}>
        {categories.map(category => {
          const selected = selectedSlugs.includes(category.slug)
          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => toggleCategory(category.slug)}
              style={{
                border: selected ? '2px solid #0a2f75' : '1px solid #d9e2ef',
                background: selected ? '#eef5ff' : '#ffffff',
                borderRadius: '18px',
                padding: '15px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                cursor: 'pointer',
                boxShadow: selected ? '0 12px 28px rgba(10, 47, 117, 0.12)' : '0 8px 20px rgba(15, 23, 42, 0.06)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    border: selected ? '2px solid #0a2f75' : '2px solid #9aa8ba',
                    background: selected ? '#0a2f75' : '#fff',
                    color: '#fff',
                    flex: '0 0 auto'
                  }}
                >
                  {selected ? '✓' : ''}
                </span>
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', color: '#0f172a', fontSize: '16px' }}>{category.name}</strong>
                  <span style={{ color: '#667085', fontSize: '13px' }}>
                    Referral benefit: {formatCurrency(category.rewardAmount)}
                  </span>
                </span>
              </span>
              <span style={{ color: selected ? '#0a2f75' : '#94a3b8', fontWeight: 800 }}>
                {selected ? 'Selected' : 'Select'}
              </span>
            </button>
          )
        })}
      </div>

      <a
        href={continueHref || undefined}
        aria-disabled={selectedCategories.length === 0}
        style={{
          borderRadius: '16px',
          background: selectedCategories.length > 0 ? '#0a2f75' : '#94a3b8',
          color: '#fff',
          padding: '15px 18px',
          fontSize: '16px',
          fontWeight: 800,
          textDecoration: 'none',
          textAlign: 'center',
          pointerEvents: selectedCategories.length > 0 ? 'auto' : 'none',
          boxShadow: '0 16px 32px rgba(10, 47, 117, 0.22)'
        }}
      >
        Continue to Rozgar Registration
      </a>
    </section>
  )
}
