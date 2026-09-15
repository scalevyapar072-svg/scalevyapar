export default function LabourCompanyLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      style={{
        minHeight: '100vh',
        background: '#f8fbff',
        color: '#0f172a',
        padding: '24px 16px',
      }}
    >
      <div style={{ width: 'min(1120px, 100%)', margin: '0 auto', display: 'grid', gap: '16px' }}>
        <div style={{ height: '72px', borderRadius: '18px', background: '#ffffff', border: '1px solid #dbe7f0' }} />
        <section style={{ minHeight: '280px', borderRadius: '24px', background: '#e8f4f6', border: '1px solid #cfe6e8', padding: '28px' }}>
          <p style={{ margin: 0, color: '#0f766e', fontSize: '13px', fontWeight: 700 }}>Loading ScaleVyapar Rozgar…</p>
          <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '13px' }}>Preparing the next page.</p>
        </section>
      </div>
    </main>
  )
}
