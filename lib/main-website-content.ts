import type { Metadata } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import { supabaseAdmin } from './supabase-admin'
import { buildWhatsAppLink } from './whatsapp'

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
  description: string
  icon: string
  enabled: boolean
}

export interface MainWebsiteFeatureCard {
  icon: string
  title: string
  description: string
  bullets: string[]
  badge?: string
  href?: string
  buttonLabel?: string
  enabled: boolean
}

export interface MainWebsitePreviewMetric {
  label: string
  value: string
}

export interface MainWebsiteProductPreviewCard {
  icon: string
  name: string
  tagline: string
  description: string
  ctaLabel: string
  ctaHref: string
  mockRows: MainWebsitePreviewMetric[]
  photoTags: string[]
  isPhoto: boolean
  enabled: boolean
}

export interface MainWebsiteProcessStep {
  step: string
  icon: string
  title: string
  description: string
  enabled: boolean
}

export interface MainWebsiteTestimonial {
  quote: string
  name: string
  business: string
  rating: number
  avatar: string
  enabled: boolean
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
  enabled: boolean
}

export interface MainWebsiteComparisonRow {
  title: string
  scaleVyaparValue: string
  otherValue: string
  enabled: boolean
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
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    lightBackgroundColor: string
    darkBackgroundColor: string
    buttonColor: string
    textColor: string
    mutedTextColor: string
    logoSrc: string
    faviconSrc: string
    fontFamily: string
    borderRadius: string
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
    backgroundStyle: string
    sticky: boolean
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
    heroBadges: string[]
    stats: MainWebsiteStatItem[]
    servicesTitle: string
    servicesDescription: string
    serviceCards: MainWebsiteFeatureCard[]
    featuresTitle: string
    featuresDescription: string
    featureCards: MainWebsiteFeatureCard[]
    productTitle: string
    productDescription: string
    productCards: MainWebsiteProductPreviewCard[]
    processTitle: string
    processDescription: string
    processSteps: MainWebsiteProcessStep[]
    pricingEyebrow: string
    pricingTitle: string
    pricingDescription: string
    pricingEnabled: boolean
    testimonialsTitle: string
    testimonialsDescription: string
    testimonials: MainWebsiteTestimonial[]
    comparisonTitle: string
    comparisonDescription: string
    comparisonLeftLabel: string
    comparisonRightLabel: string
    comparisonRows: MainWebsiteComparisonRow[]
    comparisonCtaText: string
    comparisonCtaButton: MainWebsiteButton
    faqTitle: string
    faqItems: MainWebsiteFaqItem[]
    ctaEyebrow: string
    ctaTitle: string
    ctaDescription: string
    ctaPrimaryButton: MainWebsiteButton
    ctaSecondaryButton: MainWebsiteButton
    ctaBackgroundColor: string
    ctaBackgroundImage: string
    ctaEnabled: boolean
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
  floatingContact: {
    whatsappNumber: string
    whatsappMessage: string
    enabled: boolean
    position: 'left' | 'right'
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
const defaultStatItem = (): MainWebsiteStatItem => ({ value: '', label: '', description: '', icon: '', enabled: true })
const defaultFeatureCard = (): MainWebsiteFeatureCard => ({ icon: '', title: '', description: '', bullets: [''], badge: '', href: '', buttonLabel: '', enabled: true })
const defaultPreviewMetric = (): MainWebsitePreviewMetric => ({ label: '', value: '' })
const defaultPreviewCard = (): MainWebsiteProductPreviewCard => ({
  icon: '',
  name: '',
  tagline: '',
  description: '',
  ctaLabel: '',
  ctaHref: '',
  mockRows: [defaultPreviewMetric()],
  photoTags: [''],
  isPhoto: false,
  enabled: true
})
const defaultProcessStep = (): MainWebsiteProcessStep => ({ step: '', icon: '', title: '', description: '', enabled: true })
const defaultTestimonial = (): MainWebsiteTestimonial => ({ quote: '', name: '', business: '', rating: 5, avatar: '', enabled: true })
const defaultFaqItem = (): MainWebsiteFaqItem => ({ question: '', answer: '' })
const defaultPlan = (): MainWebsitePlan => ({
  name: '',
  price: '',
  cadence: '',
  description: '',
  badge: '',
  features: [''],
  buttonLabel: '',
  buttonHref: '',
  enabled: true
})
const defaultComparisonRow = (): MainWebsiteComparisonRow => ({ title: '', scaleVyaparValue: '', otherValue: '', enabled: true })
const defaultHour = (): MainWebsiteContactHour => ({ day: '', time: '' })
const defaultLegalSection = (): MainWebsiteLegalSection => ({ title: '', body: '' })
const defaultSeoPage = (): MainWebsiteSeoPageMeta => ({ title: '', description: '' })

export const defaultMainWebsiteContent: MainWebsiteContent = {
  theme: {
    brandName: 'ScaleVyapar',
    brandTagline: 'Business automation platform built for growing Indian businesses',
    primaryColor: '#374655',
    secondaryColor: '#94a3b8',
    accentColor: '#2563eb',
    backgroundColor: '#f8fafc',
    lightBackgroundColor: '#f8fafc',
    darkBackgroundColor: '#1f2c3a',
    buttonColor: '#374655',
    textColor: '#1e293b',
    mutedTextColor: '#64748b',
    logoSrc: '/logo.png',
    faviconSrc: '/favicon.ico',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: '20px'
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
    secondaryButton: { label: 'Talk to Us', href: 'https://wa.me/919314023719' },
    backgroundStyle: 'solid-dark',
    sticky: true
  },
  footer: {
    logoSrc: '/logo.png',
    description: 'All-in-one business automation platform for Indian businesses. Generate leads, manage workflows, and scale with connected tools.',
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
    heroEyebrow: 'Made for Indian Businesses',
    heroTitle: 'Scale Your Business with',
    heroHighlightedText: 'ScaleVyapar',
    heroDescription: 'All-in-one platform for lead generation, CRM, WhatsApp automation, AI product photos and inventory workflows. Built for ambitious Indian teams.',
    heroDesktopImage: '/hero-desktop.png',
    heroMobileImage: '/hero-mobile.png',
    heroPrimaryButton: { label: 'Get Started Today', href: '/pricing' },
    heroSecondaryButton: { label: 'Explore Tools', href: '/tools' },
    heroBadges: ['LeadRadar', 'Vizora AI', 'WhatsApp Automation'],
    stats: [
      { value: '10000+', label: 'Leads Generated', description: 'Qualified business leads captured with our tools.', icon: '🎯', enabled: true },
      { value: '500+', label: 'Businesses Served', description: 'Growing teams across India use ScaleVyapar.', icon: '🏢', enabled: true },
      { value: '50L+', label: 'Revenue Created', description: 'Measured business impact delivered for clients.', icon: '💰', enabled: true },
      { value: '98%', label: 'Client Satisfaction', description: 'Support and onboarding built for long-term growth.', icon: '⭐', enabled: true }
    ],
    servicesTitle: 'Everything Your Business Needs',
    servicesDescription: 'From lead generation to inventory management, ScaleVyapar brings every growth workflow into one connected business stack.',
    serviceCards: [
      {
        icon: '🎯',
        title: 'LeadRadar',
        description: 'Extract thousands of B2B leads from Google Maps in minutes with filters for location, business type, and keywords.',
        bullets: ['Google Maps extraction', 'Filter by location', 'Export to Excel or CRM', 'Bulk lead import'],
        badge: 'Built by Us',
        href: '/tools',
        buttonLabel: 'Explore LeadRadar',
        enabled: true
      },
      {
        icon: '📸',
        title: 'Vizora AI',
        description: 'Generate professional AI product photos and marketing visuals instantly without a studio shoot.',
        bullets: ['AI photo generation', 'Creative variations', 'Instant delivery', 'Ready for ads and social'],
        badge: 'Built by Us',
        href: '/tools',
        buttonLabel: 'Explore Vizora',
        enabled: true
      },
      {
        icon: '🌐',
        title: 'Website Builder',
        description: 'Launch a modern business website with mobile responsiveness, lead capture, and ongoing updates included.',
        bullets: ['Custom design', 'Mobile responsive', 'SEO ready pages', 'WhatsApp integration'],
        badge: 'Built by Us',
        href: '/tools',
        buttonLabel: 'See Website Tools',
        enabled: true
      },
      {
        icon: '📞',
        title: 'CRM & Calls',
        description: 'Track every call, follow-up, and sales stage so your team closes more high-intent leads.',
        bullets: ['Call tracking', 'Lead management', 'Follow-up reminders', 'Team performance'],
        badge: 'Premium Tool',
        href: '/tools',
        buttonLabel: 'View CRM',
        enabled: true
      },
      {
        icon: '💬',
        title: 'WhatsApp Automation',
        description: 'Automate campaigns, replies, reminders, and lead nurturing on WhatsApp at scale.',
        bullets: ['Bulk messaging', 'Broadcast campaigns', 'Lead nurturing', 'Template workflows'],
        badge: 'Premium Tool',
        href: '/tools',
        buttonLabel: 'View Automation',
        enabled: true
      },
      {
        icon: '📦',
        title: 'Inventory Management',
        description: 'Track stock, raw materials, production orders, and dispatch in one live workflow dashboard.',
        bullets: ['Stock tracking', 'Raw material control', 'Production visibility', 'Dispatch tracking'],
        badge: 'Premium Tool',
        href: '/tools',
        buttonLabel: 'View Inventory',
        enabled: true
      }
    ],
    featuresTitle: 'Built for Indian Businesses',
    featuresDescription: 'The platform is shaped around local business workflows, Indian support expectations, and practical growth execution.',
    featureCards: [
      { icon: '🇮🇳', title: 'Made for India', description: 'Built specifically for Indian businesses with local support and practical workflows.', bullets: ['India-first product thinking'], badge: '', href: '', buttonLabel: '', enabled: true },
      { icon: '⚡', title: 'All-in-One Platform', description: 'Run lead generation, CRM, automation, and websites from one connected stack.', bullets: ['Fewer disconnected tools'], badge: '', href: '', buttonLabel: '', enabled: true },
      { icon: '💰', title: 'Affordable Pricing', description: 'Enterprise-style automation without enterprise-style overhead.', bullets: ['Pay for what you use'], badge: '', href: '', buttonLabel: '', enabled: true },
      { icon: '🔧', title: 'Easy to Use', description: 'Built so teams can launch quickly without needing a technical background.', bullets: ['Fast adoption'], badge: '', href: '', buttonLabel: '', enabled: true },
      { icon: '📞', title: '24/7 Support', description: 'WhatsApp-first support keeps setup and operations moving without delay.', bullets: ['Human help when needed'], badge: '', href: '', buttonLabel: '', enabled: true },
      { icon: '🚀', title: 'Grow Faster', description: 'The workflows are designed to improve response speed, follow-up consistency, and growth output.', bullets: ['Higher execution speed'], badge: '', href: '', buttonLabel: '', enabled: true }
    ],
    productTitle: 'How Our Tools Work',
    productDescription: 'Show clients and teams exactly what each product experience looks like before they commit.',
    productCards: [
      {
        icon: '🎯',
        name: 'LeadRadar',
        tagline: 'Extract B2B Leads Instantly',
        description: 'Search any city and collect structured business leads with phone numbers, locations, and categories in seconds.',
        ctaLabel: 'Add to My Plan',
        ctaHref: '/pricing',
        mockRows: [
          { label: 'Business Name', value: 'Sharma Textiles Pvt Ltd' },
          { label: 'Phone', value: '+91 98765 43210' },
          { label: 'Location', value: 'Jaipur, Rajasthan' },
          { label: 'Category', value: 'Textile Manufacturer' },
          { label: 'Rating', value: '4.5 (120 reviews)' }
        ],
        photoTags: [],
        isPhoto: false,
        enabled: true
      },
      {
        icon: '📸',
        name: 'Vizora AI',
        tagline: 'AI Product Photos in Seconds',
        description: 'Upload a raw product image and generate studio-style product photos, ad creatives, and ecommerce assets instantly.',
        ctaLabel: 'Build With Vizora',
        ctaHref: '/pricing',
        mockRows: [],
        photoTags: ['Front Standing', 'Side View', 'Close Up', 'Sitting', 'Walking', 'Editorial'],
        isPhoto: true,
        enabled: true
      },
      {
        icon: '💰',
        name: 'Pricing Builder',
        tagline: 'Build Your Custom Plan',
        description: 'Mix and match the tools you need and see an easy-to-understand plan structure without hidden surprises.',
        ctaLabel: 'Create My Plan',
        ctaHref: '/pricing',
        mockRows: [
          { label: 'LeadRadar', value: 'Rs 999/mo' },
          { label: 'Vizora AI', value: 'Rs 799/mo' },
          { label: 'WhatsApp', value: 'Rs 899/mo' },
          { label: 'Monthly Credits', value: '1500 credits' },
          { label: 'Total', value: 'Rs 2,697/mo' }
        ],
        photoTags: [],
        isPhoto: false,
        enabled: true
      }
    ],
    processTitle: 'Get Started in 3 Simple Steps',
    processDescription: 'Start automating your business in minutes with a rollout built for real teams, not just demos.',
    processSteps: [
      { step: '1', icon: '1', title: 'Choose Your Tools', description: 'Select the exact automation tools your business needs right now.', enabled: true },
      { step: '2', icon: '2', title: 'Get Instant Access', description: 'Login to your workspace and start using every enabled tool immediately.', enabled: true },
      { step: '3', icon: '3', title: 'Scale Your Business', description: 'Generate more leads, respond faster, and grow with smoother operations.', enabled: true }
    ],
    pricingEyebrow: 'Custom Plans',
    pricingTitle: 'Choose the right stack for your stage',
    pricingDescription: 'Start with a focused plan and expand into a more complete growth engine as your business scales.',
    pricingEnabled: true,
    testimonialsTitle: 'What Our Clients Say',
    testimonialsDescription: 'Real businesses and real growth outcomes from teams using ScaleVyapar every day.',
    testimonials: [
      { quote: 'ScaleVyapar has completely transformed how we generate leads. In just 2 weeks we got 500 plus business contacts from Google Maps. Our sales team is now 3x more productive.', name: 'Rajesh Sharma', business: 'Sharma Textiles, Jaipur', rating: 5, avatar: 'R', enabled: true },
      { quote: 'Vizora AI photos are incredible. We stopped spending 15000 per month on photographers. Now we generate stunning product photos in seconds and our Instagram sales doubled.', name: 'Priya Agarwal', business: 'Agarwal Exports, Jaipur', rating: 5, avatar: 'P', enabled: true },
      { quote: 'The WhatsApp automation tool is a game changer. We send 5000 messages a day and our follow-up rate went from 20 percent to 80 percent.', name: 'Mohit Gupta', business: 'Gupta Electronics, Jaipur', rating: 5, avatar: 'M', enabled: true },
      { quote: 'The CRM system helped us track every customer call. We no longer miss follow-ups and our conversion rate improved by 40 percent.', name: 'Sunita Verma', business: 'Verma Jewellers, Jaipur', rating: 5, avatar: 'S', enabled: true },
      { quote: 'Inventory management used to be our biggest headache. Now everything is tracked in real time and we reduced stock wastage by 60 percent.', name: 'Amit Joshi', business: 'Joshi Manufacturing, Jaipur', rating: 5, avatar: 'A', enabled: true },
      { quote: 'We got a beautiful website and 200 leads in the first month using LeadRadar. The team held our hand through everything.', name: 'Kavita Mehta', business: 'Mehta Fashion, Jaipur', rating: 5, avatar: 'K', enabled: true }
    ],
    comparisonTitle: 'ScaleVyapar vs Others',
    comparisonDescription: 'See why Indian businesses choose ScaleVyapar over patching together disconnected point tools.',
    comparisonLeftLabel: 'ScaleVyapar',
    comparisonRightLabel: 'Others',
    comparisonRows: [
      { title: 'All Tools in One Platform', scaleVyaparValue: 'Yes', otherValue: 'No', enabled: true },
      { title: 'Indian Pricing', scaleVyaparValue: 'Yes', otherValue: 'No', enabled: true },
      { title: 'WhatsApp Support 24/7', scaleVyaparValue: 'Yes', otherValue: 'No', enabled: true },
      { title: 'Credit Based System', scaleVyaparValue: 'Yes', otherValue: 'No', enabled: true },
      { title: 'AI Photo Generation', scaleVyaparValue: 'Yes', otherValue: 'No', enabled: true },
      { title: 'Google Maps Lead Extraction', scaleVyaparValue: 'Yes', otherValue: 'No', enabled: true },
      { title: 'Custom Website Builder', scaleVyaparValue: 'Yes', otherValue: 'No', enabled: true }
    ],
    comparisonCtaText: 'Still not convinced? Talk to us on WhatsApp and we will show you exactly how ScaleVyapar can help your business.',
    comparisonCtaButton: { label: 'Talk to Us on WhatsApp', href: 'https://wa.me/919314023719' },
    faqTitle: 'Frequently asked questions',
    faqItems: [
      { question: 'How quickly can we get started?', answer: 'Most teams can begin within one business day after finalizing the plan.' },
      { question: 'Can we choose only a few tools?', answer: 'Yes. ScaleVyapar is designed so you can start with only the workflows you need today.' },
      { question: 'Do you help with onboarding?', answer: 'Yes. We provide setup guidance and WhatsApp support during rollout.' }
    ],
    ctaEyebrow: 'Ready to scale',
    ctaTitle: 'Ready to Scale Your Business?',
    ctaDescription: 'Join hundreds of Indian businesses already using ScaleVyapar to automate lead generation, sales, and operations.',
    ctaPrimaryButton: { label: 'View Pricing', href: '/pricing' },
    ctaSecondaryButton: { label: 'Talk to Us on WhatsApp', href: 'https://wa.me/919314023719' },
    ctaBackgroundColor: '#374655',
    ctaBackgroundImage: '',
    ctaEnabled: true
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
      { icon: '01', title: 'Client first', description: 'We design workflows around the needs of real businesses and real teams.', bullets: ['Support-led execution'], badge: '', href: '', buttonLabel: '', enabled: true },
      { icon: '02', title: 'Built for India', description: 'Our decisions reflect local business realities and Indian buying journeys.', bullets: ['Local market fit'], badge: '', href: '', buttonLabel: '', enabled: true },
      { icon: '03', title: 'Simple to adopt', description: 'We keep implementation practical so teams can get value quickly.', bullets: ['Fast onboarding'], badge: '', href: '', buttonLabel: '', enabled: true }
    ],
    stats: [
      { value: '500+', label: 'Businesses served', description: '', icon: '', enabled: true },
      { value: '6', label: 'Product areas', description: '', icon: '', enabled: true },
      { value: '24/7', label: 'WhatsApp support', description: '', icon: '', enabled: true }
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
      { icon: 'LR', title: 'Lead generation', description: 'Find business contacts from Google Maps and structure them for sales teams.', bullets: ['Location filters', 'Business filters', 'Export-ready results'], badge: 'LeadRadar', href: '', buttonLabel: '', enabled: true },
      { icon: 'VZ', title: 'AI creatives', description: 'Create product images and content-ready assets for ecommerce and campaigns.', bullets: ['Product photography', 'Creative variations', 'Quick delivery'], badge: 'Vizora AI', href: '', buttonLabel: '', enabled: true },
      { icon: 'WEB', title: 'Business websites', description: 'Launch fast websites with service pages, pricing, contact capture, and WhatsApp entry points.', bullets: ['Responsive layout', 'SEO-friendly pages', 'Update support'], badge: 'Website Builder', href: '', buttonLabel: '', enabled: true },
      { icon: 'CRM', title: 'CRM workflow', description: 'Track leads, teams, calls, and follow-ups from one workflow view.', bullets: ['Deal tracking', 'Follow-up reminders', 'Call visibility'], badge: 'Premium', href: '', buttonLabel: '', enabled: true },
      { icon: 'WA', title: 'WhatsApp automation', description: 'Automate lead routing, campaigns, reminders, and repeat customer communication.', bullets: ['Templates', 'Broadcasts', 'Nurture flows'], badge: 'Premium', href: '', buttonLabel: '', enabled: true },
      { icon: 'INV', title: 'Inventory operations', description: 'Monitor stock and production steps for businesses with physical goods.', bullets: ['Stock updates', 'Production tracking', 'Dispatch visibility'], badge: 'Premium', href: '', buttonLabel: '', enabled: true }
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
        buttonHref: 'https://wa.me/919314023719',
        enabled: true
      },
      {
        name: 'Growth',
        price: 'Rs 5,999',
        cadence: '/month',
        description: 'Built for teams combining multiple tools across lead generation and follow-up.',
        badge: 'Popular',
        features: ['Multiple tools', 'Priority onboarding', 'Faster support'],
        buttonLabel: 'Build My Plan',
        buttonHref: '/contact',
        enabled: true
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
    faqTitle: 'Contact FAQs',
    faqItems: [
      { question: 'What happens after I submit the form?', answer: 'Our team reviews your requirement and follows up with the best next step.' },
      { question: 'Do you support custom requirements?', answer: 'Yes. We can help with custom workflow combinations and rollout planning.' }
    ],
    ctaTitle: 'Prefer to talk right away?',
    ctaDescription: 'Chat with our team on WhatsApp and get the right guidance for your business stage.',
    ctaButton: { label: 'Open WhatsApp', href: 'https://wa.me/919314023719' }
  },
  floatingContact: {
    whatsappNumber: '919314023719',
    whatsappMessage: 'Hi ScaleVyapar, I want to know more about your tools.',
    enabled: true,
    position: 'right'
  },
  legal: {
    terms: {
      title: 'Terms and Conditions',
      description: 'Please read these terms carefully before using ScaleVyapar services.',
      sections: [
        { title: 'Use of service', body: 'By using ScaleVyapar, you agree to use the platform only for lawful business purposes and in accordance with the applicable terms.' },
        { title: 'Payments and plans', body: 'Plan fees, credits, and billing terms are communicated during onboarding or pricing discussions and may vary by tool selection.' }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      description: 'This policy explains how ScaleVyapar handles personal and business information.',
      sections: [
        { title: 'Information we collect', body: 'We may collect business contact information, usage data, and support interactions required to deliver our services.' },
        { title: 'How we use information', body: 'We use collected data to operate the platform, support users, improve workflows, and communicate important service updates.' }
      ]
    },
    refund: {
      title: 'Refund Policy',
      description: 'Refund policies depend on the type of service, onboarding stage, and agreed delivery scope.',
      sections: [
        { title: 'Service-based refunds', body: 'Refund requests are reviewed case-by-case depending on the work already delivered and the active scope of service.' }
      ]
    },
    disclaimer: {
      title: 'Disclaimer',
      description: 'All information and services are provided in good faith for business use.',
      sections: [
        { title: 'General disclaimer', body: 'ScaleVyapar provides tools and automation support, but business outcomes depend on how the tools are used and managed by each client.' }
      ]
    }
  },
  seo: {
    siteTitle: 'ScaleVyapar — Business Automation Platform',
    siteDescription: 'All-in-one business automation platform for lead generation, CRM, WhatsApp automation, AI photos and inventory management.',
    openGraphImage: '/hero-desktop.png',
    keywords: 'ScaleVyapar, business automation, lead generation, CRM, WhatsApp automation, AI product photos, inventory management, India',
    pages: {
      home: { title: 'ScaleVyapar — Business Automation Platform', description: 'Scale your business with lead generation, websites, CRM, AI photos, and WhatsApp automation.' },
      about: { title: 'About ScaleVyapar', description: 'Learn about ScaleVyapar and our mission to help Indian businesses grow faster.' },
      services: { title: 'Tools and Services', description: 'Explore the tools and services available across the ScaleVyapar platform.' },
      pricing: { title: 'Build Your Own Plan', description: 'Choose the tools your business needs and create the right ScaleVyapar plan.' },
      contact: { title: 'Contact ScaleVyapar', description: 'Talk to ScaleVyapar about your workflow, requirements, and business growth goals.' },
      terms: { title: 'Terms and Conditions', description: 'Read the terms and conditions for using ScaleVyapar services.' },
      privacy: { title: 'Privacy Policy', description: 'Understand how ScaleVyapar collects, uses, and protects your information.' },
      refund: { title: 'Refund Policy', description: 'Review the refund policy for ScaleVyapar services and plans.' },
      disclaimer: { title: 'Disclaimer', description: 'Read the ScaleVyapar disclaimer for service usage and business outcomes.' }
    }
  }
}

const normalizeString = (value: unknown, fallback: string) => {
  if (typeof value === 'string') {
    return value
  }
  return fallback
}

const normalizeBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') {
    return value
  }
  return fallback
}

const normalizeNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  return fallback
}

const normalizeStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) {
    return fallback
  }
  const cleaned = value.map(item => typeof item === 'string' ? item : '').filter(item => item.length > 0)
  return cleaned.length ? cleaned : fallback
}

const normalizeButton = (value: unknown, fallback: MainWebsiteButton): MainWebsiteButton => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteButton> : {}
  return {
    label: normalizeString(source.label, fallback.label),
    href: normalizeString(source.href, fallback.href)
  }
}

const normalizeLinkItem = (value: unknown, fallback: MainWebsiteLinkItem): MainWebsiteLinkItem => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteLinkItem> : {}
  return {
    label: normalizeString(source.label, fallback.label),
    href: normalizeString(source.href, fallback.href)
  }
}

const normalizeStatItem = (value: unknown, fallback: MainWebsiteStatItem): MainWebsiteStatItem => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteStatItem> : {}
  return {
    value: normalizeString(source.value, fallback.value),
    label: normalizeString(source.label, fallback.label),
    description: normalizeString(source.description, fallback.description),
    icon: normalizeString(source.icon, fallback.icon),
    enabled: normalizeBoolean(source.enabled, fallback.enabled)
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
    href: normalizeString(source.href, fallback.href || ''),
    buttonLabel: normalizeString(source.buttonLabel, fallback.buttonLabel || ''),
    enabled: normalizeBoolean(source.enabled, fallback.enabled)
  }
}

