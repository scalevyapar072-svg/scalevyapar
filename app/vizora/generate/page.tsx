'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'

const SHOOT_TYPES = {
  'Front Standing Shoot': `High-end studio fashion photoshoot, international premium female model height 6.2 feet, always a different unique model face, fair skin tone, model whose styling matches the dress pattern. Full front pose face and body toward camera, standing pose natural and realistic, natural body balance relaxed hands, soft genuine smile, subtle weight shift on legs for realism. Photorealistic human natural skin texture realistic lighting no CGI no mannequin feel. Kurta fits perfectly tailored and proportional, natural drape realistic fabric texture no distortion. Jewelry matching outfit style elegant coordinated complementary to neckline and yoke, matching footwear color-coordinated clean stylish no casual slippers. Upper body and yoke prominent, lock focus on yoke razor-sharp even when zoomed, show every embroidery thread handwork bead and stitch, no blur no shadows no dupatta covering yoke. 8K ultra-high resolution 85mm lens f8 f11 sharp studio focus. Print must match reference exactly same motif colors placement scale no redesign no recolor. Show dupatta only if in reference copy print exactly drape naturally not blocking yoke. Kurta length 45.5 inches from shoulder minimum hem flare 30 inches. Premium editorial lighting smooth shadows soft highlights no color shift natural proportions ultra-high clarity zoom-friendly mobile optimized vertical 1000x1500. Plain background matching outfit color soft editorial lighting.`,

  'One-Arm-Up Glamour Pose': `High-end studio fashion photoshoot, international premium female model height 6.2 feet, same background color as outfit, soft diffused lighting. One arm gracefully lifted above the head or slightly bent exactly matching reference hand position, other arm positioned naturally resting on hip or hanging down. Body angled slightly front or 45 degrees to enhance silhouette and create dynamic shape. Posture straight confident high-fashion. Head turned toward camera with soft bold editorial expression. Hair and dupatta complement the lifted-arm pose with natural flow. Pose realistic photorealistic editorial. Kurta perfectly fitted tailored proportional, natural drape realistic fabric movement, no distortion no fake folds. Neckline sleeves yoke ultra-clear embroidery details zoom-friendly. Indian-style jewelry matching outfit subtle premium, matching footwear coordinated with outfit realistic elegant high-end. Upper body and yoke clearly visible razor-sharp focus yoke even when zoomed, show every thread bead stitch, no blur shadows or dupatta covering yoke. 8K ultra-high-resolution 85mm lens f8 f11 studio-sharp focus. Print matches reference exactly same motif color placement scale. Dupatta only if in reference match print exactly natural drape not covering yoke. Kurta length 47 inches minimum hem flare 32 inches. Premium soft studio lighting smooth shadows clean highlights sharp clarity crisp detailing ultra-high-resolution zoom-friendly mobile-optimized minimal luxury high-end studio editorial aesthetic vertical 1000x1500.`,

  'Neckline Extreme Close-Up': `High-end studio fashion photoshoot, same background color and tone as front pose shoot, soft diffused lighting. Frame only neckline area upper chest and yoke. Focus strictly on fine detailing stitching embroidery fabric weave buttons piping borders patterns. Camera very close to neckline for maximum clarity. Minimal or no face visible neckline and yoke are primary focus. Neckline yoke and upper chest perfectly fitted no distortion no fake folds. Every embroidery thread bead stitch and fabric weave must be fully visible. Ultra-clear yoke and embroidery details zoom-friendly. Jewelry only if present in reference should complement neckline without obstructing yoke or embroidery realistic elegant high-end. Upper body and yoke fully visible razor-sharp focus on all neckline embroidery and detailing no blur shadows or obstruction. 8K ultra-high-resolution 85mm lens f8 f11 studio-sharp focus. Neckline embroidery prints and fabric match reference exactly no recoloring motif change or distortion. Premium soft studio lighting for texture and depth smooth shadows clean highlights ultra-high-resolution zoom-friendly mobile-optimized minimal luxury high-end fashion editorial aesthetic vertical 1000x1500.`,

  'Sitting on Stool Pose': `High-end studio fashion photoshoot, plain background as per dress colour, soft diffused lighting. Model seated gracefully on simple modern stool, smiling. Back straight posture elegant and confident. One leg slightly forward and other relaxed or both feet placed neatly on floor. Hands posed naturally resting on lap holding edge of stool or softly posed beside body. Body facing front or slightly angled 45 degrees depending on editorial mood. Head aligned naturally calm confident expression. Highlight garment drape over seated pose especially bottom fall and fabric flow. Clear focus on neckline sleeves and torso fit. Premium editorial lighting smooth shadows clean highlights. Ultra-high resolution crisp sharp garment detailing. Minimal luxurious high-end studio aesthetic. Print matches reference exactly same motif colors placement scale. Realistic photorealistic human model fair skin no mannequin no CGI. Indian jewelry matching outfit matching footwear. 8K ultra-high resolution vertical 1000x1500.`,

  'Over-the-Shoulder Left Pose': `High-end studio fashion photoshoot, same background color and tone as front pose shoot, soft diffused lighting. Model standing with back slightly turned to camera facing toward left side with smile. Look back over left shoulder giving soft elegant glance toward camera. Left side of body and shoulder more visible while back and part of right side remain partially shown. Hands positioned naturally down lightly posed or one hand on waist matching hand design in reference. Pose conveys confidence grace editorial elegance, realistic photorealistic editorial. Kurta perfectly fitted tailored proportional, natural drape realistic fabric movement across back shoulder and side, no distortion no fake folds, all embroidery handwork details fully intact. Neckline back drape shoulder detailing and side silhouette fully visible. Ultra-clear yoke and embroidery details zoom-friendly. Indian-style jewelry matching outfit subtle premium, matching footwear coordinated realistic elegant high-end. Upper body and yoke area clearly visible from this angle, lock focus on yoke razor-sharp even when zoomed, show every thread bead stitch embroidery detail clearly, no blur shadows or dupatta covering yoke. 8K ultra-high-resolution 85mm lens f8 f11. Print matches reference exactly. Dupatta only if in reference. Kurta length 47 inches minimum hem flare 32 inches. Premium soft studio lighting smooth shadows clean highlights ultra-high-resolution zoom-friendly mobile-optimized luxury editorial vertical 1000x1500.`,

  'Close-Up Hand Editorial': `High-end studio close-up fashion editorial shot of model hand and sleeve border. Tight crop focused only on hand wrist and sleeve border. Hand placed gently across waist or resting softly on thigh. Fingers relaxed elegant couture pose. Sleeve border perfectly visible sharply in focus. Clearly showcase fabric texture embroidery details at hem highlight fabric weave and stitch clarity natural fabric folds visible for realism. Soft directional studio lighting subtle shadow under hand for depth slight glow on embroidery for luxury shine. Nude or pastel manicure optional minimal ring for elegance no heavy jewelry. Clean skin tones beauty editorial finish. Minimal off-white or soft dress-colour seamless studio background. Ultra-high-resolution macro fashion photography luxury product catalog Vogue-style editorial detailing sharp focus soft depth falloff. Match fabric colors and embroidery exactly from reference. Photorealistic no CGI 8K quality.`,

  'Fabric Texture Macro Shot': `High-end studio fashion macro photoshoot, plain background same as dress colour, soft diffused lighting. Macro close-up of fabric texture extremely close framing showing only fabric surface. Highlight weave patterns threads fibers embroidery or print details. Show depth softness and material quality with clarity. No model visible only the garment fabric. Shallow depth of field for premium macro effect. Lighting enhances texture without creating harsh shadows. Match fabric texture colors and pattern exactly from reference same motif same print same colors. Ultra-high resolution crisp detailed editorial-quality macro photography. 8K zoom-friendly luxury fashion catalog aesthetic.`,

  'Stitch Detailing Close-Up': `High-end studio macro photoshoot, plain background same as dress colour, soft diffused lighting. Extreme close-up of stitching details, frame only stitching lines seams hemming or thread work. Show fine thread texture needle marks seam finishing and craftsmanship. Highlight precision of stitches with ultra-sharp clarity. No model visible only the garment stitching. Shallow depth of field to emphasize stitch line. Lighting gently enhances texture and thread depth without harsh shadows. Match fabric color and material exactly from reference. Ultra-high resolution crisp macro detailing luxury studio finish. 8K zoom-friendly Vogue-style editorial quality.`,
}

