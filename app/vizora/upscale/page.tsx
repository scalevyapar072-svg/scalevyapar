'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'

export default function UpscalePage() {
  const [image, setImage] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [upscaling, setUpscaling] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [scale, setScale] = useState(4)

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

  const upscale = async () => {
    const src = image || imageUrl
    if (!src) { setError('Please upload an image first'); return }
    setUpscaling(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/vizora/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: src, scale }),
      })
      const data = await res.json()
      if (data.upscaledUrl) setResult(data.upscaledUrl)
      else setError(data.error || 'Upscaling failed — check REPLICATE_API_TOKEN in .env.local')
    } catch {
      setError('Network error — is npm run dev running?')
    } finally {
      setUpscaling(false)
    }
  }

  const download = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `vizora-upscaled-${scale}x.png`
    a.click()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/vizora" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Vizora</Link>
        <span style={{ color: '#1e293b' }}>|</span>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Photo Upscaler 4x</span>
        <span style={{ background: '#0284c720', color: '#38bdf8', fontSize: '11px', padding: '2px 10px', borderRadius: '99px', border: '1px solid #0284c740' }}>₹0.02 per image</span>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '22px' }}>

          <div>
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Upload Image</p>
              {image ? (
                <div style={{ position: 'relative' }}>
                  <img src={image} alt="upload" style={{ width: '100%', borderRadius: '10px', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => setImage(null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>Change</button>
                </div>
              ) : (
                <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? '#0284c7' : '#e2e8f0'}`, background: '#f8fafc', borderRadius: '12px', padding: '32px 20px', textAlign: 'center', cursor: 'pointer' }}>
                  <input {...getInputProps()} />
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 4px', fontWeight: '500' }}>{isDragActive ? 'Drop here!' : 'Drag & drop or click to upload'}</p>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0' }}>JPG, PNG, WEBP</p>
                </div>
              )}
            </div>

            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Upscale Settings</p>
              <label style={{ fontSize: '12px', color: '#374151', fontWeight: '600', display: 'block', marginBottom: '10px' }}>Scale factor: {scale}x (output: ~{scale * 512}px)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[2, 4, 6, 8].map((s) => (
                  <button key={s} onClick={() => setScale(s)} style={{ flex: 1, padding: '10px', border: `2px solid ${scale === s ? '#0284c7' : '#e2e8f0'}`, background: scale === s ? '#e0f2fe' : 'white', color: scale === s ? '#0284c7' : '#64748b', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
                    {s}x
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 12px' }}>
                <p style={{ fontSize: '12px', color: '#0284c7', margin: '0', lineHeight: '1.6' }}>
                  {scale}x upscale → perfect for {scale <= 2 ? 'WhatsApp and Instagram' : scale <= 4 ? 'Myntra and Flipkart listings' : 'print catalogs and banners'}
                </p>
              </div>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px' }}>{error}</div>}

            <button onClick={upscale} disabled={upscaling || !image} style={{ width: '100%', background: upscaling || !image ? '#e2e8f0' : 'linear-gradient(135deg,#0284c7,#0369a1)', color: upscaling || !image ? '#94a3b8' : 'white', border: 'none', fontSize: '14px', fontWeight: '700', padding: '14px', borderRadius: '12px', cursor: upscaling || !image ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {upscaling ? (
                <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Upscaling...</>
              ) : <>🔍 Upscale {scale}x — ₹{(0.02 * 83).toFixed(0)}</>}
            </button>
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', minHeight: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Upscaled Result</p>
              {result && <button onClick={download} style={{ background: '#0284c7', color: 'white', border: 'none', fontSize: '12px', fontWeight: '600', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}>⬇ Download</button>}
            </div>
            {result ? (
              <div>
                <img src={result} alt="upscaled" style={{ width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>✓ Upscaled {scale}x — print ready!</span>
                  <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Check this upscaled photo: ' + result)}`, '_blank')} style={{ background: '#25d366', color: 'white', border: 'none', fontSize: '12px', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>WhatsApp</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '380px', textAlign: 'center' }}>
                {upscaling ? (
                  <><div style={{ width: '52px', height: '52px', border: '4px solid #e0f2fe', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div><p style={{ color: '#374151', fontSize: '15px', fontWeight: '600', margin: '0 0 6px' }}>Upscaling your image...</p><p style={{ color: '#94a3b8', fontSize: '13px' }}>Takes 20–40 seconds</p></>
                ) : (
                  <><div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.15 }}>🔍</div><p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', margin: '0 0 6px' }}>Upload an image and click Upscale</p><p style={{ color: '#94a3b8', fontSize: '12px' }}>Your high-resolution photo will appear here</p></>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
