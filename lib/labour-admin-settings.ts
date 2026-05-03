import { promises as fs } from 'fs'
import path from 'path'
import { supabaseAdmin } from './supabase-admin'

export type LabourAdminNotificationTemplates = {
  applicationSubmittedTitle: string
  applicationSubmittedMessage: string
  shortlistedTitle: string
  shortlistedMessage: string
  rejectedTitle: string
  rejectedMessage: string
  walletReminderTitle: string
  walletReminderMessage: string
  adminBroadcastTitle: string
  adminBroadcastMessage: string
}

export type LabourAdminUploadRules = {
  maxPhotoSizeMb: number
  maxDocumentSizeMb: number
  allowedPhotoExtensions: string[]
  allowedDocumentExtensions: string[]
  requireIdentityDocumentUpload: boolean
}

export type LabourAdminKycRules = {
  requireProfilePhoto: boolean
  requireIdentityNumber: boolean
  manualReviewRequired: boolean
  autoRejectBlurredPhoto: boolean
  reviewReminderHours: number
  allowedProofTypes: string[]
}

export type LabourAdminFeeRules = {
  defaultWorkerRegistrationFee: number
  defaultWorkerDailyDeduction: number
  minimumWalletRecharge: number
  defaultCompanyRegistrationFee: number
  defaultCompanyPlanAmount: number
  followUpCreditThreshold: number
}

export type LabourAdminAutomationControls = {
  autoHideInactiveWorkers: boolean
  autoPauseExpiredJobs: boolean
  sendWalletReminderPush: boolean
  sendApplicationStatusPush: boolean
  autoCreateRechargeFollowUps: boolean
  autoEscalatePendingKyc: boolean
  pendingKycEscalationHours: number
}

export type LabourAdminWorkerLanguageControls = {
  enabledWorkerLanguageCodes: string[]
  defaultWorkerLanguageCode: string
  showLanguageSelectionOnFirstOpen: boolean
}

export type LabourAdminWorkerHomeControls = {
  popularCitySuggestions: string[]
}

export type LabourAdminHelpControls = {
  showHeaderHelpButton: boolean
  supportTitle: string
  supportSubtitle: string
  supportWhatsappNumber: string
  supportChatbotUrl: string
  supportPrefilledMessage: string
}

export interface LabourAdminSettings {
  notificationTemplates: LabourAdminNotificationTemplates
  uploadRules: LabourAdminUploadRules
  kycRules: LabourAdminKycRules
  feeRules: LabourAdminFeeRules
  automationControls: LabourAdminAutomationControls
  workerLanguageControls: LabourAdminWorkerLanguageControls
  workerHomeControls: LabourAdminWorkerHomeControls
  helpControls: LabourAdminHelpControls
}

export interface LabourAdminSettingsPayload {
  settings: LabourAdminSettings
  storage: 'supabase' | 'json'
}

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'labour-admin-settings.json')
const TABLE_NAME = 'labour_admin_settings'
const RECORD_ID = 'labour-admin-settings'

export const defaultLabourAdminSettings: LabourAdminSettings = {
  notificationTemplates: {
    applicationSubmittedTitle: 'Application received',
    applicationSubmittedMessage: 'Your application for {{job_title}} has been submitted successfully.',
    shortlistedTitle: 'You are shortlisted',
    shortlistedMessage: 'You have been shortlisted for {{job_title}}. Keep your phone active for the next step.',
    rejectedTitle: 'Application update',
    rejectedMessage: 'Your application for {{job_title}} was not selected this time.',
    walletReminderTitle: 'Wallet recharge needed',
    walletReminderMessage: 'Your wallet is low. Recharge soon to keep company details unlocked.',
    adminBroadcastTitle: 'Important update',
    adminBroadcastMessage: 'Admin shared a new update for active workers.'
  },
  uploadRules: {
    maxPhotoSizeMb: 4,
    maxDocumentSizeMb: 8,
    allowedPhotoExtensions: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
    allowedDocumentExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    requireIdentityDocumentUpload: true
  },
  kycRules: {
    requireProfilePhoto: true,
    requireIdentityNumber: true,
    manualReviewRequired: true,
    autoRejectBlurredPhoto: false,
    reviewReminderHours: 12,
    allowedProofTypes: ['aadhaar', 'pan', 'voter_id', 'driving_license', 'other']
  },
  feeRules: {
    defaultWorkerRegistrationFee: 49,
    defaultWorkerDailyDeduction: 5,
    minimumWalletRecharge: 50,
    defaultCompanyRegistrationFee: 199,
    defaultCompanyPlanAmount: 999,
    followUpCreditThreshold: 100
  },
  automationControls: {
    autoHideInactiveWorkers: true,
    autoPauseExpiredJobs: true,
    sendWalletReminderPush: true,
    sendApplicationStatusPush: true,
    autoCreateRechargeFollowUps: true,
    autoEscalatePendingKyc: true,
    pendingKycEscalationHours: 24
  },
  workerLanguageControls: {
    enabledWorkerLanguageCodes: ['hi', 'en'],
    defaultWorkerLanguageCode: 'hi',
    showLanguageSelectionOnFirstOpen: true
  },
  workerHomeControls: {
    popularCitySuggestions: [
      'Jaipur',
      'Delhi',
      'Mumbai',
      'Bengaluru',
      'Pune',
      'Kolkata',
      'Ahmedabad',
      'Hyderabad',
      'Chennai',
      'Surat',
      'Lucknow',
      'Nagpur',
      'Vadodara',
      'Indore',
      'Patna',
      'Rajkot',
      'Chandigarh',
      'Bhopal',
      'Ludhiana',
      'Kanpur',
      'Nashik',
      'Bhubaneswar'
    ]
  },
  helpControls: {
    showHeaderHelpButton: true,
    supportTitle: 'Need help?',
    supportSubtitle: 'Chat with our team or message us on WhatsApp.',
    supportWhatsappNumber: '',
    supportChatbotUrl: '',
    supportPrefilledMessage: 'Hello Team, I need help with the Rozgar worker app.'
  }
}

