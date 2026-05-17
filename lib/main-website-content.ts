import type { Metadata } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import { supabaseAdmin } from './supabase-admin'

export interface MainWebsiteLinkItem {
  label: string
  href: string
}

export interface MainWebsiteButton {
  label: string
  href: string
}

export interface MainWebsiteStatItem {
  value: string
  label: string
}

export interface MainWebsiteFeatureCard {
  icon: string
  title: string
  description: string
  bullets: string[]
  badge?: string
  href?: string
}

export interface MainWebsiteProcessStep {
  title: string
  description: string
}

export interface MainWebsiteTestimonial {
  quote: string
  name: string
  business: string
}

export interface MainWebsiteFaqItem {
  question: string
  answer: string
}

export interface MainWebsitePlan {
  name: string
  price: string
  cadence: string
  description: string
  badge: string
  features: string[]
  buttonLabel: string
  buttonHref: string
}

export interface MainWebsiteContactHour {
  day: string
  time: string
}

export interface MainWebsiteLegalSection {
  title: string
  body: string
}

export interface MainWebsiteLegalPage {
  title: string
  description: string
  sections: MainWebsiteLegalSection[]
}

export interface MainWebsiteSeoPageMeta {
  title: string
  description: string
}

export interface MainWebsiteContent {
  theme: {
    brandName: string
    brandTagline: string
    primaryColor: string
    accentColor: string
    backgroundColor: string
    buttonColor: string
    logoSrc: string
    faviconSrc: string
    fontFamily: string
  }
  header: {
    announcementText: string
    announcementButtonLabel: string
    announcementButtonHref: string
    logoSrc: string
    siteName: string
    navItems: MainWebsiteLinkItem[]
    primaryButton: MainWebsiteButton
    secondaryButton: MainWebsiteButton
  }
  footer: {
    logoSrc: string
    description: string
    quickLinks: MainWebsiteLinkItem[]
    contactEmail: string
    phone: string
    address: string
    socialLinks: MainWebsiteLinkItem[]
    copyrightText: string
  }
  home: {
    heroEyebrow: string
    heroTitle: string
    heroHighlightedText: string
    heroDescription: string
    heroDesktopImage: string
    heroMobileImage: string
    heroPrimaryButton: MainWebsiteButton
    heroSecondaryButton: MainWebsiteButton
    stats: MainWebsiteStatItem[]
    servicesTitle: string
    servicesDescription: string
    serviceCards: MainWebsiteFeatureCard[]
    processTitle: string
    processDescription: string
    processSteps: MainWebsiteProcessStep[]
    testimonialsTitle: string
    testimonialsDescription: string
    testimonials: MainWebsiteTestimonial[]
    faqTitle: string
    faqItems: MainWebsiteFaqItem[]
    ctaEyebrow: string
    ctaTitle: string
    ctaDescription: string
    ctaPrimaryButton: MainWebsiteButton
    ctaSecondaryButton: MainWebsiteButton
  }
  about: {
    pageTitle: string
    heroEyebrow: string
    heroTitle: string
    heroDescription: string
    companyDescription: string
    mission: string
    vision: string
    values: MainWebsiteFeatureCard[]
    stats: MainWebsiteStatItem[]
    ctaTitle: string
    ctaDescription: string
    ctaPrimaryButton: MainWebsiteButton
    ctaSecondaryButton: MainWebsiteButton
  }
  services: {
    pageTitle: string
    pageDescription: string
    sectionTitle: string
    sectionDescription: string
    cards: MainWebsiteFeatureCard[]
    ctaTitle: string
    ctaDescription: string
    ctaPrimaryButton: MainWebsiteButton
    ctaSecondaryButton: MainWebsiteButton
  }
  pricing: {
    enabled: boolean
    pageTitle: string
    pageDescription: string
    introTitle: string
    introDescription: string
    plans: MainWebsitePlan[]
    faqTitle: string
    faqItems: MainWebsiteFaqItem[]
    ctaTitle: string
    ctaDescription: string
    ctaPrimaryButton: MainWebsiteButton
    ctaSecondaryButton: MainWebsiteButton
  }
  contact: {
    pageTitle: string
    pageDescription: string
    phone: string
    email: string
    address: string
    mapLink: string
    whatsappLink: string
    contactFormTitle: string
    supportText: string
    hours: MainWebsiteContactHour[]
    socialLinks: MainWebsiteLinkItem[]
    faqTitle: string
    faqItems: MainWebsiteFaqItem[]
    ctaTitle: string
    ctaDescription: string
    ctaButton: MainWebsiteButton
  }
  legal: {
    terms: MainWebsiteLegalPage
    privacy: MainWebsiteLegalPage
    refund: MainWebsiteLegalPage
    disclaimer: MainWebsiteLegalPage
  }
  seo: {
    siteTitle: string
    siteDescription: string
    openGraphImage: string
    keywords: string
    pages: {
      home: MainWebsiteSeoPageMeta
      about: MainWebsiteSeoPageMeta
      services: MainWebsiteSeoPageMeta
      pricing: MainWebsiteSeoPageMeta
      contact: MainWebsiteSeoPageMeta
      terms: MainWebsiteSeoPageMeta
      privacy: MainWebsiteSeoPageMeta
      refund: MainWebsiteSeoPageMeta
      disclaimer: MainWebsiteSeoPageMeta
    }
  }
}

type StorageMode = 'supabase' | 'json'
export type MainWebsiteSeoPageKey = keyof MainWebsiteContent['seo']['pages']

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'main-website-content.json')
const TABLE_NAME = 'labour_website_content'
const RECORD_ID = 'main-website'
const PAGE_KEY = 'main'

