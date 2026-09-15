export default function LabourAdminLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      style={{ minHeight: '100vh', background: '#f6f8fb', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start' }}
    >
      <aside style={{ background: 'linear-gradient(180deg, #0b2f3a, #0f172a)', padding: '24px', color: '#d7f4f1', flex: '1 1 240px' }}>
        <strong style={{ fontSize: '15px' }}>Labour Exchange</strong>
        <p style={{ fontSize: '12px', color: '#9cc9c5' }}>Loading navigation…</p>
      </aside>
      <section style={{ padding: '24px', flex: '999 1 420px', minWidth: 0 }}>
        <div style={{ minHeight: '180px', border: '1px solid #dce4ef', borderRadius: '20px', background: '#ffffff', padding: '20px' }}>
          <p style={{ margin: 0, color: '#0f766e', fontSize: '13px', fontWeight: 700 }}>Loading Labour Admin…</p>
        </div>
      </section>
    </main>
  )
}
