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

export interface LabourCompanyLegalPageSection {
  title: string
  body: string
}

export interface LabourCompanyLegalPageContent {
  eyebrow: string
  title: string
  subtitle: string
  sections: LabourCompanyLegalPageSection[]
}

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
    logoSrc: string
    logoWidth: string
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
    legalLinks: Array<{
      label: string
      href: string
    }>
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
      highlightedText: string
      subtitle: string
      primaryCtaLabel: string
      primaryCtaHref: string
      secondaryCtaLabel: string
      secondaryCtaHref: string
      primaryImageSrc: string
      secondaryImageSrc: string
      imageBadgeTitle: string
      imageBadgeSubtitle: string
    }
    searchBar: {
      title: string
      placeholder: string
      categoryLabel: string
      cityLabel: string
      buttonLabel: string
    }
    stats: {
      items: Array<{
        value: string
        label: string
        icon: string
      }>
    }
    trustStrip: {
      title: string
      items: string[]
    }
    features: {
      eyebrow: string
      title: string
      subtitle: string
      cards: Array<{
        icon: string
        title: string
        description: string
        bullets: string[]
      }>
    }
    process: {
      eyebrow: string
      title: string
      steps: Array<{
        icon: string
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
      eyebrow: string
      title: string
      items: Array<{
        quote: string
        name: string
        role: string
        company: string
        rating: string
      }>
    }
    categories: {
      eyebrow: string
      title: string
      buttonLabel: string
      buttonHref: string
      cards: Array<{
        icon: string
        title: string
        subtitle: string
        href: string
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
      eyebrow: string
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
    workerCta: {
      title: string
      description: string
      buttonLabel: string
      buttonHref: string
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
  legalPages: {
    privacyPolicy: LabourCompanyLegalPageContent
    termsOfService: LabourCompanyLegalPageContent
    userDataDeletion: LabourCompanyLegalPageContent
  }
}

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'labour-company-website.json')
const TABLE_NAME = 'labour_website_content'
const RECORD_ID = 'company-website'

const defaultContent: LabourCompanyWebsiteContent = {
  theme: {
    brandName: 'ScaleVyapar Rozgar',
    brandTagline: 'Find skilled workers and hire faster across India',
    accentColor: '#0f172a',
    accentSoft: '#e0ecff',
    highlightColor: '#2563eb'
  },
  header: {
    announcement: 'Daily worker hiring for factories, workshops, contractors and growing businesses',
    logoSrc: '/rozgar-logo-source.png',
    logoWidth: '260',
    primaryCtaLabel: 'Post Requirement',
    primaryCtaHref: '/labour/company/job-post',
    navItems: [
      { label: 'Home', href: '/labour/company' },
      { label: 'Pricing', href: '/labour/company/pricing' },
      { label: 'Search Workers', href: '/labour/company/search' },
      { label: 'Contact', href: '/labour/company/contact' }
    ]
  },
  footer: {
    description: 'A company hiring website for stitching karighar, embroidery workers, electricians, printer workers, machine setup staff, contractor workers and other daily-basis workforce needs.',
    supportEmail: 'support@scalevyapar.com',
    phone: '+91 98765 43210',
    address: 'Surat, Gujarat, India',
    copyrightText: '© 2026 ScaleVyapar Worker Exchange. All rights reserved.',
    legalLinks: [
      { label: 'Privacy Policy', href: '/labour/company/privacy-policy' },
      { label: 'Terms of Service', href: '/labour/company/terms-of-service' },
      { label: 'User Data Deletion', href: '/labour/company/user-data-deletion' }
    ],
    linkGroups: [
      {
        title: 'Company',
        links: [
          { label: 'Home', href: '/labour/company' },
          { label: 'Pricing', href: '/labour/company/pricing' },
          { label: 'Search Workers', href: '/labour/company/search' }
        ]
      },
      {
        title: 'Support',
        links: [
          { label: 'Contact Us', href: '/labour/company/contact' }
        ]
      }
    ]
  },
  home: {
    sectionOrder: ['hero', 'trust', 'features', 'process', 'pricing', 'testimonials', 'faq', 'cta', 'intake'],
    hero: {
      eyebrow: 'India\'s Trusted Worker Hiring Platform',
      title: 'Find Skilled Workers. Hire Faster. Grow Your Business.',
      highlightedText: 'Grow Your Business.',
      subtitle: 'ScaleVyapar helps businesses across India find the right blue and grey-collar workers quickly and reliably. Post your requirements, reach verified workers, and build a stronger workforce.',
      primaryCtaLabel: 'Post Your Requirement',
      primaryCtaHref: '/labour/company/job-post',
      secondaryCtaLabel: 'Find Workers',
      secondaryCtaHref: '/labour/company/search',
      primaryImageSrc: '/worker-hero-reference.png',
      secondaryImageSrc: '/worker-hero-reference.png',
      imageBadgeTitle: 'Trusted by 1000+ Companies Across India',
      imageBadgeSubtitle: 'Verified workers, faster hiring and better workforce visibility.'
    },
    searchBar: {
      title: 'Find the Right Worker for Your Requirement',
      placeholder: 'Search job title, skills or worker type',
      categoryLabel: 'All Categories',
      cityLabel: 'All Cities',
      buttonLabel: 'Search Workers'
    },
    stats: {
      items: [
        { value: '500+', label: 'Verified Workers', icon: 'users' },
        { value: '120+', label: 'Registered Companies', icon: 'building' },
        { value: '300+', label: 'Job Requirements Posted', icon: 'clipboard' },
        { value: '12+', label: 'Industries Covered', icon: 'sparkles' }
      ]
    },
    trustStrip: {
      title: 'Built for fast, local and category-specific worker hiring',
      items: [
        'Verified Workers',
        'Quick Matching',
        'Secure & Reliable'
      ]
    },
    features: {
      eyebrow: 'Why Choose ScaleVyapar',
      title: 'The Smarter Way to Hire Workers',
      subtitle: 'A cleaner company hiring flow built for regular workforce requirements and active worker discovery.',
      cards: [
        {
          icon: 'users',
          title: 'For All Worker Types',
          description: 'Find skilled, semi-skilled and general workers for regular hiring needs.',
          bullets: [
            'Multiple categories',
            'Regular workforce demand',
            'City-wise visibility'
          ]
        },
        {
          icon: 'clipboard',
          title: 'Post Job Instantly',
          description: 'Post requirements in minutes and start receiving suitable worker responses faster.',
          bullets: [
            'Quick posting flow',
            'Guided requirement form',
            'Connected to company panel'
          ]
        },
        {
          icon: 'badge',
          title: 'Only Verified Profiles',
          description: 'Connect with worker profiles that are easier to review and shortlist with confidence.',
          bullets: [
            'Cleaner data visibility',
            'Useful shortlist flow',
            'Reduced stale records'
          ]
        },
        {
          icon: 'search',
          title: 'Fast Worker Matching',
          description: 'Reach the right workers faster through category and city-based discovery.',
          bullets: [
            'Faster discovery',
            'Category-focused search',
            'Better matching signal'
          ]
        },
        {
          icon: 'shield',
          title: 'Secure & Trusted Platform',
          description: 'A structured workflow helps keep hiring more reliable for companies and workers.',
          bullets: [
            'Admin moderation',
            'Better platform trust',
            'Controlled visibility'
          ]
        },
        {
          icon: 'headset',
          title: 'Help, Anytime',
          description: 'Use the company panel and support team when you need help moving a requirement forward.',
          bullets: [
            'Support access',
            'Company-side guidance',
            'Hiring follow-up'
          ]
        }
      ]
    },
    process: {
      eyebrow: 'How It Works',
      title: 'Simple Steps to Hire',
      steps: [
        {
          icon: 'building',
          title: 'Register / Login',
          description: 'Create your company account and complete your profile to begin hiring.'
        },
        {
          icon: 'clipboard',
          title: 'Post Requirement',
          description: 'Add job details, location, skills and number of workers needed.'
        },
        {
          icon: 'users',
          title: 'Get Applications',
          description: 'Receive responses from relevant workers more quickly.'
        },
        {
          icon: 'search',
          title: 'Review & Shortlist',
          description: 'Compare profiles and shortlist the best matches for your business.'
        },
        {
          icon: 'badge',
          title: 'Hire the Best',
          description: 'Connect, interview and hire the right workers with confidence.'
        }
      ]
    },
    pricing: {
      title: 'Company pricing',
      subtitle: 'Keep plans clear, short-validity and easy to understand for market hiring.',
      footnote: 'Displayed plans below are connected to live active company plans from the worker database.'
    },
    testimonials: {
      eyebrow: 'What Companies Say',
      title: 'Trusted by Companies Across India',
      items: [
        {
          quote: 'ScaleVyapar has made hiring easier for our business. We get good quality workers every time.',
          name: 'Rohit Sharma',
          role: 'Operations Head',
          company: 'Textile Unit',
          rating: '5'
        },
        {
          quote: 'We posted a job and received verified and fit profiles within hours. Highly efficient.',
          name: 'Vijay Agarwal',
          role: 'HR Manager',
          company: 'Manufacturing Company',
          rating: '5'
        },
        {
          quote: 'The best platform to quickly find reliable manpower for our projects and seasonal needs.',
          name: 'Neena Khan',
          role: 'CEO',
          company: 'BuildTech',
          rating: '5'
        }
      ]
    },
    categories: {
      eyebrow: 'Worker Categories',
      title: 'Find Workers By Categories',
      buttonLabel: 'View All Categories',
      buttonHref: '/labour/company/search',
      cards: [
        { icon: 'hammer', title: 'Construction & Infrastructure', subtitle: 'On-site workforce and project support', href: '/labour/company/search' },
        { icon: 'factory', title: 'Manufacturing & Factory', subtitle: 'Machine, production and floor teams', href: '/labour/company/search' },
        { icon: 'package', title: 'Packaging & Warehouse', subtitle: 'Packing, loading and dispatch workers', href: '/labour/company/search' },
        { icon: 'truck', title: 'Logistics & Transportation', subtitle: 'Movement, transport and route support', href: '/labour/company/search' },
        { icon: 'wrench', title: 'Maintenance & Electrical', subtitle: 'Repair, servicing and technical help', href: '/labour/company/search' },
        { icon: 'sparkles', title: 'All Categories', subtitle: 'Browse all active worker categories', href: '/labour/company/search' }
      ]
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          question: 'Can I post requirements for more than one worker category?',
          answer: 'Yes. A company can select multiple categories and create multiple worker requirements from the same flow.'
        },
        {
          question: 'Can pricing and plan validity be changed later?',
          answer: 'Yes. Company plans are controlled from the worker admin panel and can be updated there.'
        },
        {
          question: 'Will my requirement go live immediately?',
          answer: 'The current flow creates a pending company with a draft job post so your admin team can review and activate it.'
        }
      ]
    },
    finalCta: {
      eyebrow: 'For Companies',
      title: 'Post Your Requirement & Hire Trusted Workers',
      subtitle: 'Join hundreds of companies across India building better teams every day.',
      buttonLabel: 'Post Requirement Now',
      buttonHref: '/labour/company/job-post'
    },
    intake: {
      title: 'Post company requirement',
      description: 'Submit your company and first job requirement in one go. The worker admin team can review, approve and publish it from the admin panel.',
      submitLabel: 'Create company enquiry'
    },
    workerCta: {
      title: 'Looking for Work?',
      description: 'Create your profile and get hired by top companies looking for skilled workers.',
      buttonLabel: 'Join as Worker',
      buttonHref: '/login'
    }
  },
  pricingPage: {
    eyebrow: 'Simple pricing for worker hiring',
    title: 'Choose the right company plan for your hiring volume and urgency.',
    subtitle: 'Clear pricing, short validity windows and category-specific options inspired by employer pricing pages, but tailored for worker exchange workflows.',
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
    primaryCtaHref: '/labour/company/job-post',
    secondaryCtaLabel: 'Contact sales',
    secondaryCtaHref: '/labour/company/contact',
    faqTitle: 'Pricing questions'
  },
  signinPage: {
    eyebrow: 'Existing company access',
    title: 'Sign in to manage your company profile, plans and worker requirements.',
    subtitle: 'Keep this page simple for employers. Use it as a branded login page with clear actions for existing customers and new enquiries.',
    infoTitle: 'What you can do after sign in',
    infoDescription: 'View active plans, manage requirements, follow job status and connect with the admin team.',
    benefits: [
      'Manage posted worker requirements',
      'Review plan validity and payment status',
      'Track city and category hiring activity',
      'Connect with support for activation and follow-up'
    ],
    primaryCtaLabel: 'Go to client login',
    primaryCtaHref: '/login',
    secondaryCtaLabel: 'New company enquiry',
    secondaryCtaHref: '/labour/company/company-registration'
  },
  contactPage: {
    eyebrow: 'Get in touch',
    title: 'Contact the ScaleVyapar worker hiring team',
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
        ctaHref: '/labour/company/company-registration'
      }
    ]
  },
  searchPage: {
    eyebrow: 'Search active workers',
    title: 'Browse visible workers by category, city and availability.',
    subtitle: 'This page gives companies a quick website-level view of active workers before they post or expand their requirements.',
    helperText: 'Use the search filters below to find workers who match your hiring needs.',
    emptyTitle: 'No workers match these filters yet',
    emptyDescription: 'Try another city or category, or post a requirement so the admin team can help connect you faster.'
  },
  legalPages: {
    privacyPolicy: {
      eyebrow: 'Legal',
      title: 'Privacy Policy',
      subtitle: 'ScaleVyapar Rozgar collects only the business and contact information needed to help companies discover workers, manage enquiries, and communicate about hiring activity.',
      sections: [
        {
          title: 'Information we collect',
          body: 'We may collect company name, contact person name, phone numbers, email addresses, city, hiring preferences, and communication history submitted through the company website or worker administration tools.'
        },
        {
          title: 'How we use information',
          body: 'We use submitted information to respond to enquiries, match companies with available workers, manage job post activity, send service updates, and improve marketplace operations and support quality.'
        },
        {
          title: 'Sharing and retention',
          body: 'Information is shared only with authorised ScaleVyapar systems, support workflows, and service providers needed to operate the platform. We retain data only as long as necessary for hiring support, legal compliance, and operational recordkeeping.'
        },
        {
          title: 'Contact',
          body: 'For privacy questions, contact support@scalevyapar.com or use the support number +91 98765 43210.'
        }
      ]
    },
    termsOfService: {
      eyebrow: 'Legal',
      title: 'Terms of Service',
      subtitle: 'By using the ScaleVyapar Rozgar company site, you agree to use the service only for genuine hiring, worker search, and related business communication.',
      sections: [
        {
          title: 'Permitted use',
          body: 'You may use this site to enquire about workers, create hiring requests, review plans, and communicate with ScaleVyapar support regarding company-side recruitment activity.'
        },
        {
          title: 'Accurate information',
          body: 'You agree to provide accurate company, contact, and hiring information. False, misleading, abusive, or unlawful usage may lead to account restriction or removal from the platform.'
        },
        {
          title: 'Service availability',
          body: 'ScaleVyapar may update, improve, suspend, or limit parts of the service to maintain quality, compliance, and operational stability. We do not guarantee uninterrupted availability at all times.'
        },
        {
          title: 'Support and disputes',
          body: 'For support, billing, or service questions, contact support@scalevyapar.com. Continued use of the service after updates to these terms constitutes acceptance of the revised terms.'
        }
      ]
    },
    userDataDeletion: {
      eyebrow: 'Legal',
      title: 'User Data Deletion',
      subtitle: 'If you want ScaleVyapar Rozgar to delete company-side enquiry or contact data associated with your business, please send a request using the steps below.',
      sections: [
        {
          title: 'How to request deletion',
          body: 'Email support@scalevyapar.com with the subject line User Data Deletion Request and include your company name, contact number, and the email address used on the platform.'
        },
        {
          title: 'Verification',
          body: 'We may contact you to verify ownership of the company record before deleting any data, so we can protect against accidental or fraudulent deletion requests.'
        },
        {
          title: 'What gets removed',
          body: 'After verification, we will delete or anonymise eligible company enquiry data, support messages, and related records unless retention is required for billing, security, fraud prevention, or legal compliance.'
        },
        {
          title: 'Response time',
          body: 'We aim to review deletion requests promptly and respond through support@scalevyapar.com or +91 98765 43210.'
        }
      ]
    }
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

const sanitizePublicFooterLinkGroups = (groups: LabourCompanyWebsiteContent['footer']['linkGroups']) =>
  groups
    .map(group => ({
      ...group,
      links: group.links.filter(link => !link.href.startsWith('/admin/') && !/website editor/i.test(link.label))
    }))
    .filter(group => group.links.length > 0)

const normalizeCompanyRegistrationHref = (value: string | undefined, fallback: string) => {
  const href = typeof value === 'string' && value.trim() ? value.trim() : fallback
  const normalized = href.replace(/\\/g, '/')
  if (
    normalized === '#company-intake' ||
    normalized === '/labour/company#company-intake' ||
    normalized === 'labour/company#company-intake' ||
    normalized === '/labour/company/post-requirement' ||
    normalized === 'labour/company/post-requirement'
  ) {
    return '/labour/company/company-registration'
  }

  return normalized
}

const normalizeJobPostHref = (value: string | undefined, fallback: string) => {
  const href = typeof value === 'string' && value.trim() ? value.trim() : fallback
  const normalized = href.replace(/\\/g, '/')

  if (
    normalized === '#company-intake' ||
    normalized === '/labour/company#company-intake' ||
    normalized === 'labour/company#company-intake' ||
    normalized === '/labour/company/post-requirement' ||
    normalized === 'labour/company/post-requirement' ||
    normalized === '/labour/company/company-registration' ||
    normalized === 'labour/company/company-registration'
  ) {
    return '/labour/company/job-post'
  }

  return normalized
}

const mergeFooterLinks = (input: unknown, fallback: LabourCompanyWebsiteContent['footer']['legalLinks']) => {
  if (!Array.isArray(input) || !input.length) return fallback
  return input.map((link, index) => {
    const nextLink = typeof link === 'object' && link ? link as Record<string, unknown> : {}
    const fallbackLink = fallback[index] || fallback[0]
    return {
      label: typeof nextLink.label === 'string' && nextLink.label.trim() ? nextLink.label : fallbackLink.label,
      href: typeof nextLink.href === 'string' && nextLink.href.trim() ? nextLink.href : fallbackLink.href
    }
  })
}

const mergeLegalSections = (input: unknown, fallback: LabourCompanyLegalPageSection[]) => {
  if (!Array.isArray(input) || !input.length) return fallback
  return input.map((section, index) => {
    const nextSection = typeof section === 'object' && section ? section as Record<string, unknown> : {}
    const fallbackSection = fallback[index] || fallback[Math.max(fallback.length - 1, 0)]
    return {
      title: typeof nextSection.title === 'string' && nextSection.title.trim() ? nextSection.title : fallbackSection.title,
      body: typeof nextSection.body === 'string' && nextSection.body.trim() ? nextSection.body : fallbackSection.body
    }
  })
}

const mergeLegalPage = (input: unknown, fallback: LabourCompanyLegalPageContent): LabourCompanyLegalPageContent => {
  const nextPage = typeof input === 'object' && input ? input as Record<string, unknown> : {}
  return {
    eyebrow: typeof nextPage.eyebrow === 'string' && nextPage.eyebrow.trim() ? nextPage.eyebrow : fallback.eyebrow,
    title: typeof nextPage.title === 'string' && nextPage.title.trim() ? nextPage.title : fallback.title,
    subtitle: typeof nextPage.subtitle === 'string' && nextPage.subtitle.trim() ? nextPage.subtitle : fallback.subtitle,
    sections: mergeLegalSections(nextPage.sections, fallback.sections)
  }
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
    searchBar: typeof legacy.searchBar === 'object' && legacy.searchBar
      ? { ...defaultContent.home.searchBar, ...(legacy.searchBar as Record<string, string>) }
      : defaultContent.home.searchBar,
    stats: typeof legacy.stats === 'object' && legacy.stats
      ? {
          items: Array.isArray((legacy.stats as Record<string, unknown>).items)
            ? (legacy.stats as Record<string, never>).items as LabourCompanyWebsiteContent['home']['stats']['items']
            : defaultContent.home.stats.items
        }
      : defaultContent.home.stats,
    trustStrip: typeof legacy.trustStrip === 'object' && legacy.trustStrip
      ? {
          title: typeof (legacy.trustStrip as Record<string, unknown>).title === 'string' ? (legacy.trustStrip as Record<string, string>).title : defaultContent.home.trustStrip.title,
          items: Array.isArray((legacy.trustStrip as Record<string, unknown>).items) ? (legacy.trustStrip as Record<string, string[]>).items : defaultContent.home.trustStrip.items
        }
      : defaultContent.home.trustStrip,
    features: typeof legacy.features === 'object' && legacy.features
      ? {
          eyebrow: typeof (legacy.features as Record<string, unknown>).eyebrow === 'string' ? (legacy.features as Record<string, string>).eyebrow : defaultContent.home.features.eyebrow,
          title: typeof (legacy.features as Record<string, unknown>).title === 'string' ? (legacy.features as Record<string, string>).title : defaultContent.home.features.title,
          subtitle: typeof (legacy.features as Record<string, unknown>).subtitle === 'string' ? (legacy.features as Record<string, string>).subtitle : defaultContent.home.features.subtitle,
          cards: Array.isArray((legacy.features as Record<string, unknown>).cards) ? (legacy.features as Record<string, never>).cards as LabourCompanyWebsiteContent['home']['features']['cards'] : defaultContent.home.features.cards
        }
      : defaultContent.home.features,
    process: typeof legacy.process === 'object' && legacy.process
      ? {
          eyebrow: typeof (legacy.process as Record<string, unknown>).eyebrow === 'string' ? (legacy.process as Record<string, string>).eyebrow : defaultContent.home.process.eyebrow,
          title: typeof (legacy.process as Record<string, unknown>).title === 'string' ? (legacy.process as Record<string, string>).title : defaultContent.home.process.title,
          steps: Array.isArray((legacy.process as Record<string, unknown>).steps) ? (legacy.process as Record<string, never>).steps as LabourCompanyWebsiteContent['home']['process']['steps'] : defaultContent.home.process.steps
        }
      : defaultContent.home.process,
    pricing: typeof legacy.pricing === 'object' && legacy.pricing ? { ...defaultContent.home.pricing, ...(legacy.pricing as Record<string, string>) } : defaultContent.home.pricing,
    testimonials: typeof legacy.testimonials === 'object' && legacy.testimonials
      ? {
          eyebrow: typeof (legacy.testimonials as Record<string, unknown>).eyebrow === 'string' ? (legacy.testimonials as Record<string, string>).eyebrow : defaultContent.home.testimonials.eyebrow,
          title: typeof (legacy.testimonials as Record<string, unknown>).title === 'string' ? (legacy.testimonials as Record<string, string>).title : defaultContent.home.testimonials.title,
          items: Array.isArray((legacy.testimonials as Record<string, unknown>).items) ? (legacy.testimonials as Record<string, never>).items as LabourCompanyWebsiteContent['home']['testimonials']['items'] : defaultContent.home.testimonials.items
        }
      : defaultContent.home.testimonials,
    categories: typeof legacy.categories === 'object' && legacy.categories
      ? {
          eyebrow: typeof (legacy.categories as Record<string, unknown>).eyebrow === 'string' ? (legacy.categories as Record<string, string>).eyebrow : defaultContent.home.categories.eyebrow,
          title: typeof (legacy.categories as Record<string, unknown>).title === 'string' ? (legacy.categories as Record<string, string>).title : defaultContent.home.categories.title,
          buttonLabel: typeof (legacy.categories as Record<string, unknown>).buttonLabel === 'string' ? (legacy.categories as Record<string, string>).buttonLabel : defaultContent.home.categories.buttonLabel,
          buttonHref: typeof (legacy.categories as Record<string, unknown>).buttonHref === 'string' ? (legacy.categories as Record<string, string>).buttonHref : defaultContent.home.categories.buttonHref,
          cards: Array.isArray((legacy.categories as Record<string, unknown>).cards) ? (legacy.categories as Record<string, never>).cards as LabourCompanyWebsiteContent['home']['categories']['cards'] : defaultContent.home.categories.cards
        }
      : defaultContent.home.categories,
    faq: typeof legacy.faq === 'object' && legacy.faq
      ? {
          title: typeof (legacy.faq as Record<string, unknown>).title === 'string' ? (legacy.faq as Record<string, string>).title : defaultContent.home.faq.title,
          items: Array.isArray((legacy.faq as Record<string, unknown>).items) ? (legacy.faq as Record<string, never>).items as LabourCompanyWebsiteContent['home']['faq']['items'] : defaultContent.home.faq.items
        }
      : defaultContent.home.faq,
    finalCta: typeof legacy.finalCta === 'object' && legacy.finalCta ? { ...defaultContent.home.finalCta, ...(legacy.finalCta as Record<string, string>) } : defaultContent.home.finalCta,
    workerCta: typeof legacy.workerCta === 'object' && legacy.workerCta ? { ...defaultContent.home.workerCta, ...(legacy.workerCta as Record<string, string>) } : defaultContent.home.workerCta
  }
})

