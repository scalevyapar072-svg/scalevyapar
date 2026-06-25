'use client'

import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  HelpCircle,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  PieChart,
  Search,
  ShieldCheck,
  Sparkles,
  Users2,
} from 'lucide-react'

import styles from './dashboard.module.css'

type DashboardUser = {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  plan?: string
  status?: string
}

type DashboardModule = {
  id: string
  name: string
  slug?: string
  description?: string
  summary?: string
  isActive?: boolean
  isAssigned?: boolean
  href?: string
  customerLink?: string
  features?: string[]
  icon?: string
  status?: string
  type?: string
}

type ModuleMeta = {
  badge: string
  shortIcon: string
  heroIcon: string
  accent: string
  surface: string
  softSurface: string
  border: string
  description: string
  features: string[]
  href: string
  summary: string
}

const MODULE_META: Record<string, ModuleMeta> = {
  vizora: {
    badge: 'Creative Studio',
    shortIcon: 'V',
    heroIcon: 'VA',
    accent: '#7c5cf0',
    surface: 'linear-gradient(135deg,#9f8cff,#7c5cf0)',
    softSurface: 'linear-gradient(135deg,#faf5ff,#f3efff)',
    border: '#e9ddff',
    description: 'Create polished product visuals, ad creatives, and motion content for your catalog from one workspace.',
    summary: 'AI-powered creative production for product photos, ads, and short-form selling content.',
    features: ['AI Photo Generator', 'Photo Upscaler 4x', 'Video Ad Generator', 'UGC Ads Creator', 'Background Cleanup', 'Creative Variants'],
    href: '/vizora',
  },
  leads: {
    badge: 'Lead Engine',
    shortIcon: 'LG',
    heroIcon: 'LE',
    accent: '#4f9ed8',
    surface: 'linear-gradient(135deg,#73c2f6,#4f9ed8)',
    softSurface: 'linear-gradient(135deg,#f0f9ff,#eef7ff)',
    border: '#d4ebfa',
    description: 'Search businesses by location, export lead lists, and build a reliable outbound pipeline.',
    summary: 'Google-sourced B2B lead collection with filtering, list management, and export support.',
    features: ['Google Maps Scraper', 'Filter by Location', 'Filter by Business Type', 'Export to CSV', 'Lead List Cleanup', 'Quick Follow-up Prep'],
    href: '/leads',
  },
  rozgar: {
    badge: 'Rozgar quick actions',
    shortIcon: 'R',
    heroIcon: 'RZ',
    accent: '#0f8f8a',
    surface: 'linear-gradient(135deg,#2bb4b0,#0f8f8a)',
    softSurface: 'linear-gradient(135deg,#f1fbfa,#e7f6f5)',
    border: '#d9edf0',
    description: 'Search available workers, receive applications, and manage labour hiring without leaving your dashboard.',
    summary: 'Dedicated labour marketplace and company hiring panel for fast worker sourcing.',
    features: ['Search Labour', 'Receive Worker Applications', 'Company Hiring Panel', 'Rozgar Dashboard', 'Worker Shortlisting', 'Hiring Activity Review'],
    href: '/labour/company/search',
  },
  crm: {
    badge: 'CRM Workflow',
    shortIcon: 'CRM',
    heroIcon: 'CM',
    accent: '#4bbd94',
    surface: 'linear-gradient(135deg,#79ddb8,#4bbd94)',
    softSurface: 'linear-gradient(135deg,#effcf7,#effbf5)',
    border: '#d5f6e7',
    description: 'Track call outcomes, capture notes, and move every prospect through a clear follow-up pipeline.',
    summary: 'Daily sales follow-up workspace for call tracking, notes, and lead stage management.',
    features: ['Call Tracking', 'Follow-up Reminders', 'Lead Status', 'Notes & History', 'Opportunity Tracking', 'Team Handover Notes'],
    href: '/leads',
  },
  whatsapp: {
    badge: 'Messaging Automation',
    shortIcon: 'WA',
    heroIcon: 'WA',
    accent: '#5fbf88',
    surface: 'linear-gradient(135deg,#8ce0af,#5fbf88)',
    softSurface: 'linear-gradient(135deg,#f2fcf5,#eefbf2)',
    border: '#d7f4df',
    description: 'Automate customer replies, nurture leads, and keep conversations moving on WhatsApp.',
    summary: 'WhatsApp-first outreach and auto-response workflows for customer communication.',
    features: ['Auto Replies', 'Bulk Messaging', 'Lead Nurturing', 'Message Templates', 'Customer Follow-up', 'Quick Response Queues'],
    href: '/leads',
  },
  shopify: {
    badge: 'Store Operations',
    shortIcon: 'S',
    heroIcon: 'SP',
    accent: '#9fb55f',
    surface: 'linear-gradient(135deg,#c6d98f,#9fb55f)',
    softSurface: 'linear-gradient(135deg,#fbfdf1,#fafae8)',
    border: '#e7efc2',
    description: 'Organize catalog, pricing, and store operations for a cleaner Shopify workflow.',
    summary: 'Storefront operations support for listings, pricing, and order visibility.',
    features: ['Catalog Setup', 'Product Organization', 'Pricing Workflow', 'Store Readiness Checklist', 'Order Snapshot', 'Collection Planning'],
    href: '/leads',
  },
  inventory: {
    badge: 'Inventory Control',
    shortIcon: 'INV',
    heroIcon: 'IN',
    accent: '#d79d5d',
    surface: 'linear-gradient(135deg,#f2c38e,#d79d5d)',
    softSurface: 'linear-gradient(135deg,#fffaf2,#fff5eb)',
    border: '#f2dfc5',
    description: 'Monitor stock, materials, and dispatch activity in a more organized operations dashboard.',
    summary: 'Inventory and production visibility for stock movement, materials, and dispatch planning.',
    features: ['Stock Monitoring', 'Material Tracking', 'Dispatch Planning', 'Low Stock Review', 'Batch Visibility', 'Movement Notes'],
    href: '/leads',
  },
  chatbot: {
    badge: 'AI Assistant',
    shortIcon: 'AI',
    heroIcon: 'AI',
    accent: '#d77aa8',
    surface: 'linear-gradient(135deg,#efb0cf,#d77aa8)',
    softSurface: 'linear-gradient(135deg,#fff4f9,#fdeef5)',
    border: '#f5d5e5',
    description: 'Deploy a support assistant that handles first responses and helps qualify incoming prospects.',
    summary: 'AI chat assistant for fast first-touch customer support and lead qualification.',
    features: ['Customer Support Bot', 'Lead Qualification', 'FAQ Handling', 'Instant Replies', 'Escalation Routing', 'Chat Intake Capture'],
    href: '/leads',
  },
}

