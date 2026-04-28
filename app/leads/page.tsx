'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type LeadResult = {
  id: string
  source: string
  businessName: string
  productName: string
  contactName: string
  mobile: string
  email: string
  address: string
  city: string
  website: string
  googleMapsUrl: string
  category: string
  price: string
  memberYears: string
  gstVisible: boolean
  emailVisible: boolean
  mobileVisible: boolean
  rating: number | null
  reviews: number | null
  status: string
  notes: string
}

type RunStep = {
  id: string
  title: string
  detail: string
  status: 'pending' | 'active' | 'done'
}

type SourceId = 'googleMaps' | 'websites' | 'social' | 'directories' | 'otherSources'

type SourceOption = {
  id: SourceId
  title: string
  description: string
}

const EXTRACTORS = [
  {
    id: 'google',
    title: 'Business Extractor',
    subtitle: 'Search by business keyword and location, then enrich visible public business data from the selected sources.',
    status: 'live'
  }
] as const

const SOURCE_OPTIONS: SourceOption[] = [
  {
    id: 'googleMaps',
    title: 'Google Maps',
    description: 'Business listing, address, category, rating, and any phone that Google exposes publicly.'
  },
  {
    id: 'websites',
    title: 'Business Website',
    description: 'Visible phone, email, and contact-page details from business websites discovered from Tavily Search.'
  },
  {
    id: 'social',
    title: 'Facebook & Instagram',
    description: 'Public business profile links discovered from the website and visible public channels.'
  },
  {
    id: 'directories',
    title: 'Online Directories',
    description: 'Public directory references linked from the business website or visible public listings.'
  },
  {
    id: 'otherSources',
    title: 'Other Public Sources',
    description: 'LinkedIn, WhatsApp, and other public business links that are openly published.'
  }
]