const defaultLink = (): MainWebsiteLinkItem => ({ label: '', href: '' })
const defaultFeatureCard = (): MainWebsiteFeatureCard => ({ icon: '', title: '', description: '', bullets: [''] })
const defaultProcessStep = (): MainWebsiteProcessStep => ({ title: '', description: '' })
const defaultTestimonial = (): MainWebsiteTestimonial => ({ quote: '', name: '', business: '' })
const defaultFaqItem = (): MainWebsiteFaqItem => ({ question: '', answer: '' })
const defaultPlan = (): MainWebsitePlan => ({
  name: '',
  price: '',
  cadence: '',
  description: '',
  badge: '',
  features: [''],
  buttonLabel: '',
  buttonHref: ''
})
const defaultHour = (): MainWebsiteContactHour => ({ day: '', time: '' })
const defaultLegalSection = (): MainWebsiteLegalSection => ({ title: '', body: '' })
const defaultSeoPage = (): MainWebsiteSeoPageMeta => ({ title: '', description: '' })

export const defaultMainWebsiteContent: MainWebsiteContent = {
  theme: {
    brandName: 'ScaleVyapar',
    brandTagline: 'Business automation tools built for growing Indian businesses',
    primaryColor: '#374655',
    accentColor: '#1d4ed8',
    backgroundColor: '#f8fafc',
    buttonColor: '#374655',
    logoSrc: '/logo.png',
    faviconSrc: '/favicon.ico',
    fontFamily: 'system-ui, sans-serif'
  },
  header: {
    announcementText: 'Get 30% off on selected plans this month.',
    announcementButtonLabel: 'View Pricing',
    announcementButtonHref: '/pricing',
    logoSrc: '/logo.png',
    siteName: 'ScaleVyapar',
    navItems: [
      { label: 'Home', href: '/' },
      { label: 'Tools', href: '/tools' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' }
    ],
    primaryButton: { label: 'Login', href: 'https://www.scalevyapar.in/login' },
    secondaryButton: { label: 'Talk to Us', href: 'https://wa.me/919314023719' }
  },
  footer: {
    logoSrc: '/logo.png',
    description: 'All-in-one business automation platform for Indian businesses. Generate leads, manage workflows, and scale from one workspace.',
    quickLinks: [
      { label: 'Home', href: '/' },
      { label: 'About Us', href: '/about' },
      { label: 'Tools', href: '/tools' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact', href: '/contact' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Refund Policy', href: '/refund-policy' }
    ],
    contactEmail: 'scalevyapar072@gmail.com',
    phone: '+91 9314023719',
    address: 'Jaipur, Rajasthan, India',
    socialLinks: [
      { label: 'WhatsApp', href: 'https://wa.me/919314023719' },
      { label: 'Email', href: 'mailto:scalevyapar072@gmail.com' }
    ],
    copyrightText: 'Copyright 2026 ScaleVyapar. All rights reserved.'
  },
  home: {
    heroEyebrow: 'Built for Indian business teams',
    heroTitle: 'Automate sales, marketing, and operations with',
    heroHighlightedText: 'ScaleVyapar',
    heroDescription: 'Launch the tools your business needs for lead generation, websites, CRM, WhatsApp follow-ups, and AI-powered growth workflows.',
    heroDesktopImage: '/hero-desktop.png',
    heroMobileImage: '/hero-mobile.png',
    heroPrimaryButton: { label: 'Build Your Plan', href: '/pricing' },
    heroSecondaryButton: { label: 'Explore Tools', href: '/tools' },
    stats: [
      { value: '500+', label: 'Businesses served' },
      { value: '6', label: 'Core business tools' },
      { value: '24/7', label: 'WhatsApp support' },
      { value: 'Jaipur', label: 'Proudly built in India' }
    ],
    servicesTitle: 'Everything you need to scale faster',
    servicesDescription: 'Choose the modules that match your growth stage and run them from one connected business workspace.',
    serviceCards: [
      {
        icon: 'LR',
        title: 'LeadRadar',
        description: 'Extract qualified B2B leads from Google Maps with filters for city, business type, and keywords.',
        bullets: ['Google Maps extraction', 'Local targeting', 'Excel and CRM export'],
        badge: 'Built by ScaleVyapar',
        href: '/tools'
      },
      {
        icon: 'VZ',
        title: 'Vizora AI',
        description: 'Create AI product photos and marketing creatives without organizing a shoot.',
        bullets: ['AI product photos', 'Social media creatives', 'Fast turnaround'],
        badge: 'Built by ScaleVyapar',
        href: '/tools'
      },
      {
        icon: 'WB',
        title: 'Website Builder',
        description: 'Launch a responsive business website with ongoing updates and lead capture built in.',
        bullets: ['Custom design', 'Mobile responsive', 'SEO-ready setup'],
        badge: 'Built by ScaleVyapar',
        href: '/tools'
      },
      {
        icon: 'CRM',
        title: 'CRM and Calls',
        description: 'Track calls, follow-ups, and deal stages so no high-intent lead slips through.',
        bullets: ['Lead tracking', 'Follow-up reminders', 'Team visibility'],
        badge: 'Premium tool',
        href: '/tools'
      },
      {
        icon: 'WA',
        title: 'WhatsApp Automation',
        description: 'Run follow-up campaigns, reminders, and automated replies at scale on WhatsApp.',
        bullets: ['Bulk messaging', 'Lead nurturing', 'Campaign automation'],
        badge: 'Premium tool',
        href: '/tools'
      },
      {
        icon: 'INV',
        title: 'Inventory Management',
        description: 'Monitor stock, raw materials, and dispatch flows from one live dashboard.',
        bullets: ['Stock tracking', 'Production visibility', 'Dispatch workflow'],
        badge: 'Premium tool',
        href: '/tools'
      }
    ],
    processTitle: 'How ScaleVyapar works',
    processDescription: 'Start with the modules you need today and expand the workspace as your team grows.',
    processSteps: [
      { title: 'Choose your tools', description: 'Pick the business tools that solve your current growth bottlenecks.' },
      { title: 'Launch your workspace', description: 'Get set up quickly with onboarding, routing, and business-ready defaults.' },
      { title: 'Scale with confidence', description: 'Run faster follow-ups, better lead generation, and cleaner operations.' }
    ],
    testimonialsTitle: 'What clients say about ScaleVyapar',
    testimonialsDescription: 'Real feedback from businesses using the platform to generate leads and automate growth.',
    testimonials: [
      { quote: 'ScaleVyapar helped us generate 500 plus leads in two weeks. Our sales team is much more productive now.', name: 'Rajesh Sharma', business: 'Sharma Textiles, Jaipur' },
      { quote: 'Vizora reduced our content production cost dramatically and improved our Instagram sales pipeline.', name: 'Priya Agarwal', business: 'Agarwal Exports, Jaipur' },
      { quote: 'The WhatsApp automation tools completely changed our follow-up speed and response quality.', name: 'Mohit Gupta', business: 'Gupta Electronics, Jaipur' }
    ],
    faqTitle: 'Frequently asked questions',
    faqItems: [
      { question: 'How quickly can we get started?', answer: 'Most clients can be onboarded within one business day after plan confirmation.' },
      { question: 'Do you support custom combinations of tools?', answer: 'Yes. You can build a plan around the exact tools your team needs.' },
      { question: 'Do you offer onboarding help?', answer: 'Yes. We provide setup guidance and WhatsApp support during rollout.' }
    ],
    ctaEyebrow: 'Ready when you are',
    ctaTitle: 'Launch the right business stack for your team',
    ctaDescription: 'Talk to ScaleVyapar and build a plan around the tools that fit your workflow today.',
    ctaPrimaryButton: { label: 'View Pricing', href: '/pricing' },
    ctaSecondaryButton: { label: 'Chat on WhatsApp', href: 'https://wa.me/919314023719' }
  },
  about: {
    pageTitle: 'About ScaleVyapar',
    heroEyebrow: 'About us',
    heroTitle: 'Built for Indian businesses by people who understand the market',
    heroDescription: 'ScaleVyapar helps growing teams run lead generation, websites, CRM workflows, and automation from one connected platform.',
    companyDescription: 'ScaleVyapar was created to give Indian businesses practical automation tools without the cost and complexity of stitched-together foreign software stacks.',
    mission: 'Make business automation accessible, practical, and growth-focused for Indian businesses of every size.',
    vision: 'Become the go-to automation operating system for ambitious Indian business teams.',
    values: [
      { icon: '01', title: 'Client first', description: 'We design workflows around the needs of real businesses and real teams.', bullets: ['Support-led execution'] },
      { icon: '02', title: 'Built for India', description: 'Our decisions reflect local business realities, local support expectations, and Indian buying journeys.', bullets: ['Local market fit'] },
      { icon: '03', title: 'Simple to adopt', description: 'We keep implementation practical so teams can get value quickly.', bullets: ['Fast onboarding'] }
    ],
    stats: [
      { value: '500+', label: 'Businesses served' },
      { value: '6', label: 'Product areas' },
      { value: '24/7', label: 'WhatsApp support' }
    ],
    ctaTitle: 'Want to build with ScaleVyapar?',
    ctaDescription: 'Our team can help you choose the right mix of products, onboarding, and support for your stage.',
    ctaPrimaryButton: { label: 'See Pricing', href: '/pricing' },
    ctaSecondaryButton: { label: 'Contact Us', href: '/contact' }
  },
  services: {
    pageTitle: 'Tools and Services',
    pageDescription: 'Explore the business tools and automation services available across the ScaleVyapar platform.',
    sectionTitle: 'One platform, multiple growth engines',
    sectionDescription: 'Every service can be launched independently or combined into a more complete operating stack.',
    cards: [
      {
        icon: 'LR',
        title: 'Lead generation',
        description: 'Find business contacts from Google Maps and structure them for sales teams.',
        bullets: ['Location filters', 'Business filters', 'Export-ready results'],
        badge: 'LeadRadar'
      },
      {
        icon: 'VZ',
        title: 'AI creatives',
        description: 'Create product images and content-ready assets for ecommerce and campaigns.',
        bullets: ['Product photography', 'Creative variations', 'Quick delivery'],
        badge: 'Vizora AI'
      },
      {
        icon: 'WEB',
        title: 'Business websites',
        description: 'Launch fast websites with service pages, pricing, contact capture, and WhatsApp entry points.',
        bullets: ['Responsive layout', 'SEO-friendly pages', 'Update support'],
        badge: 'Website Builder'
      },
      {
        icon: 'CRM',
        title: 'CRM workflow',
        description: 'Track leads, teams, calls, and follow-ups from one workflow view.',
        bullets: ['Deal tracking', 'Follow-up reminders', 'Call visibility'],
        badge: 'Premium'
      },
      {
        icon: 'WA',
        title: 'WhatsApp automation',
        description: 'Automate lead routing, campaigns, reminders, and repeat customer communication.',
        bullets: ['Templates', 'Broadcasts', 'Nurture flows'],
        badge: 'Premium'
      },
      {
        icon: 'INV',
        title: 'Inventory operations',
        description: 'Monitor stock and production steps for businesses with physical goods.',
        bullets: ['Stock updates', 'Production tracking', 'Dispatch visibility'],
        badge: 'Premium'
      }
    ],
    ctaTitle: 'Need help choosing the right stack?',
    ctaDescription: 'We can help map your requirements to the right set of modules before rollout.',
    ctaPrimaryButton: { label: 'Build a Plan', href: '/pricing' },
    ctaSecondaryButton: { label: 'Talk to the Team', href: 'https://wa.me/919314023719' }
  },
  pricing: {
    enabled: true,
    pageTitle: 'Build Your Own Plan',
    pageDescription: 'Select the tools your business needs and pay only for the workflow coverage you actually use.',
    introTitle: 'Choose the tools that match your business',
    introDescription: 'Use the calculator below to shape your plan, and add credits as your usage grows.',
    plans: [
      {
        name: 'Starter',
        price: 'Rs 2,999',
        cadence: '/month',
        description: 'Good for small teams starting with a focused workflow.',
        badge: 'Most accessible',
        features: ['Core onboarding', 'One growth workflow', 'WhatsApp support'],
        buttonLabel: 'Talk to Sales',
        buttonHref: 'https://wa.me/919314023719'
      },
      {
        name: 'Growth',
        price: 'Rs 5,999',
        cadence: '/month',
        description: 'Built for teams combining multiple tools across lead generation and follow-up.',
        badge: 'Popular',
        features: ['Multiple tools', 'Priority onboarding', 'Faster support'],
        buttonLabel: 'Build My Plan',
        buttonHref: '/contact'
      }
    ],
    faqTitle: 'Pricing questions',
    faqItems: [
      { question: 'What are credits?', answer: 'Credits are usage units applied to supported tools and actions across the platform.' },
      { question: 'Can we change tools later?', answer: 'Yes. Plans can be adjusted as your requirements evolve.' },
      { question: 'Do you help with onboarding?', answer: 'Yes. Onboarding support is included so your team can launch smoothly.' }
    ],
    ctaTitle: 'Need help choosing the right plan?',
    ctaDescription: 'Our team can recommend the right tool mix based on your team, process, and growth goals.',
    ctaPrimaryButton: { label: 'Message on WhatsApp', href: 'https://wa.me/919314023719' },
    ctaSecondaryButton: { label: 'Contact Us', href: '/contact' }
  },
  contact: {
    pageTitle: 'Get in Touch',
    pageDescription: 'Talk to ScaleVyapar about your workflow, your current bottlenecks, and the tools you want to launch.',
    phone: '+91 9314023719',
    email: 'scalevyapar072@gmail.com',
    address: 'Jaipur, Rajasthan, India',
    mapLink: 'https://maps.google.com/?q=Jaipur,Rajasthan',
    whatsappLink: 'https://wa.me/919314023719',
    contactFormTitle: 'Send us a message',
    supportText: 'Share your business details and we will follow up on WhatsApp with the right next step.',
    hours: [
      { day: 'Monday to Friday', time: '9:00 AM to 7:00 PM' },
      { day: 'Saturday', time: '10:00 AM to 5:00 PM' },
      { day: 'Sunday', time: 'WhatsApp support only' }
    ],
    socialLinks: [
      { label: 'WhatsApp', href: 'https://wa.me/919314023719' },
      { label: 'Email', href: 'mailto:scalevyapar072@gmail.com' }
    ],
    faqTitle: 'Common questions',
    faqItems: [
      { question: 'How soon do you reply?', answer: 'WhatsApp enquiries usually receive the fastest response.' },
      { question: 'Can you suggest the right tools for our business?', answer: 'Yes. We help map your needs to the best combination of products.' },
      { question: 'Do you support custom website or workflow requests?', answer: 'Yes. We can review custom needs during discovery.' }
    ],
    ctaTitle: 'Ready to start the conversation?',
    ctaDescription: 'Reach out on WhatsApp for the fastest route to onboarding and planning.',
    ctaButton: { label: 'Message on WhatsApp', href: 'https://wa.me/919314023719?text=Hi! I want to know more about ScaleVyapar.' }
  },
  legal: {
    terms: {
      title: 'Terms of Service',
      description: 'These terms describe how the ScaleVyapar website and services may be used.',
      sections: [
        { title: 'Permitted use', body: 'You may use the ScaleVyapar website and services for lawful business activity, enquiries, and supported operational workflows.' },
        { title: 'Accuracy of information', body: 'You agree to provide accurate account, billing, and contact information when interacting with ScaleVyapar.' },
        { title: 'Service availability', body: 'We may improve, change, suspend, or discontinue parts of the service to maintain quality, compliance, and performance.' }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      description: 'This policy explains how ScaleVyapar collects, uses, and protects business and contact information.',
      sections: [
        { title: 'Information we collect', body: 'We may collect names, business details, contact information, billing information, and messages submitted through our forms or workflows.' },
        { title: 'How we use data', body: 'Collected information is used to provide services, respond to enquiries, support accounts, and improve product operations.' },
        { title: 'How data is shared', body: 'ScaleVyapar does not sell personal data. Service providers may process data only as needed to help us operate the platform.' }
      ]
    },
    refund: {
      title: 'Refund Policy',
      description: 'This policy explains how refunds and service adjustments are handled for ScaleVyapar services.',
      sections: [
        { title: 'Service review', body: 'Refund requests are reviewed against the service already delivered, setup effort completed, and any custom work performed.' },
        { title: 'Subscription billing', body: 'If a plan renewal needs correction, contact us promptly so we can review the billing event and available remedies.' },
        { title: 'Support contact', body: 'For refund-related requests, contact the ScaleVyapar team through the support channels listed on the contact page.' }
      ]
    },
    disclaimer: {
      title: 'Disclaimer',
      description: 'This page outlines important limitations and expectations for information published by ScaleVyapar.',
      sections: [
        { title: 'Business information', body: 'Website copy, pricing examples, and service descriptions are provided for general information and may change over time.' },
        { title: 'No guaranteed outcome', body: 'Business results vary based on market conditions, execution quality, offer strength, and campaign inputs.' },
        { title: 'Third-party platforms', body: 'Some workflows depend on third-party services, providers, or platform policies outside direct ScaleVyapar control.' }
      ]
    }
  },
  seo: {
    siteTitle: 'ScaleVyapar | Business Automation Platform',
    siteDescription: 'ScaleVyapar helps Indian businesses automate lead generation, websites, CRM, WhatsApp workflows, and growth operations.',
    openGraphImage: '/logo.png',
    keywords: 'ScaleVyapar, business automation, lead generation, CRM, WhatsApp automation, AI photos, inventory management',
    pages: {
      home: {
        title: 'ScaleVyapar | Business Automation Platform',
        description: 'Launch lead generation, websites, CRM, WhatsApp automation, and growth workflows from one business platform.'
      },
      about: {
        title: 'About ScaleVyapar',
        description: 'Learn how ScaleVyapar helps Indian businesses adopt practical automation tools that support growth.'
      },
      services: {
        title: 'Tools and Services | ScaleVyapar',
        description: 'Explore the tools and services available across the ScaleVyapar business automation platform.'
      },
      pricing: {
        title: 'Pricing | ScaleVyapar',
        description: 'Build a ScaleVyapar plan around the business tools your team needs today.'
      },
      contact: {
        title: 'Contact | ScaleVyapar',
        description: 'Contact ScaleVyapar for pricing, onboarding, and business automation support.'
      },
      terms: {
        title: 'Terms of Service | ScaleVyapar',
        description: 'Read the terms of service for the ScaleVyapar website and platform.'
      },
      privacy: {
        title: 'Privacy Policy | ScaleVyapar',
        description: 'Read the privacy policy for the ScaleVyapar website and platform.'
      },
      refund: {
        title: 'Refund Policy | ScaleVyapar',
        description: 'Read the refund policy for services offered by ScaleVyapar.'
      },
      disclaimer: {
        title: 'Disclaimer | ScaleVyapar',
        description: 'Read the disclaimer for information published on the ScaleVyapar website.'
      }
    }
  }
}

const isMissingSupabaseTableError = (message: string | undefined) =>
  typeof message === 'string' && (
    message.includes('schema cache') ||
    message.includes('relation') ||
    message.includes('table')
  )

const normalizeString = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

const normalizeBoolean = (value: unknown, fallback: boolean) =>
  typeof value === 'boolean' ? value : fallback

const normalizeStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) {
    return fallback
  }

  const cleaned = value
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)

  return cleaned.length ? cleaned : fallback
}

