import Link from 'next/link'

export default function Footer() {
  return (
    <>
      <style>{`
        .footer { background: #374655; color: white; padding: 60px 48px 30px; }
        .footer-grid { display: grid; gridTemplateColumns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
        .footer-brand img { height: 38px; margin-bottom: 16px; }
        .footer-brand p { color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.7; max-width: 280px; }
        .footer-col h4 { color: white; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
        .footer-col a { display: block; color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 10px; transition: color 0.2s; }
        .footer-col a:hover { color: white; }
        .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .footer-bottom p { color: rgba(255,255,255,0.4); font-size: 13px; }
        .social-links { display: flex; gap: 12px; }
        .social-link { width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: background 0.2s; }
        .social-link:hover { background: rgba(255,255,255,0.2); }
        .contact-info { display: flex; flex-direction: column; gap: 8px; }
        .contact-item { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.6); font-size: 14px; }
        @media (max-width: 768px) {
          .footer { padding: 40px 20px 24px; }
          .footer-grid { grid-template-columns: 1fr; gap: 32px; }
          .footer-bottom { flex-direction: column; text-align: center; }
        }
      `}</style>

      <footer className="footer">
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">
            <img src="/logo.png" alt="ScaleVyapar" />
            <p>All-in-one business automation platform for Indian businesses. Scale faster with our powerful tools.</p>
            <div className="social-links" style={{ marginTop: '20px' }}>
              <a href="https://wa.me/919314023719" className="social-link" target="_blank">💬</a>
              <a href="mailto:scalevyapar072@gmail.com" className="social-link">📧</a>
            </div>
          </div>

          {/* Tools */}
          <div className="footer-col">
            <h4>Our Tools</h4>
            <Link href="/tools">🎯 LeadRadar</Link>
            <Link href="/tools">📸 Vizora</Link>
            <Link href="/tools">👥 Callyzer</Link>
            <Link href="/tools">💬 BotBee</Link>
            <Link href="/tools">📦 Inventory</Link>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link href="/">Home</Link>
            <Link href="/about">About Us</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link href="/user-data-deletion">User Data Deletion</Link>
            <Link href="https://scalevyapar.vercel.app/login" target="_blank">Login</Link>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Contact Us</h4>
            <div className="contact-info">
              <div className="contact-item">
                <span>📍</span>
                <span>Jaipur, Rajasthan</span>
              </div>
              <div className="contact-item">
                <span>📞</span>
                <a href="tel:+919314023719">+91 9314023719</a>
              </div>
              <div className="contact-item">
                <span>📧</span>
                <a href="mailto:scalevyapar072@gmail.com">scalevyapar072@gmail.com</a>
              </div>
              <div className="contact-item">
                <span>💬</span>
                <a href="https://wa.me/919314023719" target="_blank">WhatsApp Us</a>
              </div>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© 2026 ScaleVyapar. All rights reserved. Made with ❤️ in Jaipur, India 🇮🇳</p>
          <p>Business Automation Platform</p>
        </div>
      </footer>
    </>
  )
}
