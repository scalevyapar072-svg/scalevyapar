'use client'
import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'

export default function EraserPage() {
  const [image, setImage] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'remove-bg' | 'object-erase'>('remove-bg')

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

  const removeBg = async () => {
    if (!image) { setError('Upload an image first'); return }
    setRemoving(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/vizora/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      const data = await res.json()
      if (data.image) setResult(data.image)
      else setError(data.error || 'Background removal failed — add REMOVEBG_API_KEY to .env.local')
    } catch {
      setError('Network error')
    } finally {
      setRemoving(false)
    }
  }

  const download = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = 'vizora-no-bg.png'
    a.click()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/vizora" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Vizora</Link>
        <span style={{ color: '#1e293b' }}>|</span>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Magic Eraser</span>
        <span style={{ background: '#05996020', color: '#34d399', fontSize: '11px', padding: '2px 10px', borderRadius: '99px', border: '1px solid #05996040' }}>₹1.5 per erase</span>
      </div>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 28px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { key: 'remove-bg', label: '🗑 Remove Background', desc: 'One click — remove entire background' },
            { key: 'object-erase', label: '✏ Object Eraser', desc: 'Paint over objects to erase them' },
          ].map((m) => (
            <button key={m.key} onClick={() => setMode(m.key as any)} style={{ flex: 1, padding: '14px', border: `2px solid ${mode === m.key ? '#059669' : '#e2e8f0'}`, background: mode === m.key ? '#f0fdf4' : 'white', color: mode === m.key ? '#059669' : '#64748b', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', textAlign: 'left' }}>
              {m.label}<br/>
              <span style={{ fontSize: '11px', fontWeight: '400', opacity: 0.7 }}>{m.desc}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Original Image</p>
            {image ? (
              <div style={{ position: 'relative' }}>
                <img src={image} alt="original" style={{ width: '100%', borderRadius: '10px', display: 'block' }} />
                <button onClick={() => { setImage(null); setResult(null) }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>Change</button>
              </div>
            ) : (
              <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? '#059669' : '#e2e8f0'}`, background: '#f8fafc', borderRadius: '12px', padding: '48px 20px', textAlign: 'center', cursor: 'pointer' }}>
                <input {...getInputProps()} />
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>✨</div>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 4px', fontWeight: '500' }}>{isDragActive ? 'Drop here!' : 'Upload your product photo'}</p>
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0' }}>JPG, PNG, WEBP</p>
              </div>
            )}
            {image && (
              <button onClick={removeBg} disabled={removing} style={{ width: '100%', marginTop: '14px', background: removing ? '#e2e8f0' : 'linear-gradient(135deg,#059669,#047857)', color: removing ? '#94a3b8' : 'white', border: 'none', fontSize: '14px', fontWeight: '700', padding: '13px', borderRadius: '10px', cursor: removing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {removing ? <><svg style={{ animation: 'spin 1s linear infinite', width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>Removing...</> : '✨ Remove Background — ₹2'}
              </button>
            )}
            {error && <div style={{ marginTop: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', padding: '10px', borderRadius: '8px' }}>{error}</div>}
          </div>

          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Result</p>
              {result && <button onClick={download} style={{ background: '#059669', color: 'white', border: 'none', fontSize: '12px', fontWeight: '600', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer' }}>⬇ Download PNG</button>}
            </div>
            {result ? (
              <div>
                <div style={{ background: 'repeating-conic-gradient(#e2e8f0 0% 25%, white 0% 50%) 0 0 / 20px 20px', borderRadius: '10px', padding: '8px' }}>
                  <img src={result} alt="result" style={{ width: '100%', borderRadius: '6px', display: 'block' }} />
                </div>
                <div style={{ marginTop: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#166534', fontWeight: '600' }}>✓ Background removed!</span>
                  <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Check this: ' + result)}`, '_blank')} style={{ background: '#25d366', color: 'white', border: 'none', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>WhatsApp</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '360px', textAlign: 'center' }}>
                {removing ? (
                  <><div style={{ width: '48px', height: '48px', border: '4px solid #dcfce7', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '14px' }}></div><p style={{ color: '#374151', fontSize: '14px', fontWeight: '600', margin: '0' }}>Removing background...</p></>
                ) : (
                  <><div style={{ fontSize: '48px', marginBottom: '14px', opacity: 0.15 }}>✨</div><p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', margin: '0 0 6px' }}>Upload image and click Remove Background</p><p style={{ color: '#94a3b8', fontSize: '12px', margin: '0' }}>Transparent PNG will appear here</p></>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
