import { supabaseAdmin } from './supabase-admin'

const TABLE_NAME = 'worker_referral_settings'
const RECORD_ID = 'global'
const DEFAULT_MINIMUM_WITHDRAWAL_AMOUNT = 250

export type LabourReferralSettings = {
  id: string
  minimumWithdrawalAmount: number
  createdAt: string
  updatedAt: string
}

type LabourReferralSettingsRow = {
  id: string
  minimum_withdrawal_amount: number
  created_at: string
  updated_at: string
}

const roundCurrency = (value: number) => Math.round(Number(value || 0) * 100) / 100

const normalizeText = (value: unknown) => String(value || '').trim()

const formatWholeOrDecimalAmount = (value: number) => {
  const rounded = roundCurrency(value)
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '')
}

const mapSettingsRow = (row: LabourReferralSettingsRow): LabourReferralSettings => ({
  id: normalizeText(row.id),
  minimumWithdrawalAmount: roundCurrency(row.minimum_withdrawal_amount),
  createdAt: normalizeText(row.created_at),
  updatedAt: normalizeText(row.updated_at),
})

const buildDefaultRow = () => {
  const timestamp = new Date().toISOString()

  return {
    id: RECORD_ID,
    minimum_withdrawal_amount: DEFAULT_MINIMUM_WITHDRAWAL_AMOUNT,
    created_at: timestamp,
    updated_at: timestamp,
  }
}

const parseMinimumWithdrawalAmount = (value: unknown) => {
  const amount = roundCurrency(Number(value || 0))
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Minimum withdrawal amount must be greater than zero.')
  }

  return amount
}

const ensureSettingsRow = async (): Promise<LabourReferralSettings> => {
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select('id, minimum_withdrawal_amount, created_at, updated_at')
    .eq('id', RECORD_ID)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (data) {
    return mapSettingsRow(data as LabourReferralSettingsRow)
  }

  const defaultRow = buildDefaultRow()
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from(TABLE_NAME)
    .upsert(defaultRow, { onConflict: 'id' })
    .select('id, minimum_withdrawal_amount, created_at, updated_at')
    .single()

  if (insertError) {
    throw new Error(insertError.message)
  }

  return mapSettingsRow(inserted as LabourReferralSettingsRow)
}

export const getReferralSettings = async () => ensureSettingsRow()

export const getMinimumWithdrawalAmount = async () =>
  (await ensureSettingsRow()).minimumWithdrawalAmount

export const updateReferralSettings = async (input: {
  minimumWithdrawalAmount: unknown
}) => {
  const minimumWithdrawalAmount = parseMinimumWithdrawalAmount(input.minimumWithdrawalAmount)
  const existing = await ensureSettingsRow()
  const updatedAt = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .upsert(
      {
        id: RECORD_ID,
        minimum_withdrawal_amount: minimumWithdrawalAmount,
        created_at: existing.createdAt || updatedAt,
        updated_at: updatedAt,
      },
      { onConflict: 'id' },
    )
    .select('id, minimum_withdrawal_amount, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapSettingsRow(data as LabourReferralSettingsRow)
}

export const formatReferralMinimumWithdrawal = (value: number) =>
  formatWholeOrDecimalAmount(value)
