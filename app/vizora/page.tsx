'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'

const TOOLS = [
  {
    id: 'generate',
    emoji: '📸',
    name: 'AI Photo Generator',
    tagline: 'Exact dress on real model',
    cost: '₹6/image',
    accent: '#a855f7',
    bg: 'linear-gradient(135deg,#4c1d95,#6d28d9)',
  },
  {
    id: 'upscale',
    emoji: '🔍',
    name: 'Photo Upscaler 4x',
    tagline: 'Print-ready quality',
    cost: '₹2/image',
    accent: '#38bdf8',
    bg: 'linear-gradient(135deg,#0c4a6e,#0284c7)',
  },
  {
    id: 'video',
    emoji: '🎬',
    name: 'Video Ad Generator',
    tagline: 'Instagram reel in seconds',
    cost: '₹4/video',
    accent: '#f472b6',
    bg: 'linear-gradient(135deg,#831843,#db2777)',
  },
  {
    id: 'ugc',
    emoji: '🎭',
    name: 'UGC Ads Creator',
    tagline: 'AI avatar speaks your brand',
    cost: '₹45/video',
    accent: '#fb923c',
    bg: 'linear-gradient(135deg,#7c2d12,#ea580c)',
  },
  {
    id: 'eraser',
    emoji: '✨',
    name: 'Magic Eraser',
    tagline: 'Remove backgrounds instantly',
    cost: '₹2/image',
    accent: '#34d399',
    bg: 'linear-gradient(135deg,#064e3b,#059669)',
  },
]

const SHOOT_TYPES = [
  { id: 'front', label: '📸 Front Standing' },
  { id: 'onearm', label: '💃 One-Arm-Up' },
  { id: 'neckline', label: '🔍 Neckline Close-Up' },
  { id: 'sitting-stool', label: '🪑 Sitting Stool' },
  { id: 'sitting-portrait', label: '🖼 Sitting Portrait' },
  { id: 'reclining', label: '🛋 Reclining Sofa' },
  { id: 'shoulder', label: '↩ Over-Shoulder' },
  { id: 'hand', label: '✋ Hand Editorial' },
  { id: 'fabric', label: '🧵 Fabric Macro' },
  { id: 'stitch', label: '🪡 Stitch Detail' },
  { id: 'walking', label: '🚶 Walking Natural' },
  { id: 'back', label: '🔄 Back Pose' },
]

