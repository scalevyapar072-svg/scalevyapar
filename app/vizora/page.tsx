'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'

const TOOLS = [
  { id: 'generate', emoji: 'ðŸ“¸', name: 'AI Photo Generator', tagline: 'Exact dress on real model', cost: 'â‚¹6/image', accent: '#7c3aed', light: '#ede9fe', border: '#c4b5fd' },
  { id: 'upscale', emoji: 'ðŸ”', name: 'Photo Upscaler 4x', tagline: 'Print-ready quality', cost: 'â‚¹2/image', accent: '#0284c7', light: '#e0f2fe', border: '#7dd3fc' },
  { id: 'video', emoji: 'ðŸŽ¬', name: 'Video Ad Generator', tagline: 'Instagram reel in seconds', cost: 'â‚¹4/video', accent: '#db2777', light: '#fce7f3', border: '#f9a8d4' },
  { id: 'ugc', emoji: 'ðŸŽ­', name: 'UGC Ads Creator', tagline: 'AI avatar speaks your brand', cost: 'â‚¹45/video', accent: '#d97706', light: '#fef3c7', border: '#fcd34d' },
  { id: 'eraser', emoji: 'âœ¨', name: 'Magic Eraser', tagline: 'Remove backgrounds instantly', cost: 'â‚¹2/image', accent: '#059669', light: '#d1fae5', border: '#6ee7b7' },
]

