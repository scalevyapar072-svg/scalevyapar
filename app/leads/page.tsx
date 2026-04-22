'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type LeadResult = {
  id: string
  source: string
  businessName: string
  contactName: string
  mobile: string
  email: string
  address: string
  city: string
  website: string
  googleMapsUrl: string
  category: string
  rating: number | null
  reviews: number | null
  status: string
}

const EXTRACTORS = [
  {
    id: 'google',
    title: 'Google Extractor',
    subtitle: 'Search business leads by keyword and city using Google data.',
    status: 'live'
  },
  {
    id: 'indiamart',
    title: 'IndiaMART Extractor',
    subtitle: 'Supplier and buyer lead extraction with phone and company details.',
    status: 'coming-soon'
  },
  {
    id: 'justdial',
    title: 'Justdial Extractor',
    subtitle: 'Business listings with phone numbers and category data.',
    status: 'coming-soon'
  },
  {
    id: 'directory',
    title: 'Online Directory Extractor',
    subtitle: 'Public phone directory business contacts and listing details.',
    status: 'coming-soon'
  },
  {
    id: 'social',
    title: 'Facebook / Instagram Extractor',
    subtitle: 'Social business profile discovery, profile links, and follower data.',
    status: 'coming-soon'
  }
] as const

export default function LeadsPage() {
  const [activeExtractor, setActiveExtractor] = useState<(typeof EXTRACTORS)[number]['id']>('google')
  const [keyword, setKeyword] = useState('boutique')
  const [location, setLocation] = useState('Surat')
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [results, setResults] = useState<LeadResult[]>([])

  const activeCard = useMemo(
    () => EXTRACTORS.find(item => item.id === activeExtractor) || EXTRACTORS[0],
    [activeExtractor]
  )

  const runGoogleExtractor = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setResults([])

    try {
      const res = await fetch('/api/leads/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location, limit })
      })

      const data = await res.json().catch(() => ({ error: 'Unexpected response from server.' }))

      if (!res.ok) {
        setError(data.error || 'Failed to fetch Google leads.')
        return
      }

      setResults(data.leads || [])
      setSuccess(`${data.count || 0} Google leads loaded for ${keyword} in ${location}.`)
    } catch {
      setError('Network error while fetching leads. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    if (results.length === 0) return

    const headers = [
      'Source',
      'Business Name',
      'Contact Name',
      'Mobile',
      'Email',
      'Address',
      'City',
      'Website',
      'Google Maps URL',
      'Category',
      'Rating',
      'Reviews',
      'Status'
    ]

    const rows = results.map(item => [
      item.source,
      item.businessName,
      item.contactName,
      item.mobile,
      item.email,
      item.address,
      item.city,
      item.website,
      item.googleMapsUrl,
      item.category,
      item.rating ?? '',
      item.reviews ?? '',
      item.status
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `google-leads-${keyword}-${location}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#0f172a' }}>
      <div style={{ height: '60px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>LG</div>
          <div>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>Lead Generation</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>5 extractor models · Google live first</p>
          </div>
          <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '11px', padding: '4px 10px', borderRadius: '999px', fontWeight: '700' }}>Google Extractor Live</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href='/dashboard' style={{ background: '#ffffff', color: '#334155', border: '1px solid #dbe2ea', padding: '8px 14px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>Back to Dashboard</Link>
          <Link href='/admin' style={{ background: '#ffffff', color: '#334155', border: '1px solid #dbe2ea', padding: '8px 14px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>Admin</Link>
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '28px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
              <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extractor Models</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {EXTRACTORS.map(item => {
                  const isActive = item.id === activeExtractor
                  const isLive = item.status === 'live'
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveExtractor(item.id)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: isActive ? '#f8fafc' : '#ffffff',
                        border: `1px solid ${isActive ? '#cbd5e1' : '#e2e8f0'}`,
                        borderRadius: '14px',
                        padding: '14px 15px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{item.title}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{item.subtitle}</p>
                        </div>
                        <span style={{ background: isLive ? '#f0fdf4' : '#f8fafc', color: isLive ? '#166534' : '#64748b', border: `1px solid ${isLive ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '999px', padding: '4px 8px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {isLive ? 'Live' : 'Soon'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Scope</p>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', fontSize: '13px', lineHeight: 1.8 }}>
                <li>Google business search by keyword and city</li>
                <li>Lead table with phone, website, address, rating</li>
                <li>CSV export for downloaded lead lists</li>
                <li>Other extractors will be added one by one next</li>
              </ul>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '22px', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '18px', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>{activeCard.title}</h1>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>{activeCard.subtitle}</p>
                </div>
                <div style={{ minWidth: '180px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Output fields</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>Business name, phone, address, website, city, category, rating, maps link</p>
                </div>
              </div>

              {activeExtractor !== 'google' ? (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{activeCard.title} is next in queue</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>We will add this extractor after the Google model is finalized and tested.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 160px auto', gap: '12px', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>Business Keyword</label>
                      <input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder='e.g. boutique, saree wholesaler, garment exporter' style={{ width: '100%', border: '1px solid #dbe2ea', background: '#ffffff', borderRadius: '12px', padding: '11px 12px', fontSize: '14px', color: '#0f172a' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>Location</label>
                      <input value={location} onChange={event => setLocation(event.target.value)} placeholder='e.g. Surat, Jaipur, Mumbai' style={{ width: '100%', border: '1px solid #dbe2ea', background: '#ffffff', borderRadius: '12px', padding: '11px 12px', fontSize: '14px', color: '#0f172a' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>Lead Count</label>
                      <input type='number' min={1} max={20} value={limit} onChange={event => setLimit(Number(event.target.value) || 10)} style={{ width: '100%', border: '1px solid #dbe2ea', background: '#ffffff', borderRadius: '12px', padding: '11px 12px', fontSize: '14px', color: '#0f172a' }} />
                    </div>
                    <button onClick={runGoogleExtractor} disabled={loading} style={{ background: loading ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                      {loading ? 'Extracting...' : 'Run Extractor'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '18px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Source</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Google</p>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Results</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{results.length}</p>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Export</p>
                      <button onClick={exportCsv} disabled={results.length === 0} style={{ marginTop: '4px', background: results.length === 0 ? '#e2e8f0' : '#ffffff', color: results.length === 0 ? '#94a3b8' : '#0f172a', border: '1px solid #dbe2ea', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', fontWeight: '700', cursor: results.length === 0 ? 'not-allowed' : 'pointer' }}>Export CSV</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {(error || success) && (
              <div style={{ background: error ? '#fff1f2' : '#eff6ff', border: `1px solid ${error ? '#fecdd3' : '#bfdbfe'}`, borderRadius: '14px', padding: '14px 16px', color: error ? '#b91c1c' : '#1d4ed8', fontSize: '13px', fontWeight: '600' }}>
                {error || success}
              </div>
            )}

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Lead Results</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Google business results ready for review and export.</p>
                </div>
                <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '5px 10px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>{results.length} row{results.length === 1 ? '' : 's'}</span>
              </div>

              {results.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No lead results yet</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Run the Google extractor above to load business leads for a city and keyword.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1180px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Business Name', 'Mobile', 'Address', 'Website', 'Category', 'Rating', 'Maps', 'Status'].map(head => (
                          <th key={head} style={{ textAlign: 'left', padding: '14px 16px', fontSize: '12px', color: '#64748b', fontWeight: '700', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{item.businessName}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.city}</p>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0f172a' }}>{item.mobile || '-'}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', maxWidth: '280px' }}>{item.address || '-'}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                            {item.website ? (
                              <a href={item.website} target='_blank' rel='noopener noreferrer' style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>Open website</a>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>{item.category || '-'}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>{item.rating ? `${item.rating} (${item.reviews || 0})` : '-'}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                            {item.googleMapsUrl ? (
                              <a href={item.googleMapsUrl} target='_blank' rel='noopener noreferrer' style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>Open map</a>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', color: '#475569', fontWeight: '700' }}>{item.status || 'Unknown'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
