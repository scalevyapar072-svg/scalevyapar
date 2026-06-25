import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from './supabase-admin'
import { defaultMainWebsiteContent, type MainWebsiteContent } from '@/data/main-website-content'
import { normalizeWebsiteAssetPath } from './labour-company-public-assets'

const TABLE_NAME = 'labour_website_content'
const RECORD_ID = 'main-website'
const PAGE_KEY = 'main'
const RECORD_TITLE = 'ScaleVyapar Main Website'

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const isMissingSupabaseTableError = (message: string | undefined) =>
  typeof message === 'string' && (
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('table')
  )

const deepMerge = <T>(fallback: T, incoming: unknown): T => {
  if (Array.isArray(fallback)) {
    return (Array.isArray(incoming) ? incoming : fallback) as T
  }

  if (!isPlainObject(fallback)) {
    return (incoming === undefined || incoming === null ? fallback : incoming) as T
  }

  const source = isPlainObject(incoming) ? incoming : {}
  const result: Record<string, unknown> = {}

  Object.keys(fallback).forEach(key => {
    result[key] = deepMerge((fallback as Record<string, unknown>)[key], source[key])
  })

  return result as T
}

const normalizeMainWebsiteContent = (value: unknown): MainWebsiteContent => {
  const merged = deepMerge(defaultMainWebsiteContent, value)

  return {
    ...merged,
    header: {
      ...merged.header,
      logoSrc: normalizeWebsiteAssetPath(merged.header?.logoSrc, defaultMainWebsiteContent.header.logoSrc)
    },
    footer: {
      ...merged.footer,
      logoSrc: normalizeWebsiteAssetPath(merged.footer?.logoSrc, defaultMainWebsiteContent.footer.logoSrc)
    }
  }
}

const persistSupabaseContent = async (content: MainWebsiteContent) => {
  const { error } = await supabaseAdmin
    .from(TABLE_NAME)
    .upsert({
      id: RECORD_ID,
      page_key: PAGE_KEY,
      title: RECORD_TITLE,
      content_json: content,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

  if (error) {
    throw new Error(error.message)
  }
}

export const getMainWebsiteContent = async (): Promise<{ content: MainWebsiteContent; storage: 'supabase' | 'fallback' }> => {
  noStore()

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select('content_json')
    .eq('id', RECORD_ID)
    .maybeSingle()

  if (error && isMissingSupabaseTableError(error.message)) {
    return { content: normalizeMainWebsiteContent(defaultMainWebsiteContent), storage: 'fallback' }
  }

  if (error) {
    throw new Error(`Failed to fetch main website content: ${error.message}`)
  }

  if (!data?.content_json) {
    const seededContent = normalizeMainWebsiteContent(defaultMainWebsiteContent)

    try {
      await persistSupabaseContent(seededContent)
      return { content: seededContent, storage: 'supabase' }
    } catch (persistError) {
      if (
        persistError &&
        typeof persistError === 'object' &&
        'message' in persistError &&
        isMissingSupabaseTableError(String(persistError.message))
      ) {
        return { content: seededContent, storage: 'fallback' }
      }

      return { content: seededContent, storage: 'fallback' }
    }
  }

  return {
    content: normalizeMainWebsiteContent(data.content_json),
    storage: 'supabase'
  }
}

export const updateMainWebsiteContent = async (content: MainWebsiteContent) => {
  noStore()
  const normalized = normalizeMainWebsiteContent(content)

  try {
    await persistSupabaseContent(normalized)
  } catch (error) {
    if (error && typeof error === 'object' && 'message' in error && isMissingSupabaseTableError(String(error.message))) {
      return { content: normalized, storage: 'fallback' as const }
    }

    if (error instanceof Error) {
      throw new Error(`Failed to update main website content: ${error.message}`)
    }

    throw error
  }

  return { content: normalized, storage: 'supabase' as const }
}

export type { MainWebsiteContent }
