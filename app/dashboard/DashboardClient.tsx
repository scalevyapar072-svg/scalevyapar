'use client'

import { useMemo, useState } from 'react'

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
  accentDark: string
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
    accent: '#7c3aed',
    accentDark: '#5b21b6',
    surface: 'linear-gradient(135deg,#8b80ff 0%,#6d5efc 55%,#5544de 100%)',
    softSurface: '#faf5ff',
    border: '#e9d5ff',
    description: 'Create polished product visuals, ad creatives, and motion content for your catalog from one workspace.',
    summary: 'AI-powered creative production for product photos, ads, and short-form selling content.',
    features: ['AI Photo Generation', 'Photo Upscaling 4x', 'Video Ads', 'UGC Creator Videos', 'Background Cleanup', 'Creative Variants'],
    href: '/vizora',
  },
  leads: {
    badge: 'Lead Engine',
    shortIcon: 'LG',
    heroIcon: 'LE',
    accent: '#2563eb',
    accentDark: '#1d4ed8',
    surface: 'linear-gradient(135deg,#59b6ff 0%,#2787f5 55%,#1b64d8 100%)',
    softSurface: '#eff6ff',
    border: '#bfdbfe',
    description: 'Search businesses by location, export lead lists, and build a reliable outbound pipeline.',
    summary: 'Google-sourced B2B lead collection with filtering, list management, and export support.',
    features: ['Google Maps Scraper', 'Location Filters', 'Business Type Filters', 'Export to CSV', 'Lead Cleanup', 'Follow-up Preparation'],
    href: '/leads',
  },
  rozgar: {
    badge: 'Labour Hiring',
    shortIcon: 'R',
    heroIcon: 'RZ',
    accent: '#0284c7',
    accentDark: '#0369a1',
    surface: 'linear-gradient(135deg,#6d9cff 0%,#4177f6 55%,#2d5fdf 100%)',
    softSurface: '#f0f9ff',
    border: '#bae6fd',
    description: 'Search workers, manage labour applications, and operate the hiring flow from one marketplace.',
    summary: 'Dedicated labour marketplace and company hiring panel for fast worker sourcing.',
    features: ['Search Labour', 'Receive Worker Applications', 'Company Hiring Panel', 'Rozgar Dashboard', 'Worker Shortlisting', 'Hiring Activity Review'],
    href: '/labour/company/search',
  },
  crm: {
    badge: 'CRM Workflow',
    shortIcon: 'CRM',
    heroIcon: 'CM',
    accent: '#059669',
    accentDark: '#047857',
    surface: 'linear-gradient(135deg,#41cf96 0%,#0f9f6e 55%,#0a7e57 100%)',
    softSurface: '#ecfdf5',
    border: '#a7f3d0',
    description: 'Track call outcomes, capture notes, and move every prospect through a clear follow-up pipeline.',
    summary: 'Daily sales follow-up workspace for call tracking, notes, and lead stage management.',
    features: ['Call Tracking', 'Follow-up Reminders', 'Lead Status', 'Notes and History', 'Opportunity Tracking', 'Team Handover Notes'],
    href: '/leads',
  },
  whatsapp: {
    badge: 'Messaging Automation',
    shortIcon: 'WA',
    heroIcon: 'WA',
    accent: '#16a34a',
    accentDark: '#15803d',
    surface: 'linear-gradient(135deg,#4cc989 0%,#1b9a64 55%,#11784f 100%)',
    softSurface: '#f0fdf4',
    border: '#bbf7d0',
    description: 'Automate customer replies, nurture leads, and keep conversations moving on WhatsApp.',
    summary: 'WhatsApp-first outreach and auto-response workflows for customer communication.',
    features: ['Auto Replies', 'Bulk Messaging', 'Lead Nurturing', 'Message Templates', 'Customer Follow-up', 'Quick Response Queues'],
    href: '/leads',
  },
  shopify: {
    badge: 'Store Operations',
    shortIcon: 'S',
    heroIcon: 'SP',
    accent: '#ca8a04',
    accentDark: '#a16207',
    surface: 'linear-gradient(135deg,#b8c86d 0%,#8d9750 55%,#6e783d 100%)',
    softSurface: '#fefce8',
    border: '#fde68a',
    description: 'Organize catalog, pricing, and store operations for a cleaner Shopify workflow.',
    summary: 'Storefront operations support for listings, pricing, and order visibility.',
    features: ['Catalog Setup', 'Product Organization', 'Pricing Workflow', 'Store Readiness', 'Order Snapshot', 'Collection Planning'],
    href: '/leads',
  },
  inventory: {
    badge: 'Inventory Control',
    shortIcon: 'INV',
    heroIcon: 'IN',
    accent: '#ea580c',
    accentDark: '#c2410c',
    surface: 'linear-gradient(135deg,#efb261 0%,#d1862e 55%,#a9671d 100%)',
    softSurface: '#fff7ed',
    border: '#fed7aa',
    description: 'Monitor stock, materials, and dispatch activity in a more organized operations dashboard.',
    summary: 'Inventory and production visibility for stock movement, materials, and dispatch planning.',
    features: ['Stock Monitoring', 'Material Tracking', 'Dispatch Planning', 'Low Stock Review', 'Batch Visibility', 'Movement Notes'],
    href: '/leads',
  },
  chatbot: {
    badge: 'AI Assistant',
    shortIcon: 'AI',
    heroIcon: 'AI',
    accent: '#db2777',
    accentDark: '#be185d',
    surface: 'linear-gradient(135deg,#ed93bb 0%,#d14f8a 55%,#a8376c 100%)',
    softSurface: '#fdf2f8',
    border: '#fbcfe8',
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
  const rawHref = candidates.find((v): v is string => typeof v === 'string' && v.trim().length > 0 && v.trim() !== '#') || '#'
  if (rawHref === '#') return rawHref
  try {
    const url = new URL(rawHref)
    if (url.hostname.includes('vercel.app')) return `https://www.scalevyapar.in${url.pathname}${url.search}${url.hash}`
    return `${url.origin}${url.pathname}${url.search}${url.hash}`
  } catch { return rawHref }
}

