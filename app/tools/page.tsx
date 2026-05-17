import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import Link from 'next/link'

export default function ToolsPage() {
  const tools = [
    {
      icon: '🎯',
      name: 'LeadRadar',
      tagline: 'Extract B2B Leads from Google Maps',
      desc: 'LeadRadar is our powerful lead generation tool that extracts thousands of business leads from Google Maps in minutes. Target the exact businesses you want by location, category and keywords.',
      features: ['Extract leads from any city or area in India', 'Filter by business type and category', 'Get phone numbers, emails and addresses', 'Export to Excel or import directly to CRM', 'Search multiple locations at once', 'Real time data — always up to date'],
      credits: '100 credits per search',
      badge: 'Built by ScaleVyapar',
      badgeColor: '#0369a1',
      badgeBg: '#e0f2fe',
      useCases: ['Real estate agencies finding property buyers', 'Manufacturers finding distributors', 'Service businesses finding local clients', 'B2B sales teams building prospect lists']
    },
    {
      icon: '📸',
      name: 'Vizora AI',
      tagline: 'Professional AI Product Photos in Seconds',
      desc: 'Vizora uses cutting edge AI to generate professional product photos and video ads instantly. No photographer, no studio, no expensive shoots — just upload your product and get stunning visuals.',
      features: ['AI generated product photos on real models', '12 professional pose types', 'Video ad generation for social media', 'Photo upscaling 4x quality', 'UGC style content creation', 'Magic eraser for background removal'],
      credits: '100 credits per photo',
      badge: 'Built by ScaleVyapar',
      badgeColor: '#0369a1',
      badgeBg: '#e0f2fe',
      useCases: ['Fashion and clothing brands', 'Ecommerce product listings', 'Social media advertisements', 'Instagram and Facebook marketing']
    },
    {
      icon: '🌐',
      name: 'Website Builder',
      tagline: 'Professional Website for Your Business',
      desc: 'Get a fully custom professional website built for your business. One time setup fee covers everything — design, development and launch. Modifications are covered by your monthly credits.',
      features: ['Fully custom designed website', 'Mobile responsive on all devices', 'Fast loading and SEO optimized', 'Contact forms and WhatsApp integration', 'Product catalog and pricing pages', 'Ongoing modifications with credits'],
      credits: '100 credits per modification',
      badge: 'Built by ScaleVyapar',
      badgeColor: '#0369a1',
      badgeBg: '#e0f2fe',
      oneTime: '₹4,999 one time setup',
      useCases: ['Small businesses needing online presence', 'Manufacturers wanting product showcase', 'Service businesses needing lead generation', 'Retailers wanting online store']
    },
    {
      icon: '📞',
      name: 'CRM & Call Management',
      tagline: 'Track Every Call and Close More Deals',
      desc: 'Our CRM and call management system helps your sales team track every call, manage follow-ups and close more deals. Never miss a follow-up or lose a potential customer again.',
      features: ['Automatic call tracking and logging', 'Lead status — Hot, Warm, Cold', 'Follow-up reminders and alerts', 'Team performance reports', 'Call recording and notes', 'Pipeline management dashboard'],
      credits: '100 credits per session',
      badge: 'Premium Tool',
      badgeColor: '#15803d',
      badgeBg: '#f0fdf4',
      useCases: ['Sales teams managing large lead volumes', 'Telecalling centers tracking performance', 'Real estate agents managing prospects', 'Insurance agents following up clients']
    },
    {
      icon: '💬',
      name: 'WhatsApp Automation',
      tagline: 'Automate Your WhatsApp Marketing',
      desc: 'Send bulk WhatsApp messages, set up automated chatbots and run complete lead nurturing campaigns — all from one powerful dashboard. Reach thousands of customers instantly.',
      features: ['Bulk WhatsApp messaging', 'Automated chatbot responses', 'Lead nurturing campaigns', 'Broadcast to unlimited contacts', 'Message templates and scheduling', 'Analytics and delivery reports'],
      credits: '100 credits per session',
      badge: 'Premium Tool',
      badgeColor: '#15803d',
      badgeBg: '#f0fdf4',
      useCases: ['Businesses running WhatsApp marketing', 'Ecommerce order notifications', 'Educational institutes sending updates', 'Real estate sending property alerts']
    },
    {
      icon: '📦',
      name: 'Inventory Management',
      tagline: 'Track Stock and Manage Production',
      desc: 'Keep your inventory under control with real time stock tracking, production order management and dispatch monitoring. Never run out of stock or lose track of orders again.',
      features: ['Real time stock level tracking', 'Raw material management', 'Production order tracking', 'Dispatch and delivery monitoring', 'Low stock alerts and notifications', 'Supplier and vendor management'],
      credits: '100 credits per session',
      badge: 'Premium Tool',
      badgeColor: '#15803d',
      badgeBg: '#f0fdf4',
      useCases: ['Manufacturers tracking production', 'Wholesalers managing large inventory', 'Retailers monitoring stock levels', 'Distributors tracking shipments']
    },
  ]

  return (
    <>
      <style>{`
        .tools-hero { background: #374655; padding: 80px 48px; text-align: center; position: relative; overflow: hidden; }
        .tools-hero::before { content: ''; position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: rgba(255,255,255,0.04); border-radius: 50%; }
        .tools-hero h1 { color: white; font-size: 42px; font-weight: 800; margin-bottom: 16px; animation: fadeInDown 0.8s ease; }
        .tools-hero p { color: rgba(255,255,255,0.7); font-size: 17px; max-width: 600px; margin: 0 auto; line-height: 1.7; animation: fadeInUp 0.8s ease 0.2s both; }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .tools-section { background: #f8fafc; padding: 80px 48px; }
        .tools-container { max-width: 1100px; margin: 0 auto; }
        .tool-block { background: white; border: 1px solid #e2e8f0; border-radius: 24px; padding: 40px; margin-bottom: 24px; transition: all 0.3s; }
        .tool-block:hover { box-shadow: 0 12px 40px rgba(55,70,85,0.12); border-color: #374655; transform: translateY(-2px); }
        .tool-block-header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
        .tool-block-icon { width: 64px; height: 64px; background: #f1f5f9; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 30px; flex-shrink: 0; transition: all 0.3s; }
        .tool-block:hover .tool-block-icon { background: #374655; transform: scale(1.05); }
        .tool-block-title h2 { color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 6px; }
        .tool-block-title p { color: #64748b; font-size: 15px; margin-bottom: 10px; }
        .tool-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; display: inline-block; }
        .tool-block-body { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .tool-desc-text { color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 20px; }
        .tool-features-list { display: flex; flex-direction: column; gap: 10px; }
        .tool-feature-item { display: flex; align-items: center; gap: 10px; }
        .tool-feature-check { width: 22px; height: 22px; background: #374655; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; flex-shrink: 0; }
        .tool-feature-text { color: #374655; font-size: 14px; font-weight: 500; }
        .tool-right-panel { background: #f8fafc; border-radius: 16px; padding: 24px; }
        .tool-right-panel h4 { color: #1e293b; font-size: 15px; font-weight: 700; margin-bottom: 14px; }
        .use-case-item { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 10px; color: #64748b; font-size: 14px; line-height: 1.5; }
        .credits-badge { background: #374655; color: white; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 16px; }
        .one-time-info { background: #fef3c7; color: #d97706; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 12px; }
        .tool-cta-btn { display: block; background: #374655; color: white; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; text-decoration: none; transition: all 0.3s; margin-top: 16px; }
        .tool-cta-btn:hover { background: #4a5a6a; transform: translateY(-2px); }
        .cta-section { background: #374655; padding: 80px 48px; text-align: center; }
        .cta-section h2 { color: white; font-size: 36px; font-weight: 800; margin-bottom: 16px; }
        .cta-section p { color: rgba(255,255,255,0.7); font-size: 16px; margin-bottom: 32px; }
        .cta-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .cta-btn-white { background: white; color: #374655; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; text-decoration: none; transition: all 0.3s; }
        .cta-btn-white:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.2); }
        .cta-btn-wa { background: #25d366; color: white; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; text-decoration: none; transition: all 0.3s; }
        .cta-btn-wa:hover { background: #20b958; transform: translateY(-3px); }
        @media (max-width: 768px) {
          .tools-hero { padding: 60px 20px; }
          .tools-hero h1 { font-size: 28px; }
          .tools-section { padding: 40px 20px; }
          .tool-block { padding: 24px; }
          .tool-block-body { grid-template-columns: 1fr; }
          .cta-section { padding: 60px 20px; }
          .cta-section h2 { font-size: 26px; }
        }
      `}</style>

      <Navbar />

      <section className="tools-hero">
        <h1>Our Tools & Services 🛠️</h1>
        <p>Everything your business needs to generate leads, manage customers, automate marketing and scale faster.</p>
      </section>

      <section className="tools-section">
        <div className="tools-container">
          {tools.map((tool, idx) => (
            <AnimateOnScroll key={tool.name} direction={idx % 2 === 0 ? 'left' : 'right'} delay={100}>
              <div className="tool-block">
                <div className="tool-block-header">
                  <div className="tool-block-icon">{tool.icon}</div>
                  <div className="tool-block-title">
                    <h2>{tool.name}</h2>
                    <p>{tool.tagline}</p>
                    <span className="tool-badge" style={{ background: tool.badgeBg, color: tool.badgeColor }}>{tool.badge}</span>
                  </div>
                </div>
                <div className="tool-block-body">
                  <div>
                    <p className="tool-desc-text">{tool.desc}</p>
                    <div className="tool-features-list">
                      {tool.features.map(f => (
                        <div key={f} className="tool-feature-item">
                          <div className="tool-feature-check">✓</div>
                          <span className="tool-feature-text">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="tool-right-panel">
                    <div className="credits-badge">⚡ {tool.credits}</div>
                    {tool.oneTime && <div><div className="one-time-info">🌐 {tool.oneTime}</div></div>}
                    <h4>Who is this for?</h4>
                    {tool.useCases.map(uc => (
                      <div key={uc} className="use-case-item">
                        <span>→</span>
                        <span>{uc}</span>
                      </div>
                    ))}
                    <Link href="/pricing" className="tool-cta-btn">Add to My Plan →</Link>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <AnimateOnScroll direction="up">
          <h2>Ready to Get Started?</h2>
          <p>Choose the tools your business needs and start scaling today.</p>
          <div className="cta-btns">
            <Link href="/pricing" className="cta-btn-white">Build Your Plan →</Link>
            <a href="https://wa.me/919314023719" className="cta-btn-wa" target="_blank">💬 Talk to Us</a>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer />
    </>
  )
}