const GOOGLE_STEPS: RunStep[] = [
  {
    id: 'prepare',
    title: 'Prepare search criteria',
    detail: 'Validate keyword, location, and enrichment source preferences before extraction starts.',
    status: 'pending'
  },
  {
    id: 'maps',
    title: 'Seed source discovery',
    detail: 'Discover visible public business sources for the keyword and location.',
    status: 'pending'
  },
  {
    id: 'enrich',
    title: 'Enrich visible public data',
    detail: 'Scan business websites, contact pages, and public sources for visible contact info, social links, and directories.',
    status: 'pending'
  },
  {
    id: 'sheet',
    title: 'Build visible lead table',
    detail: 'Normalize rows for the visible lead sheet and CSV export.',
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

function getExtractorSteps() {
  return GOOGLE_STEPS.map(step => ({ ...step }))
}

export default function LeadsPage() {
  const [activeExtractor, setActiveExtractor] = useState<(typeof EXTRACTORS)[number]['id']>('google')
  const [keyword, setKeyword] = useState('ladies kurti wholesaler')
  const [location, setLocation] = useState('Surat')
  const [leadGoal, setLeadGoal] = useState('all')
  const [selectedSources, setSelectedSources] = useState<SourceId[]>(['googleMaps'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [results, setResults] = useState<LeadResult[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [runSteps, setRunSteps] = useState<RunStep[]>(getExtractorSteps())
  const [pagesFetched, setPagesFetched] = useState(0)
  const [liveWorkspaceHref, setLiveWorkspaceHref] = useState('')
  const [searchUri, setSearchUri] = useState('')

  const activeCard = useMemo(
    () => EXTRACTORS.find(item => item.id === activeExtractor) || EXTRACTORS[0],
    [activeExtractor]
  )

  const selectedLead = useMemo(
    () => results.find(item => item.id === selectedLeadId) || results[0] || null,
    [results, selectedLeadId]
  )

  const selectedSourceCards = useMemo(
    () => SOURCE_OPTIONS.filter(option => selectedSources.includes(option.id)),
    [selectedSources]
  )

  const selectedSourceTitles = useMemo(
    () => selectedSourceCards.map(option => option.title),
    [selectedSourceCards]
  )

  useEffect(() => {
    setRunSteps(getExtractorSteps())
    setError('')
    setSuccess('')
    setResults([])
    setPagesFetched(0)
    setSelectedLeadId('')
  }, [activeExtractor])

  useEffect(() => {
    if (results.length > 0 && !selectedLeadId) {
      setSelectedLeadId(results[0].id)
    }
  }, [results, selectedLeadId])

  const mapQuery = selectedLead
    ? `${selectedLead.businessName} ${selectedLead.address}`.trim()
    : `${keyword} in ${location}`.trim()

  const usingGoogleMapsWorkspace = selectedSources.includes('googleMaps')

  const sourceModeLabel = useMemo(() => {
    const activeSource = SOURCE_OPTIONS.find(opt => opt.id === selectedSources[0])
    return activeSource?.title || 'Google Maps'
  }, [selectedSources])

  const sourceModeHelp = useMemo(() => {
    const activeSource = SOURCE_OPTIONS.find(opt => opt.id === selectedSources[0])
    return activeSource?.description || 'Visible business data will be loaded from the selected source.'
  }, [selectedSources])

  const embeddedMapUrl = MAPS_EMBED_KEY
    ? `https://www.google.com/maps/embed/v1/search?key=${encodeURIComponent(MAPS_EMBED_KEY)}&q=${encodeURIComponent(mapQuery)}&zoom=${selectedLead ? '16' : '12'}`
    : ''

  const mapSearchUrl =
    searchUri ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${keyword} in ${location}`)}`

  const tavilySearchUrl =
    searchUri ||
    `https://app.tavily.com/search?q=${encodeURIComponent(`${keyword} ${location} business website`)}`

  const workspaceUrl = usingGoogleMapsWorkspace ? mapSearchUrl : tavilySearchUrl
  const workspaceTitle = usingGoogleMapsWorkspace ? 'Google Maps Workspace' : 'Business Website Search Workspace'
  const workspaceCopy = usingGoogleMapsWorkspace
    ? 'Watch the Google Maps market area while the extractor finds visible business listings and enriches them with website, contact-page, social, and directory data.'
    : 'Review the live web-search workspace while the extractor discovers visible public business websites and extracts visible contact-page details.'
  const workspaceButtonLabel = usingGoogleMapsWorkspace ? 'Open Google Maps' : 'Open Tavily Search'

  const resetRunState = () => {
    setLoading(true)
    setError('')
    setSuccess('')
    setResults([])
    setPagesFetched(0)
    setSearchUri('')
    setSelectedLeadId('')
    setRunSteps(getExtractorSteps())
  }

  const toggleSource = (sourceId: SourceId) => {
    setSelectedSources([sourceId])
  }

  const runGoogleExtractor = async () => {
    resetRunState()

    const initialMapUrl = usingGoogleMapsWorkspace
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${keyword} in ${location}`)}`
      : `https://app.tavily.com/search?q=${encodeURIComponent(`${keyword} ${location} business website`)}`
    setLiveWorkspaceHref(initialMapUrl)
    setRunSteps(current => setStepStatus(current, 'prepare', 'active'))

    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      setRunSteps(current => setStepStatus(current, 'prepare', 'done', `Keyword, location, and ${selectedSources.length} selected source(s) are ready.`))
      setRunSteps(current => setStepStatus(current, 'maps', 'active'))

      const res = await fetch('/api/leads/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          location,
          limit: leadGoal,
          sources: selectedSources
        })
      })

      const data = await res.json().catch(() => ({ error: 'Unexpected response from server.' }))

      if (!res.ok) {
        setRunSteps(current => setStepStatus(current, 'maps', 'done', `${sourceModeLabel} search was interrupted or failed to return results.`))
        setRunSteps(current => setStepStatus(current, 'enrich', 'active', 'Enrichment stopped because the search returned an error.'))
        
        const mainError = data.error || `Failed to fetch leads from ${sourceModeLabel}.`
        setError(mainError)
        return
      }

      setRunSteps(current =>
        setStepStatus(
          current,
          'maps',
          'done',
          `Found ${data.pagesFetched || 1} ${usingGoogleMapsWorkspace ? 'Google Maps page(s) with business listings' : 'web-search page(s) with visible public website candidates'} for ${keyword} in ${location}.`
        )
      )
      
      const enrichmentCount = selectedSources.length - (selectedSources.includes('googleMaps') ? 1 : 0)
        const enrichmentLabel = enrichmentCount > 0
          ? ` Enriching with ${selectedSourceCards.filter(c => c.id !== 'googleMaps').map(c => c.title).join(', ')}.`
          : ' No enrichment sources selected.'
        
        setRunSteps(current => setStepStatus(current, 'enrich', 'active', `Extracting visible public data from business websites, contact pages, and profiles.${enrichmentLabel}`))

      setResults(data.leads || [])
      setPagesFetched(data.pagesFetched || 0)
      setSearchUri(data.searchUri || '')
      setSelectedLeadId(data.leads?.[0]?.id || '')
      if (data.searchUri) {
        setLiveWorkspaceHref(data.searchUri)
      }

      setRunSteps(current => setStepStatus(current, 'enrich', 'done', `Visible data enrichment returned ${data.count || 0} merged row(s).`))
      setRunSteps(current => setStepStatus(current, 'sheet', 'active', 'Filling the visible lead table and export-ready sheet.'))
      await new Promise(resolve => setTimeout(resolve, 250))
      setRunSteps(current => setStepStatus(current, 'sheet', 'done', 'Visible lead results are ready for review, filtering, and export.'))

      const sourceName = selectedSourceCards[0]?.title || 'Google Maps'
      const enrichmentList = selectedSourceCards.filter(c => c.id !== 'googleMaps').map(c => c.title).join(', ') || 'none'
      setSuccess(`${data.count || 0} visible lead row(s) from ${sourceName}${enrichmentList !== 'none' && usingGoogleMapsWorkspace ? `, enriched with ${enrichmentList}` : ''}. Search: ${keyword} in ${location}.`)
    } catch {
      setError('Network error while fetching leads. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const runExtractor = () => {
    runGoogleExtractor()
  }

  const exportCsv = () => {
    if (results.length === 0) return

    const headers = [
      'Source',
      'Business Name',
      'Product Name',
      'Contact Name',
      'Mobile',
      'Email',
      'Address',
      'City',
      'Website',
      'Google Maps URL',
      'Category',
      'Price',
      'Member Years',
      'GST Badge',
      'Email Badge',
      'Mobile Badge',
      'Rating',
      'Reviews',
      'Status',
      'Notes'
    ]

    const rows = results.map(item => [
      item.source,
      item.businessName,
      item.productName,
      item.contactName,
      item.mobile,
      item.email,
      item.address,
      item.city,
      item.website,
      item.googleMapsUrl,
      item.category,
      item.price,
      item.memberYears,
      item.gstVisible ? 'Yes' : 'No',
      item.emailVisible ? 'Yes' : 'No',
      item.mobileVisible ? 'Yes' : 'No',
      item.rating ?? '',
      item.reviews ?? '',
      item.status,
      item.notes
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `visible-leads-${keyword}-${location}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const setupTitle = 'Search Model'
  const setupCopy = [
    'Select one source at a time depending on how your customer wants the visible public data discovered.',
    'Google Maps uses map listings, while Business Website uses Tavily Search and then scans visible contact pages on the discovered sites.',
    'Only visible, publicly-listed contact information is extracted. No hidden numbers or gated contact data.'
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8fb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#0f172a' }}>
      <div style={{ height: '64px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>LG</div>
          <div>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '18px', color: '#0f172a' }}>Lead Generation</p>
             <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>One search criteria. Multiple visible public sources. Maps and web powered.</p>
          </div>
          <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontSize: '11px', padding: '5px 10px', borderRadius: '999px', fontWeight: '700' }}>{activeCard.title} Live</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href='/dashboard' style={{ background: '#ffffff', color: '#334155', border: '1px solid #dbe2ea', padding: '8px 14px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>Back to Dashboard</Link>
          <Link href='/admin' style={{ background: '#ffffff', color: '#334155', border: '1px solid #dbe2ea', padding: '8px 14px', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>Admin</Link>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 'calc(100vw - 8px)', margin: '0 auto', padding: '18px 8px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '252px minmax(0, 1fr)', gap: '20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '18px', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
              <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extractor Modules</p>
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
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{setupTitle}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: '#475569', fontSize: '13px', lineHeight: 1.7 }}>
                {setupCopy.map(item => (
                  <p key={item} style={{ margin: 0 }}>{item}</p>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, alignSelf: 'start' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '22px', boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '18px', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>{activeCard.title}</h1>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>{activeCard.subtitle}</p>
                </div>
                <div style={{ minWidth: '320px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Professional workspace</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                    Search once by business keyword and location, then load visible public data from the selected sources into one lead table.
                  </p>
                </div>
              </div>

              {activeExtractor !== 'google' ? (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{activeCard.title} is next in queue</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>The source checkbox workflow below is already designed so this module can plug into the same lead table later.</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr) 190px auto', gap: '12px', alignItems: 'end' }}>
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
                    <button 
                      onClick={runExtractor} 
                      disabled={loading || selectedSources.length === 0}
                      style={{
                        background: loading ? '#64748b' : selectedSources.length === 0 ? '#cbd5e1' : '#0f172a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: loading || selectedSources.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: loading || selectedSources.length === 0 ? 0.7 : 1,
                        transition: 'all 150ms ease-out'
                      }}
                      title={selectedSources.length === 0 ? 'Select at least one source' : undefined}
                    >
                      {loading ? '⏳ Running extractor...' : 'Run Extractor'}
                    </button>
                  </div>

                  <div style={{ marginTop: '16px', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Search source</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Choose one source mode at a time based on how you want visible public business data discovered.</p>
                      </div>
                      <span style={{ background: '#ffffff', border: '1px solid #dbe2ea', borderRadius: '999px', padding: '5px 10px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>{selectedSources.length} selected</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                      {SOURCE_OPTIONS.map(option => {
                        const checked = selectedSources.includes(option.id)
                        return (
                          <div
                            key={option.id}
                            onClick={() => toggleSource(option.id)}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '20px 1fr auto',
                              gap: '12px',
                              alignItems: 'start',
                              padding: '12px',
                              borderRadius: '14px',
                              border: `1px solid ${checked ? '#bfdbfe' : '#e2e8f0'}`,
                              background: checked ? '#eff6ff' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 150ms ease-out',
                              boxShadow: checked ? '0 0 0 3px rgba(191, 219, 254, 0.3)' : 'none'
                            }}
                          >
                            <input
                              type='checkbox'
                              checked={checked}
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleSource(option.id)
                              }}
                              style={{ marginTop: '2px', cursor: 'pointer' }}
                            />
                            <div>
                              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{option.title}</p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>{option.description}</p>
                            </div>
                            {checked ? (
                              <span style={{ alignSelf: 'start', background: '#dbeafe', color: '#1d4ed8', borderRadius: '999px', padding: '4px 8px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                Selected
                              </span>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <span style={{ background: '#0f172a', color: '#ffffff', borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: '700' }}>
                        Current mode: {sourceModeLabel}
                      </span>
                      {selectedSourceTitles.map(title => (
                        <span key={title} style={{ background: '#ffffff', color: '#475569', border: '1px solid #dbe2ea', borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: '700' }}>
                          {title}
                        </span>
                      ))}
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
                      {sourceModeHelp}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginTop: '18px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Current source mode</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{sourceModeLabel}</p>
                      <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                        {leadGoal === 'all' ? 'Lead goal: Batch all' : 'Lead goal: Batch fixed'}
                      </p>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Selected sources</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedSources.length}</p>
                      <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                        {selectedSourceTitles.join(', ') || 'None'}
                      </p>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Rows returned</p>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{results.length}</p>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Pages fetched</p>
                        <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{pagesFetched}</p>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)', minWidth: 0 }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{workspaceTitle}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{workspaceCopy}</p>
                </div>
                <a href={liveWorkspaceHref || workspaceUrl} target='_blank' rel='noopener noreferrer' style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #dbe2ea', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
                    {workspaceButtonLabel}
                </a>
              </div>

                {usingGoogleMapsWorkspace && MAPS_EMBED_KEY ? (
                  <iframe
                    title='Google map workspace'
                    src={embeddedMapUrl}
                    style={{ width: '100%', height: '620px', border: 'none', display: 'block', background: '#f8fafc' }}
                    loading='lazy'
                    referrerPolicy='no-referrer-when-downgrade'
                    allowFullScreen
                  />
                ) : usingGoogleMapsWorkspace ? (
                  <div style={{ height: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f8fafc' }}>
                    <div style={{ maxWidth: '520px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                        Map embed key not configured yet
                      </p>
                      <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>
                        Add <code>NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY</code> in your environment variables and enable the Maps Embed API to show the live zoomable map inside this workspace.
                      </p>
                      <a href={workspaceUrl} target='_blank' rel='noopener noreferrer' style={{ background: '#0f172a', color: 'white', borderRadius: '10px', padding: '10px 14px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'inline-block' }}>
                        {workspaceButtonLabel}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ minHeight: '520px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 360px)', gap: '20px', alignItems: 'stretch', padding: '24px', background: '#f8fafc' }}>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <p style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Business Website Search Workspace</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: 1.7 }}>
                          Tavily Search is used to discover visible public business websites for your keyword and location. The extractor then scans visible contact pages for public phone and email details.
                        </p>
                      </div>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Active web search query</p>
                        <p style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>{`${keyword} ${location} business website`}</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                          <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Selected source</p>
                          <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{sourceModeLabel}</p>
                        </div>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                          <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Rows ready</p>
                          <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{results.length}</p>
                        </div>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px' }}>
                          <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Pages fetched</p>
                          <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{pagesFetched}</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                      <div>
                        <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>What the extractor checks</p>
                        <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', fontSize: '13px', lineHeight: 1.8 }}>
                          <li>homepage and contact pages</li>
                          <li>visible phone numbers</li>
                          <li>visible email addresses</li>
                          <li>public social and directory links</li>
                        </ul>
                      </div>
                      <a href={workspaceUrl} target='_blank' rel='noopener noreferrer' style={{ background: '#0f172a', color: 'white', borderRadius: '10px', padding: '10px 14px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', display: 'inline-block', textAlign: 'center' }}>
                        {workspaceButtonLabel}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px', alignItems: 'stretch', minWidth: 0 }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)', minWidth: 0, height: '100%' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Extraction Activity</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>A visible-data run log showing what the extractor is doing right now.</p>
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

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)', minWidth: 0, height: '100%' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Visible Lead Results Table</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Incoming visible public leads on one side for quick review.</p>
                    </div>
                    <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '5px 10px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>{results.length} rows</span>
                  </div>
                  {results.length === 0 ? (
                    <div style={{ padding: '24px 20px', color: '#64748b', fontSize: '14px' }}>
                      Run the extractor to populate the visible lead sheet preview.
                    </div>
                  ) : (
                    <div style={{ maxHeight: '620px', overflowY: 'auto' }}>
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
                                <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#64748b' }}>{item.source} - {item.mobile || 'Visible phone not shown'}</p>
                                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.website || item.address || item.notes || 'Website or notes unavailable'}</p>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '4px 8px', fontSize: '11px', color: '#475569', fontWeight: '700' }}>{item.status || 'Pending'}</span>
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

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 24px rgba(15,23,42,0.04)', minWidth: 0, alignSelf: 'start' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Lead Results Table</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Merged visible public business rows ready for export and client delivery.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '5px 10px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>{results.length} row{results.length === 1 ? '' : 's'}</span>
                  <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '999px', padding: '5px 10px', fontSize: '12px', color: '#1d4ed8', fontWeight: '700' }}>Compact review table</span>
                </div>
              </div>

              {results.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No visible leads yet</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    Run the extractor above to load Google-seeded visible business data from the selected public sources.
                  </p>
                </div>
              ) : (
                <div style={{ width: '100%', overflowX: 'hidden', overflowY: 'hidden', padding: '0 0 8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '11%' }} />
                      <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Source', 'Business Name', 'Mobile', 'Email', 'City', 'Website / Profile', 'Status'].map(head => (
                          <th key={head} style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'left', padding: '14px 16px', fontSize: '12px', color: '#64748b', fontWeight: '700', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', background: '#f8fafc' }}>{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map(item => {
                        const isSelected = selectedLead?.id === item.id
                        return (
                          <tr key={item.id} onClick={() => setSelectedLeadId(item.id)} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#f8fafc' : '#ffffff', cursor: 'pointer' }}>
                            <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>{item.source}</td>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: 1.5, wordBreak: 'break-word' }}>{item.businessName}</p>
                              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.productName || item.contactName || item.category || '-'}</p>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap' }}>{item.mobile || '-'}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.email || '-'}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.city || '-'}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                              {item.website ? (
                                <a href={item.website} target='_blank' rel='noopener noreferrer' style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }} onClick={event => event.stopPropagation()}>Open link</a>
                              ) : item.googleMapsUrl ? (
                                <a href={item.googleMapsUrl} target='_blank' rel='noopener noreferrer' style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }} onClick={event => event.stopPropagation()}>Open map</a>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '4px 10px', fontSize: '11px', color: '#475569', fontWeight: '700', whiteSpace: 'nowrap' }}>{item.status || 'Unknown'}</span>
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








