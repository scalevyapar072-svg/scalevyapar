'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'

const OPTIONS = {
  modelType: ['Female model — Indian', 'Male model — Indian', 'No model (flat lay)', 'Remove mannequin'],
  background: ['Pure white studio', 'Studio grey', 'Outdoor garden', 'Luxury interior', 'Pastel color'],
  style: ['Editorial fashion', 'Catalog simple', 'Instagram lifestyle', 'Myntra style', 'Export catalog'],
  pose: ['Standing front', 'Standing side', 'Walking natural', 'Sitting relaxed', 'Detail close-up'],
}

export default function GeneratePage() {
  const [image, setImage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState('')
  const [settings, setSettings] = useState({
    modelType: OPTIONS.modelType[0],
    background: OPTIONS.background[0],
    style: OPTIONS.style[0],
    pose: OPTIONS.pose[0],
    extra: '',
    count: 2,
  })

  const onDrop = useCallback((files: File[]) => {
    const reader = new FileReader()
    reader.onload = (e) => setImage(e.target?.result as string)
    reader.readAsDataURL(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  const generate = async () => {
    if (!image) { setError('Please upload a product image first'); return }
    setGenerating(true)
    setError('')
    setResults([])
    try {
      const prompt = `Front-pose standing studio fashion photoshoot, international premium female model height 6.2 feet, fair skin tone, different unique face, full front pose facing camera, natural realistic standing pose, relaxed hands, soft genuine smile, subtle weight shift for realism. Wearing exact same garment from reference image — pink floral block print kurta set with dupatta, exact same fabric texture, print motif colors placement and scale, no redesign or recolor, kurta fits perfectly tailored and proportional, natural fabric drape realistic texture no distortion. Yoke area razor sharp in focus showing every embroidery thread and detail, upper body prominent, dupatta draped naturally not covering yoke. Matching ethnic jewelry coordinated with outfit neckline, matching footwear color coordinated clean stylish. Plain background matching outfit color soft editorial lighting, 85mm lens f8 f11 sharp studio focus, 8K ultra high resolution photorealistic human skin texture natural lighting no CGI no mannequin feel, premium editorial lighting smooth shadows soft highlights no color shift natural proportions zoom friendly mobile optimized vertical 1000x1500. ${settings.extra}`
      const res = await fetch('/api/vizora/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, prompt, numImages: settings.count }),
      })
      const data = await res.json()
      if (data.images) setResults(Array.isArray(data.images) ? data.images : Object.values(data.images))
      else setError(data.error || 'Generation failed — check REPLICATE_API_TOKEN in .env.local')
    } catch {
      setError('Network error — is npm run dev running?')
    } finally {
      setGenerating(false)
    }
  }

  const download = (url: string, i: number) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `vizora-${i + 1}.png`
    a.click()
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0',
    color: '#0f172a', fontSize: '13px', padding: '9px 12px',
    borderRadius: '8px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Navbar */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/vizora" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Vizora</Link>
        <span style={{ color: '#1e293b' }}>|</span>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>AI Photo Generator</span>
        <span style={{ background: '#7c3aed20', color: '#a78bfa', fontSize: '11px', padding: '2px 10px', borderRadius: '99px', border: '1px solid #7c3aed40' }}>₹0.25 per image</span>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '22px' }}>

          {/* LEFT — Upload + Settings */}
          <div>
            {/* Upload */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Product Photo</p>
              {image ? (
                <div style={{ position: 'relative' }}>
                  <img src={image} alt="upload" style={{ width: '100%', borderRadius: '10px', maxHeight: '260px', objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => setImage(null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                    Change
                  </button>
                </div>
              ) : (
                <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? '#7c3aed' : '#e2e8f0'}`, background: isDragActive ? '#ede9fe15' : '#f8fafc', borderRadius: '12px', padding: '36px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input {...getInputProps()} />
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>🖼️</div>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 4px', fontWeight: '500' }}>
                    {isDragActive ? 'Drop here!' : 'Drag & drop or click to upload'}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0' }}>JPG, PNG, WEBP — Max 10MB</p>
                </div>
              )}
            </div>

            {/* Settings */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Settings</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(Object.keys(OPTIONS) as Array<keyof typeof OPTIONS>).map((key) => (
                  <div key={key}>
                    <label style={{ fontSize: '12px', color: '#374151', fontWeight: '600', display: 'block', marginBottom: '6px', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <select
                      value={(settings as any)[key]}
                      onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))}
                      style={{ ...inp, cursor: 'pointer' }}
                    >
                      {OPTIONS[key].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: '12px', color: '#374151', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                    Number of images: {settings.count}
                  </label>
                  <input
                    type="range" min={1} max={4} value={settings.count}
                    onChange={e => setSettings(p => ({ ...p, count: parseInt(e.target.value) }))}
                    style={{ width: '100%', accentColor: '#7c3aed' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    <span>1</span><span>2</span><span>3</span><span>4</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#374151', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Extra details (optional)</label>
                  <textarea
                    value={settings.extra}
                    onChange={e => setSettings(p => ({ ...p, extra: e.target.value }))}
                    placeholder="e.g. dupatta draped, gold jewelry, ethnic necklace..."
                    style={{ ...inp, height: '76px', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5' } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', lineHeight: '1.5' }}>
                {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={generating || !image}
              style={{
                width: '100%',
                background: generating || !image ? '#e2e8f0' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                color: generating || !image ? '#94a3b8' : 'white',
                border: 'none', fontSize: '14px', fontWeight: '700',
                padding: '14px', borderRadius: '12px',
                cursor: generating || !image ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              {generating ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Generating... please wait
                </>
              ) : (
                <>🖼️ Generate {settings.count} Photos — ₹{(settings.count * 0.25 * 83).toFixed(0)}</>
              )}
            </button>
          </div>

          {/* RIGHT — Output */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', minHeight: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Generated Photos</p>
              {results.length > 0 && (
                <span style={{ fontSize: '12px', color: '#64748b' }}>{results.length} photos ready — hover to download</span>
              )}
            </div>

            {results.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '460px', textAlign: 'center' }}>
                {generating ? (
                  <>
                    <div style={{ width: '56px', height: '56px', border: '4px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '18px' }}></div>
                    <p style={{ color: '#374151', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>AI is generating your photos...</p>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0' }}>Usually takes 30–60 seconds</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '52px', marginBottom: '14px', opacity: 0.15 }}>🖼️</div>
                    <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500', margin: '0 0 6px' }}>Upload a product photo and click Generate</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0' }}>Your AI studio photos will appear here</p>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }}>
                {results.map((img, i) => (
                  <div
                    key={i}
                    style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}
                    onMouseEnter={e => { (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '1' }}
                    onMouseLeave={e => { (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '0' }}
                  >
                    <img src={img} alt={`result-${i}`} style={{ width: '100%', display: 'block' }} />
                    <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button onClick={() => download(img, i)} style={{ background: 'white', color: '#0f172a', border: 'none', fontSize: '12px', fontWeight: '700', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>
                        ⬇ Download
                      </button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Check this AI photo: ' + img)}`, '_blank')} style={{ background: '#25d366', color: 'white', border: 'none', fontSize: '12px', fontWeight: '700', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>
                        WhatsApp
                      </button>
                    </div>
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: '600' }}>
                      #{i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
