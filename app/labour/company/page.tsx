import { CompanyIntakeForm } from './company-intake-form'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'

const formatCurrency = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`

export default async function LabourCompanyPage() {
  const snapshot = await getLabourMarketplaceSnapshot()
  const companyPlans = snapshot.plans.filter(plan => plan.audience === 'company' && plan.isActive)
  const categories = snapshot.categories.filter(category => category.isActive)
  const liveJobs = snapshot.jobPosts.filter(jobPost => jobPost.status === 'live').length

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 28px 56px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '34px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg,#0f172a,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: '900', fontSize: '18px' }}>
              LX
            </div>
            <div>
              <p style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '800' }}>ScaleVyapar Labour Exchange</p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Company hiring website for daily-basis labour demand</p>
            </div>
          </div>
          <a href="/login" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #dbe2ea', borderRadius: '14px', padding: '12px 18px', textDecoration: 'none', fontSize: '13px', fontWeight: '800' }}>
            Existing Client Login
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '24px', alignItems: 'start', marginBottom: '28px' }}>
          <div style={{ background: 'linear-gradient(135deg,#0f172a,#172554)', color: '#ffffff', borderRadius: '28px', padding: '34px', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 60px rgba(15,23,42,0.16)' }}>
            <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', right: '120px', bottom: '-70px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(59,130,246,0.12)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.66)' }}>
                For Companies and Contractors
              </p>
              <h1 style={{ margin: '0 0 14px', fontSize: '42px', lineHeight: 1.08, fontWeight: '900', maxWidth: '620px' }}>
                Find the right karighar, labour, electrician, printer helper, or machine staff fast.
              </h1>
              <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.78)', fontSize: '16px', lineHeight: 1.7, maxWidth: '620px' }}>
                This company website is built for daily-basis hiring. Post your requirement once, choose an affordable plan, and let your demand reach the right labour category in the market.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px', padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'rgba(255,255,255,0.64)' }}>Active Categories</p>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>{categories.length}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px', padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'rgba(255,255,255,0.64)' }}>Active Workers</p>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>{snapshot.stats.activeWorkers}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '18px', padding: '16px 18px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'rgba(255,255,255,0.64)' }}>Live Job Posts</p>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>{liveJobs}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {categories.map(category => (
                  <span key={category.id} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', padding: '9px 14px', fontSize: '12px', fontWeight: '700' }}>
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <CompanyIntakeForm
            categories={categories.map(category => ({
              id: category.id,
              name: category.name,
              description: category.description,
              demandLevel: category.demandLevel
            }))}
            plans={companyPlans.map(plan => ({
              id: plan.id,
              name: plan.name,
              planAmount: plan.planAmount,
              registrationFee: plan.registrationFee,
              validityDays: plan.validityDays,
              description: plan.description,
              categoryId: plan.categoryId
            }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #dbe2ea', borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '24px', fontWeight: '900' }}>Why companies use this</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                'Post demand by category and city so the right labour type sees it quickly.',
                'Use low-cost short-validity plans that match daily or urgent requirement cycles.',
                'Track pending companies, active plans, and requirement status from the admin panel.',
                'Connect fashion production needs like stitching and embroidery with broader labour demand in one system.'
              ].map(item => (
                <div key={item} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px 16px', color: '#334155', fontSize: '14px', lineHeight: 1.6 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #dbe2ea', borderRadius: '24px', padding: '24px' }}>
            <h2 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '24px', fontWeight: '900' }}>Company Pricing Plans</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {companyPlans.map(plan => (
                <div key={plan.id} style={{ border: '1px solid #e2e8f0', borderRadius: '18px', padding: '16px 18px', background: plan.categoryId ? '#eff6ff' : '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '16px', fontWeight: '800' }}>{plan.name}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>{plan.description}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, color: '#0f172a', fontSize: '26px', fontWeight: '900' }}>{formatCurrency(plan.planAmount)}</p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{plan.validityDays} days validity</p>
                    </div>
                  </div>
                  <p style={{ margin: '10px 0 0', color: '#334155', fontSize: '13px' }}>
                    Registration fee {formatCurrency(plan.registrationFee)}{plan.categoryId ? ` | Priority category: ${categories.find(category => category.id === plan.categoryId)?.name || plan.categoryId}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
