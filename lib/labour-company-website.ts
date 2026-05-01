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
    brandTagline: string
    accentColor: string
    accentSoft: string
    highlightColor: string
  }
  header: {
    announcement: string
    primaryCtaLabel: string
    primaryCtaHref: string
    navItems: Array<{
      label: string
      href: string
    }>
  }
  footer: {
    description: string
    supportEmail: string
    phone: string
    address: string
    copyrightText: string
    linkGroups: Array<{
      title: string
      links: Array<{
        label: string
        href: string
      }>
    }>
  }
  home: {
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
    intake: {
      title: string
      description: string
      submitLabel: string
    }
  }
  pricingPage: {
    eyebrow: string
    title: string
    subtitle: string
    badgeText: string
    customPlanTitle: string
    customPlanDescription: string
    customPlanPoints: string[]
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
    faqTitle: string
  }
  signinPage: {
    eyebrow: string
    title: string
    subtitle: string
    infoTitle: string
    infoDescription: string
    benefits: string[]
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
  }
  contactPage: {
    eyebrow: string
    title: string
    subtitle: string
    supportEmail: string
    escalationEmail: string
    phone: string
    address: string
    cards: Array<{
      title: string
      description: string
      ctaLabel: string
      ctaHref: string
    }>
  }
  searchPage: {
    eyebrow: string
    title: string
    subtitle: string
    helperText: string
    emptyTitle: string
    emptyDescription: string
  }
}

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'labour-company-website.json')
const TABLE_NAME = 'labour_website_content'
const RECORD_ID = 'company-website'