function getModuleStatus(module: DashboardModule) {
  if (module.isAssigned) return module.isActive ? 'Assigned & live' : 'Assigned but inactive'
  return 'Not assigned'
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function DashboardClient({ user, modules }: { user: DashboardUser; modules: DashboardModule[] }) {
  const assignedModules = modules.filter(m => m.isAssigned)
  const inactiveModules = modules.filter(m => !m.isAssigned)

  const [activeModule, setActiveModule] = useState<string>(() => {
    const first = assignedModules[0] || modules[0]
    return first ? resolveModuleKey(first) : 'crm'
  })

  const activeModuleRecord = modules.find(m => resolveModuleKey(m) === activeModule) || assignedModules[0] || modules[0]
  const activeKey = activeModuleRecord ? resolveModuleKey(activeModuleRecord) : 'crm'
  const activeMeta = MODULE_META[activeKey] || MODULE_META.crm
  const activeHref = pickModuleHref(activeKey, activeModuleRecord)
  const moduleDescription = activeModuleRecord?.description?.trim() || activeMeta.description
  const moduleSummary = activeModuleRecord?.summary?.trim() || activeMeta.summary

  const featureList = useMemo(() => {
    if (Array.isArray(activeModuleRecord?.features) && activeModuleRecord.features.length > 0) return activeModuleRecord.features
    return activeMeta.features
  }, [activeMeta.features, activeModuleRecord?.features])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="app">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #f1f5f9;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 13px;
          color: #0f172a;
          line-height: 1.5;
        }

        /* ─── TOPBAR ─── */
        .topbar {
          height: 56px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          position: sticky;
          top: 0;
          z-index: 50;
          flex-shrink: 0;
        }

        .topLeft {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logoMark {
          width: 32px;
          height: 32px;
          background: #0f172a;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: -0.02em;
          flex-shrink: 0;
        }

        .logoText {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .logoDivider {
          width: 1px;
          height: 18px;
          background: #e2e8f0;
          margin: 0 4px;
        }

        .logoSub {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 400;
        }

        .topRight {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .userChip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px 5px 5px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
        }

        .userAvatar {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #0f172a;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .userName {
          font-size: 12px;
          font-weight: 500;
          color: #0f172a;
        }

        .userEmail {
          font-size: 11px;
          color: #94a3b8;
        }

        .logoutBtn {
          height: 32px;
          padding: 0 14px;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          background: #fff;
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .logoutBtn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        /* ─── BODY ─── */
        .body {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        /* ─── SIDEBAR ─── */
        .sidebar {
          width: 232px;
          flex-shrink: 0;
          background: #e8f0fe;
          border-right: 1px solid #c7d7f8;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 56px);
          position: sticky;
          top: 56px;
          overflow-y: auto;
        }

        .sidebar::-webkit-scrollbar { width: 0px; }

        .sbProfile {
          padding: 16px 14px 12px;
          border-bottom: 1px solid #c7d7f8;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sbAvatar {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #1e40af;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .sbProfileName {
          font-size: 13px;
          font-weight: 500;
          color: #1e293b;
          line-height: 1.3;
        }

        .sbProfileEmail {
          font-size: 11px;
          color: #64748b;
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .sbStats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #c7d7f8;
          border-bottom: 1px solid #c7d7f8;
        }

        .sbStat {
          background: #e8f0fe;
          padding: 10px 12px;
          text-align: center;
        }

        .sbStatVal {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          line-height: 1;
          margin-bottom: 3px;
          text-transform: capitalize;
        }

        .sbStatLbl {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sbGroup {
          padding: 14px 14px 6px;
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .sbList {
          padding: 0 8px;
        }

        .sbItem {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          border: 1px solid transparent;
          background: transparent;
          width: 100%;
          text-align: left;
          font-family: inherit;
          margin-bottom: 2px;
          transition: all 0.12s;
          position: relative;
        }

        .sbItem:hover {
          background: rgba(255,255,255,0.55);
        }

        .sbItem.active {
          background: #ffffff;
          border-color: #bfdbfe;
          box-shadow: 0 1px 3px rgba(30,64,175,0.08);
          border-left: 2px solid #2563eb;
        }

        .sbItemIcon {
          width: 30px;
          height: 30px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          letter-spacing: -0.02em;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }

        .sbItemBody { flex: 1; min-width: 0; }

        .sbItemName {
          font-size: 12.5px;
          font-weight: 500;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }

        .sbItemSub {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 1px;
        }

        .sbItemDot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .dot-green { background: #22c55e; }
        .dot-gray  { background: #cbd5e1; }

        .sbFooter {
          margin-top: auto;
          padding: 10px 12px;
          border-top: 1px solid #c7d7f8;
        }

        .sbLogout {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 12px;
          color: #64748b;
          cursor: pointer;
          font-family: inherit;
          border: none;
          background: transparent;
          width: 100%;
          transition: all 0.12s;
        }

        .sbLogout:hover {
          background: rgba(255,255,255,0.6);
          color: #1e293b;
        }

        /* ─── MAIN ─── */
        .main {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
          overflow-x: hidden;
          background: #f1f5f9;
          padding: 22px 22px 32px 22px;
        }

        /* ─── PAGE HEADER ─── */
        .pageHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
        }

        .pageCrumb {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 400;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .crumbSep { color: #cbd5e1; }

        .pageTitle {
          font-size: 20px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .pageActions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .statusPill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          height: 32px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid;
        }

        .pill-green {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #15803d;
        }

        .pill-gray {
          background: #f8fafc;
          border-color: #e2e8f0;
          color: #64748b;
        }

        .openBtn {
          height: 32px;
          padding: 0 16px;
          border-radius: 7px;
          background: #0f172a;
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          flex-shrink: 0;
        }

        .openBtn:hover { background: #1e293b; }

        .disabledBtn {
          height: 32px;
          padding: 0 16px;
          border-radius: 7px;
          background: #f1f5f9;
          color: #94a3b8;
          font-size: 12px;
          border: 1px solid #e2e8f0;
        }

        /* ─── METRIC ROW ─── */
        .metricRow {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .metricCard {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          border-top: 3px solid #e2e8f0;
        }

        .metricIconBox {
          width: 40px;
          height: 40px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metricBody {}

        .metricLbl {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 400;
          margin-bottom: 3px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metricVal {
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .metricSub {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 1px;
        }

        /* ─── TWO-COL LAYOUT ─── */
        .twoCol {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 14px;
          margin-bottom: 14px;
          align-items: start;
        }

        /* ─── PANEL ─── */
        .panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .panelHeader {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .panelTitle {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }

        .panelSub {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
          font-weight: 400;
        }

        .panelBadge {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 99px;
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .panelBody {
          padding: 16px 20px;
        }

        /* ─── FEATURE GRID ─── */
        .featureGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .featureCard {
          border: 1px solid #f1f5f9;
          border-radius: 9px;
          padding: 14px 15px;
          background: #fafbfc;
          transition: all 0.15s;
          cursor: default;
        }

        .featureCard:hover {
          border-color: #e2e8f0;
          background: #fff;
          box-shadow: 0 2px 8px rgba(15,23,42,0.06);
        }

        .featureNum {
          font-size: 10px;
          font-weight: 600;
          color: #cbd5e1;
          margin-bottom: 8px;
          letter-spacing: 0.04em;
        }

        .featureDot {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 8px;
        }

        .featureName {
          font-size: 12.5px;
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .featureDesc {
          font-size: 11.5px;
          color: #94a3b8;
          line-height: 1.55;
        }

        /* ─── INFO PANEL (right col) ─── */
        .infoPanel {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .infoCard {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 18px;
        }

        .infoCardAccent {
          height: 3px;
          border-radius: 12px 12px 0 0;
          margin: -16px -18px 14px;
        }

        .infoLabel {
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 8px;
        }

        .infoTitle {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 6px;
          line-height: 1.35;
          letter-spacing: -0.01em;
        }

        .infoDesc {
          font-size: 12px;
          color: #64748b;
          line-height: 1.6;
          margin-bottom: 14px;
        }

        .infoAction {
          display: block;
          text-align: center;
          padding: 8px 16px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          color: #fff;
          transition: opacity 0.15s;
        }

        .infoAction:hover { opacity: 0.88; }

        .infoActionDisabled {
          display: block;
          text-align: center;
          padding: 8px 16px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 500;
          background: #f1f5f9;
          color: #94a3b8;
          border: 1px solid #e2e8f0;
        }

        .infoRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 12px;
        }

        .infoRow:last-child { border-bottom: none; }

        .infoRowKey { color: #94a3b8; }
        .infoRowVal { font-weight: 500; color: #1e293b; }

        /* ─── SUMMARY STRIP ─── */
        .summaryStrip {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 20px;
          align-items: start;
        }

        .ssSection {}

        .ssLabel {
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 5px;
        }

        .ssTitle {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 5px;
          letter-spacing: -0.01em;
        }

        .ssCopy {
          font-size: 12px;
          color: #64748b;
          line-height: 1.6;
        }

        .ssCta {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-end;
          gap: 8px;
        }

        /* ─── ROZGAR QUICK ─── */
        .rozgarStrip {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }

        .rzTitle {
          font-size: 13px;
          font-weight: 500;
          color: #1e40af;
          margin-bottom: 3px;
        }

        .rzDesc {
          font-size: 12px;
          color: #3b82f6;
        }

        .rzActions { display: flex; gap: 8px; flex-shrink: 0; }

        .rzBtn {
          height: 30px;
          padding: 0 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          display: flex;
          align-items: center;
          transition: opacity 0.12s;
          font-family: inherit;
        }

        .rzBtn:hover { opacity: 0.85; }

        .rzBtnPrimary { background: #1d4ed8; color: #fff; border: none; cursor: pointer; }
        .rzBtnSecondary { background: #fff; color: #1d4ed8; border: 1px solid #bfdbfe; }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 1100px) {
          .twoCol { grid-template-columns: 1fr; }
          .summaryStrip { grid-template-columns: 1fr; }
          .ssCta { align-items: flex-start; flex-direction: row; }
        }

        @media (max-width: 768px) {
          .body { flex-direction: column; }
          .sidebar { width: 100%; height: auto; position: static; }
          .metricRow { grid-template-columns: 1fr; }
          .main { padding: 16px; }
        }
      `}</style>

      {/* ── TOPBAR ── */}
      <header className="topbar">
        <div className="topLeft">
          <div className="logoMark">SV</div>
          <span className="logoText">ScaleVyapar</span>
          <div className="logoDivider" />
          <span className="logoSub">Client Hub</span>
        </div>
        <div className="topRight">
          <div className="userChip">
            <div className="userAvatar">{initials(user.name)}</div>
            <div>
              <div className="userName">{user.name}</div>
              <div className="userEmail">{user.email}</div>
            </div>
          </div>
          <button onClick={logout} className="logoutBtn">
            Sign out
          </button>
        </div>
      </header>

      <div className="body">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sbProfile">
            <div className="sbAvatar">{initials(user.name)}</div>
            <div style={{ minWidth: 0 }}>
              <div className="sbProfileName">{user.name}</div>
              <div className="sbProfileEmail">{user.email}</div>
            </div>
          </div>

          <div className="sbStats">
            <div className="sbStat">
              <div className="sbStatVal">{assignedModules.length}</div>
              <div className="sbStatLbl">Active</div>
            </div>
            <div className="sbStat">
              <div className="sbStatVal">{modules.length}</div>
              <div className="sbStatLbl">Total</div>
            </div>
            <div className="sbStat">
              <div className="sbStatVal" style={{ color: '#16a34a', fontSize: 12 }}>{(user.status || 'active').toUpperCase()}</div>
              <div className="sbStatLbl">Status</div>
            </div>
          </div>

          {assignedModules.length > 0 && (
            <>
              <div className="sbGroup">Active Modules</div>
              <div className="sbList">
                {assignedModules.map(mod => {
                  const key = resolveModuleKey(mod)
                  const meta = MODULE_META[key] || MODULE_META.crm
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModule(key)}
                      className={`sbItem${activeModule === key ? ' active' : ''}`}
                    >
                      <div className="sbItemIcon" style={{ background: meta.surface }}>{mod.icon || meta.shortIcon}</div>
                      <div className="sbItemBody">
                        <div className="sbItemName">{mod.name}</div>
                        <div className="sbItemSub">{getModuleStatus(mod)}</div>
                      </div>
                      <div className={`sbItemDot dot-green`} />
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {inactiveModules.length > 0 && (
            <>
              <div className="sbGroup" style={{ marginTop: 8 }}>Inactive</div>
              <div className="sbList">
                {inactiveModules.map(mod => {
                  const key = resolveModuleKey(mod)
                  const meta = MODULE_META[key] || MODULE_META.crm
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModule(key)}
                      className={`sbItem${activeModule === key ? ' active' : ''}`}
                    >
                      <div className="sbItemIcon" style={{ background: '#cbd5e1', color: '#475569' }}>{mod.icon || meta.shortIcon}</div>
                      <div className="sbItemBody">
                        <div className="sbItemName" style={{ color: '#64748b' }}>{mod.name}</div>
                        <div className="sbItemSub">{getModuleStatus(mod)}</div>
                      </div>
                      <div className="sbItemDot dot-gray" />
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <div className="sbFooter">
            <button onClick={logout} className="sbLogout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">

          {/* Page header */}
          <div className="pageHeader">
            <div>
              <div className="pageCrumb">
                <span>Workspace</span>
                <span className="crumbSep">›</span>
                <span style={{ color: activeMeta.accent }}>{activeMeta.badge}</span>
              </div>
              <div className="pageTitle">{activeModuleRecord?.name || 'Module'}</div>
            </div>
            <div className="pageActions">
              {activeModuleRecord?.isAssigned
                ? <span className="statusPill pill-green"><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />Live</span>
                : <span className="statusPill pill-gray">Inactive</span>
              }
              {activeModuleRecord?.isAssigned
                ? <a href={activeHref} target="_blank" rel="noreferrer" className="openBtn">
                    Open {activeModuleRecord?.name}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                : <div className="disabledBtn">Not assigned</div>
              }
            </div>
          </div>

          {/* Metrics */}
          <div className="metricRow">
            <div className="metricCard" style={{ borderTop: `3px solid ${activeModuleRecord?.isAssigned ? '#22c55e' : '#e2e8f0'}` }}>
              <div className="metricIconBox" style={{ background: activeModuleRecord?.isAssigned ? '#f0fdf4' : '#f8fafc', border: `1px solid ${activeModuleRecord?.isAssigned ? '#bbf7d0' : '#e2e8f0'}` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeModuleRecord?.isAssigned ? '#16a34a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className="metricBody">
                <div className="metricLbl">Workspace state</div>
                <div className="metricVal" style={{ color: activeModuleRecord?.isAssigned ? '#16a34a' : '#64748b' }}>
                  {activeModuleRecord?.isAssigned ? 'Live & active' : 'Inactive'}
                </div>
                <div className="metricSub">Assigned to your account</div>
              </div>
            </div>
            <div className="metricCard" style={{ borderTop: `3px solid ${activeMeta.accent}` }}>
              <div className="metricIconBox" style={{ background: activeMeta.softSurface, border: `1px solid ${activeMeta.border}` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeMeta.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <div className="metricBody">
                <div className="metricLbl">Primary use</div>
                <div className="metricVal">{activeMeta.badge}</div>
                <div className="metricSub">Module category</div>
              </div>
            </div>
            <div className="metricCard" style={{ borderTop: '3px solid #94a3b8' }}>
              <div className="metricIconBox" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div className="metricBody">
                <div className="metricLbl">Feature coverage</div>
                <div className="metricVal">{featureList.length} capabilities</div>
                <div className="metricSub">Ready to use</div>
              </div>
            </div>
          </div>

          {/* Two col */}
          <div className="twoCol">
            {/* Features panel */}
            <div className="panel">
              <div className="panelHeader">
                <div>
                  <div className="panelTitle">Module capabilities</div>
                  <div className="panelSub">Everything available in {activeModuleRecord?.name}</div>
                </div>
                <span className="panelBadge">{featureList.length} features</span>
              </div>
              <div className="panelBody">
                {activeKey === 'rozgar' && (
                  <div className="rozgarStrip">
                    <div>
                      <div className="rzTitle">Labour hiring quick actions</div>
                      <div className="rzDesc">Search workers or manage incoming applications directly.</div>
                    </div>
                    <div className="rzActions">
                      <a href="/labour/company/search" target="_blank" rel="noreferrer" className="rzBtn rzBtnPrimary">Search Labour</a>
                      <a href="/labour/company/panel" target="_blank" rel="noreferrer" className="rzBtn rzBtnSecondary">Applications</a>
                    </div>
                  </div>
                )}
                <div className="featureGrid">
                  {featureList.map((feature, i) => (
                    <div className="featureCard" key={feature}>
                      <div className="featureNum">{String(i + 1).padStart(2, '0')}</div>
                      <div className="featureDot" style={{ background: activeMeta.surface }}>{String(i + 1).padStart(2, '0')}</div>
                      <div className="featureName">{feature}</div>
                      <div className="featureDesc">
                        {activeModuleRecord?.isAssigned
                          ? `Available in your ${activeModuleRecord?.name} workspace.`
                          : `Available once this module is assigned to your account.`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right info panel */}
            <div className="infoPanel">
              <div className="infoCard">
                <div className="infoCardAccent" style={{ background: activeMeta.surface }} />
                <div className="infoLabel">Module overview</div>
                <div className="infoTitle">{activeModuleRecord?.name}</div>
                <div className="infoDesc">{moduleDescription}</div>
                {activeModuleRecord?.isAssigned
                  ? <a href={activeHref} target="_blank" rel="noreferrer" className="infoAction" style={{ background: activeMeta.accent }}>Open module →</a>
                  : <div className="infoActionDisabled">Not assigned yet</div>
                }
              </div>

              <div className="infoCard">
                <div className="infoLabel">Module details</div>
                <div className="infoRow">
                  <span className="infoRowKey">Status</span>
                  <span className="infoRowVal" style={{ color: activeModuleRecord?.isAssigned ? '#16a34a' : '#94a3b8' }}>
                    {activeModuleRecord?.isAssigned ? '● Live' : '○ Inactive'}
                  </span>
                </div>
                <div className="infoRow">
                  <span className="infoRowKey">Category</span>
                  <span className="infoRowVal">{activeMeta.badge}</span>
                </div>
                <div className="infoRow">
                  <span className="infoRowKey">Features</span>
                  <span className="infoRowVal">{featureList.length} capabilities</span>
                </div>
                <div className="infoRow">
                  <span className="infoRowKey">Assignment</span>
                  <span className="infoRowVal">{activeModuleRecord?.isAssigned ? 'Assigned' : 'Unassigned'}</span>
                </div>
                <div className="infoRow">
                  <span className="infoRowKey">Plan</span>
                  <span className="infoRowVal">{user.plan || 'Client'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary strip */}
          <div className="summaryStrip">
            <div className="ssSection">
              <div className="ssLabel">Module summary</div>
              <div className="ssTitle">What this module does</div>
              <div className="ssCopy">{moduleSummary}</div>
            </div>
            <div className="ssSection">
              <div className="ssLabel">Workspace behavior</div>
              <div className="ssTitle">{activeModuleRecord?.isAssigned ? 'Ready to operate' : 'Visible, not active'}</div>
              <div className="ssCopy">
                {activeModuleRecord?.isAssigned
                  ? 'This module is active for your account. All workflows and permissions are in place.'
                  : 'This module stays inactive until assigned. You can review its capabilities here.'}
              </div>
            </div>
            <div className="ssCta">
              {activeModuleRecord?.isAssigned
                ? <a href={activeHref} target="_blank" rel="noreferrer" className="openBtn">
                    Open {activeModuleRecord?.name}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                : <div className="disabledBtn">Inactive</div>
              }
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}