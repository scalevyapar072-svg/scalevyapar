import Link from 'next/link'
import type { MainWebsiteContent } from '@/lib/main-website-content'

const socialMark = (label: string) => {
  const value = label.toLowerCase()
  if (value.includes('whatsapp')) return 'WA'
  if (value.includes('email')) return 'EM'
  if (value.includes('instagram')) return 'IG'
  if (value.includes('facebook')) return 'FB'
  if (value.includes('linkedin')) return 'IN'
  return label.slice(0, 2).toUpperCase()
}

export default function Footer({ content }: { content: MainWebsiteContent }) {
  const logoSrc = content.footer.logoSrc || content.theme.logoSrc

  return (
    <>
      <style>{`
        .footer {
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.14), transparent 24%),
            linear-gradient(145deg, ${content.theme.darkBackgroundColor}, ${content.theme.primaryColor});
          color: white;
          padding: 64px 48px 32px;
        }
        .footer-shell {
          max-width: 1200px;
          margin: 0 auto;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr 1fr;
          gap: 36px;
        }
        .footer-brand {
          display: grid;
          gap: 16px;
          align-content: start;
        }
        .footer-brand-top {
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }
        .footer-brand-top img {
          height: 44px;
          width: auto;
          object-fit: contain;
        }
        .footer-brand-name {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .footer-description,
        .footer-col a,
        .footer-col p {
          margin: 0;
          color: rgba(255,255,255,0.72);
          font-size: 14px;
          line-height: 1.75;
          text-decoration: none;
        }
        .footer-col {
          display: grid;
          align-content: start;
          gap: 12px;
        }
        .footer-col h4 {
          margin: 0;
          color: white;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .footer-links {
          display: grid;
          gap: 10px;
        }
        .footer-link:hover,
        .footer-contact-link:hover {
          color: white;
        }
        .footer-socials {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .footer-social {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
          transition: transform 0.22s ease, background 0.22s ease;
        }
        .footer-social:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.14);
        }
        .footer-bottom {
          margin-top: 30px;
          padding-top: 22px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .footer-bottom p {
          margin: 0;
          color: rgba(255,255,255,0.55);
          font-size: 13px;
          line-height: 1.6;
        }
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .footer {
            padding: 48px 20px 100px;
          }
          .footer-bottom {
            flex-direction: column;
          }
        }
      `}</style>

      <footer className="footer">
        <div className="footer-shell">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-brand-top">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoSrc} alt={content.theme.brandName} />
                ) : null}
                <h3 className="footer-brand-name">{content.theme.brandName}</h3>
              </div>
              <p className="footer-description">{content.footer.description}</p>
              <div className="footer-socials">
                {content.footer.socialLinks.map(item => (
                  <Link key={`${item.label}-${item.href}`} href={item.href} className="footer-social" target={item.href.startsWith('http') ? '_blank' : undefined}>
                    {socialMark(item.label)}
                  </Link>
                ))}
              </div>
            </div>

            <div className="footer-col">
              <h4>Quick Links</h4>
              <div className="footer-links">
                {content.footer.quickLinks.map(item => (
                  <Link key={`${item.label}-${item.href}`} href={item.href} className="footer-link">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="footer-col">
              <h4>Contact Us</h4>
              <p>{content.footer.address}</p>
              <p>
                <a className="footer-contact-link" href={`tel:${content.footer.phone.replace(/\s+/g, '')}`}>{content.footer.phone}</a>
              </p>
              <p>
                <a className="footer-contact-link" href={`mailto:${content.footer.contactEmail}`}>{content.footer.contactEmail}</a>
              </p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>{content.footer.copyrightText}</p>
            <p>{content.theme.brandTagline}</p>
          </div>
        </div>
      </footer>
    </>
  )
}
