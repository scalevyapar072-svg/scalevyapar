import ToolPreview from '@/components/ToolPreview'
import CounterBanner from '@/components/CounterBanner'
import ComparisonTable from '@/components/ComparisonTable'
import TypingAnimation from '@/components/TypingAnimation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import CountUp from '@/components/CountUp'
import Link from 'next/link'
import TestimonialsSection from '@/components/TestimonialsSection'

export default function HomePage() {
  const tools = [
    { icon: '🎯', name: 'LeadRadar', tag: 'Built by Us', desc: 'Extract thousands of B2B leads from Google Maps in minutes. Filter by location, business type and keywords.', features: ['Google Maps extraction', 'Filter by location', 'Export to Excel/CRM', 'Bulk lead import'] },
    { icon: '📸', name: 'Vizora AI', tag: 'Built by Us', desc: 'Generate professional AI product photos and video ads instantly. No photographer needed.', features: ['AI photo generation', 'Video ad creation', '12 pose types', 'Instant download'] },
    { icon: '🌐', name: 'Website Builder', tag: 'Built by Us', desc: 'Get a professional website built for your business. One time setup with ongoing modifications included.', features: ['Custom design', 'Mobile responsive', 'SEO optimized', 'WhatsApp integration'] },
    { icon: '📞', name: 'CRM & Calls', tag: 'Premium Tool', desc: 'Track every call, manage follow-ups and close more deals with our powerful CRM system.', features: ['Call tracking', 'Lead management', 'Follow-up reminders', 'Team performance'] },
    { icon: '💬', name: 'WhatsApp Automation', tag: 'Premium Tool', desc: 'Automate your WhatsApp marketing with bulk messaging, chatbots and lead nurturing campaigns.', features: ['Bulk messaging', 'Chatbot automation', 'Lead nurturing', 'Broadcast campaigns'] },
    { icon: '📦', name: 'Inventory Management', tag: 'Premium Tool', desc: 'Track your stock levels, manage raw materials, production orders and dispatch in real time.', features: ['Stock tracking', 'Raw material management', 'Production orders', 'Dispatch tracking'] },
  ]

  const steps = [
    { icon: '1', title: 'Choose Your Tools', desc: 'Select the automation tools your business needs from our powerful toolkit.' },
    { icon: '2', title: 'Get Instant Access', desc: 'Login to your dashboard and start using all your tools immediately.' },
    { icon: '3', title: 'Scale Your Business', desc: 'Watch your business grow with automated lead generation, sales and marketing.' },
  ]

  return (
    <>
      <style>{`
      @media (max-width: 768px) {
  .testimonials-grid { grid-template-columns: 1fr !important; }
}
      * { box-sizing: border-box; }
        .hero { background: #374655; min-height: 92vh; display: flex; align-items: center; position: relative; overflow: hidden; padding: 80px 48px; }
        .hero-deco1 { position: absolute; top: -150px; right: -150px; width: 500px; height: 500px; background: rgba(255,255,255,0.04); border-radius: 50%; animation: pulse 4s ease-in-out infinite; }
        .hero-deco2 { position: absolute; bottom: -150px; left: -150px; width: 500px; height: 500px; background: rgba(255,255,255,0.04); border-radius: 50%; animation: pulse 4s ease-in-out infinite 2s; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .hero-content { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .hero-left { animation: fadeInLeft 0.8s ease forwards; }
        .hero-right { animation: fadeInRight 0.8s ease 0.3s both; }
        @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        .hero-left h1 { color: white; font-size: 52px; font-weight: 800; line-height: 1.15; margin-bottom: 20px; }
        .hero-left h1 span { color: #94a3b8; }
        .hero-left p { color: rgba(255,255,255,0.7); font-size: 18px; line-height: 1.7; margin-bottom: 36px; }
        .hero-btns { display: flex; gap: 16px; flex-wrap: wrap; }
        .hero-btn-primary { background: white; color: #374655; padding: 16px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; transition: all 0.3s; display: inline-block; text-decoration: none; }
        .hero-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .hero-btn-outline { background: transparent; color: white; border: 2px solid rgba(255,255,255,0.4); padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; transition: all 0.3s; display: inline-block; text-decoration: none; }
        .hero-btn-outline:hover { border-color: white; background: rgba(255,255,255,0.08); transform: translateY(-3px); }
        .hero-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .hero-card { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 20px; backdrop-filter: blur(10px); transition: all 0.3s; cursor: default; }
        .hero-card:hover { background: rgba(255,255,255,0.14); transform: translateY(-4px); }
        .hero-card.featured { grid-column: span 2; }
        .hero-card-icon { font-size: 28px; margin-bottom: 10px; }
        .hero-card h3 { color: white; font-size: 15px; font-weight: 700; margin-bottom: 6px; }
        .hero-card p { color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.5; }
        .stats-section { background: white; padding: 60px 48px; border-bottom: 1px solid #f1f5f9; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; max-width: 1000px; margin: 0 auto; text-align: center; }
        .stat-item h3 { color: #374655; font-size: 42px; font-weight: 800; margin-bottom: 8px; }
        .stat-item p { color: #64748b; font-size: 15px; font-weight: 500; }
        .tools-section { background: #f8fafc; padding: 80px 48px; }
        .section-header { text-align: center; margin-bottom: 56px; }
        .section-tag { background: #374655; color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 16px; }
        .section-title { font-size: 36px; font-weight: 800; color: #1e293b; margin-bottom: 16px; }
        .section-subtitle { font-size: 16px; color: #64748b; line-height: 1.7; max-width: 600px; margin: 0 auto; }
        .tools-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
        .tool-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; transition: all 0.3s; }
        .tool-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(55,70,85,0.12); border-color: #374655; }
        .tool-card-icon { width: 56px; height: 56px; background: #f1f5f9; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 16px; transition: all 0.3s; }
        .tool-card:hover .tool-card-icon { background: #374655; transform: scale(1.1); }
        .tool-card h3 { color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .tool-tag { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-bottom: 12px; display: inline-block; }
        .tool-tag.own { background: #e0f2fe; color: #0369a1; }
        .tool-tag.premium { background: #f0fdf4; color: #15803d; }
        .tool-card p { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
        .tool-features { display: flex; flex-direction: column; gap: 8px; }
        .tool-feature { display: flex; align-items: center; gap: 8px; color: #374655; font-size: 13px; font-weight: 500; }
        .tool-feature-dot { width: 20px; height: 20px; background: #374655; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
        .how-section { background: white; padding: 80px 48px; }
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; max-width: 1000px; margin: 0 auto; position: relative; }
        .steps-grid::before { content: ''; position: absolute; top: 30px; left: 16%; right: 16%; height: 2px; background: linear-gradient(to right, #374655, #374655); opacity: 0.2; }
        .step-card { text-align: center; padding: 32px 24px; }
        .step-number { width: 60px; height: 60px; background: #374655; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; margin: 0 auto 20px; transition: all 0.3s; }
        .step-card:hover .step-number { transform: scale(1.1); box-shadow: 0 8px 24px rgba(55,70,85,0.3); }
        .step-card h3 { color: #1e293b; font-size: 18px; font-weight: 700; margin-bottom: 12px; }
        .step-card p { color: #64748b; font-size: 14px; line-height: 1.7; }
        .why-section { background: #374655; padding: 80px 48px; }
        .why-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1200px; margin: 0 auto; }
        .why-card { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 28px; transition: all 0.3s; }
        .why-card:hover { background: rgba(255,255,255,0.14); transform: translateY(-4px); }
        .why-card-icon { font-size: 32px; margin-bottom: 16px; }
        .why-card h3 { color: white; font-size: 18px; font-weight: 700; margin-bottom: 10px; }
        .why-card p { color: rgba(255,255,255,0.65); font-size: 14px; line-height: 1.6; }
        {/* Testimonials */}
      <section style={{ background: '#f8fafc', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <AnimateOnScroll direction="up">
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <span className="section-tag">Testimonials</span>
              <h2 className="section-title">What Our Clients Say</h2>
              <p className="section-subtitle">Real businesses, real results. Here is what our clients have to say about ScaleVyapar.</p>
            </div>
          </AnimateOnScroll>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[
              { name: 'Rajesh Sharma', business: 'Sharma Textiles, Jaipur', review: 'ScaleVyapar has completely transformed how we generate leads. In just 2 weeks we got 500+ business contacts from Google Maps. Our sales team is now 3x more productive!', rating: 5, avatar: 'R' },
              { name: 'Priya Agarwal', business: 'Agarwal Exports, Jaipur', review: 'Vizora AI photos are incredible! We stopped spending ₹15,000 per month on photographers. Now we generate stunning product photos in seconds. Our Instagram sales doubled!', rating: 5, avatar: 'P' },
              { name: 'Mohit Gupta', business: 'Gupta Electronics, Jaipur', review: 'The WhatsApp automation tool is a game changer. We send 5000 messages a day and our follow-up rate went from 20% to 80%. Best investment we made this year!', rating: 5, avatar: 'M' },
              { name: 'Sunita Verma', business: 'Verma Jewellers, Jaipur', review: 'The CRM system helped us track every customer call. We no longer miss follow-ups and our conversion rate improved by 40%. ScaleVyapar support team is amazing!', rating: 5, avatar: 'S' },
              { name: 'Amit Joshi', business: 'Joshi Manufacturing, Jaipur', review: 'Inventory management was our biggest headache. Now everything is tracked in real time. We reduced stock wastage by 60% and our production is much more organized.', rating: 5, avatar: 'A' },
              { name: 'Kavita Mehta', business: 'Mehta Fashion, Jaipur', review: 'We got a beautiful website and 200 leads in the first month using LeadRadar. The team at ScaleVyapar held our hand through everything. Highly recommended!', rating: 5, avatar: 'K' },
            ].map((t, idx) => (
              <AnimateOnScroll key={t.name} direction="up" delay={idx * 100}>
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', transition: 'all 0.3s', height: '100%' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(55,70,85,0.12)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#374655' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0' }}
                >
                  <div style={{ display: 'flex', marginBottom: '16px' }}>
                    {[...Array(t.rating)].map((_, i) => (
                      <span key={i} style={{ color: '#f59e0b', fontSize: '18px' }}>★</span>
                    ))}
                  </div>
                  <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.7', marginBottom: '20px', fontStyle: 'italic' }}>"{t.review}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#374655', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>{t.avatar}</div>
                    <div>
                      <p style={{ color: '#1e293b', fontSize: '14px', fontWeight: '700', marginBottom: '2px' }}>{t.name}</p>
                      <p style={{ color: '#64748b', fontSize: '12px' }}>{t.business}</p>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>
        .cta-section { background: white; padding: 80px 48px; text-align: center; }
        .cta-box { background: #374655; border-radius: 24px; padding: 60px 48px; max-width: 800px; margin: 0 auto; position: relative; overflow: hidden; }
        .cta-box::before { content: ''; position: absolute; top: -80px; right: -80px; width: 300px; height: 300px; background: rgba(255,255,255,0.05); border-radius: 50%; }
        .cta-box h2 { color: white; font-size: 36px; font-weight: 800; margin-bottom: 16px; position: relative; }
        .cta-box p { color: rgba(255,255,255,0.7); font-size: 16px; margin-bottom: 32px; line-height: 1.6; position: relative; }
        .cta-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; position: relative; }
        .cta-btn-white { background: white; color: #374655; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; transition: all 0.3s; text-decoration: none; }
        .cta-btn-white:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.2); }
        .cta-btn-wa { background: #25d366; color: white; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; transition: all 0.3s; text-decoration: none; }
        .cta-btn-wa:hover { background: #20b958; transform: translateY(-3px); }
        @media (max-width: 768px) {
          .hero { padding: 60px 20px; min-height: auto; }
          .hero-content { grid-template-columns: 1fr; gap: 40px; }
          .hero-left h1 { font-size: 32px; }
          .hero-left p { font-size: 15px; }
          .stats-section { padding: 40px 20px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .stat-item h3 { font-size: 32px; }
          .tools-section { padding: 60px 20px; }
          .tools-grid { grid-template-columns: 1fr; }
          .how-section { padding: 60px 20px; }
          .steps-grid { grid-template-columns: 1fr; }
          .steps-grid::before { display: none; }
          .why-section { padding: 60px 20px; }
          .why-grid { grid-template-columns: 1fr; }
          .cta-section { padding: 60px 20px; }
          .cta-box { padding: 40px 24px; }
          .cta-box h2 { font-size: 26px; }
        }
      `}</style>

      <Navbar />

    
      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <style>{`
          .hero-desktop { display: block; }
          .hero-mobile { display: none; }
          .hero-wrap { position: 'relative'; }

          @keyframes heroFadeInLeft { from{opacity:0;transform:translateX(-40px);}to{opacity:1;transform:translateX(0);} }
          @keyframes heroFadeInUp { from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);} }
          @keyframes shimmer { 0%{transform:translateX(-100%);}100%{transform:translateX(100%);} }
          @keyframes glowPulse { 0%,100%{opacity:0.4;}50%{opacity:0.7;} }
          @keyframes livePulse { 0%,100%{opacity:1;}50%{opacity:0.3;} }
          @keyframes float { 0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);} }

          .hero-desktop-wrap {
            position: relative;
            width: 100%;
            min-height: 92vh;
            background-image: url(/hero-desktop.png);
            background-size: cover;
            background-position: center right;
            background-repeat: no-repeat;
            display: flex;
            align-items: center;
          }

  .hero-mobile-wrap {
  display: none;
  position: relative;
  width: 100%;
  min-height: 100vh;
  background-image: url(/hero-mobile.png);
  background-size: cover;
  background-position: top center;
  background-repeat: no-repeat;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 40px;
}

          .hero-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, rgba(20,30,45,0.75) 0%, rgba(20,30,45,0.4) 50%, rgba(20,30,45,0.1) 100%);
          }

          .hero-mobile-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(20,30,45,0.8) 0%, rgba(20,30,45,0.3) 60%, rgba(20,30,45,0.1) 100%);
          }

          .hero-canvas {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
          }

          .hero-text-left {
            position: relative;
            z-index: 2;
            max-width: 580px;
            padding: 80px 48px;
            animation: heroFadeInLeft 0.9s ease forwards;
          }

          .hero-text-top {
            position: relative;
            z-index: 2;
            padding: 48px 24px 24px;
            animation: heroFadeInUp 0.9s ease forwards;
            text-align: left;
          }

          .hero-badge {
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
          }

          .hero-title {
            color: white;
            font-size: 52px;
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 18px;
          }

          .hero-title-mobile {
            color: white;
            font-size: 34px;
            font-weight: 800;
            line-height: 1.15;
            margin-bottom: 16px;
          }

          .hero-subtitle {
            color: rgba(255,255,255,0.8);
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 32px;
          }

          .hero-btns {
            display: flex;
            gap: 14px;
            flex-wrap: wrap;
            margin-bottom: 36px;
          }

          .hero-btn-main {
            background: white;
            color: #374655;
            padding: 14px 28px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 15px;
            transition: all 0.3s;
            display: inline-block;
            text-decoration: none;
            position: relative;
            overflow: hidden;
          }

          .hero-btn-main::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            animation: shimmer 2.5s infinite;
          }

          .hero-btn-main:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }

          .hero-btn-sec {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 2px solid rgba(255,255,255,0.4);
            padding: 12px 28px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.3s;
            display: inline-block;
            text-decoration: none;
            backdrop-filter: blur(10px);
          }

          .hero-btn-sec:hover { border-color: white; background: rgba(255,255,255,0.2); transform: translateY(-3px); }

          .hero-stats {
            display: flex;
            gap: 28px;
            padding-top: 28px;
            border-top: 1px solid rgba(255,255,255,0.15);
            flex-wrap: wrap;
          }

          .hero-stat h4 { color: white; font-size: 26px; font-weight: 800; margin-bottom: 2px; }
          .hero-stat p { color: rgba(255,255,255,0.6); font-size: 12px; }

          .hero-live-dot {
            width: 7px;
            height: 7px;
            background: #4ade80;
            border-radius: 50%;
            display: inline-block;
            margin-right: 5px;
            animation: livePulse 1.5s ease-in-out infinite;
          }

          .hero-glow1 {
            position: absolute;
            top: 30%;
            left: 30%;
            width: 300px;
            height: 300px;
            background: rgba(55,70,85,0.25);
            border-radius: 50%;
            filter: blur(80px);
            animation: glowPulse 4s ease-in-out infinite;
            z-index: 1;
          }

          .hero-glow2 {
            position: absolute;
            bottom: 20%;
            left: 10%;
            width: 200px;
            height: 200px;
            background: rgba(100,140,180,0.15);
            border-radius: 50%;
            filter: blur(60px);
            animation: glowPulse 4s ease-in-out infinite 2s;
            z-index: 1;
          }

          .hero-scroll-hint {
            position: absolute;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            color: rgba(255,255,255,0.5);
            font-size: 12px;
            animation: float 2s ease-in-out infinite;
          }

          .hero-scroll-arrow {
            width: 24px;
            height: 24px;
            border-right: 2px solid rgba(255,255,255,0.4);
            border-bottom: 2px solid rgba(255,255,255,0.4);
            transform: rotate(45deg);
          }

          @media (max-width: 768px) {
.hero-desktop-wrap { display: none !important; }
  .hero-mobile-wrap { display: flex !important; }
          }
        `}</style>

        {/* DESKTOP VERSION */}
        <div className="hero-desktop-wrap">
          <div className="hero-overlay" />
          <div className="hero-glow1" />
          <div className="hero-glow2" />
          <canvas id="hero-canvas-desktop" className="hero-canvas" />

          <div className="hero-text-left">
            <span className="hero-badge">🇮🇳 Made for Indian Businesses</span>
            <h1 className="hero-title">
              Scale Your Business<br />with <TypingAnimation />
            </h1>
            <p className="hero-subtitle">
              All-in-one platform for lead generation, CRM, WhatsApp automation, AI photos and inventory management. Built for Indian businesses.
            </p>
            <div className="hero-btns">
              <Link href="/pricing" className="hero-btn-main">Get Started Today →</Link>
              <Link href="/tools" className="hero-btn-sec">Explore Tools</Link>
            </div>
            <div className="hero-stats">
              {[
                { value: '500+', label: 'Businesses Served' },
                { value: '10x', label: 'Faster Leads' },
                { value: '24/7', label: 'Support' },
              ].map(stat => (
                <div key={stat.label} className="hero-stat">
                  <h4>{stat.value}</h4>
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-scroll-hint">
            <div className="hero-scroll-arrow" />
            <span>Scroll</span>
          </div>
        </div>

        {/* MOBILE VERSION */}
        <div className="hero-mobile-wrap">
          <div className="hero-mobile-overlay" />
          <canvas id="hero-canvas-mobile" className="hero-canvas" />

          <div className="hero-text-top">
            <span className="hero-badge">🇮🇳 Made for Indian Businesses</span>
            <h1 className="hero-title-mobile">
              Scale Your Business<br />with <TypingAnimation />
            </h1>
            <p className="hero-subtitle">
              All-in-one platform for lead generation, CRM, WhatsApp automation and more. Built for Indian businesses.
            </p>
            <div className="hero-btns">
              <Link href="/pricing" className="hero-btn-main">Get Started →</Link>
              <Link href="/tools" className="hero-btn-sec">Explore Tools</Link>
            </div>
            <div className="hero-stats">
              {[
                { value: '500+', label: 'Businesses' },
                { value: '10x', label: 'Faster Leads' },
                { value: '24/7', label: 'Support' },
              ].map(stat => (
                <div key={stat.label} className="hero-stat">
                  <h4>{stat.value}</h4>
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>


      </section>

      
      
      

      <CounterBanner />
      {/* Tools */}
      <section className="tools-section">
        <div className="section-header">
          <AnimateOnScroll direction="up">
            <span className="section-tag">Our Tools</span>
            <h2 className="section-title">Everything Your Business Needs</h2>
            <p className="section-subtitle">From lead generation to inventory management — we have got all the tools to automate and scale your business.</p>
          </AnimateOnScroll>
        </div>
        <div className="tools-grid">
          {tools.map((tool, idx) => (
            <AnimateOnScroll key={tool.name} direction="up" delay={idx * 100}>
              <div className="tool-card">
                <div className="tool-card-icon">{tool.icon}</div>
                <h3>{tool.name}</h3>
                <span className={`tool-tag ${tool.tag === 'Built by Us' ? 'own' : 'premium'}`}>{tool.tag}</span>
                <p>{tool.desc}</p>
                <div className="tool-features">
                  {tool.features.map(f => (
                    <div key={f} className="tool-feature">
                      <div className="tool-feature-dot">✓</div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

     
     <ToolPreview />
      {/* How It Works */}
      <section className="how-section">
        <div className="section-header">
          <AnimateOnScroll direction="up">
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">Get Started in 3 Simple Steps</h2>
            <p className="section-subtitle">Start automating your business in minutes — no technical knowledge required.</p>
          </AnimateOnScroll>
        </div>
        <div className="steps-grid">
          {steps.map((step, idx) => (
            <AnimateOnScroll key={step.title} direction="up" delay={idx * 150}>
              <div className="step-card">
                <div className="step-number">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Why ScaleVyapar */}
      <section className="why-section">
        <div className="section-header">
          <AnimateOnScroll direction="up">
            <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'inline-block', marginBottom: '16px' }}>Why ScaleVyapar</span>
            <h2 className="section-title" style={{ color: 'white' }}>Built for Indian Businesses</h2>
            <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>We understand the challenges of growing a business in India.</p>
          </AnimateOnScroll>
        </div>
        <div className="why-grid">
          {[
            { icon: '🇮🇳', title: 'Made for India', desc: 'Built specifically for Indian businesses with local language support, Indian pricing and India-first features.' },
            { icon: '⚡', title: 'All in One Platform', desc: 'No need to juggle multiple tools. Everything you need to run and grow your business is in one place.' },
            { icon: '💰', title: 'Affordable Pricing', desc: 'Enterprise-level automation at startup-friendly prices. Pay only for the tools you actually need.' },
            { icon: '🔧', title: 'Easy to Use', desc: 'No technical knowledge required. If you can use WhatsApp, you can use ScaleVyapar.' },
            { icon: '📞', title: '24/7 Support', desc: 'Our team is always available on WhatsApp to help you get the most out of our platform.' },
            { icon: '🚀', title: 'Grow Faster', desc: 'Businesses using ScaleVyapar generate 10x more leads and close deals 3x faster than before.' },
          ].map((item, idx) => (
            <AnimateOnScroll key={item.title} direction="up" delay={idx * 100}>
              <div className="why-card">
                <div className="why-card-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>



<TestimonialsSection />
     <ComparisonTable />
      {/* CTA */}
      <section className="cta-section">
        <AnimateOnScroll direction="up">
          <div className="cta-box">
            <h2>Ready to Scale Your Business?</h2>
            <p>Join hundreds of Indian businesses already using ScaleVyapar to automate their growth.</p>
            <div className="cta-btns">
              <Link href="/pricing" className="cta-btn-white">View Pricing →</Link>
              <a href="https://wa.me/919314023719" className="cta-btn-wa" target="_blank">💬 Talk to Us on WhatsApp</a>
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer />
    </>
  )
}