const SHOOT_TYPES = [
  { id: 'front', label: 'ðŸ“¸ Front Standing' },
  { id: 'onearm', label: 'ðŸ’ƒ One-Arm-Up' },
  { id: 'neckline', label: 'ðŸ” Neckline Close-Up' },
  { id: 'sitting-stool', label: 'ðŸª‘ Sitting Stool' },
  { id: 'sitting-portrait', label: 'ðŸ–¼ Sitting Portrait' },
  { id: 'reclining', label: 'ðŸ›‹ Reclining Sofa' },
  { id: 'shoulder', label: 'â†© Over-Shoulder' },
  { id: 'hand', label: 'âœ‹ Hand Editorial' },
  { id: 'fabric', label: 'ðŸ§µ Fabric Macro' },
  { id: 'stitch', label: 'ðŸª¡ Stitch Detail' },
  { id: 'walking', label: 'ðŸš¶ Walking Natural' },
  { id: 'back', label: 'ðŸ”„ Back Pose' },
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
    if (!image && activeTool !== 'video' && activeTool !== 'ugc') { setError('Please upload a photo first'); return }
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
        setError('This tool is coming soon â€” integration in progress')
      }
    } catch { setError('Network error â€” please try again') }
    finally { setGenerating(false) }
  }

  const download = (url: string, i: number) => {
    const a = document.createElement('a'); a.href = url; a.download = `vizora-${activeTool}-${i + 1}.png`; a.click()
  }

  const selectedShoot = SHOOT_TYPES.find(s => s.id === shootType)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#0f172a' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      {/* Top bar */}
      <div style={{ height: '56px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', color: 'white' }}>V</div>
          <div>
            <span style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>Vizora </span>
            <span style={{ fontWeight: '400', fontSize: '16px', color: '#94a3b8' }}>Studio</span>
          </div>
          <div style={{ width: '1px', height: '20px', background: '#e2e8f0' }} />
          <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '11px', padding: '3px 10px', borderRadius: '99px', fontWeight: '600', border: '1px solid #c4b5fd' }}>AI Creative Suite â€” 5 Tools</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '99px', padding: '5px 12px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>FASHN.ai Live</span>
          </div>
          <Link href="/admin" target="_blank" target="_blank" style={{ color: '#64748b', fontSize: '12px', textDecoration: 'none', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '8px', fontWeight: '500' }}>â† Admin</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '230px 320px 1fr', minHeight: 'calc(100vh - 56px)' }}>

        {/* LEFT â€” Tool selector */}
        <div style={{ background: 'white', borderRight: '1px solid #e2e8f0', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', margin: '0 0 12px 4px' }}>Choose Tool</p>
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTool(t.id); setResults([]); setError('') }}
              style={{
                width: '100%', padding: '12px 14px',
                border: `1.5px solid ${activeTool === t.id ? t.border : '#f1f5f9'}`,
                background: activeTool === t.id ? t.light : '#fafafa',
                borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
                boxShadow: activeTool === t.id ? `0 2px 8px ${t.accent}20` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: activeTool === t.id ? t.accent : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0, transition: 'all 0.15s' }}>
                  {t.emoji}
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '700', color: activeTool === t.id ? t.accent : '#374151' }}>{t.name}</p>
                  <p style={{ margin: '0', fontSize: '10px', color: '#94a3b8' }}>{t.cost}</p>
                </div>
              </div>
            </button>
          ))}

          {/* Credits */}
          <div style={{ marginTop: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
            <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '700', margin: '0 0 10px' }}>API Credits</p>
            {[
              { label: 'FASHN.ai', value: '~95 left', color: '#7c3aed', bar: 95 },
              { label: 'Replicate', value: '$9.50', color: '#0284c7', bar: 95 },
            ].map(c => (
              <div key={c.label} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{c.label}</span>
                  <span style={{ fontSize: '11px', color: c.color, fontWeight: '700' }}>{c.value}</span>
                </div>
                <div style={{ height: '3px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.bar}%`, background: c.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE â€” Settings */}
        <div style={{ background: '#fdfdfe', borderRight: '1px solid #e2e8f0', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Tool header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '18px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: tool.light, border: `1px solid ${tool.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{tool.emoji}</div>
            <div>
              <p style={{ margin: '0 0 3px', fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{tool.name}</p>
              <p style={{ margin: '0', fontSize: '11px', color: '#94a3b8' }}>{tool.tagline} Â· <span style={{ color: tool.accent, fontWeight: '600' }}>{tool.cost}</span></p>
            </div>
          </div>

          {/* Upload */}
          {activeTool !== 'video' && activeTool !== 'ugc' && (
            <div>
              <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upload Photo</p>
              {image ? (
                <div style={{ position: 'relative' }}>
                  <img src={image} alt="upload" style={{ width: '100%', borderRadius: '12px', maxHeight: '200px', objectFit: 'cover', display: 'block', border: '1px solid #e2e8f0' }} />
                  <button onClick={() => { setImage(null); setResults([]) }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.9)', color: '#374151', border: '1px solid #e2e8f0', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', backdropFilter: 'blur(4px)' }}>Change</button>
                </div>
              ) : (
                <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? tool.accent : '#cbd5e1'}`, background: isDragActive ? tool.light : '#f8fafc', borderRadius: '12px', padding: '28px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input {...getInputProps()} />
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>ðŸ–¼ï¸</div>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 4px', fontWeight: '500' }}>{isDragActive ? 'Drop here!' : 'Drag & drop or click to upload'}</p>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0' }}>JPG, PNG, WEBP â€” Max 10MB</p>
                </div>
              )}
            </div>
          )}

          {/* Pose selector */}
          {activeTool === 'generate' && (
            <>
              <div>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pose Type â€” 12 Options</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  {SHOOT_TYPES.map(type => (
                    <button key={type.id} onClick={() => setShootType(type.id)} style={{ padding: '7px 10px', border: `1.5px solid ${shootType === type.id ? tool.border : '#e2e8f0'}`, background: shootType === type.id ? tool.light : 'white', color: shootType === type.id ? tool.accent : '#64748b', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: shootType === type.id ? '700' : '400', textAlign: 'left', transition: 'all 0.15s' }}>
                      {type.label}
                    </button>
                  ))}
                </div>
                {selectedShoot && <p style={{ fontSize: '11px', color: '#7c3aed', margin: '8px 0 0', background: '#ede9fe', padding: '7px 12px', borderRadius: '8px', fontWeight: '500' }}>âœ“ {selectedShoot.label} selected</p>}
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Extra Details (optional)</label>
                <textarea value={extra} onChange={e => setExtra(e.target.value)} placeholder="e.g. gold jewelry, white background, fair skin Indian model..." style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', padding: '10px 12px', borderRadius: '10px', outline: 'none', height: '68px', resize: 'none', fontFamily: 'inherit' }} />
              </div>
            </>
          )}

          {/* Upscale settings */}
          {activeTool === 'upscale' && (
            <div>
              <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scale Factor</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[2, 4, 6, 8].map(s => (
                  <button key={s} onClick={() => setScale(s)} style={{ flex: 1, padding: '10px', border: `2px solid ${scale === s ? tool.border : '#e2e8f0'}`, background: scale === s ? tool.light : 'white', color: scale === s ? tool.accent : '#64748b', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', transition: 'all 0.15s' }}>{s}x</button>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '10px 0 0', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                {scale <= 2 ? '2x â€” Great for WhatsApp & social media' : scale <= 4 ? '4x â€” Perfect for Myntra & e-commerce listings' : '6-8x â€” Print catalogs & large format displays'}
              </p>
            </div>
          )}

          {/* Coming soon */}
          {(activeTool === 'video' || activeTool === 'ugc') && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '14px' }}>{activeTool === 'video' ? 'ðŸŽ¬' : 'ðŸŽ­'}</div>
              <p style={{ color: '#374151', fontSize: '15px', fontWeight: '700', margin: '0 0 8px' }}>Coming Soon</p>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 20px', lineHeight: '1.7' }}>
                {activeTool === 'video' ? 'Kling AI + FFmpeg integration\nin progress â€” launching soon!' : 'HeyGen API + ElevenLabs Hindi voice\nintegration in progress â€” launching soon!'}
              </p>
              <a href={activeTool === 'video' ? 'https://klingai.com' : 'https://heygen.com'} target="_blank" rel="noopener noreferrer" style={{ color: tool.accent, fontSize: '12px', textDecoration: 'none', background: tool.light, border: `1px solid ${tool.border}`, padding: '7px 16px', borderRadius: '8px', fontWeight: '600' }}>
                Learn more â†’
              </a>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', padding: '10px 14px', borderRadius: '10px', lineHeight: '1.6' }}>
              âš ï¸ {error}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating || ((!image) && activeTool !== 'video' && activeTool !== 'ugc')}
            style={{
              width: '100%', padding: '14px',
              background: generating || (!image && activeTool !== 'video' && activeTool !== 'ugc') ? '#f1f5f9' : tool.accent,
              color: generating || (!image && activeTool !== 'video' && activeTool !== 'ugc') ? '#94a3b8' : 'white',
              border: 'none', fontSize: '14px', fontWeight: '700', borderRadius: '12px',
              cursor: generating || (!image && activeTool !== 'video' && activeTool !== 'ugc') ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: !generating && (image || activeTool === 'video' || activeTool === 'ugc') ? `0 4px 16px ${tool.accent}40` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {generating ? (
              <>
                <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Processing... 20â€“40 sec
              </>
            ) : (
              <>{tool.emoji} {
                activeTool === 'generate' ? `Generate â€” ${selectedShoot?.label}` :
                activeTool === 'upscale' ? `Upscale ${scale}x` :
                activeTool === 'eraser' ? 'Remove Background' :
                activeTool === 'video' ? 'Generate Video Ad' : 'Create UGC Ad'
              }</>
            )}
          </button>
          <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: '-8px 0 0' }}>{tool.cost} Â· {tool.tagline}</p>
        </div>

        {/* RIGHT â€” Output */}
        <div style={{ background: '#f8fafc', padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px' }}>Generated Output</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0' }}>{tool.name} Â· {tool.cost}</p>
            </div>
            {results.length > 0 && <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '12px', padding: '4px 12px', borderRadius: '99px', fontWeight: '600', border: '1px solid #bbf7d0' }}>âœ“ {results.length} result{results.length > 1 ? 's' : ''} ready</span>}
          </div>

          {results.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 200px)', textAlign: 'center' }}>
              {generating ? (
                <>
                  <div style={{ width: '60px', height: '60px', border: `4px solid ${tool.light}`, borderTopColor: tool.accent, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '24px' }} />
                  <p style={{ color: '#374151', fontSize: '16px', fontWeight: '700', margin: '0 0 8px' }}>Generating your result...</p>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0' }}>FASHN.ai is placing your garment on a real model</p>
                  <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '6px 0 0' }}>Usually takes 20â€“40 seconds</p>
                </>
              ) : (
                <>
                  <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: tool.light, border: `1px solid ${tool.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '20px' }}>{tool.emoji}</div>
                  <p style={{ color: '#374151', fontSize: '15px', fontWeight: '600', margin: '0 0 8px' }}>{image ? 'Click Generate to start' : 'Upload a photo to begin'}</p>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 24px' }}>{tool.tagline}</p>
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 22px', maxWidth: '300px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0', lineHeight: '2', textAlign: 'left' }}>
                      {activeTool === 'generate' && <>ðŸ“¸ Same exact print & colors<br />ðŸ‘— Real human model<br />ðŸŽ¯ 12 professional pose types<br />âš¡ Ready in 20â€“40 seconds</>}
                      {activeTool === 'upscale' && <>ðŸ” 2x to 8x upscaling<br />ðŸ–¨ï¸ Print-ready quality<br />ðŸ›’ Myntra & catalog ready<br />âœ¨ AI face enhancement</>}
                      {activeTool === 'eraser' && <>âœ‚ï¸ Instant background removal<br />ðŸ–¼ï¸ Clean PNG transparency<br />ðŸŽ¨ Perfect for listings<br />âš¡ Ready in seconds</>}
                      {(activeTool === 'video' || activeTool === 'ugc') && <>ðŸš€ Coming soon<br />ðŸ”§ API integration in progress<br />ðŸ“± Instagram reel format<br />ðŸŽ¬ 30-second ad ready</>}
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
                  style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', background: 'white' }}
                  onMouseEnter={e => { (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '1' }}
                  onMouseLeave={e => { (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '0' }}
                >
                  <img src={img} alt={`result-${i}`} style={{ width: '100%', display: 'block' }} />
                  <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <button onClick={() => download(img, i)} style={{ background: 'white', color: '#0f172a', border: 'none', fontSize: '13px', fontWeight: '700', padding: '10px 22px', borderRadius: '10px', cursor: 'pointer' }}>â¬‡ Download</button>
                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('AI fashion shoot: ' + img)}`, '_blank')} style={{ background: '#25d366', color: 'white', border: 'none', fontSize: '13px', fontWeight: '700', padding: '10px 22px', borderRadius: '10px', cursor: 'pointer' }}>WhatsApp</button>
                  </div>
                </div>
              ))}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: '700', margin: '0 0 2px' }}>âœ“ Ready for catalog!</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0' }}>Hover image to download or share</p>
                </div>
                <button onClick={generate} style={{ background: tool.light, color: tool.accent, border: `1px solid ${tool.border}`, fontSize: '12px', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>Generate Again</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