const normalizePreviewMetric = (value: unknown, fallback: MainWebsitePreviewMetric): MainWebsitePreviewMetric => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsitePreviewMetric> : {}
  return {
    label: normalizeString(source.label, fallback.label),
    value: normalizeString(source.value, fallback.value)
  }
}

const normalizePreviewCard = (value: unknown, fallback: MainWebsiteProductPreviewCard): MainWebsiteProductPreviewCard => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteProductPreviewCard> : {}
  return {
    icon: normalizeString(source.icon, fallback.icon),
    name: normalizeString(source.name, fallback.name),
    tagline: normalizeString(source.tagline, fallback.tagline),
    description: normalizeString(source.description, fallback.description),
    ctaLabel: normalizeString(source.ctaLabel, fallback.ctaLabel),
    ctaHref: normalizeString(source.ctaHref, fallback.ctaHref),
    mockRows: normalizeArray(source.mockRows, fallback.mockRows, normalizePreviewMetric, defaultPreviewMetric),
    photoTags: normalizeStringArray(source.photoTags, fallback.photoTags),
    isPhoto: normalizeBoolean(source.isPhoto, fallback.isPhoto),
    enabled: normalizeBoolean(source.enabled, fallback.enabled)
  }
}

const normalizeProcessStep = (value: unknown, fallback: MainWebsiteProcessStep): MainWebsiteProcessStep => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteProcessStep> : {}
  return {
    step: normalizeString(source.step, fallback.step),
    icon: normalizeString(source.icon, fallback.icon),
    title: normalizeString(source.title, fallback.title),
    description: normalizeString(source.description, fallback.description),
    enabled: normalizeBoolean(source.enabled, fallback.enabled)
  }
}

