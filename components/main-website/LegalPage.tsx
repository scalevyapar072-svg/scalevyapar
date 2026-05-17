import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { MainWebsiteContent, MainWebsiteLegalPage } from '@/lib/main-website-content'

export default function LegalPage({
  content,
  page
}: {
  content: MainWebsiteContent
  page: MainWebsiteLegalPage
}) {
  return (
    <>
      <Navbar content={content} />
      <main
        style={{
          minHeight: '100vh',
          background: `linear-gradient(180deg, ${content.theme.backgroundColor} 0%, #ffffff 100%)`,
          padding: '48px 20px 80px',
          color: '#0f172a',
          fontFamily: content.theme.fontFamily || 'system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <span
              style={{
                display: 'inline-flex',
                padding: '8px 14px',
                borderRadius: '999px',
                background: `${content.theme.accentColor}22`,
                color: content.theme.accentColor,
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              {content.theme.brandName}
            </span>
            <h1
              style={{
                fontSize: '40px',
                lineHeight: 1.1,
                margin: '16px 0 10px',
                fontWeight: 900,
              }}
            >
              {page.title}
            </h1>
            <p
              style={{
                margin: 0,
                color: '#475569',
                fontSize: '16px',
                lineHeight: 1.7,
                maxWidth: '760px',
              }}
            >
              {page.description}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '18px' }}>
            {page.sections.map(section => (
              <section
                key={section.title}
                style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.06)',
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: '22px' }}>{section.title}</h2>
                <p style={{ color: '#475569', lineHeight: 1.75, marginBottom: 0 }}>{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer content={content} />
    </>
  )
}
