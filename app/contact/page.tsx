'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnimateOnScroll from '@/components/AnimateOnScroll'
import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', business: '', message: '', tool: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const msg = `Hi ScaleVyapar! I want to know more about your services.%0A%0AName: ${form.name}%0AEmail: ${form.email}%0APhone: ${form.phone}%0ABusiness: ${form.business}%0ATool Interested In: ${form.tool}%0AMessage: ${form.message}`
    window.open(`https://wa.me/919314023719?text=${msg}`, '_blank')
    setSubmitted(true)
  }

  return (
    <>
      <style>{`
        .contact-hero { background: #374655; padding: 80px 48px; text-align: center; position: relative; overflow: hidden; }
        .contact-hero::before { content: ''; position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: rgba(255,255,255,0.04); border-radius: 50%; animation: pulse 4s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1);}50%{transform:scale(1.05);} }
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-30px);}to{opacity:1;transform:translateY(0);} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);} }
        .contact-hero h1 { color: white; font-size: 42px; font-weight: 800; margin-bottom: 16px; position: relative; animation: fadeInDown 0.8s ease; }
        .contact-hero p { color: rgba(255,255,255,0.7); font-size: 17px; max-width: 600px; margin: 0 auto; line-height: 1.7; position: relative; animation: fadeInUp 0.8s ease 0.2s both; }
        .contact-section { background: #f8fafc; padding: 80px 48px; }
        .contact-container { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1.5fr; gap: 48px; align-items: start; }
        .contact-info h2 { color: #1e293b; font-size: 28px; font-weight: 800; margin-bottom: 24px; }
        .contact-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 12px; display: flex; align-items: center; gap: 14px; transition: all 0.3s; text-decoration: none; }
        .contact-card:hover { border-color: #374655; box-shadow: 0 8px 24px rgba(55,70,85,0.12); transform: translateX(4px); }
        .contact-card-icon { width: 44px; height: 44px; background: #374655; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; transition: all 0.3s; }
        .contact-card:hover .contact-card-icon { transform: scale(1.1); }
        .contact-card h4 { color: #1e293b; font-size: 14px; font-weight: 700; margin-bottom: 2px; }
        .contact-card p { color: #374655; font-size: 14px; font-weight: 600; }
        .contact-card span { color: #64748b; font-size: 12px; }
        .wa-card { background: #374655 !important; border: none !important; }
        .wa-card h4 { color: rgba(255,255,255,0.7) !important; }
        .wa-card p { color: white !important; font-size: 16px !important; }
        .wa-card span { color: rgba(255,255,255,0.6) !important; }
        .wa-card .contact-card-icon { background: rgba(255,255,255,0.15) !important; }
        .contact-form-box { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 36px; }
        .contact-form-box h2 { color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 24px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-group { margin-bottom: 14px; }
        .form-group label { color: #1e293b; font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px; }
        .form-input { width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; color: #1e293b; font-size: 14px; outline: none; transition: all 0.2s; font-family: system-ui; box-sizing: border-box; }
        .form-input:focus { border-color: #374655; box-shadow: 0 0 0 3px rgba(55,70,85,0.08); }
        .form-select { width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; color: #1e293b; font-size: 14px; outline: none; cursor: pointer; box-sizing: border-box; transition: all 0.2s; }
        .form-select:focus { border-color: #374655; }
        .submit-btn { width: 100%; background: #374655; color: white; border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s; margin-top: 8px; }
        .submit-btn:hover { background: #4a5a6a; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(55,70,85,0.3); }
        .success-box { background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 16px; padding: 40px; text-align: center; animation: fadeInUp 0.6s ease; }
        .success-icon { font-size: 56px; margin-bottom: 16px; animation: bounce 0.6s ease; }
        @keyframes bounce { 0%,100%{transform:scale(1);}50%{transform:scale(1.2);} }
        .success-box h3 { color: #15803d; font-size: 22px; font-weight: 800; margin-bottom: 8px; }
        .success-box p { color: #64748b; font-size: 14px; line-height: 1.6; }
        .hours-box { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-top: 8px; }
        .hours-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .faq-section { background: white; padding: 80px 48px; }
        .faq-container { max-width: 800px; margin: 0 auto; }
        .faq-item { border-bottom: 1px solid #f1f5f9; padding: 24px 0; transition: all 0.2s; }
        .faq-item:hover { padding-left: 8px; }
        .faq-item h4 { color: #1e293b; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .faq-item p { color: #64748b; font-size: 14px; line-height: 1.7; }
        .cta-strip { background: #374655; padding: 60px 48px; text-align: center; position: relative; overflow: hidden; }
        .cta-strip::before { content: ''; position: absolute; top: -80px; right: -80px; width: 300px; height: 300px; background: rgba(255,255,255,0.05); border-radius: 50%; }
        .cta-strip h2 { color: white; font-size: 28px; font-weight: 800; margin-bottom: 12px; position: relative; }
        .cta-strip p { color: rgba(255,255,255,0.7); font-size: 15px; margin-bottom: 24px; position: relative; }
        .wa-big-btn { background: #25d366; color: white; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; text-decoration: none; transition: all 0.3s; position: relative; }
        .wa-big-btn:hover { background: #20b958; transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,0.2); }
        @media (max-width: 768px) {
          .contact-hero { padding: 60px 20px; }
          .contact-hero h1 { font-size: 28px; }
          .contact-section { padding: 40px 20px; }
          .contact-container { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .faq-section { padding: 60px 20px; }
          .cta-strip { padding: 40px 20px; }
        }
      `}</style>

      <Navbar />

      <section className="contact-hero">
        <h1>Get in Touch 📞</h1>
        <p>Have questions about ScaleVyapar? We are here to help. Reach out on WhatsApp for the fastest response.</p>
      </section>

      <section className="contact-section">
        <div className="contact-container">
          <AnimateOnScroll direction="left">
            <div className="contact-info">
              <h2>Contact Information</h2>
              <a href="https://wa.me/919314023719" className="contact-card wa-card" target="_blank">
                <div className="contact-card-icon">💬</div>
                <div>
                  <h4>WhatsApp — Fastest Response</h4>
                  <p>+91 9314023719</p>
                  <span>Usually replies within minutes</span>
                </div>
              </a>
              <a href="tel:+919314023719" className="contact-card">
                <div className="contact-card-icon">📞</div>
                <div>
                  <h4>Phone</h4>
                  <p>+91 9314023719</p>
                  <span>Mon–Sat, 9AM–7PM IST</span>
                </div>
              </a>
              <a href="mailto:scalevyapar072@gmail.com" className="contact-card">
                <div className="contact-card-icon">📧</div>
                <div>
                  <h4>Email</h4>
                  <p>scalevyapar072@gmail.com</p>
                  <span>Response within 24 hours</span>
                </div>
              </a>
              <div className="contact-card" style={{ cursor: 'default' }}>
                <div className="contact-card-icon">📍</div>
                <div>
                  <h4>Location</h4>
                  <p>Jaipur, Rajasthan</p>
                  <span>India 🇮🇳</span>
                </div>
              </div>
              <div className="hours-box">
                <h4 style={{ color: '#1e293b', fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>🕐 Business Hours</h4>
                {[
                  { day: 'Monday — Friday', time: '9:00 AM — 7:00 PM' },
                  { day: 'Saturday', time: '10:00 AM — 5:00 PM' },
                  { day: 'Sunday', time: 'WhatsApp Support Only' },
                ].map(h => (
                  <div key={h.day} className="hours-row">
                    <span style={{ color: '#64748b' }}>{h.day}</span>
                    <span style={{ color: '#374655', fontWeight: '600' }}>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll direction="right">
            <div className="contact-form-box">
              {submitted ? (
                <div className="success-box">
                  <div className="success-icon">🎉</div>
                  <h3>Message Sent Successfully!</h3>
                  <p>Thank you for reaching out! Your message has been sent to our WhatsApp. Our team will get back to you within minutes.</p>
                  <button onClick={() => setSubmitted(false)} style={{ marginTop: '20px', background: '#374655', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2>Send Us a Message</h2>
                  <form onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input className="form-input" type="text" placeholder="Your name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                      </div>
                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input className="form-input" type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email Address</label>
                        <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label>Business Name</label>
                        <input className="form-input" type="text" placeholder="Your business" value={form.business} onChange={e => setForm(p => ({ ...p, business: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Tool Interested In</label>
                      <select className="form-select" value={form.tool} onChange={e => setForm(p => ({ ...p, tool: e.target.value }))}>
                        <option value="">Select a tool...</option>
                        <option>LeadRadar — Lead Generation</option>
                        <option>Vizora — AI Photos</option>
                        <option>Website Builder</option>
                        <option>CRM & Call Management</option>
                        <option>WhatsApp Automation</option>
                        <option>Inventory Management</option>
                        <option>Full Platform — All Tools</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Message *</label>
                      <textarea className="form-input" placeholder="Tell us about your business and what you need help with..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={4} required style={{ resize: 'vertical' }} />
                    </div>
                    <button type="submit" className="submit-btn">
                      💬 Send Message on WhatsApp →
                    </button>
                  </form>
                </>
              )}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="faq-section">
        <div className="faq-container">
          <AnimateOnScroll direction="up">
            <h2 style={{ color: '#1e293b', fontSize: '28px', fontWeight: '800', marginBottom: '32px', textAlign: 'center' }}>Common Questions</h2>
          </AnimateOnScroll>
          {[
            { q: 'How quickly can I get started?', a: 'Once you contact us on WhatsApp and confirm your plan, we set up your account within 24 hours. You can start using all your tools immediately after setup.' },
            { q: 'Do you offer a free trial?', a: 'Yes! We offer a 7 day free trial with 200 credits so you can test the platform before committing. No credit card required.' },
            { q: 'What kind of support do you provide?', a: 'We provide 24/7 WhatsApp support, free onboarding training via video call, and ongoing help whenever you need it.' },
            { q: 'Can you help set up the tools for me?', a: 'Absolutely! Our team will help you get set up, configure your tools and train your team so you get the best results from day one.' },
            { q: 'Is my data safe and secure?', a: 'Yes. We take data security very seriously. All your data is encrypted and stored securely. We never share your data with third parties.' },
          ].map((faq, idx) => (
            <AnimateOnScroll key={faq.q} direction="up" delay={idx * 100}>
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
          <h2>Ready to Scale Your Business?</h2>
          <p>Message us on WhatsApp right now and get started within 24 hours!</p>
          <a href="https://wa.me/919314023719?text=Hi! I want to know more about ScaleVyapar." className="wa-big-btn" target="_blank">
            💬 Message Us on WhatsApp
          </a>
        </AnimateOnScroll>
      </section>

      <Footer />
    </>
  )
}