function resolveModuleKey(mod: DashboardModule) {
  const rawSlug = String(mod?.slug || '').trim().toLowerCase()
  const rawName = String(mod?.name || '').trim().toLowerCase()
  const rawHref = String(mod?.customerLink || mod?.href || '').trim().toLowerCase()

  if (rawSlug in MODULE_META) return rawSlug
  if (rawName.includes('rozgar') || rawHref.includes('/labour/company')) return 'rozgar'
  if (rawName.includes('vizora') || rawHref.includes('/vizora')) return 'vizora'
  if (rawName.includes('lead')) return 'leads'
  if (rawName.includes('crm')) return 'crm'
  if (rawName.includes('whatsapp')) return 'whatsapp'
  if (rawName.includes('shopify')) return 'shopify'
  if (rawName.includes('inventory')) return 'inventory'
  if (rawName.includes('chatbot')) return 'chatbot'

  return 'crm'
}

function pickModuleHref(moduleKey: string, mod?: DashboardModule) {
  const candidates = [mod?.customerLink, mod?.href, MODULE_META[moduleKey]?.href]
  return candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0 && value.trim() !== '#') || '#'
}

function getModuleStatus(module: DashboardModule) {
  if (module.isAssigned) {
    return module.isActive ? 'Assigned & live' : 'Assigned but inactive'
  }

  return 'Not assigned'
}

