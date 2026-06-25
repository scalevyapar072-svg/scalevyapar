import Link from 'next/link'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import CountUp from '@/components/CountUp'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { getMainWebsiteContent } from '@/lib/main-website-content'

export default async function AboutPage() {
  const { content } = await getMainWebsiteContent()
  const about = content.aboutPage

  return (
    <>
      <style>{`
        .about-hero { background: #374655; padding: 80px 48px; text-align: center; position: relative; overflow: hidden; }
        .about-hero::before { content: ''; position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: rgba(255,255,255,0.04); border-radius: 50%; animation: pulse 4s ease-in-out infinite; }
        .about-hero::after { content: ''; position: absolute; bottom: -100px; left: -100px; width: 300px; height: 300px; background: rgba(255,255,255,0.04); border-radius: 50%; animation: pulse 4s ease-in-out infinite 2s; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .about-hero h1 { color: white; font-size: 42px; font-weight: 800; margin-bottom: 16px; position: relative; animation: fadeInDown 0.8s ease; }
        .about-hero p { color: rgba(255,255,255,0.7); font-size: 17px; max-width: 600px; margin: 0 auto; line-height: 1.7; position: relative; animation: fadeInUp 0.8s ease 0.2s both; }
        .about-section { background: white; padding: 80px 48px; }
        .about-container { max-width: 1100px; margin: 0 auto; }
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; margin-bottom: 80px; }
        .about-text h2 { color: #1e293b; font-size: 32px; font-weight: 800; margin-bottom: 16px; line-height: 1.2; }
        .about-text p { color: #64748b; font-size: 15px; line-height: 1.8; margin-bottom: 16px; }
        .about-visual { background: #374655; border-radius: 24px; padding: 40px; }
        .about-stat { background: rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; margin-bottom: 12px; display: flex; align-items: center; gap: 16px; transition: all 0.3s; }
        .about-stat:hover { background: rgba(255,255,255,0.14); transform: translateX(4px); }
        .about-stat-icon { font-size: 28px; }
        .about-stat h3 { color: white; font-size: 24px; font-weight: 800; margin-bottom: 2px; }
        .about-stat p { color: rgba(255,255,255,0.6); font-size: 13px; }
        .mission-section { background: #f8fafc; padding: 80px 48px; }
        .mission-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1100px; margin: 0 auto; }
        .mission-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; text-align: center; transition: all 0.3s; }
        .mission-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(55,70,85,0.12); border-color: #374655; }
        .mission-icon { font-size: 40px; margin-bottom: 16px; }
        .mission-card h3 { color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 12px; }
        .mission-card p { color: #64748b; font-size: 14px; line-height: 1.7; }
        .values-section { background: #374655; padding: 80px 48px; }
        .values-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 900px; margin: 0 auto; }
        .value-card { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 24px; display: flex; gap: 16px; transition: all 0.3s; }
        .value-card:hover { background: rgba(255,255,255,0.14); transform: translateY(-4px); }
        .value-icon { font-size: 28px; flex-shrink: 0; }
        .value-card h3 { color: white; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .value-card p { color: rgba(255,255,255,0.65); font-size: 14px; line-height: 1.6; }
        .cta-section { background: white; padding: 80px 48px; text-align: center; }
        .cta-box { background: #374655; border-radius: 24px; padding: 60px 48px; max-width: 800px; margin: 0 auto; position: relative; overflow: hidden; }
        .cta-box::before { content: ''; position: absolute; top: -80px; right: -80px; width: 300px; height: 300px; background: rgba(255,255,255,0.05); border-radius: 50%; }
        .cta-box h2 { color: white; font-size: 32px; font-weight: 800; margin-bottom: 16px; position: relative; }
        .cta-box p { color: rgba(255,255,255,0.7); font-size: 16px; margin-bottom: 32px; line-height: 1.6; position: relative; }
        .cta-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; position: relative; }
        .cta-btn-white { background: white; color: #374655; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; text-decoration: none; transition: all 0.3s; }
        .cta-btn-white:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.2); }
        .cta-btn-wa { background: #25d366; color: white; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; text-decoration: none; transition: all 0.3s; }
        .cta-btn-wa:hover { background: #20b958; transform: translateY(-3px); }
        @media (max-width: 768px) {
          .about-hero { padding: 60px 20px; }
          .about-hero h1 { font-size: 28px; }
          .about-section { padding: 40px 20px; }
          .about-grid { grid-template-columns: 1fr; gap: 32px; }
          .mission-section { padding: 60px 20px; }
          .mission-grid { grid-template-columns: 1fr; }
          .values-section { padding: 60px 20px; }
          .values-grid { grid-template-columns: 1fr; }
          .cta-section { padding: 60px 20px; }
          .cta-box { padding: 40px 24px; }
          .cta-box h2 { font-size: 24px; }
        }
      `}</style>

      <Navbar content={content.header} />

      <section className="about-hero">
        <h1>{about.heroTitle}</h1>
        <p>{about.heroSubtitle}</p>
      </section>

      <section className="about-section">
        <div className="about-container">
          <div className="about-grid">
            <AnimateOnScroll direction="left">
              <div className="about-text">
                <h2>{about.storyTitle}</h2>
                {about.storyParagraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                <p style={{ color: '#374655', fontWeight: '600', fontSize: '15px' }}>{about.locationLine}</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll direction="right">
              <div className="about-visual">
                {about.stats.map(stat => (
                  <div key={stat.label} className="about-stat">
                    <div className="about-stat-icon">{stat.icon}</div>
                    <div>
                      <h3>{typeof stat.value === 'number' ? <CountUp end={stat.value} suffix={stat.suffix || ''} /> : stat.text}</h3>
                      <p>{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      <section className="mission-section">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <AnimateOnScroll direction="up">
            <span style={{ background: '#374655', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' }}>{about.mission.eyebrow}</span>
            <h2 style={{ color: '#1e293b', fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>{about.mission.title}</h2>
            <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' }}>{about.mission.subtitle}</p>
          </AnimateOnScroll>
        </div>
        <div className="mission-grid">
          {about.mission.cards.map((item, idx) => (
            <AnimateOnScroll key={item.title} direction="up" delay={idx * 150}>
              <div className="mission-card">
                <div className="mission-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      <section className="values-section">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <AnimateOnScroll direction="up">
            <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' }}>{about.values.eyebrow}</span>
            <h2 style={{ color: 'white', fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>{about.values.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' }}>{about.values.subtitle}</p>
          </AnimateOnScroll>
        </div>
        <div className="values-grid">
          {about.values.cards.map((item, idx) => (
            <AnimateOnScroll key={item.title} direction={idx % 2 === 0 ? 'left' : 'right'} delay={idx * 100}>
              <div className="value-card">
                <div className="value-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <AnimateOnScroll direction="up">
          <div className="cta-box">
            <h2>{about.finalCta.title}</h2>
            <p>{about.finalCta.subtitle}</p>
            <div className="cta-btns">
              <Link href={about.finalCta.primaryCtaHref} className="cta-btn-white">{about.finalCta.primaryCtaLabel}</Link>
              <a href={about.finalCta.secondaryCtaHref} className="cta-btn-wa" target="_blank" rel="noreferrer">{about.finalCta.secondaryCtaLabel}</a>
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer content={content.footer} />
    </>
  )
}