const COMPANY_COPY_SKIP_KEYS = new Set([
  'href',
  'ctaHref',
  'primaryCtaHref',
  'secondaryCtaHref',
  'buttonHref',
  'logoSrc',
  'supportEmail',
  'escalationEmail',
  'phone'
])

const rewriteCompanyFacingLabourCopy = (value: string) =>
  value
    .replace(/\bLabours\b/g, 'Workers')
    .replace(/\blabours\b/g, 'workers')
    .replace(/\bLabour\b/g, 'Worker')
    .replace(/\blabour\b/g, 'worker')

const applyCompanyFacingCopy = (input: unknown, parentKey?: string): unknown => {
  if (typeof input === 'string') {
    return COMPANY_COPY_SKIP_KEYS.has(parentKey || '') ? input : rewriteCompanyFacingLabourCopy(input)
  }

  if (Array.isArray(input)) {
    return input.map(item => applyCompanyFacingCopy(item, parentKey))
  }

  if (!input || typeof input !== 'object') {
    return input
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, applyCompanyFacingCopy(value, key)])
  )
}

const LEGACY_REFERENCE_HOMEPAGE = {
  heroEyebrow: 'Hiring for factories, workshops and contractors',
  heroTitle: 'Hire daily-basis workers faster across stitching, embroidery, machine setup, printer work, electrician jobs and more.',
  heroSubtitle: 'A dedicated company hiring website for worker demand. Post your requirement, choose a low-cost plan, and connect with relevant workers in your city.',
  featureTitle: 'What companies get',
  processTitle: 'How the company flow works',
  testimonialTitle: 'Why this model works',
  finalCtaTitle: 'Start hiring your next worker team'
} as const