const normalizeLinkItem = (value: unknown, fallback: MainWebsiteLinkItem): MainWebsiteLinkItem => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteLinkItem> : {}
  return {
    label: normalizeString(source.label, fallback.label),
    href: normalizeString(source.href, fallback.href)
  }
}

const normalizeButton = (value: unknown, fallback: MainWebsiteButton): MainWebsiteButton => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteButton> : {}
  return {
    label: normalizeString(source.label, fallback.label),
    href: normalizeString(source.href, fallback.href)
  }
}

const normalizeStatItem = (value: unknown, fallback: MainWebsiteStatItem): MainWebsiteStatItem => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteStatItem> : {}
  return {
    value: normalizeString(source.value, fallback.value),
    label: normalizeString(source.label, fallback.label)
  }
}

const normalizeFeatureCard = (value: unknown, fallback: MainWebsiteFeatureCard): MainWebsiteFeatureCard => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteFeatureCard> : {}
  return {
    icon: normalizeString(source.icon, fallback.icon),
    title: normalizeString(source.title, fallback.title),
    description: normalizeString(source.description, fallback.description),
    bullets: normalizeStringArray(source.bullets, fallback.bullets),
    badge: normalizeString(source.badge, fallback.badge || ''),
    href: normalizeString(source.href, fallback.href || '')
  }
}

