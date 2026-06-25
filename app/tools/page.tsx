import Link from 'next/link'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { getMainWebsiteContent } from '@/lib/main-website-content'

export default async function ToolsPage() {
  const { content } = await getMainWebsiteContent()
  const tools = content.toolsPage.tools

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

      <Navbar content={content.header} />

      <section className="tools-hero">
        <h1>{content.toolsPage.heroTitle}</h1>
        <p>{content.toolsPage.heroSubtitle}</p>
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
                    <p className="tool-desc-text">{tool.description}</p>
                    <div className="tool-features-list">
                      {tool.features.map(feature => (
                        <div key={feature} className="tool-feature-item">
                          <div className="tool-feature-check">✓</div>
                          <span className="tool-feature-text">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="tool-right-panel">
                    <div className="credits-badge">⚡ {tool.credits}</div>
                    {tool.oneTime ? <div><div className="one-time-info">🌐 {tool.oneTime}</div></div> : null}
                    <h4>Who is this for?</h4>
                    {tool.useCases.map(useCase => (
                      <div key={useCase} className="use-case-item">
                        <span>→</span>
                        <span>{useCase}</span>
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
          <h2>{content.toolsPage.finalCta.title}</h2>
          <p>{content.toolsPage.finalCta.subtitle}</p>
          <div className="cta-btns">
            <Link href={content.toolsPage.finalCta.primaryCtaHref} className="cta-btn-white">{content.toolsPage.finalCta.primaryCtaLabel}</Link>
            <a href={content.toolsPage.finalCta.secondaryCtaHref} className="cta-btn-wa" target="_blank" rel="noreferrer">{content.toolsPage.finalCta.secondaryCtaLabel}</a>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer content={content.footer} />
    </>
  )
}