const defaultContent: LabourCompanyWebsiteContent = {
  theme: {
    brandName: 'ScaleVyapar Labour Exchange',
    brandTagline: 'Hire daily-basis labour faster across industries',
    accentColor: '#0f172a',
    accentSoft: '#e0ecff',
    highlightColor: '#2563eb'
  },
  header: {
    announcement: 'Daily worker hiring for factories, workshops, contractors and growing businesses',
    primaryCtaLabel: 'Post Requirement',
    primaryCtaHref: '/labour/company#company-intake',
    navItems: [
      { label: 'Home', href: '/labour/company' },
      { label: 'Pricing', href: '/labour/company/pricing' },
      { label: 'Search Labour', href: '/labour/company/search' },
      { label: 'Contact', href: '/labour/company/contact' }
    ]
  },
  footer: {
    description: 'A company hiring website for stitching karighar, embroidery worker, electrician, printer labour, machine setup staff, contractor labour and other daily-basis workforce needs.',
    supportEmail: 'support@scalevyapar.com',
    phone: '+91 98765 43210',
    address: 'Surat, Gujarat, India',
    copyrightText: '© 2026 ScaleVyapar Labour Exchange. All rights reserved.',
    linkGroups: [
      {
        title: 'Company',
        links: [
          { label: 'Home', href: '/labour/company' },
          { label: 'Pricing', href: '/labour/company/pricing' },
          { label: 'Search Labour', href: '/labour/company/search' }
        ]
      },
      {
        title: 'Support',
        links: [
          { label: 'Contact Us', href: '/labour/company/contact' },
          { label: 'Admin Website Editor', href: '/admin/labour/website' }
        ]
      }
    ]
  },
  home: {
    sectionOrder: ['hero', 'trust', 'features', 'process', 'pricing', 'testimonials', 'faq', 'cta', 'intake'],
    hero: {
      eyebrow: 'Hiring for factories, workshops and contractors',
      title: 'Hire daily-basis labour faster across stitching, embroidery, machine setup, printer work, electrician jobs and more.',
      subtitle: 'A dedicated company hiring website for labour demand. Post your requirement, choose a low-cost plan, and connect with relevant workers in your city.',
      primaryCtaLabel: 'Post Requirement',
      primaryCtaHref: '#company-intake',
      secondaryCtaLabel: 'See Pricing',
      secondaryCtaHref: '/labour/company/pricing'
    },
    trustStrip: {
      title: 'Built for fast, local and category-specific labour hiring',
      items: [
        'Daily-basis labour categories',
        'Company plan control from admin',
        'City-wise demand matching',
        'Short-validity urgent hiring flow'
      ]
    },
    features: {
      title: 'What companies get',
      subtitle: 'A practical employer website inspired by modern hiring pages, but adapted to the labour market and daily workforce needs.',
      cards: [
        {
          title: 'Category-specific hiring',
          description: 'Post labour requirements for stitching karighar, embroidery worker, electrician, printer labour, machine setup, contractor labour and more.',
          bullets: [
            'Multiple labour categories',
            'City and role based demand',
            'Fast short-term requirement posting'
          ]
        },
        {
          title: 'Affordable company plans',
          description: 'Keep pricing simple for businesses that hire often but still want low upfront cost and clear validity windows.',
          bullets: [
            'Registration fee tracking',
            '3-day and priority plans',
            'Admin editable plan pricing'
          ]
        },
        {
          title: 'Search live labour',
          description: 'Companies can browse active workers on the website, filter them by city and category, and shortlist relevant people quickly.',
          bullets: [
            'Visible active workers only',
            'Search by city and labour category',
            'Useful for urgent workforce demand'
          ]
        }
      ]
    },
    process: {
      title: 'How the company flow works',
      steps: [
        {
          title: 'Submit company details',
          description: 'Add your company, contact person, mobile, city and the labour categories you want to hire.'
        },
        {
          title: 'Choose your plan',
          description: 'Select the right company plan based on category and hiring urgency.'
        },
        {
          title: 'Post the first requirement',
          description: 'Add workers needed, wage amount, validity days and job description.'
        },
        {
          title: 'Get activated from admin',
          description: 'Your profile appears in the admin panel for review, follow-up and publishing.'
        }
      ]
    },
    pricing: {
      title: 'Company pricing',
      subtitle: 'Keep plans clear, short-validity and easy to understand for market hiring.',
      footnote: 'Displayed plans below are connected to live active company plans from the labour database.'
    },
    testimonials: {
      title: 'Why this model works',
      items: [
        {
          quote: 'We needed a hiring flow that works for urgent production labour instead of generic corporate recruitment. This structure is made for that speed.',
          name: 'Operations Team',
          role: 'Garment Production',
          company: 'ScaleVyapar Demo'
        },
        {
          quote: 'Short validity, category filters and direct local requirements make daily labour hiring much more realistic for small and medium businesses.',
          name: 'Factory Hiring Desk',
          role: 'Workshop Hiring',
          company: 'ScaleVyapar Demo'
        }
      ]
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          question: 'Can I post requirements for more than one labour category?',
          answer: 'Yes. A company can select multiple categories and create multiple labour requirements from the same flow.'
        },
        {
          question: 'Can pricing and plan validity be changed later?',
          answer: 'Yes. Company plans are controlled from the labour admin panel and can be updated there.'
        },
        {
          question: 'Will my requirement go live immediately?',
          answer: 'The current flow creates a pending company with a draft job post so your admin team can review and activate it.'
        }
      ]
    },
    finalCta: {
      title: 'Start hiring your next labour team',
      subtitle: 'Post your first requirement and let the admin team review, activate and publish it from ScaleVyapar Labour Exchange.',
      buttonLabel: 'Submit Company Requirement',
      buttonHref: '#company-intake'
    },
    intake: {
      title: 'Post company requirement',
      description: 'Submit your company and first job requirement in one go. The labour admin team can review, approve and publish it from the admin panel.',
      submitLabel: 'Create company enquiry'
    }
  },
  pricingPage: {
    eyebrow: 'Simple pricing for labour hiring',
    title: 'Choose the right company plan for your hiring volume and urgency.',
    subtitle: 'Clear pricing, short validity windows and category-specific options inspired by employer pricing pages, but tailored for labour exchange workflows.',
    badgeText: 'Most popular for growing businesses',
    customPlanTitle: 'Need a custom plan?',
    customPlanDescription: 'Use a personalised plan if you hire across many categories or cities and want additional admin support.',
    customPlanPoints: [
      'Dedicated account follow-up',
      'Priority category setup',
      'Longer validity options',
      'City-wise hiring management'
    ],
    primaryCtaLabel: 'Post a requirement',
    primaryCtaHref: '/labour/company#company-intake',
    secondaryCtaLabel: 'Contact sales',
    secondaryCtaHref: '/labour/company/contact',
    faqTitle: 'Pricing questions'
  },
  signinPage: {
    eyebrow: 'Existing company access',
    title: 'Sign in to manage your company profile, plans and labour requirements.',
    subtitle: 'Keep this page simple for employers. Use it as a branded login page with clear actions for existing customers and new enquiries.',
    infoTitle: 'What you can do after sign in',
    infoDescription: 'View active plans, manage requirements, follow job status and connect with the admin team.',
    benefits: [
      'Manage posted labour requirements',
      'Review plan validity and payment status',
      'Track city and category hiring activity',
      'Connect with support for activation and follow-up'
    ],
    primaryCtaLabel: 'Go to client login',
    primaryCtaHref: '/login',
    secondaryCtaLabel: 'New company enquiry',
    secondaryCtaHref: '/labour/company#company-intake'
  },
  contactPage: {
    eyebrow: 'Get in touch',
    title: 'Contact the ScaleVyapar labour hiring team',
    subtitle: 'Use this page for support, sales follow-up, activation help and pricing discussions.',
    supportEmail: 'support@scalevyapar.com',
    escalationEmail: 'escalations@scalevyapar.com',
    phone: '+91 98765 43210',
    address: 'Surat, Gujarat, India',
    cards: [
      {
        title: 'Talk to sales',
        description: 'Discuss company pricing, category setup and custom hiring plans.',
        ctaLabel: 'Open pricing page',
        ctaHref: '/labour/company/pricing'
      },
      {
        title: 'Need support',
        description: 'Use the contact team for account activation, plan follow-up and company profile changes.',
        ctaLabel: 'Send company enquiry',
        ctaHref: '/labour/company#company-intake'
      }
    ]
  },
  searchPage: {
    eyebrow: 'Search active workers',
    title: 'Browse visible labour by category, city and availability.',
    subtitle: 'This page gives companies a quick website-level view of active workers before they post or expand their requirements.',
    helperText: 'Use the search filters below to find workers who match your hiring needs.',
    emptyTitle: 'No workers match these filters yet',
    emptyDescription: 'Try another city or category, or post a requirement so the admin team can help connect you faster.'
  }
}

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
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(defaultContent, null, 2), 'utf8')
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