const normalizeProcessStep = (value: unknown, fallback: MainWebsiteProcessStep): MainWebsiteProcessStep => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteProcessStep> : {}
  return {
    title: normalizeString(source.title, fallback.title),
    description: normalizeString(source.description, fallback.description)
  }
}

const normalizeTestimonial = (value: unknown, fallback: MainWebsiteTestimonial): MainWebsiteTestimonial => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteTestimonial> : {}
  return {
    quote: normalizeString(source.quote, fallback.quote),
    name: normalizeString(source.name, fallback.name),
    business: normalizeString(source.business, fallback.business)
  }
}

const normalizeFaqItem = (value: unknown, fallback: MainWebsiteFaqItem): MainWebsiteFaqItem => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteFaqItem> : {}
  return {
    question: normalizeString(source.question, fallback.question),
    answer: normalizeString(source.answer, fallback.answer)
  }
}

const normalizePlan = (value: unknown, fallback: MainWebsitePlan): MainWebsitePlan => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsitePlan> : {}
  return {
    name: normalizeString(source.name, fallback.name),
    price: normalizeString(source.price, fallback.price),
    cadence: normalizeString(source.cadence, fallback.cadence),
    description: normalizeString(source.description, fallback.description),
    badge: normalizeString(source.badge, fallback.badge),
    features: normalizeStringArray(source.features, fallback.features),
    buttonLabel: normalizeString(source.buttonLabel, fallback.buttonLabel),
    buttonHref: normalizeString(source.buttonHref, fallback.buttonHref)
  }
}

