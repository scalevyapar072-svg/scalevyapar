import Razorpay from 'razorpay'
import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyApp } from '@/lib/labour-company-app'
import { createCheckoutSummary } from '@/lib/labour-company-checkout'
import { getLabourCompanyWebsiteContent } from '@/lib/labour-company-website'
import { getLabourMarketplaceSnapshot } from '@/lib/labour-marketplace'
import { getLabourMastersSnapshot } from '@/lib/labour-masters'
import {
  filterBusinessTypesByIndustryDependency,
  filterCategoriesByLabourDependency,
  findMatchingMasterOption,
  getVisibleLabourMasterOptions,
  groupLabourMasterOptions,
} from '@/lib/labour-masters-schema'
import { getCompanyPlanAccessEligibility } from '@/lib/labour-plan-utils'
import { resolveCompanyPlanForCheckout } from '@/lib/labour-company-payment'
import { resolveStoredCompanyPlanAmount } from '@/lib/labour-company-free-trial'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured.')
  }

  return {
    keyId,
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    })
  }
}

const normalizeAmountInPaise = (value: number) => Math.max(100, Math.round(value * 100))

type CompanyRazorpayOrderDependencies = {
  requireCompanyApp: typeof requireCompanyApp
  getLabourCompanyWebsiteContent: typeof getLabourCompanyWebsiteContent
  getLabourMarketplaceSnapshot: typeof getLabourMarketplaceSnapshot
  getLabourMastersSnapshot?: typeof getLabourMastersSnapshot
  getCompanyPlanAccessEligibility?: typeof getCompanyPlanAccessEligibility
  resolveCompanyPlanForCheckout: typeof resolveCompanyPlanForCheckout
  getRazorpay: typeof getRazorpay
}

const defaultDependencies: CompanyRazorpayOrderDependencies = {
  requireCompanyApp,
  getLabourCompanyWebsiteContent,
  getLabourMarketplaceSnapshot,
  getLabourMastersSnapshot: () => getLabourMastersSnapshot(),
  getCompanyPlanAccessEligibility: (plan, selection) => getCompanyPlanAccessEligibility(plan, selection),
  resolveCompanyPlanForCheckout,
  getRazorpay,
}

export async function POST(request: NextRequest) {
  return handleCompanyRazorpayOrderPost(request)
}

export async function handleCompanyRazorpayOrderPost(
  request: NextRequest,
  dependencies: CompanyRazorpayOrderDependencies = defaultDependencies,
) {
  try {
    const auth = await dependencies.requireCompanyApp(request)
    const body = await request.json().catch(() => ({}))
    const { content } = await dependencies.getLabourCompanyWebsiteContent()

    const summary = createCheckoutSummary({
      pricingPage: content.pricingPage,
      planSlug: typeof body.plan === 'string' ? body.plan : '',
      billingMode: typeof body.billing === 'string' ? body.billing : '',
      discountCode: typeof body.discountCode === 'string' ? body.discountCode : '',
      gstinOverride: typeof body.gstin === 'string' ? body.gstin : '',
      buyerStateOverride: typeof body.buyerState === 'string' ? body.buyerState : ''
    })

    const snapshot = await dependencies.getLabourMarketplaceSnapshot()
    const company = snapshot.companies.find(item => item.id === auth.companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company account not found.' }, { status: 404 })
    }

    const selectedCompanyPlan = dependencies.resolveCompanyPlanForCheckout(
      snapshot,
      typeof body.plan === 'string' ? body.plan : summary.plan.slug,
      summary
    )
    if (!selectedCompanyPlan) {
      return NextResponse.json({ error: 'No active company plan is available for checkout.' }, { status: 400 })
    }

    if (dependencies.getLabourMastersSnapshot && dependencies.getCompanyPlanAccessEligibility) {
      const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : ''
      const selectedJob = jobId
        ? snapshot.jobPosts.find(job => job.id === jobId && job.companyId === company.id) || null
        : null
      if (!selectedJob || selectedJob.planId !== selectedCompanyPlan.id) {
        return NextResponse.json(
          {
            code: 'PLAN_ACCESS_NOT_ELIGIBLE',
            error: 'A valid saved job selection for this Company plan is required before checkout.',
          },
          { status: 400 },
        )
      }

      const mastersSnapshot = await dependencies.getLabourMastersSnapshot()
      const masterOptionsByKey = groupLabourMasterOptions(mastersSnapshot.options)
      const industryCategoryValue = String(company.industryCategory || '').trim()
      const businessTypeValue = String(company.businessType || '').trim()
      const labourCategoryId = String(selectedJob.categoryId || '').trim()
      const visibleIndustries = getVisibleLabourMasterOptions(masterOptionsByKey.industry_category || [])
      const visibleBusinessTypes = filterBusinessTypesByIndustryDependency(
        masterOptionsByKey.business_type || [],
        masterOptionsByKey.industry_category || [],
        mastersSnapshot.industryBusinessDependencies || [],
        industryCategoryValue,
      )
      const visibleCategories = filterCategoriesByLabourDependency(
        snapshot.categories,
        mastersSnapshot.categoryDependencies || [],
        masterOptionsByKey,
        businessTypeValue,
        industryCategoryValue,
      )
      if (
        !findMatchingMasterOption(visibleIndustries, industryCategoryValue) ||
        !findMatchingMasterOption(visibleBusinessTypes, businessTypeValue) ||
        !visibleCategories.some(category => category.id === labourCategoryId)
      ) {
        return NextResponse.json(
          {
            code: 'PLAN_ACCESS_NOT_ELIGIBLE',
            error: 'The saved Industry, Business Type, or Labour Category selection is no longer valid.',
          },
          { status: 400 },
        )
      }

      const planAccessEligibility = dependencies.getCompanyPlanAccessEligibility(selectedCompanyPlan, {
        industryCategoryValue,
        businessTypeValue,
        labourCategoryId,
      })
      if (!planAccessEligibility.eligible) {
        return NextResponse.json(
          { code: 'PLAN_ACCESS_NOT_ELIGIBLE', error: planAccessEligibility.error },
          { status: 400 },
        )
      }
    }

    const storedPlanAmount = resolveStoredCompanyPlanAmount(selectedCompanyPlan)
    if (storedPlanAmount === null) {
      return NextResponse.json({ error: 'The selected company plan has an invalid stored amount.' }, { status: 400 })
    }
    if (storedPlanAmount === 0) {
      return NextResponse.json(
        {
          code: 'FREE_PLAN_CHECKOUT_NOT_REQUIRED',
          error: 'This zero-value plan does not require checkout.',
          redirectTo: '/labour/company/job-post'
        },
        { status: 400 }
      )
    }

    const { client, keyId } = dependencies.getRazorpay()
    const amount = normalizeAmountInPaise(summary.total)
    const receipt = `rzp_${Date.now().toString(36)}_${auth.companyId.replace(/[^a-z0-9]/gi, '').slice(-8)}`
    const order = await client.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        companyId: company.id,
        companyEmail: company.email,
        checkoutPlanSlug: summary.plan.slug,
        checkoutPlanTitle: summary.planTitle,
        billingMode: summary.billingMode,
        companyPlanId: selectedCompanyPlan.id
      }
    })

    return NextResponse.json({
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planTitle: summary.planTitle,
      companyName: company.companyName,
      contactPerson: company.contactPerson,
      email: company.email,
      mobile: company.mobile,
      companyPlanId: selectedCompanyPlan.id
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Razorpay order.'
    const status = /authorization token/i.test(message) ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
