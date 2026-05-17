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
  const primaryColor = content.theme.primaryColor
  const accentColor = content.theme.accentColor
  const logoSrc = content.footer.logoSrc || content.theme.logoSrc

  return (
    <>
      <style>{`
        .footer {
          background: ${primaryColor};
          color: white;
          padding: 64px 48px 32px;
        }
        .footer-grid {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 32px;
        }
        .footer-brand {
          display: grid;
          gap: 16px;
        }
        .footer-brand-top {
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }
        .footer-brand-top img {
          height: 42px;
          width: auto;
          border-radius: 10px;
          background: white;
          padding: 4px;
        }
        .footer-brand-name {
          font-size: 18px;
          font-weight: 800;
        }
        .footer-brand p,
        .footer-col p,
        .footer-col a {
          color: rgba(255,255,255,0.72);
          font-size: 14px;
          line-height: 1.7;
          text-decoration: none;
        }
        .footer-col {
          display: grid;
          align-content: start;
          gap: 12px;
        }
        .footer-col h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: white;
        }
        .footer-links {
          display: grid;
          gap: 10px;
        }
        .footer-link:hover {
          color: white;
        }
        .footer-socials {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .footer-social {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.1);
          color: white;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
        }
        .footer-bottom {
          max-width: 1180px;
          margin: 28px auto 0;
          padding-top: 22px;
          border-top: 1px solid rgba(255,255,255,0.12);
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .footer-accent {
          color: ${accentColor};
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
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-brand-top">
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt={content.theme.brandName} />
              ) : null}
              <span className="footer-brand-name">{content.theme.brandName}</span>
            </div>
            <p>{content.footer.description}</p>
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
            <h4>Contact</h4>
            <p>{content.footer.address}</p>
            <p>
              <a href={`tel:${content.footer.phone.replace(/\s+/g, '')}`}>{content.footer.phone}</a>
            </p>
            <p>
              <a href={`mailto:${content.footer.contactEmail}`}>{content.footer.contactEmail}</a>
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{content.footer.copyrightText}</p>
          <p>{content.theme.brandTagline}</p>
        </div>
      </footer>
    </>
  )
}
