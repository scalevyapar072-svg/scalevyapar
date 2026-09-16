import { randomUUID } from 'crypto'

import { getLabourMarketplaceSnapshot } from './labour-marketplace'
import { supabaseAdmin } from './supabase-admin'
import { getWorkerLifecycleDateValue } from './worker-lifecycle-evaluator'

export type WorkerPlanRenewalResult = {
  renewed: boolean
  workerId: string
  planId: string
  planValidFrom: string
  planValidUntil: string
}

export type WorkerPlanRenewalDecision = {
  shouldRenew: boolean
  planValidFrom: string
  planValidUntil: string
}

const addDays = (dateValue: string, days: number) => {
  const timestamp = Date.parse(`${dateValue}T00:00:00.000Z`)
  if (!Number.isFinite(timestamp)) {
    throw new Error('The renewal start date is invalid.')
  }

  return new Date(timestamp + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export const buildWorkerPlanRenewalDecision = ({
  currentPlanId,
  requestedPlanId,
  currentPlanValidFrom,
  currentPlanValidUntil,
  currentDateValue,
  validityDays,
}: {
  currentPlanId: string
  requestedPlanId: string
  currentPlanValidFrom: string
  currentPlanValidUntil: string
  currentDateValue: string
  validityDays: number
}): WorkerPlanRenewalDecision => {
  if (
    currentPlanId === requestedPlanId &&
    currentPlanValidUntil.slice(0, 10) >= currentDateValue
  ) {
    return {
      shouldRenew: false,
      planValidFrom: currentPlanValidFrom,
      planValidUntil: currentPlanValidUntil,
    }
  }

  return {
    shouldRenew: true,
    planValidFrom: currentDateValue,
    planValidUntil: addDays(currentDateValue, validityDays),
  }
}

export const renewWorkerPlan = async ({
  workerId,
  planId,
  actor,
  now = new Date(),
}: {
  workerId: string
  planId?: string
  actor: string
  now?: Date
}): Promise<WorkerPlanRenewalResult> => {
  const snapshot = await getLabourMarketplaceSnapshot()
  const worker = snapshot.workers.find(item => item.id === workerId)
  if (!worker) {
    throw new Error('Worker account not found.')
  }

  const requestedPlanId = String(planId || worker.activePlan || '').trim()
  const plan = snapshot.plans.find(
    item => item.id === requestedPlanId && item.audience === 'worker' && item.isActive,
  )
  if (!plan) {
    throw new Error('Select an active worker plan before renewal.')
  }

  const validityDays = plan.planValidityDays > 0 ? plan.planValidityDays : plan.validityDays
  if (validityDays <= 0) {
    throw new Error('The selected worker plan has no valid renewal period.')
  }

  const planValidFrom = getWorkerLifecycleDateValue(now)
  const currentPlanEnd = String(worker.planValidUntil || '').slice(0, 10)
  const decision = buildWorkerPlanRenewalDecision({
    currentPlanId: worker.activePlan,
    requestedPlanId: plan.id,
    currentPlanValidFrom: worker.planValidFrom,
    currentPlanValidUntil: worker.planValidUntil,
    currentDateValue: planValidFrom,
    validityDays,
  })

  if (!decision.shouldRenew) {
    return {
      renewed: false,
      workerId,
      planId: plan.id,
      planValidFrom: decision.planValidFrom,
      planValidUntil: decision.planValidUntil,
    }
  }

  const planValidUntil = decision.planValidUntil

  let renewalQuery = supabaseAdmin
    .from('labour_workers')
    .update({
      active_plan: plan.id,
      plan_valid_from: planValidFrom,
      plan_valid_until: planValidUntil,
      last_wallet_deduction_date: null,
      updated_at: now.toISOString(),
    })
    .eq('id', worker.id)

  renewalQuery = worker.activePlan
    ? renewalQuery.eq('active_plan', worker.activePlan)
    : renewalQuery.is('active_plan', null)
  renewalQuery = currentPlanEnd
    ? renewalQuery.eq('plan_valid_until', currentPlanEnd)
    : renewalQuery.is('plan_valid_until', null)

  const { data, error } = await renewalQuery
    .select('id,active_plan,plan_valid_from,plan_valid_until')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to renew worker plan: ${error.message}`)
  }

  if (!data) {
    const latestSnapshot = await getLabourMarketplaceSnapshot()
    const latestWorker = latestSnapshot.workers.find(item => item.id === worker.id)
    if (
      latestWorker?.activePlan === plan.id &&
      latestWorker.planValidFrom === planValidFrom &&
      latestWorker.planValidUntil === planValidUntil
    ) {
      return {
        renewed: false,
        workerId,
        planId: plan.id,
        planValidFrom,
        planValidUntil,
      }
    }

    throw new Error('Worker plan changed while renewal was being processed. Refresh and try again.')
  }

  const { error: auditError } = await supabaseAdmin.from('labour_audit_logs').insert({
    id: `audit-${randomUUID()}`,
    action: 'renew',
    entity_type: 'workers',
    entity_id: worker.id,
    summary: `Explicit worker plan renewal: ${plan.id} (${planValidFrom} to ${planValidUntil})`,
    actor,
    created_at: now.toISOString(),
  })
  if (auditError) {
    console.error('Worker renewal audit log failed:', auditError)
  }

  return {
    renewed: true,
    workerId,
    planId: plan.id,
    planValidFrom,
    planValidUntil,
  }
}
