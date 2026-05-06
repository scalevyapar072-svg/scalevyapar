import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import CountUp from '@/components/CountUp'
import Link from 'next/link'

export default function AboutPage() {
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

      <Navbar />

      <section className="about-hero">
        <h1>About ScaleVyapar 🏢</h1>
        <p>We are on a mission to help Indian businesses grow faster with powerful automation tools that actually work.</p>
      </section>

      <section className="about-section">
        <div className="about-container">
          <div className="about-grid">
            <AnimateOnScroll direction="left">
              <div className="about-text">
                <h2>Built for Indian Businesses by Indians</h2>
                <p>ScaleVyapar was born out of a simple frustration — Indian businesses were using expensive foreign tools that did not understand local needs, local languages or local market dynamics.</p>
                <p>We decided to build something different. A platform that understands the Indian business landscape, works with Indian payment systems, and is priced for Indian businesses.</p>
                <p>Today ScaleVyapar helps hundreds of businesses across India generate more leads, close more deals and automate their operations — all from one powerful platform.</p>
                <p style={{ color: '#374655', fontWeight: '600', fontSize: '15px' }}>📍 Proudly based in Jaipur, Rajasthan 🇮🇳</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll direction="right">
              <div className="about-visual">
                {[
                  { icon: '🎯', value: 500, suffix: '+', label: 'Businesses Served' },
                  { icon: '⚡', value: 6, suffix: '', label: 'Powerful Tools' },
                  { icon: '📍', value: null, text: 'Jaipur', label: 'Headquartered In' },
                  { icon: '💬', value: null, text: '24/7', label: 'WhatsApp Support' },
                ].map(stat => (
                  <div key={stat.label} className="about-stat">
                    <div className="about-stat-icon">{stat.icon}</div>
                    <div>
                      <h3>{stat.value ? <CountUp end={stat.value} suffix={stat.suffix || ''} /> : stat.text}</h3>
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
            <span style={{ background: '#374655', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' }}>Our Mission</span>
            <h2 style={{ color: '#1e293b', fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>Why We Built ScaleVyapar</h2>
            <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' }}>Every decision we make is guided by one goal — helping Indian businesses scale faster and smarter.</p>
          </AnimateOnScroll>
        </div>
        <div className="mission-grid">
          {[
            { icon: '🎯', title: 'Our Mission', desc: 'To make enterprise-level business automation accessible and affordable for every Indian business — from small shops to large manufacturers.' },
            { icon: '👁️', title: 'Our Vision', desc: 'To become the go-to business automation platform for 1 million Indian businesses by 2030.' },
            { icon: '💎', title: 'Our Promise', desc: 'Simple tools, honest pricing, and real results. We only succeed when our clients succeed.' },
          ].map((item, idx) => (
            <AnimateOnScroll key={item.title} direction="up" delay={idx * 150}>
              <div className="mission-card">
                <div className="mission-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      <section className="values-section">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <AnimateOnScroll direction="up">
            <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' }}>Our Values</span>
            <h2 style={{ color: 'white', fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>What We Stand For</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.7' }}>These values guide everything we do at ScaleVyapar.</p>
          </AnimateOnScroll>
        </div>
        <div className="values-grid">
          {[
            { icon: '🤝', title: 'Client First', desc: 'Every feature we build, every decision we make is guided by what is best for our clients. Your success is our success.' },
            { icon: '💡', title: 'Innovation', desc: 'We constantly push the boundaries of what is possible to bring you the most powerful and easy to use tools.' },
            { icon: '🔒', title: 'Trust & Transparency', desc: 'Honest pricing, no hidden fees, no long term contracts. We earn your trust every single month.' },
            { icon: '🇮🇳', title: 'Made for India', desc: 'Everything we build is designed specifically for the Indian market, Indian businesses and Indian customers.' },
          ].map((item, idx) => (
            <AnimateOnScroll key={item.title} direction={idx % 2 === 0 ? 'left' : 'right'} delay={idx * 100}>
              <div className="value-card">
                <div className="value-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <AnimateOnScroll direction="up">
          <div className="cta-box">
            <h2>Ready to Grow Your Business?</h2>
            <p>Join hundreds of Indian businesses already using ScaleVyapar to automate their growth and scale faster.</p>
            <div className="cta-btns">
              <Link href="/pricing" className="cta-btn-white">View Pricing →</Link>
              <a href="https://wa.me/919314023719" className="cta-btn-wa" target="_blank">💬 Talk to Us</a>
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer />
    </>
  )
}