const normalizeHour = (value: unknown, fallback: MainWebsiteContactHour): MainWebsiteContactHour => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteContactHour> : {}
  return {
    day: normalizeString(source.day, fallback.day),
    time: normalizeString(source.time, fallback.time)
  }
}

const normalizeLegalSection = (value: unknown, fallback: MainWebsiteLegalSection): MainWebsiteLegalSection => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteLegalSection> : {}
  return {
    title: normalizeString(source.title, fallback.title),
    body: normalizeString(source.body, fallback.body)
  }
}

const normalizeLegalPage = (value: unknown, fallback: MainWebsiteLegalPage): MainWebsiteLegalPage => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteLegalPage> : {}
  const sections = Array.isArray(source.sections) && source.sections.length
    ? source.sections.map((section, index) => normalizeLegalSection(section, fallback.sections[index] || defaultLegalSection()))
    : fallback.sections

  return {
    title: normalizeString(source.title, fallback.title),
    description: normalizeString(source.description, fallback.description),
    sections
  }
}

const normalizeSeoPage = (value: unknown, fallback: MainWebsiteSeoPageMeta): MainWebsiteSeoPageMeta => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteSeoPageMeta> : {}
  return {
    title: normalizeString(source.title, fallback.title),
    description: normalizeString(source.description, fallback.description)
  }
}

const normalizeArray = <T>(
  value: unknown,
  fallback: T[],
  normalizer: (item: unknown, fallbackItem: T) => T,
  emptyFactory: () => T
) => {
  if (!Array.isArray(value)) {
    return fallback
  }

  const cleaned = value.map((item, index) => normalizer(item, fallback[index] || emptyFactory()))
  return cleaned.length ? cleaned : fallback
}

