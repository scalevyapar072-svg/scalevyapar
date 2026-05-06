import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import PricingCalculator from './PricingCalculatorClient'

export default function PricingPage() {
  return (
    <>
      <style>{`
        .pricing-hero { background: #374655; padding: 80px 48px; text-align: center; position: relative; overflow: hidden; }
        .pricing-hero::before { content: ''; position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: rgba(255,255,255,0.04); border-radius: 50%; animation: pulse 4s ease-in-out infinite; }
        .pricing-hero::after { content: ''; position: absolute; bottom: -100px; left: -100px; width: 300px; height: 300px; background: rgba(255,255,255,0.04); border-radius: 50%; animation: pulse 4s ease-in-out infinite 2s; }
        @keyframes pulse { 0%,100%{transform:scale(1);}50%{transform:scale(1.05);} }
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-30px);}to{opacity:1;transform:translateY(0);} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);} }
        .pricing-hero h1 { color: white; font-size: 42px; font-weight: 800; margin-bottom: 16px; position: relative; animation: fadeInDown 0.8s ease; }
        .pricing-hero p { color: rgba(255,255,255,0.7); font-size: 17px; max-width: 600px; margin: 0 auto; line-height: 1.7; position: relative; animation: fadeInUp 0.8s ease 0.2s both; }
        .pricing-section { background: #f8fafc; padding: 80px 48px; }
        .pricing-container { max-width: 900px; margin: 0 auto; }
        .section-label { background: #374655; color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 16px; }
        .faq-section { background: white; padding: 80px 48px; }
        .faq-item { border-bottom: 1px solid #f1f5f9; padding: 24px 0; transition: all 0.2s; }
        .faq-item:hover { padding-left: 8px; }
        .faq-item h4 { color: #1e293b; font-size: 16px; font-weight: 700; margin-bottom: 10px; }
        .faq-item p { color: #64748b; font-size: 14px; line-height: 1.7; }
        .cta-strip { background: #374655; padding: 60px 48px; text-align: center; position: relative; overflow: hidden; }
        .cta-strip::before { content: ''; position: absolute; top: -80px; right: -80px; width: 300px; height: 300px; background: rgba(255,255,255,0.05); border-radius: 50%; }
        .cta-strip h2 { color: white; font-size: 28px; font-weight: 800; margin-bottom: 12px; position: relative; }
        .cta-strip p { color: rgba(255,255,255,0.7); font-size: 15px; margin-bottom: 24px; position: relative; }
        .whatsapp-btn { background: #25d366; color: white; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; transition: all 0.3s; text-decoration: none; position: relative; }
        .whatsapp-btn:hover { background: #20b958; transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.2); }
        @media (max-width: 768px) {
          .pricing-hero { padding: 60px 20px; }
          .pricing-hero h1 { font-size: 28px; }
          .pricing-section { padding: 40px 20px; }
          .faq-section { padding: 60px 20px; }
          .cta-strip { padding: 40px 20px; }
        }
      `}</style>

      <Navbar />

      <section className="pricing-hero">
        <h1>Build Your Own Plan 🎯</h1>
        <p>Choose only the tools your business needs. Pay for what you use — no hidden fees, no long term contracts.</p>
      </section>

      <section className="pricing-section">
        <div className="pricing-container">
          <AnimateOnScroll direction="up">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span className="section-label">Custom Plan Builder</span>
              <h2 style={{ color: '#1e293b', fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>Choose Your Tools</h2>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.7' }}>Select the tools you need and get a monthly credit subscription. Buy extra credits anytime you run out.</p>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll direction="up" delay={200}>
            <PricingCalculator />
          </AnimateOnScroll>
        </div>
      </section>

      <section className="faq-section">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <AnimateOnScroll direction="up">
            <h2 style={{ color: '#1e293b', fontSize: '28px', fontWeight: '800', marginBottom: '32px', textAlign: 'center' }}>Frequently Asked Questions</h2>
          </AnimateOnScroll>
          {[
            { q: 'What are credits?', a: 'Credits are the currency used inside ScaleVyapar. Every time you use a tool — extract leads, generate photos, or use any service — credits are deducted. Each action costs 100 credits.' },
            { q: 'What happens when my credits run out?', a: 'When your monthly credits run out you can buy extra credit packs instantly. Your subscription continues and resets next month.' },
            { q: 'Can I change my plan anytime?', a: 'Yes! You can add or remove tools anytime. Changes take effect from the next billing cycle.' },
            { q: 'Is there a free trial?', a: 'Yes we offer a 7 day free trial for all new clients with 200 free credits. No credit card required.' },
            { q: 'How does the Website Builder work?', a: 'Website Builder is a one time payment to build your website. After that modifications are included in your monthly subscription credits.' },
            { q: 'Do you provide training?', a: 'Yes! We provide free onboarding training for all clients via WhatsApp and video call.' },
            { q: 'What payment methods do you accept?', a: 'We accept UPI, bank transfer, and all major credit and debit cards.' },
          ].map((faq, idx) => (
            <AnimateOnScroll key={faq.q} direction="up" delay={idx * 80}>
              <div className="faq-item">
                <h4>{faq.q}</h4>
                <p>{faq.a}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      <section className="cta-strip">
        <AnimateOnScroll direction="up">
          <h2>Not sure which tools you need?</h2>
          <p>Talk to our team on WhatsApp and we will help you choose the right plan for your business.</p>
          <a href="https://wa.me/919314023719" className="whatsapp-btn" target="_blank">
            💬 Chat on WhatsApp
          </a>
        </AnimateOnScroll>
      </section>

      <Footer />
    </>
  )
}