const uniqueSections = (sections: LabourCompanyWebsiteSection[]) => {
  const allowed: LabourCompanyWebsiteSection[] = ['hero', 'trust', 'features', 'process', 'pricing', 'testimonials', 'faq', 'cta', 'intake']
  const seen = new Set<LabourCompanyWebsiteSection>()
  const ordered = sections.filter(section => allowed.includes(section) && !seen.has(section) && seen.add(section))
  return ordered.length ? ordered : defaultContent.home.sectionOrder
}

const mergeLinkGroups = (input: unknown, fallback: LabourCompanyWebsiteContent['footer']['linkGroups']) => {
  if (!Array.isArray(input)) return fallback
  return input.map((group, groupIndex) => {
    const nextGroup = typeof group === 'object' && group ? group as Record<string, unknown> : {}
    const fallbackGroup = fallback[groupIndex] || fallback[0]
    return {
      title: typeof nextGroup.title === 'string' && nextGroup.title.trim() ? nextGroup.title : fallbackGroup.title,
      links: Array.isArray(nextGroup.links)
        ? nextGroup.links.map((link, linkIndex) => {
          const nextLink = typeof link === 'object' && link ? link as Record<string, unknown> : {}
          const fallbackLink = fallbackGroup.links[linkIndex] || fallbackGroup.links[0]
          return {
            label: typeof nextLink.label === 'string' && nextLink.label.trim() ? nextLink.label : fallbackLink.label,
            href: typeof nextLink.href === 'string' && nextLink.href.trim() ? nextLink.href : fallbackLink.href
          }
        })
        : fallbackGroup.links
    }
  })
}