export const normalizeMainWebsiteContent = (value: unknown): MainWebsiteContent => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteContent> : {}

  return {
    theme: {
      brandName: normalizeString(source.theme?.brandName, defaultMainWebsiteContent.theme.brandName),
      brandTagline: normalizeString(source.theme?.brandTagline, defaultMainWebsiteContent.theme.brandTagline),
      primaryColor: normalizeString(source.theme?.primaryColor, defaultMainWebsiteContent.theme.primaryColor),
      accentColor: normalizeString(source.theme?.accentColor, defaultMainWebsiteContent.theme.accentColor),
      backgroundColor: normalizeString(source.theme?.backgroundColor, defaultMainWebsiteContent.theme.backgroundColor),
      buttonColor: normalizeString(source.theme?.buttonColor, defaultMainWebsiteContent.theme.buttonColor),
      logoSrc: normalizeString(source.theme?.logoSrc, defaultMainWebsiteContent.theme.logoSrc),
      faviconSrc: normalizeString(source.theme?.faviconSrc, defaultMainWebsiteContent.theme.faviconSrc),
      fontFamily: normalizeString(source.theme?.fontFamily, defaultMainWebsiteContent.theme.fontFamily)
    },
    header: {
      announcementText: normalizeString(source.header?.announcementText, defaultMainWebsiteContent.header.announcementText),
      announcementButtonLabel: normalizeString(source.header?.announcementButtonLabel, defaultMainWebsiteContent.header.announcementButtonLabel),
      announcementButtonHref: normalizeString(source.header?.announcementButtonHref, defaultMainWebsiteContent.header.announcementButtonHref),
      logoSrc: normalizeString(source.header?.logoSrc, defaultMainWebsiteContent.header.logoSrc),
      siteName: normalizeString(source.header?.siteName, defaultMainWebsiteContent.header.siteName),
      navItems: normalizeArray(source.header?.navItems, defaultMainWebsiteContent.header.navItems, normalizeLinkItem, defaultLink),
      primaryButton: normalizeButton(source.header?.primaryButton, defaultMainWebsiteContent.header.primaryButton),
      secondaryButton: normalizeButton(source.header?.secondaryButton, defaultMainWebsiteContent.header.secondaryButton)
    },
    footer: {
      logoSrc: normalizeString(source.footer?.logoSrc, defaultMainWebsiteContent.footer.logoSrc),
      description: normalizeString(source.footer?.description, defaultMainWebsiteContent.footer.description),
      quickLinks: normalizeArray(source.footer?.quickLinks, defaultMainWebsiteContent.footer.quickLinks, normalizeLinkItem, defaultLink),
      contactEmail: normalizeString(source.footer?.contactEmail, defaultMainWebsiteContent.footer.contactEmail),
      phone: normalizeString(source.footer?.phone, defaultMainWebsiteContent.footer.phone),
      address: normalizeString(source.footer?.address, defaultMainWebsiteContent.footer.address),
      socialLinks: normalizeArray(source.footer?.socialLinks, defaultMainWebsiteContent.footer.socialLinks, normalizeLinkItem, defaultLink),
      copyrightText: normalizeString(source.footer?.copyrightText, defaultMainWebsiteContent.footer.copyrightText)
    },
    home: {
      heroEyebrow: normalizeString(source.home?.heroEyebrow, defaultMainWebsiteContent.home.heroEyebrow),
      heroTitle: normalizeString(source.home?.heroTitle, defaultMainWebsiteContent.home.heroTitle),
      heroHighlightedText: normalizeString(source.home?.heroHighlightedText, defaultMainWebsiteContent.home.heroHighlightedText),
      heroDescription: normalizeString(source.home?.heroDescription, defaultMainWebsiteContent.home.heroDescription),
      heroDesktopImage: normalizeString(source.home?.heroDesktopImage, defaultMainWebsiteContent.home.heroDesktopImage),
      heroMobileImage: normalizeString(source.home?.heroMobileImage, defaultMainWebsiteContent.home.heroMobileImage),
      heroPrimaryButton: normalizeButton(source.home?.heroPrimaryButton, defaultMainWebsiteContent.home.heroPrimaryButton),
      heroSecondaryButton: normalizeButton(source.home?.heroSecondaryButton, defaultMainWebsiteContent.home.heroSecondaryButton),
      stats: normalizeArray(source.home?.stats, defaultMainWebsiteContent.home.stats, normalizeStatItem, () => ({ value: '', label: '' })),
      servicesTitle: normalizeString(source.home?.servicesTitle, defaultMainWebsiteContent.home.servicesTitle),
      servicesDescription: normalizeString(source.home?.servicesDescription, defaultMainWebsiteContent.home.servicesDescription),
      serviceCards: normalizeArray(source.home?.serviceCards, defaultMainWebsiteContent.home.serviceCards, normalizeFeatureCard, defaultFeatureCard),
      processTitle: normalizeString(source.home?.processTitle, defaultMainWebsiteContent.home.processTitle),
      processDescription: normalizeString(source.home?.processDescription, defaultMainWebsiteContent.home.processDescription),
      processSteps: normalizeArray(source.home?.processSteps, defaultMainWebsiteContent.home.processSteps, normalizeProcessStep, defaultProcessStep),
      testimonialsTitle: normalizeString(source.home?.testimonialsTitle, defaultMainWebsiteContent.home.testimonialsTitle),
      testimonialsDescription: normalizeString(source.home?.testimonialsDescription, defaultMainWebsiteContent.home.testimonialsDescription),
      testimonials: normalizeArray(source.home?.testimonials, defaultMainWebsiteContent.home.testimonials, normalizeTestimonial, defaultTestimonial),
      faqTitle: normalizeString(source.home?.faqTitle, defaultMainWebsiteContent.home.faqTitle),
      faqItems: normalizeArray(source.home?.faqItems, defaultMainWebsiteContent.home.faqItems, normalizeFaqItem, defaultFaqItem),
      ctaEyebrow: normalizeString(source.home?.ctaEyebrow, defaultMainWebsiteContent.home.ctaEyebrow),
      ctaTitle: normalizeString(source.home?.ctaTitle, defaultMainWebsiteContent.home.ctaTitle),
      ctaDescription: normalizeString(source.home?.ctaDescription, defaultMainWebsiteContent.home.ctaDescription),
      ctaPrimaryButton: normalizeButton(source.home?.ctaPrimaryButton, defaultMainWebsiteContent.home.ctaPrimaryButton),
      ctaSecondaryButton: normalizeButton(source.home?.ctaSecondaryButton, defaultMainWebsiteContent.home.ctaSecondaryButton)
    },
    about: {
      pageTitle: normalizeString(source.about?.pageTitle, defaultMainWebsiteContent.about.pageTitle),
      heroEyebrow: normalizeString(source.about?.heroEyebrow, defaultMainWebsiteContent.about.heroEyebrow),
      heroTitle: normalizeString(source.about?.heroTitle, defaultMainWebsiteContent.about.heroTitle),
      heroDescription: normalizeString(source.about?.heroDescription, defaultMainWebsiteContent.about.heroDescription),
      companyDescription: normalizeString(source.about?.companyDescription, defaultMainWebsiteContent.about.companyDescription),
      mission: normalizeString(source.about?.mission, defaultMainWebsiteContent.about.mission),
      vision: normalizeString(source.about?.vision, defaultMainWebsiteContent.about.vision),
      values: normalizeArray(source.about?.values, defaultMainWebsiteContent.about.values, normalizeFeatureCard, defaultFeatureCard),
      stats: normalizeArray(source.about?.stats, defaultMainWebsiteContent.about.stats, normalizeStatItem, () => ({ value: '', label: '' })),
      ctaTitle: normalizeString(source.about?.ctaTitle, defaultMainWebsiteContent.about.ctaTitle),
      ctaDescription: normalizeString(source.about?.ctaDescription, defaultMainWebsiteContent.about.ctaDescription),
      ctaPrimaryButton: normalizeButton(source.about?.ctaPrimaryButton, defaultMainWebsiteContent.about.ctaPrimaryButton),
      ctaSecondaryButton: normalizeButton(source.about?.ctaSecondaryButton, defaultMainWebsiteContent.about.ctaSecondaryButton)
    },
    services: {
      pageTitle: normalizeString(source.services?.pageTitle, defaultMainWebsiteContent.services.pageTitle),
      pageDescription: normalizeString(source.services?.pageDescription, defaultMainWebsiteContent.services.pageDescription),
      sectionTitle: normalizeString(source.services?.sectionTitle, defaultMainWebsiteContent.services.sectionTitle),
      sectionDescription: normalizeString(source.services?.sectionDescription, defaultMainWebsiteContent.services.sectionDescription),
      cards: normalizeArray(source.services?.cards, defaultMainWebsiteContent.services.cards, normalizeFeatureCard, defaultFeatureCard),
      ctaTitle: normalizeString(source.services?.ctaTitle, defaultMainWebsiteContent.services.ctaTitle),
      ctaDescription: normalizeString(source.services?.ctaDescription, defaultMainWebsiteContent.services.ctaDescription),
      ctaPrimaryButton: normalizeButton(source.services?.ctaPrimaryButton, defaultMainWebsiteContent.services.ctaPrimaryButton),
      ctaSecondaryButton: normalizeButton(source.services?.ctaSecondaryButton, defaultMainWebsiteContent.services.ctaSecondaryButton)
    },
    pricing: {
      enabled: normalizeBoolean(source.pricing?.enabled, defaultMainWebsiteContent.pricing.enabled),
      pageTitle: normalizeString(source.pricing?.pageTitle, defaultMainWebsiteContent.pricing.pageTitle),
      pageDescription: normalizeString(source.pricing?.pageDescription, defaultMainWebsiteContent.pricing.pageDescription),
      introTitle: normalizeString(source.pricing?.introTitle, defaultMainWebsiteContent.pricing.introTitle),
      introDescription: normalizeString(source.pricing?.introDescription, defaultMainWebsiteContent.pricing.introDescription),
      plans: normalizeArray(source.pricing?.plans, defaultMainWebsiteContent.pricing.plans, normalizePlan, defaultPlan),
      faqTitle: normalizeString(source.pricing?.faqTitle, defaultMainWebsiteContent.pricing.faqTitle),
      faqItems: normalizeArray(source.pricing?.faqItems, defaultMainWebsiteContent.pricing.faqItems, normalizeFaqItem, defaultFaqItem),
      ctaTitle: normalizeString(source.pricing?.ctaTitle, defaultMainWebsiteContent.pricing.ctaTitle),
      ctaDescription: normalizeString(source.pricing?.ctaDescription, defaultMainWebsiteContent.pricing.ctaDescription),
      ctaPrimaryButton: normalizeButton(source.pricing?.ctaPrimaryButton, defaultMainWebsiteContent.pricing.ctaPrimaryButton),
      ctaSecondaryButton: normalizeButton(source.pricing?.ctaSecondaryButton, defaultMainWebsiteContent.pricing.ctaSecondaryButton)
    },
    contact: {
      pageTitle: normalizeString(source.contact?.pageTitle, defaultMainWebsiteContent.contact.pageTitle),
      pageDescription: normalizeString(source.contact?.pageDescription, defaultMainWebsiteContent.contact.pageDescription),
      phone: normalizeString(source.contact?.phone, defaultMainWebsiteContent.contact.phone),
      email: normalizeString(source.contact?.email, defaultMainWebsiteContent.contact.email),
      address: normalizeString(source.contact?.address, defaultMainWebsiteContent.contact.address),
      mapLink: normalizeString(source.contact?.mapLink, defaultMainWebsiteContent.contact.mapLink),
      whatsappLink: normalizeString(source.contact?.whatsappLink, defaultMainWebsiteContent.contact.whatsappLink),
      contactFormTitle: normalizeString(source.contact?.contactFormTitle, defaultMainWebsiteContent.contact.contactFormTitle),
      supportText: normalizeString(source.contact?.supportText, defaultMainWebsiteContent.contact.supportText),
      hours: normalizeArray(source.contact?.hours, defaultMainWebsiteContent.contact.hours, normalizeHour, defaultHour),
      socialLinks: normalizeArray(source.contact?.socialLinks, defaultMainWebsiteContent.contact.socialLinks, normalizeLinkItem, defaultLink),
      faqTitle: normalizeString(source.contact?.faqTitle, defaultMainWebsiteContent.contact.faqTitle),
      faqItems: normalizeArray(source.contact?.faqItems, defaultMainWebsiteContent.contact.faqItems, normalizeFaqItem, defaultFaqItem),
      ctaTitle: normalizeString(source.contact?.ctaTitle, defaultMainWebsiteContent.contact.ctaTitle),
      ctaDescription: normalizeString(source.contact?.ctaDescription, defaultMainWebsiteContent.contact.ctaDescription),
      ctaButton: normalizeButton(source.contact?.ctaButton, defaultMainWebsiteContent.contact.ctaButton)
    },
    legal: {
      terms: normalizeLegalPage(source.legal?.terms, defaultMainWebsiteContent.legal.terms),
      privacy: normalizeLegalPage(source.legal?.privacy, defaultMainWebsiteContent.legal.privacy),
      refund: normalizeLegalPage(source.legal?.refund, defaultMainWebsiteContent.legal.refund),
      disclaimer: normalizeLegalPage(source.legal?.disclaimer, defaultMainWebsiteContent.legal.disclaimer)
    },
    seo: {
      siteTitle: normalizeString(source.seo?.siteTitle, defaultMainWebsiteContent.seo.siteTitle),
      siteDescription: normalizeString(source.seo?.siteDescription, defaultMainWebsiteContent.seo.siteDescription),
      openGraphImage: normalizeString(source.seo?.openGraphImage, defaultMainWebsiteContent.seo.openGraphImage),
      keywords: normalizeString(source.seo?.keywords, defaultMainWebsiteContent.seo.keywords),
      pages: {
        home: normalizeSeoPage(source.seo?.pages?.home, defaultMainWebsiteContent.seo.pages.home),
        about: normalizeSeoPage(source.seo?.pages?.about, defaultMainWebsiteContent.seo.pages.about),
        services: normalizeSeoPage(source.seo?.pages?.services, defaultMainWebsiteContent.seo.pages.services),
        pricing: normalizeSeoPage(source.seo?.pages?.pricing, defaultMainWebsiteContent.seo.pages.pricing),
        contact: normalizeSeoPage(source.seo?.pages?.contact, defaultMainWebsiteContent.seo.pages.contact),
        terms: normalizeSeoPage(source.seo?.pages?.terms, defaultMainWebsiteContent.seo.pages.terms),
        privacy: normalizeSeoPage(source.seo?.pages?.privacy, defaultMainWebsiteContent.seo.pages.privacy),
        refund: normalizeSeoPage(source.seo?.pages?.refund, defaultMainWebsiteContent.seo.pages.refund),
        disclaimer: normalizeSeoPage(source.seo?.pages?.disclaimer, defaultMainWebsiteContent.seo.pages.disclaimer)
      }
    }
  }
}

