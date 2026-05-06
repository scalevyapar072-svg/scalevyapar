import AnimateOnScroll from './AnimateOnScroll'
import CountUp from './CountUp'

export default function CounterBanner() {
  return (
    <>
      <style>{`
        .counter-banner { background: #374655; padding: 60px 48px; }
        .counter-container { max-width: 1100px; margin: 0 auto; }
        .counter-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; text-align: center; }
        .counter-item { padding: 20px; }
        .counter-icon { font-size: 36px; margin-bottom: 12px; }
        .counter-value { color: white; font-size: 48px; font-weight: 800; line-height: 1; margin-bottom: 8px; }
        .counter-label { color: rgba(255,255,255,0.7); font-size: 15px; font-weight: 500; }
        .counter-divider { width: 1px; background: rgba(255,255,255,0.1); margin: auto; }
        @media (max-width: 768px) {
          .counter-banner { padding: 40px 20px; }
          .counter-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .counter-value { font-size: 36px; }
        }
      `}</style>

      <section className="counter-banner">
        <div className="counter-container">
          <div className="counter-grid">
            {[
              { icon: '🎯', end: 10000, suffix: '+', label: 'Leads Generated' },
              { icon: '🏢', end: 500, suffix: '+', label: 'Businesses Served' },
              { icon: '💰', end: 50, suffix: 'L+', label: 'Revenue Generated for Clients' },
              { icon: '⭐', end: 98, suffix: '%', label: 'Client Satisfaction Rate' },
            ].map((item, idx) => (
              <AnimateOnScroll key={item.label} direction="up" delay={idx * 150}>
                <div className="counter-item">
                  <div className="counter-icon">{item.icon}</div>
                  <div className="counter-value">
                    <CountUp end={item.end} suffix={item.suffix} duration={2000} />
                  </div>
                  <div className="counter-label">{item.label}</div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}