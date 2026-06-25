'use client'
import Link from 'next/link'

export default function UGCPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/vizora" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>← Vizora</Link>
        <span style={{ color: '#1e293b' }}>|</span>
        <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>UGC Ads Creator</span>
        <span style={{ background: '#d9770620', color: '#fbbf24', fontSize: '11px', padding: '2px 10px', borderRadius: '99px', border: '1px solid #d9770640' }}>₹45 per video</span>
      </div>
      <div style={{ maxWidth: '700px', margin: '80px auto', padding: '0 28px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎭</div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px' }}>UGC Ads Creator</h1>
        <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 32px', lineHeight: '1.6' }}>AI avatar speaks about your product in Hindi or English — creates viral UGC-style creator videos for Facebook and Instagram ads.</p>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#374151', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>APIs needed to activate</p>
          {[
            { name: 'HeyGen API', cost: '$4/min', url: 'https://heygen.com' },
            { name: 'ElevenLabs (Hindi voice)', cost: '$5/mo', url: 'https://elevenlabs.io' },
            { name: 'Anthropic Claude (script)', cost: '₹0.05/script', url: 'https://console.anthropic.com' },
          ].map((api) => (
            <div key={api.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{api.name}</span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{api.cost}</span>
                <a href={api.url} target="_blank" rel="noopener noreferrer" style={{ background: '#0f172a', color: 'white', fontSize: '11px', padding: '4px 12px', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}>Get API →</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