const readJsonContent = async () => {
  try {
    const content = await fs.readFile(DATA_FILE_PATH, 'utf8')
    return normalizeMainWebsiteContent(JSON.parse(content))
  } catch {
    return defaultMainWebsiteContent
  }
}

const writeJsonContent = async (content: MainWebsiteContent) => {
  await fs.writeFile(DATA_FILE_PATH, `${JSON.stringify(content, null, 2)}\n`, 'utf8')
}

export const getMainWebsiteContent = async (): Promise<{ content: MainWebsiteContent; storage: StorageMode }> => {
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select('content_json')
    .eq('id', RECORD_ID)
    .maybeSingle()

  if (error && isMissingSupabaseTableError(error.message)) {
    return { content: normalizeMainWebsiteContent(await readJsonContent()), storage: 'json' }
  }

  if (error) {
    throw new Error(`Failed to fetch main website content: ${error.message}`)
  }

  if (!data?.content_json) {
    return { content: normalizeMainWebsiteContent(await readJsonContent()), storage: 'json' }
  }

  return {
    content: normalizeMainWebsiteContent(data.content_json),
    storage: 'supabase'
  }
}

export const getSafeMainWebsiteContent = async (): Promise<{ content: MainWebsiteContent; storage: StorageMode }> => {
  try {
    return await getMainWebsiteContent()
  } catch {
    return {
      content: defaultMainWebsiteContent,
      storage: 'json'
    }
  }
}