export default function VizoraStudio() {
  const [activeTool, setActiveTool] = useState('generate')
  const [image, setImage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState('')
  const [shootType, setShootType] = useState('front')
  const [extra, setExtra] = useState('')
  const [scale, setScale] = useState(4)

  const tool = TOOLS.find(t => t.id === activeTool)!

  const onDrop = useCallback((files: File[]) => {
    const reader = new FileReader()
    reader.onload = e => { setImage(e.target?.result as string); setResults([]); setError('') }
    reader.readAsDataURL(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }, maxFiles: 1,
  })

  const generate = async () => {
    if (!image && activeTool !== 'video' && activeTool !== 'ugc') { setError('Upload a photo first'); return }
    setGenerating(true); setError(''); setResults([])
    try {
      if (activeTool === 'generate') {
        const res = await fetch('/api/vizora/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image, shootType, extra }),
        })
        const data = await res.json()
        if (data.images) setResults(Array.isArray(data.images) ? data.images : [data.images])
        else setError(data.error || 'Generation failed')
      } else if (activeTool === 'upscale') {
        const res = await fetch('/api/vizora/upscale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: image, scale }),
        })
        const data = await res.json()
        if (data.upscaledUrl) setResults([data.upscaledUrl])
        else setError(data.error || 'Upscaling failed')
      } else if (activeTool === 'eraser') {
        const res = await fetch('/api/vizora/remove-bg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image }),
        })
        const data = await res.json()
        if (data.image) setResults([data.image])
        else setError(data.error || 'Background removal failed')
      } else {
        setError('This tool is coming soon — API integration in progress')
      }
    } catch { setError('Network error — try again') }
    finally { setGenerating(false) }
  }

  const download = (url: string, i: number) => {
    const a = document.createElement('a'); a.href = url; a.download = `vizora-${activeTool}-${i + 1}.png`; a.click()
  }

  const selectedShoot = SHOOT_TYPES.find(s => s.id === shootType)

  return (
    <div style={{ minHeight: '100vh', background: '#080c14', fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif', color: '#f1f5f9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>

      {/* Top bar */}
      <div style={{ height: '52px', background: '#0a0f1e', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', color: 'white', boxShadow: '0 0 12px #7c3aed60' }}>V</div>
          <span style={{ fontWeight: '700', fontSize: '15px', color: 'white' }}>Vizora Studio</span>
          <span style={{ background: '#7c3aed20', color: '#a78bfa', fontSize: '10px', padding: '2px 8px', borderRadius: '99px', border: '1px solid #7c3aed40', fontWeight: '600' }}>AI Creative Suite</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '99px', padding: '4px 12px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'shimmer 2s infinite' }} />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>FASHN.ai Live</span>
          </div>
          <Link href="/admin" style={{ color: '#475569', fontSize: '12px', textDecoration: 'none', background: '#0f172a', border: '1px solid #1e293b', padding: '5px 12px', borderRadius: '8px' }}>← Admin</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr', minHeight: 'calc(100vh - 52px)' }}>

        {/* LEFT SIDEBAR — Tool selector */}
        <div style={{ background: '#0a0f1e', borderRight: '1px solid #1e293b', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: '9px', color: '#334155', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', margin: '0 0 10px 4px' }}>Select Tool</p>
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTool(t.id); setResults([]); setError('') }}
              style={{
                width: '100%', padding: '12px 14px', border: `1px solid ${activeTool === t.id ? t.accent + '60' : '#1e293b'}`,
                background: activeTool === t.id ? t.accent + '15' : 'transparent',
                borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                boxShadow: activeTool === t.id ? `0 0 20px ${t.accent}20` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: activeTool === t.id ? t.bg : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, transition: 'all 0.2s' }}>
                  {t.emoji}
                </div>
                <div>
                  <p style={{ margin: '0 0 1px', fontSize: '12px', fontWeight: '600', color: activeTool === t.id ? t.accent : '#94a3b8', lineHeight: '1.3' }}>{t.name}</p>
                  <p style={{ margin: '0', fontSize: '10px', color: '#475569' }}>{t.cost}</p>
                </div>
              </div>
            </button>
          ))}

          {/* Credits info */}
          <div style={{ marginTop: 'auto', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', padding: '12px' }}>
            <p style={{ fontSize: '9px', color: '#334155', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', margin: '0 0 8px' }}>Credits</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>FASHN.ai</span>
              <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: '600' }}>~95 left</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Replicate</span>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '600' }}>$9.50 left</span>
            </div>
          </div>
        </div>

        {/* MIDDLE — Settings panel */}
        <div style={{ background: '#0d1117', borderRight: '1px solid #1e293b', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Tool header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: tool.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: `0 0 20px ${tool.accent}40` }}>{tool.emoji}</div>
            <div>
              <p style={{ margin: '0 0 2px', fontWeight: '700', fontSize: '15px', color: 'white' }}>{tool.name}</p>
              <p style={{ margin: '0', fontSize: '11px', color: '#475569' }}>{tool.tagline} · {tool.cost}</p>
            </div>
          </div>

          {/* Upload zone */}
          {activeTool !== 'video' && activeTool !== 'ugc' && (
            <div>
              <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product / Mannequin Photo</p>
              {image ? (
                <div style={{ position: 'relative' }}>
                  <img src={image} alt="upload" style={{ width: '100%', borderRadius: '10px', maxHeight: '220px', objectFit: 'cover', display: 'block', border: '1px solid #1e293b' }} />
                  <button onClick={() => { setImage(null); setResults([]) }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', color: 'white', border: '1px solid #334155', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>Change</button>
                </div>
              ) : (
                <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? tool.accent : '#1e293b'}`, background: isDragActive ? tool.accent + '10' : '#0a0f1e', borderRadius: '12px', padding: '28px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input {...getInputProps()} />
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖼️</div>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 3px' }}>{isDragActive ? 'Drop here!' : 'Drag & drop or click to upload'}</p>
                  <p style={{ color: '#334155', fontSize: '10px', margin: '0' }}>JPG, PNG, WEBP</p>
                </div>
              )}
            </div>
          )}

          {/* Tool-specific settings */}
          {activeTool === 'generate' && (
            <>
              <div>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pose Type — 12 Options</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  {SHOOT_TYPES.map(type => (
                    <button key={type.id} onClick={() => setShootType(type.id)} style={{ padding: '7px 9px', border: `1px solid ${shootType === type.id ? tool.accent : '#1e293b'}`, background: shootType === type.id ? tool.accent + '20' : 'transparent', color: shootType === type.id ? tool.accent : '#64748b', borderRadius: '7px', cursor: 'pointer', fontSize: '10px', fontWeight: shootType === type.id ? '600' : '400', textAlign: 'left', transition: 'all 0.15s' }}>
                      {type.label}
                    </button>
                  ))}
                </div>
                {selectedShoot && <p style={{ fontSize: '10px', color: '#475569', margin: '8px 0 0', background: '#0a0f1e', padding: '6px 10px', borderRadius: '6px' }}>Selected: {selectedShoot.label}</p>}
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Extra Details</label>
                <textarea value={extra} onChange={e => setExtra(e.target.value)} placeholder="e.g. gold jewelry, white background, Indian model..." style={{ width: '100%', background: '#0a0f1e', border: '1px solid #1e293b', color: '#e2e8f0', fontSize: '12px', padding: '9px 12px', borderRadius: '8px', outline: 'none', height: '64px', resize: 'none', fontFamily: 'inherit' }} />
              </div>
            </>
          )}

          {activeTool === 'upscale' && (
            <div>
              <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scale Factor</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[2, 4, 6, 8].map(s => (
                  <button key={s} onClick={() => setScale(s)} style={{ flex: 1, padding: '10px', border: `2px solid ${scale === s ? tool.accent : '#1e293b'}`, background: scale === s ? tool.accent + '20' : 'transparent', color: scale === s ? tool.accent : '#64748b', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', transition: 'all 0.15s' }}>{s}x</button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#475569', margin: '10px 0 0' }}>{scale}x upscale — perfect for {scale <= 2 ? 'WhatsApp' : scale <= 4 ? 'Myntra listings' : 'print catalogs & billboards'}</p>
            </div>
          )}

          {(activeTool === 'video' || activeTool === 'ugc') && (
            <div style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{activeTool === 'video' ? '🎬' : '🎭'}</div>
              <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600', margin: '0 0 8px' }}>Coming Soon</p>
              <p style={{ color: '#334155', fontSize: '11px', margin: '0 0 16px', lineHeight: '1.6' }}>
                {activeTool === 'video' ? 'Kling AI + FFmpeg integration in progress' : 'HeyGen API + ElevenLabs Hindi voice integration in progress'}
              </p>
              <a href={activeTool === 'video' ? 'https://klingai.com' : 'https://heygen.com'} target="_blank" rel="noopener noreferrer" style={{ color: tool.accent, fontSize: '12px', textDecoration: 'none', border: `1px solid ${tool.accent}40`, padding: '6px 14px', borderRadius: '6px' }}>
                Get API Key →
              </a>
            </div>
          )}

          {error && (
            <div style={{ background: '#1a0a0a', border: '1px solid #7f1d1d', color: '#fca5a5', fontSize: '12px', padding: '10px 14px', borderRadius: '8px', lineHeight: '1.5' }}>
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating || ((!image) && activeTool !== 'video' && activeTool !== 'ugc')}
            style={{
              width: '100%', padding: '13px',
              background: generating || (!image && activeTool !== 'video' && activeTool !== 'ugc') ? '#0f172a' : tool.bg,
              color: generating || (!image && activeTool !== 'video' && activeTool !== 'ugc') ? '#334155' : 'white',
              border: `1px solid ${generating ? '#1e293b' : tool.accent + '60'}`,
              fontSize: '13px', fontWeight: '700', borderRadius: '10px',
              cursor: generating || (!image && activeTool !== 'video' && activeTool !== 'ugc') ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: !generating && (image || activeTool === 'video' || activeTool === 'ugc') ? `0 0 20px ${tool.accent}30` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {generating ? (
              <>
                <svg style={{ animation: 'spin 1s linear infinite', width: '15px', height: '15px' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Processing... 20-40 sec
              </>
            ) : (
              <>{tool.emoji} {activeTool === 'generate' ? `Generate — ${selectedShoot?.label}` : activeTool === 'upscale' ? `Upscale ${scale}x` : activeTool === 'eraser' ? 'Remove Background' : activeTool === 'video' ? 'Generate Video Ad' : 'Create UGC Ad'}</>
            )}
          </button>

          <p style={{ fontSize: '10px', color: '#334155', textAlign: 'center', margin: '0' }}>{tool.cost} · {tool.tagline}</p>
        </div>

        {/* RIGHT — Output panel */}
        <div style={{ background: '#080c14', padding: '20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #1e293b' }}>
            <p style={{ fontSize: '11px', color: '#334155', fontWeight: '600', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Output</p>
            {results.length > 0 && <span style={{ fontSize: '11px', color: '#64748b' }}>Hover to download</span>}
          </div>

          {results.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 160px)', textAlign: 'center' }}>
              {generating ? (
                <>
                  <div style={{ width: '56px', height: '56px', border: `4px solid ${tool.accent}30`, borderTopColor: tool.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                  <p style={{ color: '#94a3b8', fontSize: '15px', fontWeight: '600', margin: '0 0 6px' }}>AI is working...</p>
                  <p style={{ color: '#334155', fontSize: '12px', margin: '0' }}>Your result will appear here in 20-40 seconds</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.08 }}>{tool.emoji}</div>
                  <p style={{ color: '#334155', fontSize: '14px', margin: '0 0 6px', fontWeight: '500' }}>{image ? 'Click Generate to start' : 'Upload a photo first'}</p>
                  <p style={{ color: '#1e293b', fontSize: '12px', margin: '0 0 20px' }}>{tool.tagline}</p>
                  <div style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px 20px', maxWidth: '280px' }}>
                    <p style={{ fontSize: '11px', color: '#475569', margin: '0', lineHeight: '1.8' }}>
                      {activeTool === 'generate' && <>✓ Exact same dress & print<br />✓ Real human model<br />✓ 12 professional poses<br />✓ Ready in 20-40 seconds</>}
                      {activeTool === 'upscale' && <>✓ 2x to 8x upscaling<br />✓ Print-ready quality<br />✓ Myntra & catalog ready<br />✓ AI face enhancement</>}
                      {activeTool === 'eraser' && <>✓ Instant background removal<br />✓ Clean PNG with transparency<br />✓ Perfect for listings<br />✓ Any background color</>}
                      {(activeTool === 'video' || activeTool === 'ugc') && <>✓ Coming soon<br />✓ API integration in progress<br />✓ Get notified when live</>}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              {results.map((img, i) => (
                <div
                  key={i}
                  style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${tool.accent}30`, marginBottom: '12px', boxShadow: `0 0 30px ${tool.accent}15` }}
                  onMouseEnter={e => { (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '1' }}
                  onMouseLeave={e => { (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '0' }}
                >
                  <img src={img} alt={`result-${i}`} style={{ width: '100%', display: 'block' }} />
                  <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '14px' }}>
                    <button onClick={() => download(img, i)} style={{ background: 'white', color: '#0f172a', border: 'none', fontSize: '13px', fontWeight: '700', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>⬇ Download</button>
                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('AI fashion shoot: ' + img)}`, '_blank')} style={{ background: '#25d366', color: 'white', border: 'none', fontSize: '13px', fontWeight: '700', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>WhatsApp</button>
                  </div>
                </div>
              ))}
              <div style={{ background: '#0a0f1e', border: `1px solid ${tool.accent}30`, borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '600' }}>✓ Ready for catalog!</span>
                <button onClick={generate} style={{ background: tool.accent + '20', color: tool.accent, border: `1px solid ${tool.accent}40`, fontSize: '12px', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Generate Again</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}