const isMissingSupabaseTableError = (message: string | undefined) =>
  typeof message === 'string' && (
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('table')
  )

const normalizeString = (value: unknown, fallback: string) =>
  typeof value === 'string' ? value : fallback

const normalizeBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback

const normalizeNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback
  return value
    .map(item => String(item || '').trim().toLowerCase())
    .filter(Boolean)
}

const normalizeDisplayStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback
  const normalized = value
    .map(item => String(item || '').trim())
    .filter(Boolean)

  return normalized.length > 0 ? Array.from(new Set(normalized)) : fallback
}

const supportedWorkerLanguageCodes = ['hi', 'en']

const normalizeWorkerLanguageCodes = (value: unknown, fallback: string[]) => {
  const normalized = normalizeStringArray(value, fallback)
    .filter(code => supportedWorkerLanguageCodes.includes(code))

  return normalized.length > 0 ? Array.from(new Set(normalized)) : fallback
}

const normalizeWorkerLanguageCode = (value: unknown, fallback: string, enabledCodes: string[]) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (enabledCodes.includes(normalized)) {
    return normalized
  }

  return enabledCodes.includes(fallback) ? fallback : enabledCodes[0]
}

const normalizeSettings = (value: unknown): LabourAdminSettings => {
  const source = value && typeof value === 'object' ? value as Partial<LabourAdminSettings> : {}
  const notificationTemplates = (source.notificationTemplates ?? {}) as Partial<LabourAdminNotificationTemplates>
  const uploadRules = (source.uploadRules ?? {}) as Partial<LabourAdminUploadRules>
  const kycRules = (source.kycRules ?? {}) as Partial<LabourAdminKycRules>
  const feeRules = (source.feeRules ?? {}) as Partial<LabourAdminFeeRules>
  const automationControls = (source.automationControls ?? {}) as Partial<LabourAdminAutomationControls>
  const workerLanguageControls = (source.workerLanguageControls ?? {}) as Partial<LabourAdminWorkerLanguageControls>
  const workerHomeControls = (source.workerHomeControls ?? {}) as Partial<LabourAdminWorkerHomeControls>
  const helpControls = (source.helpControls ?? {}) as Partial<LabourAdminHelpControls>
  const enabledWorkerLanguageCodes = normalizeWorkerLanguageCodes(
    workerLanguageControls.enabledWorkerLanguageCodes,
    defaultLabourAdminSettings.workerLanguageControls.enabledWorkerLanguageCodes
  )

  return {
    notificationTemplates: {
      applicationSubmittedTitle: normalizeString(notificationTemplates.applicationSubmittedTitle, defaultLabourAdminSettings.notificationTemplates.applicationSubmittedTitle),
      applicationSubmittedMessage: normalizeString(notificationTemplates.applicationSubmittedMessage, defaultLabourAdminSettings.notificationTemplates.applicationSubmittedMessage),
      shortlistedTitle: normalizeString(notificationTemplates.shortlistedTitle, defaultLabourAdminSettings.notificationTemplates.shortlistedTitle),
      shortlistedMessage: normalizeString(notificationTemplates.shortlistedMessage, defaultLabourAdminSettings.notificationTemplates.shortlistedMessage),
      rejectedTitle: normalizeString(notificationTemplates.rejectedTitle, defaultLabourAdminSettings.notificationTemplates.rejectedTitle),
      rejectedMessage: normalizeString(notificationTemplates.rejectedMessage, defaultLabourAdminSettings.notificationTemplates.rejectedMessage),
      walletReminderTitle: normalizeString(notificationTemplates.walletReminderTitle, defaultLabourAdminSettings.notificationTemplates.walletReminderTitle),
      walletReminderMessage: normalizeString(notificationTemplates.walletReminderMessage, defaultLabourAdminSettings.notificationTemplates.walletReminderMessage),
      adminBroadcastTitle: normalizeString(notificationTemplates.adminBroadcastTitle, defaultLabourAdminSettings.notificationTemplates.adminBroadcastTitle),
      adminBroadcastMessage: normalizeString(notificationTemplates.adminBroadcastMessage, defaultLabourAdminSettings.notificationTemplates.adminBroadcastMessage)
    },
    uploadRules: {
      maxPhotoSizeMb: normalizeNumber(uploadRules.maxPhotoSizeMb, defaultLabourAdminSettings.uploadRules.maxPhotoSizeMb),
      maxDocumentSizeMb: normalizeNumber(uploadRules.maxDocumentSizeMb, defaultLabourAdminSettings.uploadRules.maxDocumentSizeMb),
      allowedPhotoExtensions: normalizeStringArray(uploadRules.allowedPhotoExtensions, defaultLabourAdminSettings.uploadRules.allowedPhotoExtensions),
      allowedDocumentExtensions: normalizeStringArray(uploadRules.allowedDocumentExtensions, defaultLabourAdminSettings.uploadRules.allowedDocumentExtensions),
      requireIdentityDocumentUpload: normalizeBoolean(uploadRules.requireIdentityDocumentUpload, defaultLabourAdminSettings.uploadRules.requireIdentityDocumentUpload)
    },
    kycRules: {
      requireProfilePhoto: normalizeBoolean(kycRules.requireProfilePhoto, defaultLabourAdminSettings.kycRules.requireProfilePhoto),
      requireIdentityNumber: normalizeBoolean(kycRules.requireIdentityNumber, defaultLabourAdminSettings.kycRules.requireIdentityNumber),
      manualReviewRequired: normalizeBoolean(kycRules.manualReviewRequired, defaultLabourAdminSettings.kycRules.manualReviewRequired),
      autoRejectBlurredPhoto: normalizeBoolean(kycRules.autoRejectBlurredPhoto, defaultLabourAdminSettings.kycRules.autoRejectBlurredPhoto),
      reviewReminderHours: normalizeNumber(kycRules.reviewReminderHours, defaultLabourAdminSettings.kycRules.reviewReminderHours),
      allowedProofTypes: normalizeStringArray(kycRules.allowedProofTypes, defaultLabourAdminSettings.kycRules.allowedProofTypes)
    },
    feeRules: {
      defaultWorkerRegistrationFee: normalizeNumber(feeRules.defaultWorkerRegistrationFee, defaultLabourAdminSettings.feeRules.defaultWorkerRegistrationFee),
      defaultWorkerDailyDeduction: normalizeNumber(feeRules.defaultWorkerDailyDeduction, defaultLabourAdminSettings.feeRules.defaultWorkerDailyDeduction),
      minimumWalletRecharge: normalizeNumber(feeRules.minimumWalletRecharge, defaultLabourAdminSettings.feeRules.minimumWalletRecharge),
      defaultCompanyRegistrationFee: normalizeNumber(feeRules.defaultCompanyRegistrationFee, defaultLabourAdminSettings.feeRules.defaultCompanyRegistrationFee),
      defaultCompanyPlanAmount: normalizeNumber(feeRules.defaultCompanyPlanAmount, defaultLabourAdminSettings.feeRules.defaultCompanyPlanAmount),
      followUpCreditThreshold: normalizeNumber(feeRules.followUpCreditThreshold, defaultLabourAdminSettings.feeRules.followUpCreditThreshold)
    },
    automationControls: {
      autoHideInactiveWorkers: normalizeBoolean(automationControls.autoHideInactiveWorkers, defaultLabourAdminSettings.automationControls.autoHideInactiveWorkers),
      autoPauseExpiredJobs: normalizeBoolean(automationControls.autoPauseExpiredJobs, defaultLabourAdminSettings.automationControls.autoPauseExpiredJobs),
      sendWalletReminderPush: normalizeBoolean(automationControls.sendWalletReminderPush, defaultLabourAdminSettings.automationControls.sendWalletReminderPush),
      sendApplicationStatusPush: normalizeBoolean(automationControls.sendApplicationStatusPush, defaultLabourAdminSettings.automationControls.sendApplicationStatusPush),
      autoCreateRechargeFollowUps: normalizeBoolean(automationControls.autoCreateRechargeFollowUps, defaultLabourAdminSettings.automationControls.autoCreateRechargeFollowUps),
      autoEscalatePendingKyc: normalizeBoolean(automationControls.autoEscalatePendingKyc, defaultLabourAdminSettings.automationControls.autoEscalatePendingKyc),
      pendingKycEscalationHours: normalizeNumber(automationControls.pendingKycEscalationHours, defaultLabourAdminSettings.automationControls.pendingKycEscalationHours)
    },
    workerLanguageControls: {
      enabledWorkerLanguageCodes,
      defaultWorkerLanguageCode: normalizeWorkerLanguageCode(
        workerLanguageControls.defaultWorkerLanguageCode,
        defaultLabourAdminSettings.workerLanguageControls.defaultWorkerLanguageCode,
        enabledWorkerLanguageCodes
      ),
      showLanguageSelectionOnFirstOpen: normalizeBoolean(
        workerLanguageControls.showLanguageSelectionOnFirstOpen,
        defaultLabourAdminSettings.workerLanguageControls.showLanguageSelectionOnFirstOpen
      )
    },
    workerHomeControls: {
      popularCitySuggestions: normalizeDisplayStringArray(
        workerHomeControls.popularCitySuggestions,
        defaultLabourAdminSettings.workerHomeControls.popularCitySuggestions
      )
    },
    helpControls: {
      showHeaderHelpButton: normalizeBoolean(
        helpControls.showHeaderHelpButton,
        defaultLabourAdminSettings.helpControls.showHeaderHelpButton
      ),
      supportTitle: normalizeString(
        helpControls.supportTitle,
        defaultLabourAdminSettings.helpControls.supportTitle
      ),
      supportSubtitle: normalizeString(
        helpControls.supportSubtitle,
        defaultLabourAdminSettings.helpControls.supportSubtitle
      ),
      supportWhatsappNumber: normalizeString(
        helpControls.supportWhatsappNumber,
        defaultLabourAdminSettings.helpControls.supportWhatsappNumber
      ),
      supportChatbotUrl: normalizeString(
        helpControls.supportChatbotUrl,
        defaultLabourAdminSettings.helpControls.supportChatbotUrl
      ),
      supportPrefilledMessage: normalizeString(
        helpControls.supportPrefilledMessage,
        defaultLabourAdminSettings.helpControls.supportPrefilledMessage
      )
    }
  }
}

