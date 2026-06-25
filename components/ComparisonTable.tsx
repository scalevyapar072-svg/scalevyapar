import AnimateOnScroll from './AnimateOnScroll'
import { defaultMainWebsiteContent } from '@/data/main-website-content'

type ComparisonTableProps = {
  content?: typeof defaultMainWebsiteContent.home.comparisonSection
}

export default function ComparisonTable({ content = defaultMainWebsiteContent.home.comparisonSection }: ComparisonTableProps) {
  return (
    <>
      <style>{`
        .comparison-section { background: white; padding: 80px 48px; }
        .comparison-container { max-width: 900px; margin: 0 auto; }
        .comparison-header { text-align: center; margin-bottom: 48px; }
        .comparison-table { width: 100%; border-collapse: collapse; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(55,70,85,0.1); }
        .comparison-table th { padding: 20px 24px; font-size: 16px; font-weight: 700; }
        .comparison-table th:first-child { background: #f8fafc; color: #64748b; text-align: left; width: 50%; }
        .comparison-table th:nth-child(2) { background: #374655; color: white; text-align: center; width: 25%; }
        .comparison-table th:nth-child(3) { background: #f1f5f9; color: #94a3b8; text-align: center; width: 25%; }
        .comparison-table td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; }
        .comparison-table td:first-child { color: #374655; font-size: 14px; font-weight: 500; background: white; }
        .comparison-table td:nth-child(2) { text-align: center; background: #f8fafc; }
        .comparison-table td:nth-child(3) { text-align: center; background: white; }
        .comparison-table tr:last-child td { border-bottom: none; }
        .comparison-table tr:hover td { background: #f8fafc !important; }
        .check-yes { width: 28px; height: 28px; background: #374655; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 700; }
        .check-no { width: 28px; height: 28px; background: #fee2e2; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #dc2626; font-size: 14px; font-weight: 700; }
        .sv-badge { display: inline-flex; align-items: center; gap: 6px; }
        .comparison-cta { text-align: center; margin-top: 40px; }
        .comparison-cta p { color: #64748b; font-size: 15px; margin-bottom: 20px; }
        @media (max-width: 768px) {
          .comparison-section { padding: 60px 20px; }
          .comparison-table th { padding: 14px 12px; font-size: 13px; }
          .comparison-table td { padding: 12px; font-size: 13px; }
        }
      `}</style>

      <section className="comparison-section">
        <div className="comparison-container">
          <AnimateOnScroll direction="up">
            <div className="comparison-header">
              <span style={{ background: '#374655', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' }}>{content.eyebrow}</span>
              <h2 style={{ color: '#1e293b', fontSize: '36px', fontWeight: '800', marginBottom: '12px' }}>{content.title}</h2>
              <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' }}>{content.subtitle}</p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll direction="up" delay={200}>
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>
                    <div className="sv-badge">{content.primaryLabel}</div>
                  </th>
                  <th>{content.secondaryLabel}</th>
                </tr>
              </thead>
              <tbody>
                {content.features.map(row => (
                  <tr key={row.feature}>
                    <td>{row.feature}</td>
                    <td>{row.us ? <span className="check-yes">✓</span> : <span className="check-no">✕</span>}</td>
                    <td>{row.others ? <span className="check-yes" style={{ background: '#94a3b8' }}>✓</span> : <span className="check-no">✕</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="comparison-cta">
              <p>{content.ctaText}</p>
              <a href={content.ctaButtonHref} style={{ background: '#25d366', color: 'white', padding: '14px 32px', borderRadius: '10px', fontWeight: '700', fontSize: '15px', display: 'inline-block', textDecoration: 'none', transition: 'all 0.2s' }} target="_blank" rel="noreferrer">
                {content.ctaButtonLabel}
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  )
}