const normalizeTestimonial = (value: unknown, fallback: MainWebsiteTestimonial): MainWebsiteTestimonial => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteTestimonial> : {}
  return {
    quote: normalizeString(source.quote, fallback.quote),
    name: normalizeString(source.name, fallback.name),
    business: normalizeString(source.business, fallback.business),
    rating: normalizeNumber(source.rating, fallback.rating),
    avatar: normalizeString(source.avatar, fallback.avatar),
    enabled: normalizeBoolean(source.enabled, fallback.enabled)
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
    buttonHref: normalizeString(source.buttonHref, fallback.buttonHref),
    enabled: normalizeBoolean(source.enabled, fallback.enabled)
  }
}

const normalizeComparisonRow = (value: unknown, fallback: MainWebsiteComparisonRow): MainWebsiteComparisonRow => {
  const source = value && typeof value === 'object' ? value as Partial<MainWebsiteComparisonRow> : {}
  return {
    title: normalizeString(source.title, fallback.title),
    scaleVyaparValue: normalizeString(source.scaleVyaparValue, fallback.scaleVyaparValue),
    otherValue: normalizeString(source.otherValue, fallback.otherValue),
    enabled: normalizeBoolean(source.enabled, fallback.enabled)
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
  return {
    title: normalizeString(source.title, fallback.title),
    description: normalizeString(source.description, fallback.description),
    sections: normalizeArray(source.sections, fallback.sections, normalizeLegalSection, defaultLegalSection)
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
  const floatingNumber = normalizeString(source.floatingContact?.whatsappNumber, defaultMainWebsiteContent.floatingContact.whatsappNumber)
  const floatingMessage = normalizeString(source.floatingContact?.whatsappMessage, defaultMainWebsiteContent.floatingContact.whatsappMessage)
  const whatsappLink = normalizeString(
    source.contact?.whatsappLink,
    buildWhatsAppLink(floatingNumber, floatingMessage) || defaultMainWebsiteContent.contact.whatsappLink
  )

  return {
    theme: {
      brandName: normalizeString(source.theme?.brandName, defaultMainWebsiteContent.theme.brandName),
      brandTagline: normalizeString(source.theme?.brandTagline, defaultMainWebsiteContent.theme.brandTagline),
      primaryColor: normalizeString(source.theme?.primaryColor, defaultMainWebsiteContent.theme.primaryColor),
      secondaryColor: normalizeString(source.theme?.secondaryColor, defaultMainWebsiteContent.theme.secondaryColor),
      accentColor: normalizeString(source.theme?.accentColor, defaultMainWebsiteContent.theme.accentColor),
      backgroundColor: normalizeString(source.theme?.backgroundColor, defaultMainWebsiteContent.theme.backgroundColor),
      lightBackgroundColor: normalizeString(source.theme?.lightBackgroundColor, defaultMainWebsiteContent.theme.lightBackgroundColor),
      darkBackgroundColor: normalizeString(source.theme?.darkBackgroundColor, defaultMainWebsiteContent.theme.darkBackgroundColor),
      buttonColor: normalizeString(source.theme?.buttonColor, defaultMainWebsiteContent.theme.buttonColor),
      textColor: normalizeString(source.theme?.textColor, defaultMainWebsiteContent.theme.textColor),
      mutedTextColor: normalizeString(source.theme?.mutedTextColor, defaultMainWebsiteContent.theme.mutedTextColor),
      logoSrc: normalizeString(source.theme?.logoSrc, defaultMainWebsiteContent.theme.logoSrc),
      faviconSrc: normalizeString(source.theme?.faviconSrc, defaultMainWebsiteContent.theme.faviconSrc),
      fontFamily: normalizeString(source.theme?.fontFamily, defaultMainWebsiteContent.theme.fontFamily),
      borderRadius: normalizeString(source.theme?.borderRadius, defaultMainWebsiteContent.theme.borderRadius)
    },
    header: {
      announcementText: normalizeString(source.header?.announcementText, defaultMainWebsiteContent.header.announcementText),
      announcementButtonLabel: normalizeString(source.header?.announcementButtonLabel, defaultMainWebsiteContent.header.announcementButtonLabel),
      announcementButtonHref: normalizeString(source.header?.announcementButtonHref, defaultMainWebsiteContent.header.announcementButtonHref),
      logoSrc: normalizeString(source.header?.logoSrc, defaultMainWebsiteContent.header.logoSrc),
      siteName: normalizeString(source.header?.siteName, defaultMainWebsiteContent.header.siteName),
      navItems: normalizeArray(source.header?.navItems, defaultMainWebsiteContent.header.navItems, normalizeLinkItem, defaultLink),
      primaryButton: normalizeButton(source.header?.primaryButton, defaultMainWebsiteContent.header.primaryButton),
      secondaryButton: normalizeButton(source.header?.secondaryButton, defaultMainWebsiteContent.header.secondaryButton),
      backgroundStyle: normalizeString(source.header?.backgroundStyle, defaultMainWebsiteContent.header.backgroundStyle),
      sticky: normalizeBoolean(source.header?.sticky, defaultMainWebsiteContent.header.sticky)
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
      heroBadges: normalizeStringArray(source.home?.heroBadges, defaultMainWebsiteContent.home.heroBadges),
      stats: normalizeArray(source.home?.stats, defaultMainWebsiteContent.home.stats, normalizeStatItem, defaultStatItem),
      servicesTitle: normalizeString(source.home?.servicesTitle, defaultMainWebsiteContent.home.servicesTitle),
      servicesDescription: normalizeString(source.home?.servicesDescription, defaultMainWebsiteContent.home.servicesDescription),
      serviceCards: normalizeArray(source.home?.serviceCards, defaultMainWebsiteContent.home.serviceCards, normalizeFeatureCard, defaultFeatureCard),
      featuresTitle: normalizeString(source.home?.featuresTitle, defaultMainWebsiteContent.home.featuresTitle),
      featuresDescription: normalizeString(source.home?.featuresDescription, defaultMainWebsiteContent.home.featuresDescription),
      featureCards: normalizeArray(source.home?.featureCards, defaultMainWebsiteContent.home.featureCards, normalizeFeatureCard, defaultFeatureCard),
      productTitle: normalizeString(source.home?.productTitle, defaultMainWebsiteContent.home.productTitle),
      productDescription: normalizeString(source.home?.productDescription, defaultMainWebsiteContent.home.productDescription),
      productCards: normalizeArray(source.home?.productCards, defaultMainWebsiteContent.home.productCards, normalizePreviewCard, defaultPreviewCard),
      processTitle: normalizeString(source.home?.processTitle, defaultMainWebsiteContent.home.processTitle),
      processDescription: normalizeString(source.home?.processDescription, defaultMainWebsiteContent.home.processDescription),
      processSteps: normalizeArray(source.home?.processSteps, defaultMainWebsiteContent.home.processSteps, normalizeProcessStep, defaultProcessStep),
      pricingEyebrow: normalizeString(source.home?.pricingEyebrow, defaultMainWebsiteContent.home.pricingEyebrow),
      pricingTitle: normalizeString(source.home?.pricingTitle, defaultMainWebsiteContent.home.pricingTitle),
      pricingDescription: normalizeString(source.home?.pricingDescription, defaultMainWebsiteContent.home.pricingDescription),
      pricingEnabled: normalizeBoolean(source.home?.pricingEnabled, defaultMainWebsiteContent.home.pricingEnabled),
      testimonialsTitle: normalizeString(source.home?.testimonialsTitle, defaultMainWebsiteContent.home.testimonialsTitle),
      testimonialsDescription: normalizeString(source.home?.testimonialsDescription, defaultMainWebsiteContent.home.testimonialsDescription),
      testimonials: normalizeArray(source.home?.testimonials, defaultMainWebsiteContent.home.testimonials, normalizeTestimonial, defaultTestimonial),
      comparisonTitle: normalizeString(source.home?.comparisonTitle, defaultMainWebsiteContent.home.comparisonTitle),
      comparisonDescription: normalizeString(source.home?.comparisonDescription, defaultMainWebsiteContent.home.comparisonDescription),
      comparisonLeftLabel: normalizeString(source.home?.comparisonLeftLabel, defaultMainWebsiteContent.home.comparisonLeftLabel),
      comparisonRightLabel: normalizeString(source.home?.comparisonRightLabel, defaultMainWebsiteContent.home.comparisonRightLabel),
      comparisonRows: normalizeArray(source.home?.comparisonRows, defaultMainWebsiteContent.home.comparisonRows, normalizeComparisonRow, defaultComparisonRow),
      comparisonCtaText: normalizeString(source.home?.comparisonCtaText, defaultMainWebsiteContent.home.comparisonCtaText),
      comparisonCtaButton: normalizeButton(source.home?.comparisonCtaButton, defaultMainWebsiteContent.home.comparisonCtaButton),
      faqTitle: normalizeString(source.home?.faqTitle, defaultMainWebsiteContent.home.faqTitle),
      faqItems: normalizeArray(source.home?.faqItems, defaultMainWebsiteContent.home.faqItems, normalizeFaqItem, defaultFaqItem),
      ctaEyebrow: normalizeString(source.home?.ctaEyebrow, defaultMainWebsiteContent.home.ctaEyebrow),
      ctaTitle: normalizeString(source.home?.ctaTitle, defaultMainWebsiteContent.home.ctaTitle),
      ctaDescription: normalizeString(source.home?.ctaDescription, defaultMainWebsiteContent.home.ctaDescription),
      ctaPrimaryButton: normalizeButton(source.home?.ctaPrimaryButton, defaultMainWebsiteContent.home.ctaPrimaryButton),
      ctaSecondaryButton: normalizeButton(source.home?.ctaSecondaryButton, defaultMainWebsiteContent.home.ctaSecondaryButton),
      ctaBackgroundColor: normalizeString(source.home?.ctaBackgroundColor, defaultMainWebsiteContent.home.ctaBackgroundColor),
      ctaBackgroundImage: normalizeString(source.home?.ctaBackgroundImage, defaultMainWebsiteContent.home.ctaBackgroundImage),
      ctaEnabled: normalizeBoolean(source.home?.ctaEnabled, defaultMainWebsiteContent.home.ctaEnabled)
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
      stats: normalizeArray(source.about?.stats, defaultMainWebsiteContent.about.stats, normalizeStatItem, defaultStatItem),
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
      whatsappLink: whatsappLink,
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
    floatingContact: {
      whatsappNumber: floatingNumber,
      whatsappMessage: floatingMessage,
      enabled: normalizeBoolean(source.floatingContact?.enabled, defaultMainWebsiteContent.floatingContact.enabled),
      position: normalizeString(source.floatingContact?.position, defaultMainWebsiteContent.floatingContact.position) === 'left' ? 'left' : 'right'
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

const isMissingSupabaseTableError = (message: string) =>
  /relation .* does not exist|could not find the table|does not exist/i.test(message)

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