export const updateMainWebsiteContent = async (content: MainWebsiteContent) => {
  const normalized = normalizeMainWebsiteContent(content)
  const { error } = await supabaseAdmin
    .from(TABLE_NAME)
    .upsert({
      id: RECORD_ID,
      page_key: PAGE_KEY,
      title: normalized.theme.brandName,
      content_json: normalized,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

  if (error && isMissingSupabaseTableError(error.message)) {
    await writeJsonContent(normalized)
    return { content: normalized, storage: 'json' as const }
  }

  if (error) {
    throw new Error(`Failed to update main website content: ${error.message}`)
  }

  return { content: normalized, storage: 'supabase' as const }
}

export const buildMainWebsiteMetadata = async (page: MainWebsiteSeoPageKey): Promise<Metadata> => {
  const { content } = await getSafeMainWebsiteContent()
  const pageMeta = content.seo.pages[page] || defaultSeoPage()
  const title = page === 'home' ? content.seo.siteTitle : pageMeta.title || content.seo.siteTitle
  const description = pageMeta.description || content.seo.siteDescription
  const keywords = content.seo.keywords
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      siteName: content.theme.brandName,
      images: content.seo.openGraphImage ? [{ url: content.seo.openGraphImage }] : undefined
    },
    icons: content.theme.faviconSrc ? {
      icon: content.theme.faviconSrc
    } : undefined
  }
}
