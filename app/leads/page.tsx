'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

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

type RunStep = {
  id: string
  title: string
  detail: string
  status: 'pending' | 'active' | 'done'
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

const DEFAULT_STEPS: RunStep[] = [
  {
    id: 'prepare',
    title: 'Prepare batch run',
    detail: 'Validate keyword, city, and lead goal before starting extraction.',
    status: 'pending'
  },
  {
    id: 'map',
    title: 'Open Google map workspace',
    detail: 'Load a map search view so you can watch the market area while leads are fetched.',
    status: 'pending'
  },
  {
    id: 'fetch',
    title: 'Fetch place pages',
    detail: 'Collect paginated Google business results in batches of up to 20 per page.',
    status: 'pending'
  },
  {
    id: 'sheet',
    title: 'Build lead sheet',
    detail: 'Normalize rows for the spreadsheet preview and CSV export.',
    status: 'pending'
  }
]

const LEAD_GOAL_OPTIONS = [
  { value: '20', label: '20 leads' },
  { value: '50', label: '50 leads' },
  { value: '100', label: '100 leads' },
  { value: 'all', label: 'All available (batch mode)' }
]

const MAPS_EMBED_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  ''

const setStepStatus = (
  steps: RunStep[],
  stepId: string,
  status: RunStep['status'],
  detail?: string
) => steps.map(step => (step.id === stepId ? { ...step, status, detail: detail || step.detail } : step))

export default function LeadsPage() {
  const [activeExtractor, setActiveExtractor] = useState<(typeof EXTRACTORS)[number]['id']>('google')
  const [keyword, setKeyword] = useState('boutique')
  const [location, setLocation] = useState('Surat')
  const [leadGoal, setLeadGoal] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [results, setResults] = useState<LeadResult[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [runSteps, setRunSteps] = useState<RunStep[]>(DEFAULT_STEPS)
  const [pagesFetched, setPagesFetched] = useState(0)
  const [liveMapHref, setLiveMapHref] = useState('')
  const [searchUri, setSearchUri] = useState('')

  const activeCard = useMemo(
    () => EXTRACTORS.find(item => item.id === activeExtractor) || EXTRACTORS[0],
    [activeExtractor]
  )

  const selectedLead = useMemo(
    () => results.find(item => item.id === selectedLeadId) || results[0] || null,
    [results, selectedLeadId]
  )

  useEffect(() => {
    if (results.length > 0 && !selectedLeadId) {
      setSelectedLeadId(results[0].id)
    }
  }, [results, selectedLeadId])

  const mapQuery = selectedLead
    ? `${selectedLead.businessName} ${selectedLead.address}`.trim()
    : `${keyword} in ${location}`.trim()

  const embeddedMapUrl = MAPS_EMBED_KEY
    ? `https://www.google.com/maps/embed/v1/search?key=${encodeURIComponent(MAPS_EMBED_KEY)}&q=${encodeURIComponent(mapQuery)}&zoom=${selectedLead ? '16' : '12'}`
    : ''

  const mapSearchUrl =
    searchUri ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${keyword} in ${location}`)}`

  const runGoogleExtractor = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setResults([])
    setPagesFetched(0)
    setSearchUri('')
    setSelectedLeadId('')

    const initialMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${keyword} in ${location}`)}`
    setLiveMapHref(initialMapUrl)
    setRunSteps(DEFAULT_STEPS)
    setRunSteps(current => setStepStatus(current, 'prepare', 'active'))

    const mapWindow = window.open(initialMapUrl, '_blank', 'noopener,noreferrer')

    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      setRunSteps(current => setStepStatus(current, 'prepare', 'done', 'Keyword, city, and lead goal are ready.'))
      setRunSteps(current => setStepStatus(current, 'map', 'active'))

      const res = await fetch('/api/leads/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location, limit: leadGoal })
      })

      const data = await res.json().catch(() => ({ error: 'Unexpected response from server.' }))

      if (!res.ok) {
        setRunSteps(current => setStepStatus(current, 'map', 'done', 'Map workspace opened.'))
        setRunSteps(current => setStepStatus(current, 'fetch', 'active', 'Google request failed before lead rows could be collected.'))
        setError(data.error || 'Failed to fetch Google leads.')
        return
      }

      setRunSteps(current => setStepStatus(current, 'map', 'done', 'Google map workspace is ready.'))
      setRunSteps(current => setStepStatus(current, 'fetch', 'active', 'Reading Google result pages and normalizing business rows.'))

      setResults(data.leads || [])
      setPagesFetched(data.pagesFetched || 0)
      setSearchUri(data.searchUri || '')
      setSelectedLeadId(data.leads?.[0]?.id || '')

      if (data.searchUri) {
        setLiveMapHref(data.searchUri)
        if (mapWindow) {
          mapWindow.location.href = data.searchUri
        }
      }

      setRunSteps(current => setStepStatus(current, 'fetch', 'done', `Collected ${data.count || 0} rows across ${data.pagesFetched || 1} page(s).`))
      setRunSteps(current => setStepStatus(current, 'sheet', 'active', 'Filling the live lead sheet and export-ready table.'))
      await new Promise(resolve => setTimeout(resolve, 250))
      setRunSteps(current => setStepStatus(current, 'sheet', 'done', 'Lead sheet is ready for review, selection, and CSV export.'))

      const modeLabel = leadGoal === 'all' ? 'all available batched leads' : `${data.count || 0} leads`
      setSuccess(`${data.count || 0} Google leads loaded for ${keyword} in ${location}. Extraction mode: ${modeLabel}.`)
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
      <div style={{ height: '64px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>LG</div>
          <div>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '18px', color: '#0f172a' }}>Lead Generation</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>5 extractor models. Google extractor workspace is live first.</p>
          </div>
          <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '11px', padding: '5px 10px', borderRadius: '999px', fontWeight: '700' }}>Google Extractor Live</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href='/dashboard' style={{ background: '#ffffff', color: '#334155', border: '1px solid #dbe2ea', padding: '8px 14px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>Back to Dashboard</Link>
          <Link href='/admin' style={{ background: '#ffffff', color: '#334155', border: '1px solid #dbe2ea', padding: '8px 14px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>Admin</Link>
        </div>
      </div>

      <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '28px 24px 40px' }}>
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
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Google Setup</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#475569', fontSize: '13px', lineHeight: 1.7 }}>
                <p style={{ margin: 0 }}><strong>Server extraction key:</strong> add <code>GOOGLE_PLACES_API_KEY</code> or <code>GOOGLE_MAPS_API_KEY</code> for the backend extractor.</p>
                <p style={{ margin: 0 }}><strong>Live map panel key:</strong> add <code>NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY</code> for the embedded map workspace.</p>
                <p style={{ margin: 0 }}><strong>Enable in Google Cloud:</strong> Places API (New) and Maps Embed API. Use a restricted browser key for the embed panel.</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '22px', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '18px', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{activeCard.title}</h1>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>{activeCard.subtitle}</p>
                </div>
                <div style={{ minWidth: '280px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Professional workspace</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>Map view on one side, lead sheet on the other, paginated Google extraction in the middle, and CSV export when the run completes.</p>
                </div>
              </div>

              {activeExtractor !== 'google' ? (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{activeCard.title} is next in queue</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>We will add this extractor after the Google model is finalized and tested.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 190px auto', gap: '12px', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>Business Keyword</label>
                      <input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder='e.g. boutique, saree wholesaler, garment exporter' style={{ width: '100%', border: '1px solid #dbe2ea', background: '#ffffff', borderRadius: '12px', padding: '11px 12px', fontSize: '14px', color: '#0f172a' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>Location</label>
                      <input value={location} onChange={event => setLocation(event.target.value)} placeholder='e.g. Surat, Jaipur, Mumbai' style={{ width: '100%', border: '1px solid #dbe2ea', background: '#ffffff', borderRadius: '12px', padding: '11px 12px', fontSize: '14px', color: '#0f172a' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>Lead Goal</label>
                      <select value={leadGoal} onChange={event => setLeadGoal(event.target.value)} style={{ width: '100%', border: '1px solid #dbe2ea', background: '#ffffff', borderRadius: '12px', padding: '11px 12px', fontSize: '14px', color: '#0f172a' }}>
                        {LEAD_GOAL_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={runGoogleExtractor} disabled={loading} style={{ background: loading ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                      {loading ? 'Running batch...' : 'Run Extractor'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '18px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Mode</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{leadGoal === 'all' ? 'Batch all' : 'Batch fixed'}</p>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Results</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{results.length}</p>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Pages fetched</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{pagesFetched}</p>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Export</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>CSV-ready lead sheet</p>
                      </div>
                      <button onClick={exportCsv} disabled={results.length === 0} style={{ background: results.length === 0 ? '#e2e8f0' : '#ffffff', color: results.length === 0 ? '#94a3b8' : '#0f172a', border: '1px solid #dbe2ea', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', fontWeight: '700', cursor: results.length === 0 ? 'not-allowed' : 'pointer' }}>Export CSV</button>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Google Map Workspace</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Watch the target market area and jump into Google Maps while the batch run builds your lead sheet.</p>
                  </div>
                  <a href={liveMapHref || mapSearchUrl} target='_blank' rel='noopener noreferrer' style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #dbe2ea', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>Open live map</a>
                </div>
                {MAPS_EMBED_KEY ? (
                  <iframe
                    title='Google map workspace'
                    src={embeddedMapUrl}
                    style={{ width: '100%', height: '520px', border: 'none', display: 'block', background: '#f8fafc' }}
                    loading='lazy'
                    referrerPolicy='no-referrer-when-downgrade'
                    allowFullScreen
                  />
                ) : (
                  <div style={{ height: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f8fafc' }}>
                    <div style={{ maxWidth: '520px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Map embed key not configured yet</p>
                      <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>Add <code>NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY</code> in your environment variables and enable the Maps Embed API to show the live zoomable map inside this workspace.</p>
                      <a href={mapSearchUrl} target='_blank' rel='noopener noreferrer' style={{ background: '#0f172a', color: 'white', borderRadius: '10px', padding: '10px 14px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'inline-block' }}>Open search in Google Maps</a>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Extraction Activity</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>A professional run log showing what the extractor is doing right now.</p>
                  </div>
                  <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {runSteps.map(step => (
                      <div key={step.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: '12px', alignItems: 'start' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '999px', background: step.status === 'done' ? '#dcfce7' : step.status === 'active' ? '#dbeafe' : '#f1f5f9', color: step.status === 'done' ? '#166534' : step.status === 'active' ? '#1d4ed8' : '#64748b', border: `1px solid ${step.status === 'done' ? '#bbf7d0' : step.status === 'active' ? '#bfdbfe' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>
                          {step.status === 'done' ? 'OK' : step.status === 'active' ? '...' : step.id.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{step.title}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>{step.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Lead Sheet Preview</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Excel-style incoming leads on one side for quick review.</p>
                    </div>
                    <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '5px 10px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>{results.length} rows</span>
                  </div>
                  {results.length === 0 ? (
                    <div style={{ padding: '24px 20px', color: '#64748b', fontSize: '14px' }}>Run the extractor to populate the live lead sheet preview.</div>
                  ) : (
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                      {results.map((item, index) => {
                        const isSelected = selectedLead?.id === item.id
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedLeadId(item.id)}
                            style={{ width: '100%', background: isSelected ? '#f8fafc' : '#ffffff', border: 'none', borderBottom: '1px solid #eef2f7', textAlign: 'left', padding: '14px 16px', cursor: 'pointer' }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: '12px', alignItems: 'center' }}>
                              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>{index + 1}</div>
                              <div>
                                <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{item.businessName}</p>
                                <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#64748b' }}>{item.mobile || 'Phone not listed'} · {item.category || 'Category pending'}</p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.address || 'Address unavailable'}</p>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '4px 8px', fontSize: '11px', color: '#475569', fontWeight: '700' }}>{item.rating ? `${item.rating} star` : 'No rating'}</span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Lead Results Table</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Complete business rows ready for export and client delivery.</p>
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
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1280px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Business Name', 'Mobile', 'Address', 'Website', 'Category', 'Rating', 'Maps', 'Status'].map(head => (
                          <th key={head} style={{ textAlign: 'left', padding: '14px 16px', fontSize: '12px', color: '#64748b', fontWeight: '700', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map(item => {
                        const isSelected = selectedLead?.id === item.id
                        return (
                          <tr key={item.id} onClick={() => setSelectedLeadId(item.id)} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#f8fafc' : '#ffffff', cursor: 'pointer' }}>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{item.businessName}</p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{item.city}</p>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0f172a' }}>{item.mobile || '-'}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', maxWidth: '320px' }}>{item.address || '-'}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                              {item.website ? (
                                <a href={item.website} target='_blank' rel='noopener noreferrer' style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }} onClick={event => event.stopPropagation()}>Open website</a>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>{item.category || '-'}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>{item.rating ? `${item.rating} (${item.reviews || 0})` : '-'}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                              {item.googleMapsUrl ? (
                                <a href={item.googleMapsUrl} target='_blank' rel='noopener noreferrer' style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }} onClick={event => event.stopPropagation()}>Open map</a>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', color: '#475569', fontWeight: '700' }}>{item.status || 'Unknown'}</span>
                            </td>
                          </tr>
                        )
                      })}
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
