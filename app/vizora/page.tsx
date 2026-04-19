'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'

const TOOLS = [
  { id: 'generate', label: '🖼️ AI Photo Generator', desc: 'Exact dress on real model', color: '#7c3aed', cost: '₹6/image' },
  { id: 'upscale', label: '🔍 Photo Upscaler 4x', desc: 'Upscale to print-ready quality', color: '#0284c7', cost: '₹2/image' },
  { id: 'video', label: '🎬 Video Ad Generator', desc: 'Turn photo into Instagram reel', color: '#db2777', cost: '₹4/video' },
  { id: 'ugc', label: '🎭 UGC Ads Creator', desc: 'AI avatar speaks about product', color: '#d97706', cost: '₹45/video' },
  { id: 'eraser', label: '✨ Magic Eraser', desc: 'Remove background instantly', color: '#059669', cost: '₹2/image' },
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
  { id: 'walking', label: '🚶 Walking' },
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

  const onDrop = useCallback((files: File[]) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target?.result as string)
      setResults([])
      setError('')
    }
    reader.readAsDataURL(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const currentTool = TOOLS.find(t => t.id === activeTool)!

  const handleGenerate = async () => {
    if (!image && activeTool !== 'video' && activeTool !== 'ugc') {
      setError('Please upload a photo first')
      return
    }
    setGenerating(true)
    setError('')
    setResults([])

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
        else setError(data.error || 'Background removal failed — add REMOVEBG_API_KEY')

      } else if (activeTool === 'video') {
        setError('Video Ad Generator coming soon — API integration in progress')
      } else if (activeTool === 'ugc') {
        setError('UGC Ads Creator coming soon — HeyGen API integration in progress')
      }
    } catch {
      setError('Network error — try again')
    } finally {
      setGenerating(false)
    }
  }

  const download = (url: string, i: number) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `vizora-${activeTool}-${i + 1}.png`
    a.click()
  }

  const getButtonLabel = () => {
    if (generating) return 'Processing...'
    switch (activeTool) {
      case 'generate': return `📸 Generate — ${SHOOT_TYPES.find(s => s.id === shootType)?.label}`
      case 'upscale': return `🔍 Upscale ${scale}x`
      case 'eraser': return '✨ Remove Background'
      case 'video': return '🎬 Generate Video Ad'
      case 'ugc': return '🎭 Create UGC Ad'
      default: return 'Generate'
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Top Nav */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/vizora" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Vizora</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '13px' }}>V</div>
            <span style={{ color: 'white', fontSize: '15px', fontWeight: '700' }}>Vizora Studio</span>
            <span style={{ background: '#7c3aed30', color: '#a78bfa', fontSize: '11px', padding: '2px 8px', borderRadius: '99px', border: '1px solid #7c3aed50' }}>All Tools</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#64748b', fontSize: '12px' }}>FASHN.ai • Replicate • Exact Dress</span>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }}></div>
          <span style={{ color: '#10b981', fontSize: '12px' }}>Live</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '0', height: 'calc(100vh - 53px)' }}>

        {/* LEFT — Tool Selector */}
        <div style={{ borderRight: '1px solid #1e293b', padding: '16px 12px', overflowY: 'auto' }}>
          <p style={{ fontSize: '10px', color: '#475569', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Tools</p>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResults([]); setError('') }}
              style={{
                width: '100%',
                padding: '10px 12px',
                marginBottom: '6px',
                border: `1px solid ${activeTool === tool.id ? tool.color + '60' : '#1e293b'}`,
                background: activeTool === tool.id ? tool.color + '15' : 'transparent',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '600', color: activeTool === tool.id ? tool.color : '#94a3b8' }}>{tool.label}</p>
              <p style={{ margin: '0', fontSize: '10px', color: '#475569' }}>{tool.cost}</p>
            </button>
          ))}

          <div style={{ marginTop: '16px', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
            <p style={{ fontSize: '10px', color: '#475569', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Credits</p>
            {[
              { label: 'FASHN', value: '~95 left', color: '#7c3aed' },
              { label: 'Replicate', value: '$9.50 left', color: '#0284c7' },
            ].map(c => (
              <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{c.label}</span>
                <span style={{ fontSize: '11px', color: c.color, fontWeight: '600' }}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE — Settings */}
        <div style={{ borderRight: '1px solid #1e293b', padding: '16px', overflowY: 'auto' }}>
          <p style={{ fontSize: '10px', color: '#475569', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>
            {currentTool.label}
          </p>

          {/* Upload */}
          {activeTool !== 'video' && activeTool !== 'ugc' && (
            <div style={{ marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px', fontWeight: '600' }}>Upload Photo</p>
              {image ? (
                <div style={{ position: 'relative' }}>
                  <img src={image} alt="upload" style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover', display: 'block', border: '1px solid #1e293b' }} />
                  <button onClick={() => { setImage(null); setResults([]) }} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.8)', color: 'white', border: 'none', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}>Change</button>
                </div>
              ) : (
                <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? currentTool.color : '#334155'}`, background: isDragActive ? currentTool.color + '10' : '#0f172a', borderRadius: '10px', padding: '28px 16px', textAlign: 'center', cursor: 'pointer' }}>
                  <input {...getInputProps()} />
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>🖼️</div>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 2px' }}>{isDragActive ? 'Drop here!' : 'Drag & drop or click'}</p>
                  <p style={{ color: '#475569', fontSize: '10px', margin: '0' }}>JPG, PNG, WEBP</p>
                </div>
              )}
            </div>
          )}

          {/* Tool specific settings */}
          {activeTool === 'generate' && (
            <>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px', fontWeight: '600' }}>Pose Type</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '12px' }}>
                {SHOOT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setShootType(type.id)}
                    style={{
                      padding: '6px 8px',
                      border: `1px solid ${shootType === type.id ? '#7c3aed' : '#1e293b'}`,
                      background: shootType === type.id ? '#7c3aed20' : 'transparent',
                      color: shootType === type.id ? '#a78bfa' : '#64748b',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: shootType === type.id ? '600' : '400',
                      textAlign: 'left',
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 6px', fontWeight: '600' }}>Extra details</p>
              <textarea
                value={extra}
                onChange={e => setExtra(e.target.value)}
                placeholder="e.g. gold jewelry, white background..."
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', fontSize: '11px', padding: '8px 10px', borderRadius: '8px', outline: 'none', height: '60px', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </>
          )}

          {activeTool === 'upscale' && (
            <>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px', fontWeight: '600' }}>Scale Factor</p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {[2, 4, 6, 8].map(s => (
                  <button key={s} onClick={() => setScale(s)} style={{ flex: 1, padding: '8px', border: `2px solid ${scale === s ? '#0284c7' : '#1e293b'}`, background: scale === s ? '#0284c720' : 'transparent', color: scale === s ? '#38bdf8' : '#64748b', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                    {s}x
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#475569' }}>{scale}x upscale — perfect for {scale <= 2 ? 'WhatsApp' : scale <= 4 ? 'Myntra listings' : 'print catalogs'}</p>
            </>
          )}

          {(activeTool === 'video' || activeTool === 'ugc') && (
            <div style={{ padding: '20px', background: '#1e293b', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{activeTool === 'video' ? '🎬' : '🎭'}</div>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px', fontWeight: '600' }}>Coming Soon</p>
              <p style={{ color: '#475569', fontSize: '11px', margin: '0 0 16px', lineHeight: '1.6' }}>
                {activeTool === 'video' ? 'Kling AI API integration in progress' : 'HeyGen API integration in progress'}
              </p>
              <a href={activeTool === 'video' ? 'https://klingai.com' : 'https://heygen.com'} target="_blank" rel="noopener noreferrer" style={{ background: '#334155', color: '#94a3b8', fontSize: '11px', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none' }}>
                Get API Key →
              </a>
            </div>
          )}

          {error && (
            <div style={{ background: '#450a0a', border: '1px solid #991b1b', color: '#fca5a5', fontSize: '11px', padding: '8px 12px', borderRadius: '8px', margin: '12px 0', lineHeight: '1.5' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || ((!image) && activeTool !== 'video' && activeTool !== 'ugc')}
            style={{
              width: '100%',
              marginTop: '12px',
              background: generating ? '#1e293b' : `linear-gradient(135deg, ${currentTool.color}, ${currentTool.color}cc)`,
              color: generating ? '#475569' : 'white',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              padding: '12px',
              borderRadius: '10px',
              cursor: generating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {generating && (
              <svg style={{ animation: 'spin 1s linear infinite', width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            )}
            {getButtonLabel()}
          </button>
          <p style={{ fontSize: '10px', color: '#475569', margin: '6px 0 0', textAlign: 'center' }}>{currentTool.cost} • {currentTool.desc}</p>
        </div>

        {/* RIGHT — Output */}
        <div style={{ padding: '16px', overflowY: 'auto' }}>
          <p style={{ fontSize: '10px', color: '#475569', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Output</p>

          {results.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 140px)', textAlign: 'center' }}>
              {generating ? (
                <>
                  <div style={{ width: '48px', height: '48px', border: `4px solid ${currentTool.color}30`, borderTopColor: currentTool.color, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                  <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600', margin: '0 0 6px' }}>Processing...</p>
                  <p style={{ color: '#475569', fontSize: '12px', margin: '0' }}>20-60 seconds</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.1 }}>{currentTool.label.split(' ')[0]}</div>
                  <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 4px' }}>Upload photo and click Generate</p>
                  <p style={{ color: '#334155', fontSize: '11px', margin: '0' }}>{currentTool.desc}</p>
                </>
              )}
            </div>
          ) : (
            <div>
              {results.map((img, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1e293b', marginBottom: '12px' }}
                  onMouseEnter={e => { (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '1' }}
                  onMouseLeave={e => { (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '0' }}
                >
                  <img src={img} alt={`result-${i}`} style={{ width: '100%', display: 'block' }} />
                  <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <button onClick={() => download(img, i)} style={{ background: 'white', color: '#0f172a', border: 'none', fontSize: '12px', fontWeight: '700', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>⬇ Download</button>
                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('AI fashion shoot: ' + img)}`, '_blank')} style={{ background: '#25d366', color: 'white', border: 'none', fontSize: '12px', fontWeight: '700', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>WhatsApp</button>
                  </div>
                </div>
              ))}
              <div style={{ background: '#0f2b1a', border: '1px solid #166534', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: '600' }}>✓ Ready for catalog!</span>
                <button onClick={handleGenerate} style={{ background: currentTool.color, color: 'white', border: 'none', fontSize: '11px', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Generate Again</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}