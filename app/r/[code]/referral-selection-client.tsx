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
  const [selectedSlug, setSelectedSlug] = useState(categories[0]?.slug || '')
  const selectedCategory = useMemo(
    () => categories.find(category => category.slug === selectedSlug) || null,
    [categories, selectedSlug]
  )
  const continueHref = selectedCategory
    ? `/r/${encodeURIComponent(referralCode)}/continue?category=${encodeURIComponent(selectedCategory.slug)}`
    : ''

  return (
    <section style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'grid', gap: '10px' }}>
        {categories.map(category => {
          const selected = selectedSlug === category.slug
          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => setSelectedSlug(category.slug)}
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
                    borderRadius: '999px',
                    border: selected ? '6px solid #0a2f75' : '2px solid #9aa8ba',
                    background: '#fff',
                    flex: '0 0 auto'
                  }}
                />
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', color: '#0f172a', fontSize: '16px' }}>{category.name}</strong>
                  <span style={{ color: '#667085', fontSize: '13px' }}>
                    Referral benefit: {formatCurrency(category.rewardAmount)}
                  </span>
                </span>
              </span>
              <span style={{ color: selected ? '#0a2f75' : '#94a3b8', fontWeight: 800 }}>
                {selected ? 'Selected' : 'Choose'}
              </span>
            </button>
          )
        })}
      </div>

      <a
        href={continueHref || undefined}
        aria-disabled={!selectedCategory}
        style={{
          borderRadius: '16px',
          background: selectedCategory ? '#0a2f75' : '#94a3b8',
          color: '#fff',
          padding: '15px 18px',
          fontSize: '16px',
          fontWeight: 800,
          textDecoration: 'none',
          textAlign: 'center',
          pointerEvents: selectedCategory ? 'auto' : 'none',
          boxShadow: '0 16px 32px rgba(10, 47, 117, 0.22)'
        }}
      >
        Continue to Rozgar Registration
      </a>
    </section>
  )
}
