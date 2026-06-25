import { importPKCS8, SignJWT } from 'jose'
import { supabaseAdmin } from './supabase-admin'

const PUSH_TABLE_NAME = 'labour_worker_device_tokens'
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const FCM_SEND_URL = 'https://fcm.googleapis.com/v1/projects'

const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || ''
const FCM_CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || ''
const FCM_PRIVATE_KEY = (process.env.FCM_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

type WorkerPushTokenPayload = {
  fcmToken: string
  locale: string
  platform: string
  deviceLabel?: string
}

type WorkerPushMessagePayload = {
  workerId: string
  title: string
  body: string
  priority?: 'high' | 'medium' | 'low'
  data?: Record<string, string | number | boolean | null | undefined>
}

type AccessTokenCache = {
  token: string
  expiresAt: number
}

type WorkerPushTokenRow = {
  id: string
  worker_id: string
  fcm_token: string
  locale: string | null
  platform: string | null
  device_label: string | null
  is_active: boolean
  last_seen_at: string
  created_at: string
  updated_at: string
}

let accessTokenCache: AccessTokenCache | null = null

const isMissingSupabaseTableError = (message?: string) =>
  typeof message === 'string' && (
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('table')
  )

const createId = () => `push-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const isFcmConfigured = () =>
  Boolean(FCM_PROJECT_ID.trim() && FCM_CLIENT_EMAIL.trim() && FCM_PRIVATE_KEY.trim())

const getAccessToken = async () => {
  if (!isFcmConfigured()) {
    return null
  }

  const now = Date.now()
  if (accessTokenCache && accessTokenCache.expiresAt > now + 60_000) {
    return accessTokenCache.token
  }

  const issuedAt = Math.floor(now / 1000)
  const expiresAt = issuedAt + 3600
  const privateKey = await importPKCS8(FCM_PRIVATE_KEY, 'RS256')

  const assertion = await new SignJWT({ scope: FCM_SCOPE })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(FCM_CLIENT_EMAIL)
    .setSubject(FCM_CLIENT_EMAIL)
    .setAudience(GOOGLE_TOKEN_URL)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(privateKey)

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch FCM access token: ${errorText}`)
  }

  const data = await response.json() as { access_token: string; expires_in: number }
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + ((data.expires_in || 3600) * 1000)
  }

  return data.access_token
}

export const registerWorkerPushToken = async (workerId: string, payload: WorkerPushTokenPayload) => {
  const now = new Date().toISOString()
  const record = {
    id: createId(),
    worker_id: workerId,
    fcm_token: payload.fcmToken,
    locale: payload.locale || 'hi',
    platform: payload.platform || 'android',
    device_label: payload.deviceLabel || null,
    is_active: true,
    last_seen_at: now,
    created_at: now,
    updated_at: now
  }

  const { error } = await supabaseAdmin
    .from(PUSH_TABLE_NAME)
    .upsert(record, { onConflict: 'fcm_token' })

  if (error) {
    if (isMissingSupabaseTableError(error.message)) {
      return
    }
    throw new Error(`Failed to register worker push token: ${error.message}`)
  }
}

export const unregisterWorkerPushToken = async (workerId: string, fcmToken?: string) => {
  let query = supabaseAdmin
    .from(PUSH_TABLE_NAME)
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('worker_id', workerId)

  if (fcmToken) {
    query = query.eq('fcm_token', fcmToken)
  }

  const { error } = await query
  if (error && !isMissingSupabaseTableError(error.message)) {
    throw new Error(`Failed to unregister worker push token: ${error.message}`)
  }
}

const deactivateWorkerPushToken = async (fcmToken: string) => {
  const { error } = await supabaseAdmin
    .from(PUSH_TABLE_NAME)
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('fcm_token', fcmToken)

  if (error && !isMissingSupabaseTableError(error.message)) {
    console.error('Failed to deactivate worker push token', error.message)
  }
}

const getWorkerPushTokens = async (workerId: string): Promise<WorkerPushTokenRow[]> => {
  const { data, error } = await supabaseAdmin
    .from(PUSH_TABLE_NAME)
    .select('*')
    .eq('worker_id', workerId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  if (error) {
    if (isMissingSupabaseTableError(error.message)) {
      return []
    }
    throw new Error(`Failed to load worker push tokens: ${error.message}`)
  }

  return (data || []) as WorkerPushTokenRow[]
}

export const sendWorkerPushNotification = async (payload: WorkerPushMessagePayload) => {
  if (!isFcmConfigured()) {
    return
  }

  const tokens = await getWorkerPushTokens(payload.workerId)
  if (tokens.length === 0) {
    return
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    return
  }

  const normalizedData = Object.fromEntries(
    Object.entries(payload.data || {}).flatMap(([key, value]) =>
      value === undefined || value === null ? [] : [[key, String(value)]]
    )
  )

  for (const tokenRow of tokens) {
    const response = await fetch(
      `${FCM_SEND_URL}/${FCM_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; UTF-8'
        },
        body: JSON.stringify({
          message: {
            token: tokenRow.fcm_token,
            notification: {
              title: payload.title,
              body: payload.body
            },
            data: normalizedData,
            android: {
              priority: payload.priority === 'high' ? 'HIGH' : 'NORMAL',
              notification: {
                channel_id: 'worker_alerts',
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
              }
            }
          }
        })
      }
    )

    if (response.ok) {
      continue
    }

    const errorText = await response.text()
    if (errorText.includes('UNREGISTERED') || errorText.includes('INVALID_ARGUMENT')) {
      await deactivateWorkerPushToken(tokenRow.fcm_token)
      continue
    }

    console.error('Failed to send worker push notification', errorText)
  }
}
