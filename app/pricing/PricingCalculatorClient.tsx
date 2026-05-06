'use client'

import { useState } from 'react'

const tools = [
  { icon: '🎯', name: 'LeadRadar', desc: 'Extract B2B leads from Google Maps', detail: 'Search businesses by location and category. Every search costs 100 credits.', credits: 100, unit: 'per search', monthly: 999 },
  { icon: '📸', name: 'Vizora AI Photos', desc: 'Generate professional AI product photos', detail: 'Create stunning product photos instantly with AI. Every photo costs 100 credits.', credits: 100, unit: 'per photo', monthly: 799 },
  { icon: '🌐', name: 'Website Builder', desc: 'Professional website for your business', detail: 'One time setup fee to build your website. Modifications use your monthly credits.', credits: 100, unit: 'per modification', monthly: 1999, oneTime: 4999 },
  { icon: '📞', name: 'CRM & Call Management', desc: 'Track calls and manage your leads', detail: 'Manage all your customer calls and follow-ups. Every session costs 100 credits.', credits: 100, unit: 'per session', monthly: 699 },
  { icon: '💬', name: 'WhatsApp Automation', desc: 'Automate your WhatsApp marketing', detail: 'Send bulk messages and set up chatbots. Every session costs 100 credits.', credits: 100, unit: 'per session', monthly: 899 },
  { icon: '📦', name: 'Inventory Management', desc: 'Track stock and manage production', detail: 'Monitor your inventory in real time. Every session costs 100 credits.', credits: 100, unit: 'per session', monthly: 599 },
]

const creditPacks = [
  { credits: 100, price: 99, label: 'Starter Pack' },
  { credits: 500, price: 399, label: 'Growth Pack', popular: true },
  { credits: 1000, price: 699, label: 'Pro Pack' },
  { credits: 5000, price: 2999, label: 'Enterprise Pack' },
]

