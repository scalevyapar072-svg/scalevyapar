'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'

const SHOOT_TYPES = [
  { id: 'front', label: '📸 Front Standing', desc: 'Full body front pose, editorial lighting' },
  { id: 'onearm', label: '💃 One-Arm-Up Glamour', desc: 'Glamour pose with arm raised' },
  { id: 'neckline', label: '🔍 Neckline Close-Up', desc: 'Extreme close-up of yoke & embroidery' },
  { id: 'sitting-stool', label: '🪑 Sitting on Stool', desc: 'Elegant seated pose on stool' },
  { id: 'sitting-portrait', label: '🖼 Sitting Portrait', desc: 'Close-up seated portrait' },
  { id: 'reclining', label: '🛋 Reclining on Sofa', desc: 'Luxury reclining editorial pose' },
  { id: 'shoulder', label: '↩ Over-the-Shoulder', desc: 'Back turned, glancing at camera' },
  { id: 'hand', label: '✋ Hand Editorial', desc: 'Close-up of sleeve & hand details' },
  { id: 'fabric', label: '🧵 Fabric Macro', desc: 'Extreme macro of fabric texture' },
  { id: 'stitch', label: '🪡 Stitch Detail', desc: 'Ultra close-up of stitching craft' },
  { id: 'walking', label: '🚶 Walking Natural', desc: 'Natural walking movement pose' },
  { id: 'back', label: '🔄 Back Pose', desc: 'Full back view of garment' },
]

export default function GeneratePage() {
  const [image, setImage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState('')
  const [shootType, setShootType] = useState('front')
  const [extra, setExtra] = useState('')

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
      const res = await fetch('/api/vizora/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, shootType, extra }),
      })
      const data = await res.json()
      if (data.images) setResults(Array.isArray(data.images) ? data.images : [data.images])
      else setError(data.error || 'Generation failed')
    } catch {
      setError('Network error — try again')
    } finally {
      setGenerating(false)
    }
  }

  const download = (url: string, i: number) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `vizora-${shootType}-${i + 1}.png`
    a.click()
  }

  const selectedShoot = SHOOT_TYPES.find(s => s.id === shootType)

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/vizora" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Vizora</Link>
        <span style={{ color: '#1e293b' }}>|</span>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>AI Photo Generator</span>
        <span style={{ background: '#7c3aed20', color: '#a78bfa', fontSize: '11px', padding: '2px 10px', borderRadius: '99px', border: '1px solid #7c3aed40' }}>Powered by FASHN.ai • Exact Dress</span>
        <span style={{ background: '#05996020', color: '#34d399', fontSize: '11px', padding: '2px 10px', borderRadius: '99px', border: '1px solid #05996040' }}>₹6 per image</span>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px' }}>

          {/* LEFT */}
          <div>
            {/* Upload */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px', marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Product / Mannequin Photo</p>
              {image ? (
                <div style={{ position: 'relative' }}>
                  <img src={image} alt="upload" style={{ width: '100%', borderRadius: '10px', maxHeight: '240px', objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => { setImage(null); setResults([]) }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>Change</button>
                </div>
              ) : (
                <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? '#7c3aed' : '#e2e8f0'}`, background: isDragActive ? '#ede9fe15' : '#f8fafc', borderRadius: '12px', padding: '32px 20px', textAlign: 'center', cursor: 'pointer' }}>
                  <input {...getInputProps()} />
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 4px', fontWeight: '500' }}>{isDragActive ? 'Drop here!' : 'Upload mannequin or flat-lay photo'}</p>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0' }}>JPG, PNG, WEBP — Max 10MB</p>
                </div>
              )}
            </div>

            {/* Shoot Types */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px', marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Shoot Type ({SHOOT_TYPES.length} poses)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {SHOOT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setShootType(type.id)}
                    title={type.desc}
                    style={{
                      padding: '8px 10px',
                      border: `2px solid ${shootType === type.id ? '#7c3aed' : '#e2e8f0'}`,
                      background: shootType === type.id ? '#ede9fe' : 'white',
                      color: shootType === type.id ? '#7c3aed' : '#374151',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: shootType === type.id ? '600' : '400',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      lineHeight: '1.3',
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {selectedShoot && (
                <p style={{ fontSize: '11px', color: '#64748b', margin: '10px 0 0', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                  {selectedShoot.desc}
                </p>
              )}
            </div>

            {/* Extra details */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px', marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700', display: 'block', marginBottom: '8px' }}>Extra details (optional)</label>
              <textarea
                value={extra}
                onChange={e => setExtra(e.target.value)}
                placeholder="e.g. dupatta in pink, gold zari border, white background, fair skin Indian model..."
                style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '12px', padding: '9px 12px', borderRadius: '8px', outline: 'none', height: '70px', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', lineHeight: '1.5' }}>
                {error}
              </div>
            )}

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
              }}
            >
              {generating ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Generating exact dress shoot... 30-60 sec
                </>
              ) : (
                <>📸 Generate — {selectedShoot?.label}</>
              )}
            </button>

            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '8px 0 0', textAlign: 'center' }}>
              Powered by FASHN.ai • Exact same print & colors • ₹6 per image
            </p>
          </div>

          {/* RIGHT */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', minHeight: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>
                Generated Photo — {selectedShoot?.label}
              </p>
              {results.length > 0 && (
                <span style={{ fontSize: '12px', color: '#64748b' }}>Hover to download / share</span>
              )}
            </div>

            {results.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '460px', textAlign: 'center' }}>
                {generating ? (
                  <>
                    <div style={{ width: '56px', height: '56px', border: '4px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '18px' }}></div>
                    <p style={{ color: '#374151', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>Generating your exact dress shoot...</p>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 4px' }}>FASHN.ai is placing your garment on a real model</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0' }}>Usually takes 20–40 seconds</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '52px', marginBottom: '14px', opacity: 0.15 }}>📸</div>
                    <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500', margin: '0 0 8px' }}>Upload mannequin photo → Select pose → Generate</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 16px' }}>FASHN.ai puts your exact dress on a real human model</p>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 18px', maxWidth: '320px' }}>
                      <p style={{ fontSize: '12px', color: '#166534', margin: '0', lineHeight: '1.6' }}>
                        ✓ Same exact print & colors<br />
                        ✓ Same dupatta & embroidery<br />
                        ✓ Real human model — Indian & international<br />
                        ✓ 12 professional pose types
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
                    style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}
                    onMouseEnter={e => { (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '1' }}
                    onMouseLeave={e => { (e.currentTarget.querySelector('.ov') as HTMLElement).style.opacity = '0' }}
                  >
                    <img src={img} alt={`result-${i}`} style={{ width: '100%', display: 'block', borderRadius: '12px' }} />
                    <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', borderRadius: '12px' }}>
                      <button onClick={() => download(img, i)} style={{ background: 'white', color: '#0f172a', border: 'none', fontSize: '13px', fontWeight: '700', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer' }}>
                        ⬇ Download
                      </button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Check this AI fashion shoot: ' + img)}`, '_blank')} style={{ background: '#25d366', color: 'white', border: 'none', fontSize: '13px', fontWeight: '700', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer' }}>
                        WhatsApp
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: '600' }}>✓ Exact dress on real model — ready for catalog!</span>
                  <button onClick={generate} style={{ background: '#7c3aed', color: 'white', border: 'none', fontSize: '11px', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                    Generate Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}