export default function GeneratePage() {
  const [image, setImage] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState('')
  const [shootType, setShootType] = useState('Front Standing Shoot')
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
      const basePrompt = SHOOT_TYPES[shootType as keyof typeof SHOOT_TYPES]
      const fullPrompt = `${basePrompt} ${extra}`.trim()

      const res = await fetch('/api/vizora/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, prompt: fullPrompt, numImages: 1 }),
      })
      const data = await res.json()
      if (data.images) setResults(Array.isArray(data.images) ? data.images : Object.values(data.images))
      else setError(data.error || 'Generation failed — check REPLICATE_API_TOKEN in Vercel settings')
    } catch {
      setError('Network error')
    } finally {
      setGenerating(false)
    }
  }

  const download = (url: string, i: number) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `vizora-${shootType.replace(/ /g, '-')}-${i + 1}.png`
    a.click()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Navbar */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/vizora" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Vizora</Link>
        <span style={{ color: '#1e293b' }}>|</span>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>AI Photo Generator</span>
        <span style={{ background: '#7c3aed20', color: '#a78bfa', fontSize: '11px', padding: '2px 10px', borderRadius: '99px', border: '1px solid #7c3aed40' }}>8 Shoot Types</span>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '22px' }}>

          {/* LEFT */}
          <div>
            {/* Upload */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Product Photo</p>
              {image ? (
                <div style={{ position: 'relative' }}>
                  <img src={image} alt="upload" style={{ width: '100%', borderRadius: '10px', maxHeight: '260px', objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => setImage(null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', fontSize: '11px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>Change</button>
                </div>
              ) : (
                <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? '#7c3aed' : '#e2e8f0'}`, background: isDragActive ? '#ede9fe15' : '#f8fafc', borderRadius: '12px', padding: '36px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input {...getInputProps()} />
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>🖼️</div>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 4px', fontWeight: '500' }}>{isDragActive ? 'Drop here!' : 'Drag & drop or click to upload'}</p>
                  <p style={{ color: '#94a3b8', fontSize: '11px', margin: '0' }}>JPG, PNG, WEBP — Max 10MB</p>
                </div>
              )}
            </div>

            {/* Shoot Type */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Shoot Type</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.keys(SHOOT_TYPES).map((type) => (
                  <button
                    key={type}
                    onClick={() => setShootType(type)}
                    style={{
                      padding: '10px 14px',
                      border: `2px solid ${shootType === type ? '#7c3aed' : '#e2e8f0'}`,
                      background: shootType === type ? '#ede9fe' : 'white',
                      color: shootType === type ? '#7c3aed' : '#374151',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: shootType === type ? '600' : '400',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '12px', color: '#374151', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Extra details (optional)</label>
                <textarea
                  value={extra}
                  onChange={e => setExtra(e.target.value)}
                  placeholder="e.g. dupatta in pink, gold zari border, mirror work..."
                  style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '13px', padding: '9px 12px', borderRadius: '8px', outline: 'none', height: '70px', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
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
                  Generating... please wait 60 sec
                </>
              ) : (
                <>📸 Generate — {shootType}</>
              )}
            </button>
          </div>

          {/* RIGHT — Output */}
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px', minHeight: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>Generated Photo — {shootType}</p>
              {results.length > 0 && (
                <span style={{ fontSize: '12px', color: '#64748b' }}>Hover to download</span>
              )}
            </div>

            {results.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '460px', textAlign: 'center' }}>
                {generating ? (
                  <>
                    <div style={{ width: '56px', height: '56px', border: '4px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '18px' }}></div>
                    <p style={{ color: '#374151', fontSize: '16px', fontWeight: '600', margin: '0 0 8px' }}>AI is generating your {shootType}...</p>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0' }}>Usually takes 30–90 seconds</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '52px', marginBottom: '14px', opacity: 0.15 }}>📸</div>
                    <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500', margin: '0 0 6px' }}>Select shoot type → Upload photo → Generate</p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0' }}>8 professional shoot types available</p>
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
                    <img src={img} alt={`result-${i}`} style={{ width: '100%', display: 'block' }} />
                    <div className="ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button onClick={() => download(img, i)} style={{ background: 'white', color: '#0f172a', border: 'none', fontSize: '12px', fontWeight: '700', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>
                        ⬇ Download
                      </button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Check this AI photo: ' + img)}`, '_blank')} style={{ background: '#25d366', color: 'white', border: 'none', fontSize: '12px', fontWeight: '700', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>
                        WhatsApp
                      </button>
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