function getFeatureIcon(feature: string) {
  const value = feature.toLowerCase()
  if (value.includes('search')) return Search
  if (value.includes('worker') || value.includes('application') || value.includes('follow-up')) return Users2
  if (value.includes('panel') || value.includes('hiring') || value.includes('catalog')) return Building2
  if (value.includes('dashboard') || value.includes('review') || value.includes('tracking')) return PieChart
  if (value.includes('chat') || value.includes('whatsapp') || value.includes('message')) return MessageSquareText
  if (value.includes('ai') || value.includes('creative')) return Sparkles
  if (value.includes('support') || value.includes('routing')) return ShieldCheck
  return LayoutGrid
}

function getFeatureTone(index: number) {
  const tones = ['teal', 'mint', 'sky', 'amber']
  return tones[index % tones.length]
}

function ModuleArtwork({ moduleKey }: { moduleKey: string }) {
  switch (moduleKey) {
    case 'rozgar':
      return (
        <svg className={styles.moduleArtSvg} viewBox="0 0 320 220" aria-hidden="true">
          <rect x="154" y="26" width="84" height="112" rx="18" className={styles.moduleArtPanel} />
          <rect x="186" y="54" width="58" height="70" rx="16" className={styles.moduleArtCardStrong} />
          <circle cx="214" cy="76" r="14" className={styles.moduleArtSkin} />
          <rect x="196" y="94" width="36" height="24" rx="12" className={styles.moduleArtAccent} />
          <circle cx="116" cy="78" r="40" className={styles.moduleArtLens} />
          <circle cx="116" cy="78" r="27" className={styles.moduleArtLensInner} />
          <line x1="145" y1="106" x2="171" y2="134" className={styles.moduleArtStrokeDark} />
          <g transform="translate(42 82)">
            <circle cx="22" cy="20" r="14" className={styles.moduleArtSkin} />
            <path d="M2 78C5 49 15 34 22 34c7 0 17 15 20 44" className={styles.moduleArtBody} />
          </g>
          <g transform="translate(248 90)">
            <circle cx="18" cy="18" r="12" className={styles.moduleArtSkin} />
            <path d="M2 72C4 46 12 30 18 30c6 0 14 16 16 42" className={styles.moduleArtBodyAlt} />
          </g>
          <rect x="238" y="138" width="48" height="40" rx="12" className={styles.moduleArtCardSoft} />
          <circle cx="254" cy="154" r="8" className={styles.moduleArtAccentSoft} />
          <line x1="266" y1="149" x2="278" y2="149" className={styles.moduleArtStroke} />
          <line x1="266" y1="158" x2="276" y2="158" className={styles.moduleArtStrokeLight} />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg className={styles.moduleArtSvg} viewBox="0 0 320 220" aria-hidden="true">
          <rect x="102" y="32" width="112" height="164" rx="30" className={styles.moduleArtPhoneFrame} />
          <rect x="112" y="46" width="92" height="136" rx="24" className={styles.moduleArtPhoneScreen} />
          <rect x="124" y="64" width="56" height="30" rx="15" className={styles.moduleArtChatBubble} />
          <rect x="148" y="102" width="46" height="24" rx="12" className={styles.moduleArtChatBubbleSoft} />
          <rect x="124" y="136" width="54" height="24" rx="12" className={styles.moduleArtChatBubble} />
          <circle cx="74" cy="94" r="24" className={styles.moduleArtOrb} />
          <path d="M65 94h18M74 85v18" className={styles.moduleArtStrokeDark} />
          <circle cx="252" cy="138" r="26" className={styles.moduleArtOrbSoft} />
          <path d="M241 138h22M252 127v22" className={styles.moduleArtStroke} />
          <path d="M216 74c22 0 38 18 38 40 0 19-13 34-31 38l-13 12 2-17c-10-7-16-18-16-33 0-22 16-40 40-40Z" className={styles.moduleArtOutline} />
        </svg>
      )
    case 'crm':
      return (
        <svg className={styles.moduleArtSvg} viewBox="0 0 320 220" aria-hidden="true">
          <rect x="44" y="58" width="72" height="90" rx="18" className={styles.moduleArtCardSoft} />
          <rect x="124" y="34" width="72" height="114" rx="18" className={styles.moduleArtCardStrong} />
          <rect x="204" y="76" width="72" height="92" rx="18" className={styles.moduleArtCardSoft} />
          <circle cx="80" cy="84" r="14" className={styles.moduleArtAccentSoft} />
          <circle cx="160" cy="66" r="14" className={styles.moduleArtAccent} />
          <circle cx="240" cy="102" r="14" className={styles.moduleArtOrb} />
          <line x1="80" y1="126" x2="160" y2="104" className={styles.moduleArtStrokeDark} />
          <line x1="160" y1="104" x2="240" y2="128" className={styles.moduleArtStrokeDark} />
          <line x1="64" y1="108" x2="96" y2="108" className={styles.moduleArtStrokeLight} />
          <line x1="144" y1="90" x2="176" y2="90" className={styles.moduleArtStrokeLight} />
          <line x1="224" y1="126" x2="256" y2="126" className={styles.moduleArtStrokeLight} />
          <rect x="54" y="160" width="212" height="18" rx="9" className={styles.moduleArtPipelineBase} />
          <circle cx="84" cy="169" r="10" className={styles.moduleArtAccent} />
          <circle cx="158" cy="169" r="10" className={styles.moduleArtAccentSoft} />
          <circle cx="232" cy="169" r="10" className={styles.moduleArtOrb} />
        </svg>
      )
    case 'inventory':
      return (
        <svg className={styles.moduleArtSvg} viewBox="0 0 320 220" aria-hidden="true">
          <rect x="54" y="44" width="212" height="138" rx="20" className={styles.moduleArtShelfFrame} />
          <line x1="88" y1="44" x2="88" y2="182" className={styles.moduleArtStrokeDark} />
          <line x1="160" y1="44" x2="160" y2="182" className={styles.moduleArtStrokeDark} />
          <line x1="232" y1="44" x2="232" y2="182" className={styles.moduleArtStrokeDark} />
          <line x1="54" y1="92" x2="266" y2="92" className={styles.moduleArtStrokeDark} />
          <line x1="54" y1="138" x2="266" y2="138" className={styles.moduleArtStrokeDark} />
          <rect x="68" y="58" width="38" height="22" rx="6" className={styles.moduleArtBoxA} />
          <rect x="108" y="58" width="36" height="22" rx="6" className={styles.moduleArtBoxB} />
          <rect x="180" y="58" width="40" height="22" rx="6" className={styles.moduleArtBoxA} />
          <rect x="222" y="58" width="28" height="22" rx="6" className={styles.moduleArtBoxB} />
          <rect x="74" y="104" width="54" height="24" rx="7" className={styles.moduleArtBoxB} />
          <rect x="166" y="104" width="44" height="24" rx="7" className={styles.moduleArtBoxA} />
          <rect x="214" y="104" width="28" height="24" rx="7" className={styles.moduleArtBoxB} />
          <rect x="76" y="150" width="46" height="20" rx="7" className={styles.moduleArtBoxA} />
          <rect x="172" y="150" width="58" height="20" rx="7" className={styles.moduleArtBoxB} />
        </svg>
      )
    case 'shopify':
      return (
        <svg className={styles.moduleArtSvg} viewBox="0 0 320 220" aria-hidden="true">
          <rect x="48" y="52" width="196" height="120" rx="20" className={styles.moduleArtBrowser} />
          <rect x="48" y="52" width="196" height="26" rx="20" className={styles.moduleArtBrowserTop} />
          <circle cx="68" cy="65" r="4" className={styles.moduleArtDotStrong} />
          <circle cx="82" cy="65" r="4" className={styles.moduleArtDotSoft} />
          <circle cx="96" cy="65" r="4" className={styles.moduleArtDotWarm} />
          <rect x="66" y="94" width="48" height="48" rx="12" className={styles.moduleArtProductTile} />
          <rect x="126" y="94" width="52" height="10" rx="5" className={styles.moduleArtStrokeSoft} />
          <rect x="126" y="112" width="74" height="10" rx="5" className={styles.moduleArtStrokeSoft} />
          <rect x="126" y="132" width="44" height="24" rx="12" className={styles.moduleArtAccent} />
          <path d="M262 78h24l10 66h-78l8-48h52" className={styles.moduleArtCart} />
          <circle cx="236" cy="160" r="10" className={styles.moduleArtWheel} />
          <circle cx="282" cy="160" r="10" className={styles.moduleArtWheel} />
        </svg>
      )
    case 'vizora':
      return (
        <svg className={styles.moduleArtSvg} viewBox="0 0 320 220" aria-hidden="true">
          <rect x="56" y="56" width="126" height="92" rx="18" className={styles.moduleArtCameraBody} />
          <rect x="74" y="42" width="32" height="20" rx="8" className={styles.moduleArtCameraTop} />
          <circle cx="120" cy="102" r="28" className={styles.moduleArtLens} />
          <circle cx="120" cy="102" r="16" className={styles.moduleArtLensInner} />
          <rect x="210" y="56" width="58" height="78" rx="16" className={styles.moduleArtProductFrame} />
          <rect x="222" y="68" width="34" height="46" rx="10" className={styles.moduleArtProductBody} />
          <path d="M220 160l12-16 12 10 14-20 18 26" className={styles.moduleArtStrokeDark} />
          <path d="M234 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" className={styles.moduleArtSparkle} />
          <path d="M272 96l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" className={styles.moduleArtSparkleSoft} />
          <path d="M188 34l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" className={styles.moduleArtSparkleSoft} />
        </svg>
      )
    case 'leads':
      return (
        <svg className={styles.moduleArtSvg} viewBox="0 0 320 220" aria-hidden="true">
          <rect x="48" y="50" width="128" height="118" rx="22" className={styles.moduleArtMapCard} />
          <path d="M72 76c18-18 46-18 64 0 18 18 18 46 0 64-18 18-46 18-64 0-18-18-18-46 0-64Z" className={styles.moduleArtMapPath} />
          <path d="M104 70c12 0 22 10 22 22 0 18-22 38-22 38S82 110 82 92c0-12 10-22 22-22Z" className={styles.moduleArtPin} />
          <circle cx="104" cy="92" r="8" className={styles.moduleArtPinCore} />
          <rect x="196" y="40" width="86" height="28" rx="14" className={styles.moduleArtSearchBar} />
          <circle cx="216" cy="54" r="8" className={styles.moduleArtLensInner} />
          <line x1="222" y1="60" x2="230" y2="68" className={styles.moduleArtStrokeDark} />
          <rect x="196" y="82" width="86" height="80" rx="18" className={styles.moduleArtLeadsList} />
          <rect x="210" y="98" width="24" height="24" rx="8" className={styles.moduleArtAccentSoft} />
          <rect x="242" y="102" width="26" height="8" rx="4" className={styles.moduleArtStrokeSoft} />
          <rect x="242" y="115" width="20" height="8" rx="4" className={styles.moduleArtStrokeSoft} />
          <rect x="210" y="130" width="24" height="24" rx="8" className={styles.moduleArtAccent} />
          <rect x="242" y="134" width="26" height="8" rx="4" className={styles.moduleArtStrokeSoft} />
          <rect x="242" y="147" width="18" height="8" rx="4" className={styles.moduleArtStrokeSoft} />
        </svg>
      )
    default:
      return (
        <svg className={styles.moduleArtSvg} viewBox="0 0 320 220" aria-hidden="true">
          <rect x="72" y="58" width="176" height="108" rx="24" className={styles.moduleArtCardSoft} />
          <rect x="98" y="84" width="56" height="56" rx="16" className={styles.moduleArtAccentSoft} />
          <rect x="170" y="90" width="52" height="10" rx="5" className={styles.moduleArtStrokeSoft} />
          <rect x="170" y="110" width="74" height="10" rx="5" className={styles.moduleArtStrokeSoft} />
          <rect x="170" y="130" width="42" height="24" rx="12" className={styles.moduleArtAccent} />
        </svg>
      )
  }
}

