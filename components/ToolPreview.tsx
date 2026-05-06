import AnimateOnScroll from './AnimateOnScroll'
import Link from 'next/link'

export default function ToolPreview() {
  const tools = [
    {
      icon: '🎯',
      name: 'LeadRadar',
      tagline: 'Extract B2B Leads Instantly',
      color: '#374655',
      lightColor: '#f1f5f9',
      desc: 'Search any city, get thousands of business leads with phone numbers and emails in seconds.',
      mockup: [
        { label: 'Business Name', value: 'Sharma Textiles Pvt Ltd' },
        { label: 'Phone', value: '+91 98765 43210' },
        { label: 'Location', value: 'Jaipur, Rajasthan' },
        { label: 'Category', value: 'Textile Manufacturer' },
        { label: 'Rating', value: '⭐ 4.5 (120 reviews)' },
      ]
    },
    {
      icon: '📸',
      name: 'Vizora AI',
      tagline: 'AI Product Photos in Seconds',
      color: '#374655',
      lightColor: '#f1f5f9',
      desc: 'Upload your product photo and get professional model photos instantly with AI.',
      mockup: null,
      isPhoto: true
    },
    {
      icon: '💰',
      name: 'Pricing Builder',
      tagline: 'Build Your Custom Plan',
      color: '#374655',
      lightColor: '#f1f5f9',
      desc: 'Choose exactly the tools you need and see your price instantly. No hidden fees.',
      mockup: [
        { label: 'LeadRadar', value: '₹999/mo ✓' },
        { label: 'Vizora AI', value: '₹799/mo ✓' },
        { label: 'WhatsApp', value: '₹899/mo ✓' },
        { label: 'Monthly Credits', value: '1500 credits' },
        { label: 'Total', value: '₹2,697/mo' },
      ]
    },
  ]

  return (
    <>
      <style>{`
        .preview-section { background: #f8fafc; padding: 80px 48px; }
        .preview-container { max-width: 1200px; margin: 0 auto; }
        .preview-header { text-align: center; margin-bottom: 56px; }
        .preview-grid { display: flex; flex-direction: column; gap: 60px; }
        .preview-block { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .preview-block.reverse { direction: rtl; }
        .preview-block.reverse > * { direction: ltr; }
        .preview-text-side h3 { color: #1e293b; font-size: 28px; font-weight: 800; margin-bottom: 12px; }
        .preview-text-side p { color: #64748b; font-size: 15px; line-height: 1.7; margin-bottom: 24px; }
        .preview-icon-wrap { width: 56px; height: 56px; background: #374655; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 16px; }
        .preview-tag { background: #374655; color: white; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 16px; }
        .preview-cta { background: #374655; color: white; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; text-decoration: none; transition: all 0.2s; }
        .preview-cta:hover { background: #4a5a6a; transform: translateY(-2px); }
        .preview-mockup { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 8px 32px rgba(55,70,85,0.12); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
        .preview-mockup::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 40px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .mockup-dots { position: absolute; top: 13px; left: 16px; display: flex; gap: 6px; z-index: 1; }
        .mockup-dot { width: 12px; height: 12px; border-radius: 50%; }
        .mockup-content { margin-top: 48px; }
        .mockup-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .mockup-row:last-child { border-bottom: none; font-weight: 700; color: #374655; }
        .mockup-label { color: #64748b; font-size: 13px; }
        .mockup-value { color: #1e293b; font-size: 13px; font-weight: 600; }
        .mockup-title { color: #374655; font-size: 14px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .photo-mockup { background: #374655; border-radius: 16px; padding: 24px; text-align: center; margin-top: 48px; }
        .photo-before-after { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; }
        .photo-box { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; }
        .photo-box-icon { font-size: 36px; margin-bottom: 8px; }
        .photo-box-label { color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 600; }
        .photo-arrow { color: white; font-size: 24px; font-weight: 700; }
        .photo-result { background: rgba(255,255,255,0.15); border-radius: 12px; padding: 16px; margin-top: 16px; }
        .photo-result-label { color: rgba(255,255,255,0.7); font-size: 12px; margin-bottom: 8px; }
        .photo-poses { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
        .photo-pose { background: rgba(255,255,255,0.15); color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        @media (max-width: 768px) {
          .preview-section { padding: 60px 20px; }
          .preview-block { grid-template-columns: 1fr; gap: 32px; }
          .preview-block.reverse { direction: ltr; }
        }
      `}</style>

      <section className="preview-section">
        <div className="preview-container">
          <AnimateOnScroll direction="up">
            <div className="preview-header">
              <span style={{ background: '#374655', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' }}>See It In Action</span>
              <h2 style={{ color: '#1e293b', fontSize: '36px', fontWeight: '800', marginBottom: '12px' }}>How Our Tools Work</h2>
              <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' }}>See exactly what you get with each tool before you sign up.</p>
            </div>
          </AnimateOnScroll>

          <div className="preview-grid">
            {tools.map((tool, idx) => (
              <AnimateOnScroll key={tool.name} direction={idx % 2 === 0 ? 'left' : 'right'}>
                <div className={`preview-block ${idx % 2 !== 0 ? 'reverse' : ''}`}>
                  <div className="preview-text-side">
                    <div className="preview-icon-wrap">{tool.icon}</div>
                    <span className="preview-tag">{tool.name}</span>
                    <h3>{tool.tagline}</h3>
                    <p>{tool.desc}</p>
                    <Link href="/pricing" className="preview-cta">Add to My Plan →</Link>
                  </div>

                  <div className="preview-mockup">
                    <div className="mockup-dots">
                      <div className="mockup-dot" style={{ background: '#ff5f57' }} />
                      <div className="mockup-dot" style={{ background: '#febc2e' }} />
                      <div className="mockup-dot" style={{ background: '#28c840' }} />
                    </div>

                    {tool.isPhoto ? (
                      <div className="photo-mockup">
                        <div className="photo-before-after">
                          <div className="photo-box">
                            <div className="photo-box-icon">👕</div>
                            <div className="photo-box-label">Your Product</div>
                          </div>
                          <div className="photo-arrow">→</div>
                          <div className="photo-box">
                            <div className="photo-box-icon">📸</div>
                            <div className="photo-box-label">AI Photo</div>
                          </div>
                        </div>
                        <div className="photo-result">
                          <div className="photo-result-label">Available Poses</div>
                          <div className="photo-poses">
                            {['Front Standing', 'Side View', 'Close Up', 'Sitting', 'Walking', 'Editorial'].map(pose => (
                              <span key={pose} className="photo-pose">{pose}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mockup-content">
                        <div className="mockup-title">
                          <span>{tool.icon}</span>
                          <span>{tool.name} — Live Data</span>
                        </div>
                        {tool.mockup?.map((row, i) => (
                          <div key={i} className="mockup-row">
                            <span className="mockup-label">{row.label}</span>
                            <span className="mockup-value">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}