const refreshReferenceHomepageTheme = (content: LabourCompanyWebsiteContent): LabourCompanyWebsiteContent => {
  const next = structuredClone(content)

  if (
    /^Hire daily-basis workers? faster across industries/i.test(next.theme.brandTagline) ||
    /^Hire daily-basis worker faster across industries/i.test(next.theme.brandTagline)
  ) {
    next.theme.brandTagline = defaultContent.theme.brandTagline
  }

  if (
    next.home.hero.eyebrow === LEGACY_REFERENCE_HOMEPAGE.heroEyebrow ||
    /factories,\s*workshops and contractors/i.test(next.home.hero.eyebrow)
  ) {
    next.home.hero.eyebrow = defaultContent.home.hero.eyebrow
  }

  if (
    next.home.hero.title === LEGACY_REFERENCE_HOMEPAGE.heroTitle ||
    /^Hire daily-basis/i.test(next.home.hero.title)
  ) {
    next.home.hero.title = defaultContent.home.hero.title
  }

  if (
    next.home.hero.highlightedText === defaultContent.home.hero.highlightedText &&
    !next.home.hero.title.includes(next.home.hero.highlightedText)
  ) {
    next.home.hero.highlightedText = defaultContent.home.hero.highlightedText
  }

  if (
    next.home.hero.subtitle === LEGACY_REFERENCE_HOMEPAGE.heroSubtitle ||
    /^A dedicated company hiring website/i.test(next.home.hero.subtitle)
  ) {
    next.home.hero.subtitle = defaultContent.home.hero.subtitle
  }

  if (next.home.hero.secondaryCtaLabel === 'See Pricing') {
    next.home.hero.secondaryCtaLabel = defaultContent.home.hero.secondaryCtaLabel
    next.home.hero.secondaryCtaHref = defaultContent.home.hero.secondaryCtaHref
  }

  if (
    next.home.trustStrip.items.some(item =>
      /daily-basis|company plan control|city-wise demand|short-validity urgent/i.test(item)
    )
  ) {
    next.home.trustStrip = defaultContent.home.trustStrip
  }

  if (next.home.features.title === LEGACY_REFERENCE_HOMEPAGE.featureTitle) {
    next.home.features = defaultContent.home.features
  }

  if (next.home.process.title === LEGACY_REFERENCE_HOMEPAGE.processTitle) {
    next.home.process = defaultContent.home.process
  }

  if (next.home.testimonials.title === LEGACY_REFERENCE_HOMEPAGE.testimonialTitle) {
    next.home.testimonials = defaultContent.home.testimonials
  }

  if (
    !next.home.categories.cards.length ||
    next.home.categories.cards.every(card => card.href === '/labour/company/search')
  ) {
    next.home.categories = defaultContent.home.categories
  }

  if (
    next.home.finalCta.title === LEGACY_REFERENCE_HOMEPAGE.finalCtaTitle ||
    /^Start hiring your next/i.test(next.home.finalCta.title)
  ) {
    next.home.finalCta = defaultContent.home.finalCta
  }

  if (next.home.workerCta.buttonHref === '/login') {
    next.home.workerCta = defaultContent.home.workerCta
  }

  return next
}

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

  const sanitizedLogoSrc = (() => {
    if (typeof merged.header?.logoSrc !== 'string' || !merged.header.logoSrc.trim()) {
      return defaultContent.header.logoSrc
    }

    const normalized = merged.header.logoSrc.trim().replace(/\.pwg$/i, '.png')
    return normalized.startsWith('/') ? normalized : `/${normalized}`
  })()

  const sanitizedLogoWidth = (() => {
    const parsed = Number(
      typeof merged.header?.logoWidth === 'string' || typeof merged.header?.logoWidth === 'number'
        ? `${merged.header.logoWidth}`.trim()
        : defaultContent.header.logoWidth
    )

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return defaultContent.header.logoWidth
    }

    return String(Math.round(parsed))
  })()

  const normalizedContent = {
    theme: {
      brandName: merged.theme?.brandName || defaultContent.theme.brandName,
      brandTagline: merged.theme?.brandTagline || defaultContent.theme.brandTagline,
      accentColor: merged.theme?.accentColor || defaultContent.theme.accentColor,
      accentSoft: merged.theme?.accentSoft || defaultContent.theme.accentSoft,
      highlightColor: merged.theme?.highlightColor || defaultContent.theme.highlightColor
    },
    header: {
      announcement: merged.header?.announcement || defaultContent.header.announcement,
      logoSrc: sanitizedLogoSrc,
      logoWidth: sanitizedLogoWidth,
      primaryCtaLabel: merged.header?.primaryCtaLabel || defaultContent.header.primaryCtaLabel,
      primaryCtaHref: normalizeJobPostHref(
        merged.header?.primaryCtaHref,
        defaultContent.header.primaryCtaHref
      ),
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
      legalLinks: mergeFooterLinks(merged.footer?.legalLinks, defaultContent.footer.legalLinks),
      linkGroups: sanitizePublicFooterLinkGroups(mergeLinkGroups(merged.footer?.linkGroups, defaultContent.footer.linkGroups))
    },
    home: {
      sectionOrder: uniqueSections(merged.home?.sectionOrder || defaultContent.home.sectionOrder),
      hero: {
        ...defaultContent.home.hero,
        ...merged.home?.hero,
        primaryCtaHref: normalizeJobPostHref(
          merged.home?.hero?.primaryCtaHref,
          defaultContent.home.hero.primaryCtaHref
        ),
        secondaryCtaHref: merged.home?.hero?.secondaryCtaHref || defaultContent.home.hero.secondaryCtaHref
      },
      searchBar: {
        ...defaultContent.home.searchBar,
        ...merged.home?.searchBar
      },
      stats: {
        items: Array.isArray(merged.home?.stats?.items) && merged.home.stats.items.length
          ? merged.home.stats.items.map((item, index) => {
              const fallback = defaultContent.home.stats.items[index] || defaultContent.home.stats.items[0]
              return {
                value: item?.value || fallback.value,
                label: item?.label || fallback.label,
                icon: item?.icon || fallback.icon
              }
            })
          : defaultContent.home.stats.items
      },
      trustStrip: {
        title: merged.home?.trustStrip?.title || defaultContent.home.trustStrip.title,
        items: Array.isArray(merged.home?.trustStrip?.items) ? merged.home.trustStrip.items : defaultContent.home.trustStrip.items
      },
      features: {
        eyebrow: merged.home?.features?.eyebrow || defaultContent.home.features.eyebrow,
        title: merged.home?.features?.title || defaultContent.home.features.title,
        subtitle: merged.home?.features?.subtitle || defaultContent.home.features.subtitle,
        cards: Array.isArray(merged.home?.features?.cards) && merged.home.features.cards.length
          ? merged.home.features.cards.map((card, index) => {
              const fallback = defaultContent.home.features.cards[index] || defaultContent.home.features.cards[0]
              return {
                icon: card?.icon || fallback.icon,
                title: card?.title || fallback.title,
                description: card?.description || fallback.description,
                bullets: Array.isArray(card?.bullets) && card.bullets.length ? card.bullets : fallback.bullets
              }
            })
          : defaultContent.home.features.cards
      },
      process: {
        eyebrow: merged.home?.process?.eyebrow || defaultContent.home.process.eyebrow,
        title: merged.home?.process?.title || defaultContent.home.process.title,
        steps: Array.isArray(merged.home?.process?.steps) && merged.home.process.steps.length
          ? merged.home.process.steps.map((step, index) => {
              const fallback = defaultContent.home.process.steps[index] || defaultContent.home.process.steps[0]
              return {
                icon: step?.icon || fallback.icon,
                title: step?.title || fallback.title,
                description: step?.description || fallback.description
              }
            })
          : defaultContent.home.process.steps
      },
      pricing: { ...defaultContent.home.pricing, ...merged.home?.pricing },
      testimonials: {
        eyebrow: merged.home?.testimonials?.eyebrow || defaultContent.home.testimonials.eyebrow,
        title: merged.home?.testimonials?.title || defaultContent.home.testimonials.title,
        items: Array.isArray(merged.home?.testimonials?.items) && merged.home.testimonials.items.length
          ? merged.home.testimonials.items.map((item, index) => {
              const fallback = defaultContent.home.testimonials.items[index] || defaultContent.home.testimonials.items[0]
              return {
                quote: item?.quote || fallback.quote,
                name: item?.name || fallback.name,
                role: item?.role || fallback.role,
                company: item?.company || fallback.company,
                rating: item?.rating || fallback.rating
              }
            })
          : defaultContent.home.testimonials.items
      },
      categories: {
        eyebrow: merged.home?.categories?.eyebrow || defaultContent.home.categories.eyebrow,
        title: merged.home?.categories?.title || defaultContent.home.categories.title,
        buttonLabel: merged.home?.categories?.buttonLabel || defaultContent.home.categories.buttonLabel,
        buttonHref: merged.home?.categories?.buttonHref || defaultContent.home.categories.buttonHref,
        cards: Array.isArray(merged.home?.categories?.cards) && merged.home.categories.cards.length
          ? merged.home.categories.cards.map((card, index) => {
              const fallback = defaultContent.home.categories.cards[index] || defaultContent.home.categories.cards[0]
              return {
                icon: card?.icon || fallback.icon,
                title: card?.title || fallback.title,
                subtitle: card?.subtitle || fallback.subtitle,
                href: card?.href || fallback.href
              }
            })
          : defaultContent.home.categories.cards
      },
      faq: {
        title: merged.home?.faq?.title || defaultContent.home.faq.title,
        items: Array.isArray(merged.home?.faq?.items) && merged.home.faq.items.length ? merged.home.faq.items : defaultContent.home.faq.items
      },
      finalCta: {
        ...defaultContent.home.finalCta,
        ...merged.home?.finalCta,
        buttonHref: normalizeJobPostHref(
          merged.home?.finalCta?.buttonHref,
          defaultContent.home.finalCta.buttonHref
        )
      },
      intake: { ...defaultContent.home.intake, ...merged.home?.intake },
      workerCta: {
        ...defaultContent.home.workerCta,
        ...merged.home?.workerCta
      }
    },
    pricingPage: {
      ...defaultContent.pricingPage,
      ...merged.pricingPage,
      primaryCtaHref: normalizeJobPostHref(
        merged.pricingPage?.primaryCtaHref,
        defaultContent.pricingPage.primaryCtaHref
      ),
      customPlanPoints: Array.isArray(merged.pricingPage?.customPlanPoints) && merged.pricingPage.customPlanPoints.length ? merged.pricingPage.customPlanPoints : defaultContent.pricingPage.customPlanPoints
    },
    signinPage: {
      ...defaultContent.signinPage,
      ...merged.signinPage,
      secondaryCtaHref: normalizeCompanyRegistrationHref(
        merged.signinPage?.secondaryCtaHref,
        defaultContent.signinPage.secondaryCtaHref
      ),
      benefits: Array.isArray(merged.signinPage?.benefits) && merged.signinPage.benefits.length ? merged.signinPage.benefits : defaultContent.signinPage.benefits
    },
    contactPage: {
      ...defaultContent.contactPage,
      ...merged.contactPage,
      cards: Array.isArray(merged.contactPage?.cards) && merged.contactPage.cards.length
        ? merged.contactPage.cards.map((card, index) => ({
            ...card,
            ctaHref: normalizeCompanyRegistrationHref(
              card.ctaHref,
              defaultContent.contactPage.cards[index]?.ctaHref || defaultContent.contactPage.cards[0].ctaHref
            )
          }))
        : defaultContent.contactPage.cards
    },
    searchPage: {
      ...defaultContent.searchPage,
      ...merged.searchPage
    },
    legalPages: {
      privacyPolicy: mergeLegalPage(merged.legalPages?.privacyPolicy, defaultContent.legalPages.privacyPolicy),
      termsOfService: mergeLegalPage(merged.legalPages?.termsOfService, defaultContent.legalPages.termsOfService),
      userDataDeletion: mergeLegalPage(merged.legalPages?.userDataDeletion, defaultContent.legalPages.userDataDeletion)
    }
  }

  const refreshedContent = refreshReferenceHomepageTheme(normalizedContent)
  return applyCompanyFacingCopy(refreshedContent) as LabourCompanyWebsiteContent
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