export default function DashboardClient({
  user,
  modules,
}: {
  user: DashboardUser
  modules: DashboardModule[]
}) {
  const assignedModules = modules.filter(module => module.isAssigned)
  const inactiveModules = modules.filter(module => !module.isAssigned)
  const orderedModules = [...assignedModules, ...inactiveModules]

  const [activeModule, setActiveModule] = useState<string>(() => {
    const firstAssigned = assignedModules[0] || modules[0]
    return firstAssigned ? resolveModuleKey(firstAssigned) : 'crm'
  })

  const activeModuleRecord =
    modules.find(module => resolveModuleKey(module) === activeModule) ||
    assignedModules[0] ||
    modules[0]

  const activeKey = activeModuleRecord ? resolveModuleKey(activeModuleRecord) : 'crm'
  const activeMeta = MODULE_META[activeKey] || MODULE_META.crm
  const activeHref = pickModuleHref(activeKey, activeModuleRecord)
  const moduleDescription = activeModuleRecord?.description?.trim() || activeMeta.description
  const moduleSummary = activeModuleRecord?.summary?.trim() || activeMeta.summary
  const featureList = useMemo(() => {
    if (Array.isArray(activeModuleRecord?.features) && activeModuleRecord.features.length > 0) {
      return activeModuleRecord.features
    }

    return activeMeta.features
  }, [activeMeta.features, activeModuleRecord?.features])

  const dashboardStyle = {
    '--dashboard-accent': '#0f8f8a',
    '--dashboard-accent-strong': '#0b6c70',
    '--dashboard-accent-soft': '#e7f6f5',
    '--dashboard-border': '#d9edf0',
    '--dashboard-sidebar': 'linear-gradient(180deg,#06333a 0%,#083c46 54%,#0a2b33 100%)',
    '--dashboard-page': '#f6fbfc',
    '--dashboard-card': '#ffffff',
    '--dashboard-text': '#0f172a',
    '--dashboard-muted': '#64748b',
    '--module-surface': activeMeta.surface,
    '--module-soft': activeMeta.softSurface,
    '--module-border': activeMeta.border,
    '--module-accent': activeMeta.accent,
  } as CSSProperties

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className={styles.dashboardShell} style={dashboardStyle}>
      <div className={styles.dashboardLayout}>
          <aside className={`${styles.sidebar} ${styles.fadeInSidebar}`}>
          <div className={styles.brandBlock}>
            <div className={styles.brandMark}>SV</div>
            <div>
              <div className={styles.brandTitle}>ScaleVyapar</div>
              <div className={styles.brandSubtitle}>Client Hub</div>
            </div>
          </div>

          <div className={styles.sidebarDivider} />

          <div className={styles.sidebarKicker}>Module Workspace</div>

          <div className={styles.moduleList}>
            {orderedModules.map(module => {
              const moduleKey = resolveModuleKey(module)
              const meta = MODULE_META[moduleKey] || MODULE_META.crm
              const selected = activeModule === moduleKey
              const badgeLabel = module.isAssigned ? 'Active' : 'Inactive'

              return (
                <button
                  key={module.id}
                  type="button"
                  className={`${styles.moduleItem} ${selected ? styles.moduleItemActive : ''}`}
                  onClick={() => setActiveModule(moduleKey)}
                >
                  <div className={styles.moduleItemIcon} style={{ backgroundImage: module.isAssigned ? meta.surface : 'linear-gradient(135deg,#43636e,#315660)' }}>
                    {module.icon || meta.shortIcon}
                  </div>
                  <div className={styles.moduleItemCopy}>
                    <div className={styles.moduleItemRow}>
                      <div className={styles.moduleItemTitle}>{module.name}</div>
                      <span className={`${styles.statusPill} ${module.isAssigned ? styles.statusPillActive : styles.statusPillInactive}`}>
                        {badgeLabel}
                      </span>
                    </div>
                    <div className={styles.moduleItemMeta}>{getModuleStatus(module)}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className={styles.supportCard}>
            <div className={styles.supportArt}>
              <div className={styles.supportArtCard}>
                <div className={styles.supportLine} />
                <div className={styles.supportLineShort} />
                <div className={styles.supportBubble}>
                  <HelpCircle size={18} />
                </div>
              </div>
            </div>
            <div className={styles.supportTitle}>Need Help?</div>
            <div className={styles.supportText}>Our support team is here to help you 24/7.</div>
            <a className={styles.supportButton} href="/contact" target="_blank" rel="noreferrer">
              Contact Support
              <ArrowRight size={16} />
            </a>
          </div>
        </aside>

        <main className={styles.mainPanel}>
          <header className={styles.mainHeader}>
            <div className={styles.headerModule}>
              <div className={styles.headerModuleIcon} style={{ backgroundImage: activeMeta.softSurface, color: activeMeta.accent }}>
                {activeModuleRecord?.icon || activeMeta.shortIcon}
              </div>
              <div>
                <div className={styles.headerModuleKicker}>{activeMeta.badge}</div>
                <h1 className={styles.headerModuleTitle}>{activeModuleRecord?.name || 'Module workspace'}</h1>
              </div>
            </div>

            <div className={styles.headerActions}>
              <div className={styles.userMeta}>
                <div className={styles.userName}>{user.name}</div>
                <div className={styles.userEmail}>{user.email}</div>
              </div>
              <button type="button" className={styles.logoutButton} onClick={logout}>
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </header>

          <section className={`${styles.heroCard} ${styles.fadeInSection}`}>
            <div className={styles.heroCopy}>
              <div className={styles.heroEyebrow}>{activeKey === 'rozgar' ? 'Rozgar quick actions' : activeMeta.badge}</div>
              <h2 className={styles.heroTitle}>
                {activeKey === 'rozgar'
                  ? 'Hiring tools for labour sourcing and worker applications'
                  : `${activeModuleRecord?.name || 'Module'} workspace for your daily operations`}
              </h2>
              <p className={styles.heroDescription}>
                {activeKey === 'rozgar'
                  ? 'Open the labour search interface to browse available workers, or jump directly into the company panel to review incoming applications, shortlist workers, and continue the hiring flow.'
                  : moduleDescription}
              </p>

              <div className={styles.heroActions}>
                {activeKey === 'rozgar' ? (
                  <>
                    <a className={styles.primaryAction} href="/labour/company/search" target="_blank" rel="noreferrer">
                      <Search size={18} />
                      Search Labour
                    </a>
                    <a className={styles.secondaryAction} href="/labour/company/panel" target="_blank" rel="noreferrer">
                      <Users2 size={18} />
                      Receive Worker Applications
                    </a>
                  </>
                ) : activeModuleRecord?.isAssigned ? (
                  <>
                    <a className={styles.primaryAction} href={activeHref} target="_blank" rel="noreferrer">
                      <ArrowUpRight size={18} />
                      Open {activeModuleRecord?.name}
                    </a>
                    <span className={styles.secondaryBadge}>{featureList.length} capabilities ready</span>
                  </>
                ) : (
                  <>
                    <span className={styles.primaryDisabled}>Inactive for this client</span>
                    <a className={styles.secondaryAction} href="/contact" target="_blank" rel="noreferrer">
                      <MessageSquareText size={18} />
                      Contact Support
                    </a>
                  </>
                )}
              </div>

              <div className={styles.heroFacts}>
                <div className={styles.heroFact}>
                  <span className={styles.heroFactLabel}>Module state</span>
                  <span className={styles.heroFactValue}>{activeModuleRecord?.isAssigned ? 'Live for your account' : 'Inactive for your account'}</span>
                </div>
                <div className={styles.heroFact}>
                  <span className={styles.heroFactLabel}>Primary use</span>
                  <span className={styles.heroFactValue}>{activeMeta.badge}</span>
                </div>
                <div className={styles.heroFact}>
                  <span className={styles.heroFactLabel}>Feature coverage</span>
                  <span className={styles.heroFactValue}>{featureList.length} capabilities</span>
                </div>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.visualGlow} />
              <div className={styles.visualFrame} aria-hidden="true">
                <ModuleArtwork moduleKey={activeKey} />
              </div>
            </div>
          </section>

          <section className={`${styles.workspaceSection} ${styles.fadeInSection}`}>
            <div className={styles.sectionHeading}>What you can do in this module</div>
            <div className={styles.featureGrid}>
              {featureList.map((feature, index) => {
                const FeatureIcon = getFeatureIcon(feature)

                return (
                  <article key={feature} className={`${styles.featureCard} ${styles.fadeInCard}`}>
                    <div className={styles.featureCardTop}>
                      <span className={styles.featureNumber}>{String(index + 1).padStart(2, '0')}</span>
                      <span className={styles.featureIconCircle} data-tone={getFeatureTone(index)}>
                        <FeatureIcon size={24} strokeWidth={2.1} />
                      </span>
                    </div>
                    <h3 className={styles.featureTitle}>{feature}</h3>
                    <p className={styles.featureText}>
                      {activeModuleRecord?.isAssigned
                        ? `Use ${feature.toLowerCase()} from your assigned ${activeModuleRecord?.name || 'module'} workspace when you need it.`
                        : `This capability is part of ${activeModuleRecord?.name || 'this module'} and becomes available after the module is assigned to your account.`}
                    </p>
                  </article>
                )
              })}
            </div>

            <div className={styles.summaryGrid}>
              <article className={`${styles.summaryCard} ${styles.fadeInCard}`}>
                <div className={styles.summaryHeader}>
                  <span className={styles.summaryIcon}>
                    <LayoutGrid size={18} />
                  </span>
                  <div className={styles.summaryTitle}>Module summary</div>
                </div>
                <p className={styles.summaryText}>
                  {moduleSummary}{' '}
                  {activeModuleRecord?.isAssigned
                    ? 'Your account already has access, so you can open the module directly from this dashboard.'
                    : 'It is shown here in inactive mode so you can review it without confusion before it is assigned.'}
                </p>
                <div className={styles.summaryIllustration}>
                  <div className={styles.summaryClipboard}>
                    <div className={styles.summaryClip} />
                    <div className={styles.summaryCheckRow}>
                      <span className={styles.summaryCheck} />
                      <span className={styles.summaryStroke} />
                    </div>
                    <div className={styles.summaryCheckRow}>
                      <span className={styles.summaryCheck} />
                      <span className={styles.summaryStroke} />
                    </div>
                    <div className={styles.summaryCheckRow}>
                      <span className={styles.summaryCheck} />
                      <span className={styles.summaryStrokeShort} />
                    </div>
                  </div>
                </div>
              </article>

              <article className={`${styles.nextCard} ${styles.fadeInCard}`}>
                <div>
                  <div className={styles.nextKicker}>Next step</div>
                  <div className={styles.nextTitle}>
                    {activeModuleRecord?.isAssigned ? 'Open and start using it' : 'Request this module when needed'}
                  </div>
                  <p className={styles.nextText}>
                    {activeModuleRecord?.isAssigned
                      ? 'You already have access to this module. Open it in a new tab and continue your work.'
                      : 'This module is displayed for visibility, but it stays inactive until it is assigned to your client account.'}
                  </p>
                </div>

                {activeModuleRecord?.isAssigned ? (
                  <a className={styles.nextAction} href={activeHref} target="_blank" rel="noreferrer">
                    Open {activeModuleRecord?.name}
                  </a>
                ) : (
                  <div className={styles.nextDisabled}>Inactive for this client</div>
                )}
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
