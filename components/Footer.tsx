import Link from 'next/link'
import { defaultMainWebsiteContent } from '@/data/main-website-content'

type FooterProps = {
  content?: typeof defaultMainWebsiteContent.footer
}

export default function Footer({ content = defaultMainWebsiteContent.footer }: FooterProps) {
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
          <div className="footer-brand">
            <img src={content.logoSrc} alt="ScaleVyapar" />
            <p>{content.description}</p>
            <div className="social-links" style={{ marginTop: '20px' }}>
              {content.socialLinks.map(link => (
                <a key={`${link.label}-${link.href}`} href={link.href} className="social-link" target="_blank" rel="noreferrer" aria-label={link.label}>
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-col">
            <h4>Our Tools</h4>
            {content.toolLinks.map(link => (
              <Link key={`${link.label}-${link.href}`} href={link.href}>{link.label}</Link>
            ))}
          </div>

          <div className="footer-col">
            <h4>Quick Links</h4>
            {content.quickLinks.map(link => (
              <Link key={`${link.label}-${link.href}`} href={link.href}>{link.label}</Link>
            ))}
          </div>

          <div className="footer-col">
            <h4>Contact Us</h4>
            <div className="contact-info">
              {content.contactItems.map(item => (
                <div key={`${item.icon}-${item.label}`} className="contact-item">
                  <span>{item.icon}</span>
                  {item.href ? (
                    <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined}>
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{content.copyrightText}</p>
          <p>{content.secondaryText}</p>
        </div>
      </footer>
    </>
  )
}