export default function PricingCalculator() {
  const [selected, setSelected] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'plan' | 'credits'>('plan')

  const toggle = (name: string) => {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    )
  }

  const selectedTools = tools.filter(t => selected.includes(t.name))
  const monthlyTotal = selectedTools.reduce((sum, t) => sum + t.monthly, 0)
  const oneTimeTotal = selectedTools.filter((t): t is typeof t & { oneTime: number } => !!t.oneTime).reduce((sum, t) => sum + t.oneTime, 0)
  const totalCredits = selectedTools.length * 500

  const whatsappMessage = selectedTools.length > 0
    ? `Hi! I want to subscribe to ScaleVyapar with these tools: ${selectedTools.map(t => t.name).join(', ')}. Monthly total: ₹${monthlyTotal.toLocaleString()}${oneTimeTotal > 0 ? `. One time setup: ₹${oneTimeTotal.toLocaleString()}` : ''}. Monthly credits: ${totalCredits}.`
    : 'Hi! I want to know more about ScaleVyapar pricing.'

  return (
    <>
      <style>{`
        .tab-bar { display: flex; background: #f1f5f9; border-radius: 12px; padding: 4px; margin-bottom: 32px; }
        .tab-btn { flex: 1; padding: 12px; border: none; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s; background: transparent; color: #64748b; }
        .tab-btn.active { background: #374655; color: white; }
        .tool-card { background: white; border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s; }
        .tool-card.selected { border-color: #374655; background: #f8fafc; }
        .tool-card:hover { border-color: #374655; box-shadow: 0 4px 16px rgba(55,70,85,0.1); }
        .tool-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .tool-left { display: flex; align-items: center; gap: 14px; }
        .tool-icon-box { width: 50px; height: 50px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
        .tool-icon-box.selected { background: #374655; }
        .tool-name { color: #1e293b; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
        .tool-desc { color: #64748b; font-size: 13px; }
        .tool-right { display: flex; align-items: center; gap: 16px; }
        .tool-price h4 { color: #374655; font-size: 20px; font-weight: 800; }
        .tool-price span { color: #94a3b8; font-size: 12px; }
        .tool-checkbox { width: 22px; height: 22px; accent-color: #374655; cursor: pointer; }
        .one-time-badge { background: #fef3c7; color: #d97706; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; display: block; margin-top: 4px; }
        .tool-detail { margin-top: 14px; padding-top: 14px; border-top: 1px solid #f1f5f9; display: flex; gap: 10px; flex-wrap: wrap; }
        .tool-detail-item { display: flex; align-items: center; gap: 6px; background: #f8fafc; padding: 6px 12px; border-radius: 8px; font-size: 12px; color: #374655; font-weight: 600; }
        .summary-box { background: #374655; border-radius: 20px; padding: 28px; margin-top: 24px; }
        .summary-box h3 { color: white; font-size: 18px; font-weight: 700; margin-bottom: 20px; }
        .summary-row { display: flex; justify-content: space-between; color: rgba(255,255,255,0.8); font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .summary-total-row { display: flex; justify-content: space-between; color: white; font-size: 20px; font-weight: 800; margin: 16px 0; }
        .summary-credits { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; margin-bottom: 20px; text-align: center; }
        .summary-credits p { color: rgba(255,255,255,0.7); font-size: 13px; margin-bottom: 4px; }
        .summary-credits h4 { color: white; font-size: 22px; font-weight: 800; }
        .wa-btn { width: 100%; background: #25d366; color: white; border: none; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; display: block; text-align: center; text-decoration: none; transition: all 0.2s; }
        .wa-btn:hover { background: #20b958; }
        .empty-state { text-align: center; padding: 24px 0; color: rgba(255,255,255,0.5); font-size: 15px; }
        .credit-pack { background: white; border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px; transition: all 0.2s; position: relative; }
        .credit-pack:hover { border-color: #374655; box-shadow: 0 4px 16px rgba(55,70,85,0.1); }
        .credit-pack.popular { border-color: #374655; }
        .popular-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #374655; color: white; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; white-space: nowrap; }
        .credit-pack-left h3 { color: #1e293b; font-size: 18px; font-weight: 700; margin-bottom: 4px; }
        .credit-pack-left p { color: #64748b; font-size: 14px; }
        .credit-pack-right { text-align: right; flex-shrink: 0; }
        .credit-pack-right h4 { color: #374655; font-size: 24px; font-weight: 800; }
        .credit-pack-right span { color: #94a3b8; font-size: 13px; }
        .credit-wa-btn { display: inline-block; background: #374655; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; text-align: center; text-decoration: none; margin-top: 8px; transition: all 0.2s; }
        .credit-wa-btn:hover { background: #4a5a6a; }
        @media (max-width: 768px) {
          .tool-right { width: 100%; justify-content: space-between; }
          .credit-pack { flex-direction: column; }
          .credit-pack-right { width: 100%; display: flex; justify-content: space-between; align-items: center; text-align: left; }
        }
      `}</style>

      {/* Tab Bar */}
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}>
          🎯 Build Your Plan
        </button>
        <button className={`tab-btn ${activeTab === 'credits' ? 'active' : ''}`} onClick={() => setActiveTab('credits')}>
          ⚡ Buy Extra Credits
        </button>
      </div>

      {/* Build Your Plan Tab */}
      {activeTab === 'plan' && (
        <div>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
            Click on any tool to select it. Each tool comes with <strong>500 monthly credits</strong>.
          </p>

          {tools.map(tool => (
            <div key={tool.name} className={`tool-card ${selected.includes(tool.name) ? 'selected' : ''}`} onClick={() => toggle(tool.name)}>
              <div className="tool-header">
                <div className="tool-left">
                  <div className={`tool-icon-box ${selected.includes(tool.name) ? 'selected' : ''}`}>
                    {tool.icon}
                  </div>
                  <div>
                    <div className="tool-name">{tool.name}</div>
                    <div className="tool-desc">{tool.desc}</div>
                  </div>
                </div>
                <div className="tool-right">
                  <div className="tool-price">
                    <h4>₹{tool.monthly.toLocaleString()}<span>/mo</span></h4>
                    {tool.oneTime && <span className="one-time-badge">+₹{tool.oneTime.toLocaleString()} setup</span>}
                  </div>
                  <input type="checkbox" className="tool-checkbox" checked={selected.includes(tool.name)} onChange={() => toggle(tool.name)} onClick={e => e.stopPropagation()} />
                </div>
              </div>
              {selected.includes(tool.name) && (
                <div className="tool-detail">
                  <div className="tool-detail-item">⚡ 500 credits/month</div>
                  <div className="tool-detail-item">🔄 {tool.credits} credits {tool.unit}</div>
                  <div className="tool-detail-item">📅 Monthly subscription</div>
                </div>
              )}
            </div>
          ))}

          {/* Summary */}
          <div className="summary-box">
            <h3>📋 Your Custom Plan</h3>
            {selectedTools.length === 0 ? (
              <div className="empty-state">
                <p>☝️ Select tools above to build your plan</p>
              </div>
            ) : (
              <>
                {selectedTools.map(tool => (
                  <div key={tool.name} className="summary-row">
                    <span>{tool.icon} {tool.name}</span>
                    <span>₹{tool.monthly.toLocaleString()}/mo</span>
                  </div>
                ))}
                {oneTimeTotal > 0 && (
                  <div className="summary-row">
                    <span>🌐 Website Setup (one time)</span>
                    <span>₹{oneTimeTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="summary-total-row">
                  <span>Monthly Total</span>
                  <span>₹{monthlyTotal.toLocaleString()}/mo</span>
                </div>
                <div className="summary-credits">
                  <p>Monthly Credits Included</p>
                  <h4>⚡ {totalCredits.toLocaleString()} credits/month</h4>
                </div>
              </>
            )}
            <a href={`https://wa.me/919314023719?text=${encodeURIComponent(whatsappMessage)}`} className="wa-btn" target="_blank">
              💬 Get Started on WhatsApp →
            </a>
          </div>
        </div>
      )}

      {/* Buy Extra Credits Tab */}
      {activeTab === 'credits' && (
        <div>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', textAlign: 'center' }}>
            Running low on credits? Top up anytime and never miss a beat.
          </p>
          {creditPacks.map(pack => (
            <div key={pack.credits} className={`credit-pack ${pack.popular ? 'popular' : ''}`}>
              {pack.popular && <span className="popular-badge">⭐ Most Popular</span>}
              <div className="credit-pack-left">
                <h3>⚡ {pack.credits.toLocaleString()} Credits</h3>
                <p>{pack.label}</p>
              </div>
              <div className="credit-pack-right">
                <h4>₹{pack.price.toLocaleString()}</h4>
                <span>₹{(pack.price / pack.credits).toFixed(1)} per credit</span>
                <a href={`https://wa.me/919314023719?text=${encodeURIComponent(`Hi! I want to buy ${pack.credits} extra credits (${pack.label}) for ₹${pack.price}.`)}`} className="credit-wa-btn" target="_blank">
                  Buy Now →
                </a>
              </div>
            </div>
          ))}

          <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', marginTop: '24px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '24px', marginBottom: '12px' }}>💡</p>
            <h3 style={{ color: '#1e293b', fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Need a custom credit package?</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>Contact us on WhatsApp for bulk credit discounts and custom packages.</p>
            <a href="https://wa.me/919314023719" style={{ background: '#374655', color: 'white', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', display: 'inline-block', textDecoration: 'none' }} target="_blank">
              💬 Contact for Custom Package
            </a>
          </div>
        </div>
      )}
    </>
  )
}