const mapLegacyContent = (legacy: Record<string, unknown>): Partial<LabourCompanyWebsiteContent> => ({
  theme: {
    brandName: typeof legacy.theme === 'object' && legacy.theme && typeof (legacy.theme as Record<string, unknown>).brandName === 'string'
      ? (legacy.theme as Record<string, string>).brandName
      : defaultContent.theme.brandName,
    brandTagline: defaultContent.theme.brandTagline,
    accentColor: typeof legacy.theme === 'object' && legacy.theme && typeof (legacy.theme as Record<string, unknown>).accentColor === 'string'
      ? (legacy.theme as Record<string, string>).accentColor
      : defaultContent.theme.accentColor,
    accentSoft: typeof legacy.theme === 'object' && legacy.theme && typeof (legacy.theme as Record<string, unknown>).accentSoft === 'string'
      ? (legacy.theme as Record<string, string>).accentSoft
      : defaultContent.theme.accentSoft,
    highlightColor: typeof legacy.theme === 'object' && legacy.theme && typeof (legacy.theme as Record<string, unknown>).highlightColor === 'string'
      ? (legacy.theme as Record<string, string>).highlightColor
      : defaultContent.theme.highlightColor
  },
  home: {
    ...defaultContent.home,
    sectionOrder: uniqueSections(Array.isArray(legacy.sectionOrder) ? legacy.sectionOrder as LabourCompanyWebsiteSection[] : defaultContent.home.sectionOrder),
    hero: typeof legacy.hero === 'object' && legacy.hero ? { ...defaultContent.home.hero, ...(legacy.hero as Record<string, string>) } : defaultContent.home.hero,
    trustStrip: typeof legacy.trustStrip === 'object' && legacy.trustStrip
      ? {
          title: typeof (legacy.trustStrip as Record<string, unknown>).title === 'string' ? (legacy.trustStrip as Record<string, string>).title : defaultContent.home.trustStrip.title,
          items: Array.isArray((legacy.trustStrip as Record<string, unknown>).items) ? (legacy.trustStrip as Record<string, string[]>).items : defaultContent.home.trustStrip.items
        }
      : defaultContent.home.trustStrip,
    features: typeof legacy.features === 'object' && legacy.features
      ? {
          title: typeof (legacy.features as Record<string, unknown>).title === 'string' ? (legacy.features as Record<string, string>).title : defaultContent.home.features.title,
          subtitle: typeof (legacy.features as Record<string, unknown>).subtitle === 'string' ? (legacy.features as Record<string, string>).subtitle : defaultContent.home.features.subtitle,
          cards: Array.isArray((legacy.features as Record<string, unknown>).cards) ? (legacy.features as Record<string, never>).cards as LabourCompanyWebsiteContent['home']['features']['cards'] : defaultContent.home.features.cards
        }
      : defaultContent.home.features,
    process: typeof legacy.process === 'object' && legacy.process
      ? {
          title: typeof (legacy.process as Record<string, unknown>).title === 'string' ? (legacy.process as Record<string, string>).title : defaultContent.home.process.title,
          steps: Array.isArray((legacy.process as Record<string, unknown>).steps) ? (legacy.process as Record<string, never>).steps as LabourCompanyWebsiteContent['home']['process']['steps'] : defaultContent.home.process.steps
        }
      : defaultContent.home.process,
    pricing: typeof legacy.pricing === 'object' && legacy.pricing ? { ...defaultContent.home.pricing, ...(legacy.pricing as Record<string, string>) } : defaultContent.home.pricing,
    testimonials: typeof legacy.testimonials === 'object' && legacy.testimonials
      ? {
          title: typeof (legacy.testimonials as Record<string, unknown>).title === 'string' ? (legacy.testimonials as Record<string, string>).title : defaultContent.home.testimonials.title,
          items: Array.isArray((legacy.testimonials as Record<string, unknown>).items) ? (legacy.testimonials as Record<string, never>).items as LabourCompanyWebsiteContent['home']['testimonials']['items'] : defaultContent.home.testimonials.items
        }
      : defaultContent.home.testimonials,
    faq: typeof legacy.faq === 'object' && legacy.faq
      ? {
          title: typeof (legacy.faq as Record<string, unknown>).title === 'string' ? (legacy.faq as Record<string, string>).title : defaultContent.home.faq.title,
          items: Array.isArray((legacy.faq as Record<string, unknown>).items) ? (legacy.faq as Record<string, never>).items as LabourCompanyWebsiteContent['home']['faq']['items'] : defaultContent.home.faq.items
        }
      : defaultContent.home.faq,
    finalCta: typeof legacy.finalCta === 'object' && legacy.finalCta ? { ...defaultContent.home.finalCta, ...(legacy.finalCta as Record<string, string>) } : defaultContent.home.finalCta
  }
})

