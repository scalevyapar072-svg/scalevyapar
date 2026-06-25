import AnimateOnScroll from './AnimateOnScroll'
import CountUp from './CountUp'
import { defaultMainWebsiteContent } from '@/data/main-website-content'

type CounterBannerProps = {
  items?: typeof defaultMainWebsiteContent.home.counterBanner.items
}

export default function CounterBanner({ items = defaultMainWebsiteContent.home.counterBanner.items }: CounterBannerProps) {
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
        @media (max-width: 768px) {
          .counter-banner { padding: 40px 20px; }
          .counter-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .counter-value { font-size: 36px; }
        }
      `}</style>

      <section className="counter-banner">
        <div className="counter-container">
          <div className="counter-grid">
            {items.map((item, idx) => (
              <AnimateOnScroll key={item.label} direction="up" delay={idx * 150}>
                <div className="counter-item">
                  <div className="counter-icon">{item.icon}</div>
                  <div className="counter-value">
                    <CountUp end={item.value} suffix={item.suffix} duration={2000} />
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
