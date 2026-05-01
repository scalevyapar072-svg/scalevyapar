import { promises as fs } from 'fs'
import path from 'path'
import { supabaseAdmin } from './supabase-admin'
import {
  defaultLoginPageSettings,
  type LoginPageFeatureItem,
  type LoginPageSettings,
  type LoginPageSettingsPayload
} from './login-page-settings-schema'

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'login-page-settings.json')
const TABLE_NAME = 'login_page_settings'
const RECORD_ID = 'login-page-settings'

const isMissingSupabaseTableError = (message: string | undefined) =>
  typeof message === 'string' && (
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('table')
  )

const normalizeString = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

const normalizeFeatures = (value: unknown): LoginPageFeatureItem[] => {
  if (!Array.isArray(value)) {
    return defaultLoginPageSettings.features
  }

  const cleaned = value
    .map(item => {
      const source = item && typeof item === 'object' ? item as Partial<LoginPageFeatureItem> : {}
      const icon = typeof source.icon === 'string' && source.icon.trim() ? source.icon.trim() : '•'
      const text = typeof source.text === 'string' && source.text.trim() ? source.text.trim() : ''
      return text ? { icon, text } : null
    })
    .filter((item): item is LoginPageFeatureItem => Boolean(item))

  return cleaned.length ? cleaned.slice(0, 8) : defaultLoginPageSettings.features
}

const normalizeSettings = (value: unknown): LoginPageSettings => {
  const source = value && typeof value === 'object' ? value as Partial<LoginPageSettings> : {}
  return {
    headline: normalizeString(source.headline, defaultLoginPageSettings.headline),
    subtitle: normalizeString(source.subtitle, defaultLoginPageSettings.subtitle),
    features: normalizeFeatures(source.features)
  }
}

const readJsonSettings = async () => {
  try {
    const content = await fs.readFile(DATA_FILE_PATH, 'utf8')
    return normalizeSettings(JSON.parse(content))
  } catch {
    return defaultLoginPageSettings
  }
}

const writeJsonSettings = async (settings: LoginPageSettings) => {
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

  return data ? normalizeSettings(data.settings_json) : defaultLoginPageSettings
}

const writeSupabaseSettings = async (settings: LoginPageSettings) => {
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

export const getLoginPageSettings = async (): Promise<LoginPageSettingsPayload> => {
  const supabaseSettings = await readSupabaseSettings()
  if (supabaseSettings) {
    return { settings: supabaseSettings, storage: 'supabase' }
  }

  return {
    settings: await readJsonSettings(),
    storage: 'json'
  }
}

export const saveLoginPageSettings = async (value: unknown): Promise<LoginPageSettingsPayload> => {
  const settings = normalizeSettings(value)
  const wroteToSupabase = await writeSupabaseSettings(settings)
  if (wroteToSupabase) {
    return { settings, storage: 'supabase' }
  }

  await writeJsonSettings(settings)
  return { settings, storage: 'json' }
}
