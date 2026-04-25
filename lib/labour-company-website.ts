import { promises as fs } from 'fs'
import path from 'path'
import { supabaseAdmin } from './supabase-admin'

export type LabourCompanyWebsiteSection =
  | 'hero'
  | 'trust'
  | 'features'
  | 'process'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'intake'

export interface LabourCompanyWebsiteContent {
  theme: {
    brandName: string
    accentColor: string
    accentSoft: string
    highlightColor: string
  }
  sectionOrder: LabourCompanyWebsiteSection[]
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
  }
  trustStrip: {
    title: string
    items: string[]
  }
  features: {
    title: string
    subtitle: string
    cards: Array<{
      title: string
      description: string
      bullets: string[]
    }>
  }
  process: {
    title: string
    steps: Array<{
      title: string
      description: string
    }>
  }
  pricing: {
    title: string
    subtitle: string
    footnote: string
  }
  testimonials: {
    title: string
    items: Array<{
      quote: string
      name: string
      role: string
      company: string
    }>
  }
  faq: {
    title: string
    items: Array<{
      question: string
      answer: string
    }>
  }
  finalCta: {
    title: string
    subtitle: string
    buttonLabel: string
    buttonHref: string
  }
}

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'labour-company-website.json')
const TABLE_NAME = 'labour_website_content'
const RECORD_ID = 'company-website'

const isMissingSupabaseTableError = (message: string | undefined) =>
  typeof message === 'string' && (
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('table')
  )

const ensureDataFile = async () => {
  await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true })

  try {
    await fs.access(DATA_FILE_PATH)
  } catch {
    throw new Error('Default labour company website content file is missing.')
  }
}

const readJsonContent = async (): Promise<LabourCompanyWebsiteContent> => {
  await ensureDataFile()
  const raw = await fs.readFile(DATA_FILE_PATH, 'utf8')
  return JSON.parse(raw) as LabourCompanyWebsiteContent
}

const writeJsonContent = async (content: LabourCompanyWebsiteContent) => {
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(content, null, 2), 'utf8')
}

const normalizeContent = (content: LabourCompanyWebsiteContent): LabourCompanyWebsiteContent => ({
  ...content,
  sectionOrder: content.sectionOrder || ['hero', 'trust', 'features', 'process', 'pricing', 'testimonials', 'faq', 'cta', 'intake'],
  trustStrip: {
    title: content.trustStrip?.title || '',
    items: content.trustStrip?.items || []
  },
  features: {
    title: content.features?.title || '',
    subtitle: content.features?.subtitle || '',
    cards: content.features?.cards || []
  },
  process: {
    title: content.process?.title || '',
    steps: content.process?.steps || []
  },
  testimonials: {
    title: content.testimonials?.title || '',
    items: content.testimonials?.items || []
  },
  faq: {
    title: content.faq?.title || '',
    items: content.faq?.items || []
  }
})

export const getLabourCompanyWebsiteContent = async (): Promise<{ content: LabourCompanyWebsiteContent; storage: 'supabase' | 'json' }> => {
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select('content_json')
    .eq('id', RECORD_ID)
    .maybeSingle()

  if (error && isMissingSupabaseTableError(error.message)) {
    return { content: normalizeContent(await readJsonContent()), storage: 'json' }
  }

  if (error) {
    throw new Error(`Failed to fetch labour website content: ${error.message}`)
  }

  if (!data?.content_json) {
    return { content: normalizeContent(await readJsonContent()), storage: 'json' }
  }

  return {
    content: normalizeContent(data.content_json as LabourCompanyWebsiteContent),
    storage: 'supabase'
  }
}

export const updateLabourCompanyWebsiteContent = async (content: LabourCompanyWebsiteContent) => {
  const normalized = normalizeContent(content)
  const { error } = await supabaseAdmin
    .from(TABLE_NAME)
    .upsert({
      id: RECORD_ID,
      page_key: 'company',
      title: normalized.theme.brandName,
      content_json: normalized,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

  if (error && isMissingSupabaseTableError(error.message)) {
    await writeJsonContent(normalized)
    return { content: normalized, storage: 'json' as const }
  }

  if (error) {
    throw new Error(`Failed to update labour website content: ${error.message}`)
  }

  return { content: normalized, storage: 'supabase' as const }
}
