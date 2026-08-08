import { getReferralProfileByCode, listReferralEligibleCategories } from '@/lib/labour-worker-referral'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type PublicReferralCategory = {
  slug: string
  name: string
  rewardAmount: number
}

export type PublicReferralLookup =
  | {
      status: 'valid'
      referralCode: string
      invitedBy: string
      categories: PublicReferralCategory[]
    }
  | {
      status: 'invalid' | 'inactive' | 'no_categories'
      referralCode: string
      invitedBy?: string
      categories: []
    }

const normalizePublicReferralCode = (value: string) =>
  String(value || '')
    .trim()
    .toUpperCase()

const safeDisplayName = (value: string) => {
  const cleaned = String(value || '').trim()
  if (!cleaned) return 'a Rozgar Worker'
  return cleaned.split(/\s+/).slice(0, 2).join(' ')
}

export const getPublicReferralLandingData = async (code: string): Promise<PublicReferralLookup> => {
  const referralCode = normalizePublicReferralCode(code)
  if (!referralCode) {
    return { status: 'invalid', referralCode: '', categories: [] }
  }

  const profile = await getReferralProfileByCode(referralCode)
  if (!profile) {
    return { status: 'invalid', referralCode, categories: [] }
  }

  const { data: workerRow } = await supabaseAdmin
    .from('labour_workers')
    .select('full_name')
    .eq('id', profile.workerId)
    .maybeSingle()

  const invitedBy = safeDisplayName(String(workerRow?.full_name || ''))

  if (!profile.isActive) {
    return { status: 'inactive', referralCode: profile.referralCode, invitedBy, categories: [] }
  }

  const eligibility = (await listReferralEligibleCategories(profile.id)).filter(item => item.isActive)
  if (eligibility.length === 0) {
    return { status: 'no_categories', referralCode: profile.referralCode, invitedBy, categories: [] }
  }

  const categoryIds = Array.from(new Set(eligibility.map(item => item.categoryId).filter(Boolean)))
  const { data: categoryRows, error: categoryError } = await supabaseAdmin
    .from('labour_categories')
    .select('id,name,slug,is_active')
    .in('id', categoryIds)

  if (categoryError) throw categoryError

  const categoryById = new Map(
    (categoryRows || [])
      .filter(row => row.is_active)
      .map(row => [String(row.id || ''), row])
  )

  const categories = eligibility
    .map(item => {
      const category = categoryById.get(item.categoryId)
      if (!category) return null
      const slug = String(category.slug || '').trim()
      return {
        slug: slug || String(category.id || ''),
        name: String(category.name || 'Referral category'),
        rewardAmount: Number(item.rewardAmount || 0)
      }
    })
    .filter((item): item is PublicReferralCategory => Boolean(item))
    .sort((left, right) => left.name.localeCompare(right.name))

  if (categories.length === 0) {
    return { status: 'no_categories', referralCode: profile.referralCode, invitedBy, categories: [] }
  }

  return {
    status: 'valid',
    referralCode: profile.referralCode,
    invitedBy,
    categories
  }
}