const normalizeContent = (raw: unknown): LabourCompanyWebsiteContent => {
  if (!raw || typeof raw !== 'object') {
    return defaultContent
  }

  const source = raw as Record<string, unknown>
  const legacyPatch = !source.header || !source.footer || !source.home ? mapLegacyContent(source) : {}
  const merged = {
    ...defaultContent,
    ...legacyPatch,
    ...source
  } as LabourCompanyWebsiteContent

  return {
    theme: {
      brandName: merged.theme?.brandName || defaultContent.theme.brandName,
      brandTagline: merged.theme?.brandTagline || defaultContent.theme.brandTagline,
      accentColor: merged.theme?.accentColor || defaultContent.theme.accentColor,
      accentSoft: merged.theme?.accentSoft || defaultContent.theme.accentSoft,
      highlightColor: merged.theme?.highlightColor || defaultContent.theme.highlightColor
    },
    header: {
      announcement: merged.header?.announcement || defaultContent.header.announcement,
      primaryCtaLabel: merged.header?.primaryCtaLabel || defaultContent.header.primaryCtaLabel,
      primaryCtaHref: merged.header?.primaryCtaHref || defaultContent.header.primaryCtaHref,
      navItems: Array.isArray(merged.header?.navItems) && merged.header.navItems.length
        ? merged.header.navItems.map(item => ({
            label: item.label || 'Link',
            href: item.href || '/labour/company'
          }))
        : defaultContent.header.navItems
    },
    footer: {
      description: merged.footer?.description || defaultContent.footer.description,
      supportEmail: merged.footer?.supportEmail || defaultContent.footer.supportEmail,
      phone: merged.footer?.phone || defaultContent.footer.phone,
      address: merged.footer?.address || defaultContent.footer.address,
      copyrightText: merged.footer?.copyrightText || defaultContent.footer.copyrightText,
      linkGroups: mergeLinkGroups(merged.footer?.linkGroups, defaultContent.footer.linkGroups)
    },
    home: {
      sectionOrder: uniqueSections(merged.home?.sectionOrder || defaultContent.home.sectionOrder),
      hero: { ...defaultContent.home.hero, ...merged.home?.hero },
      trustStrip: {
        title: merged.home?.trustStrip?.title || defaultContent.home.trustStrip.title,
        items: Array.isArray(merged.home?.trustStrip?.items) ? merged.home.trustStrip.items : defaultContent.home.trustStrip.items
      },
      features: {
        title: merged.home?.features?.title || defaultContent.home.features.title,
        subtitle: merged.home?.features?.subtitle || defaultContent.home.features.subtitle,
        cards: Array.isArray(merged.home?.features?.cards) && merged.home.features.cards.length ? merged.home.features.cards : defaultContent.home.features.cards
      },
      process: {
        title: merged.home?.process?.title || defaultContent.home.process.title,
        steps: Array.isArray(merged.home?.process?.steps) && merged.home.process.steps.length ? merged.home.process.steps : defaultContent.home.process.steps
      },
      pricing: { ...defaultContent.home.pricing, ...merged.home?.pricing },
      testimonials: {
        title: merged.home?.testimonials?.title || defaultContent.home.testimonials.title,
        items: Array.isArray(merged.home?.testimonials?.items) && merged.home.testimonials.items.length ? merged.home.testimonials.items : defaultContent.home.testimonials.items
      },
      faq: {
        title: merged.home?.faq?.title || defaultContent.home.faq.title,
        items: Array.isArray(merged.home?.faq?.items) && merged.home.faq.items.length ? merged.home.faq.items : defaultContent.home.faq.items
      },
      finalCta: { ...defaultContent.home.finalCta, ...merged.home?.finalCta },
      intake: { ...defaultContent.home.intake, ...merged.home?.intake }
    },
    pricingPage: {
      ...defaultContent.pricingPage,
      ...merged.pricingPage,
      customPlanPoints: Array.isArray(merged.pricingPage?.customPlanPoints) && merged.pricingPage.customPlanPoints.length ? merged.pricingPage.customPlanPoints : defaultContent.pricingPage.customPlanPoints
    },
    signinPage: {
      ...defaultContent.signinPage,
      ...merged.signinPage,
      benefits: Array.isArray(merged.signinPage?.benefits) && merged.signinPage.benefits.length ? merged.signinPage.benefits : defaultContent.signinPage.benefits
    },
    contactPage: {
      ...defaultContent.contactPage,
      ...merged.contactPage,
      cards: Array.isArray(merged.contactPage?.cards) && merged.contactPage.cards.length ? merged.contactPage.cards : defaultContent.contactPage.cards
    },
    searchPage: {
      ...defaultContent.searchPage,
      ...merged.searchPage
    }
  }
}

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
    content: normalizeContent(data.content_json),
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
    throw new Error(`Failed to update labour company website content: ${error.message}`)
  }

  return { content: normalized, storage: 'supabase' as const }
}