const readJsonSettings = async () => {
  try {
    const content = await fs.readFile(DATA_FILE_PATH, 'utf8')
    return normalizeSettings(JSON.parse(content))
  } catch {
    return defaultLabourAdminSettings
  }
}

const writeJsonSettings = async (settings: LabourAdminSettings) => {
  await fs.writeFile(DATA_FILE_PATH, `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
}

const readSupabaseSettings = async () => {
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select('settings_json')
    .eq('id', RECORD_ID)
    .maybeSingle()

  if (error && isMissingSupabaseTableError(error.message)) {
    return null
  }

  if (error) {
    throw new Error(error.message)
  }

  return data ? normalizeSettings(data.settings_json) : defaultLabourAdminSettings
}

const writeSupabaseSettings = async (settings: LabourAdminSettings) => {
  const { error } = await supabaseAdmin.from(TABLE_NAME).upsert({
    id: RECORD_ID,
    settings_json: settings,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' })

  if (error && isMissingSupabaseTableError(error.message)) {
    return false
  }

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const getLabourAdminSettings = async (): Promise<LabourAdminSettingsPayload> => {
  const supabaseSettings = await readSupabaseSettings()
  if (supabaseSettings) {
    return { settings: supabaseSettings, storage: 'supabase' }
  }

  return {
    settings: await readJsonSettings(),
    storage: 'json'
  }
}

export const saveLabourAdminSettings = async (value: unknown): Promise<LabourAdminSettingsPayload> => {
  const settings = normalizeSettings(value)
  const wroteToSupabase = await writeSupabaseSettings(settings)
  if (wroteToSupabase) {
    return { settings, storage: 'supabase' }
  }

  await writeJsonSettings(settings)
  return { settings, storage: 'json' }
}
