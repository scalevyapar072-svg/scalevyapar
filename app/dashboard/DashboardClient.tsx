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
    accent: '#6f5ef9',
    surface: 'linear-gradient(135deg,#8f7dff 0%,#6f5ef9 52%,#5443df 100%)',
    softSurface: 'linear-gradient(135deg,#f7f4ff,#efeaff)',
    border: '#e3d9ff',
    description: 'Create polished product visuals, ad creatives, and motion content for your catalog from one workspace.',
    summary: 'AI-powered creative production for product photos, ads, and short-form selling content.',
    features: ['AI Photo Generator', 'Photo Upscaler 4x', 'Video Ad Generator', 'UGC Ads Creator', 'Background Cleanup', 'Creative Variants'],
    href: '/vizora',
  },
  leads: {
    badge: 'Lead Engine',
    shortIcon: 'LG',
    heroIcon: 'LE',
    accent: '#2f80ed',
    surface: 'linear-gradient(135deg,#58b6ff 0%,#2f80ed 55%,#165dcb 100%)',
    softSurface: 'linear-gradient(135deg,#eff8ff,#e8f3ff)',
    border: '#cfe6ff',
    description: 'Search businesses by location, export lead lists, and build a reliable outbound pipeline.',
    summary: 'Google-sourced B2B lead collection with filtering, list management, and export support.',
    features: ['Google Maps Scraper', 'Filter by Location', 'Filter by Business Type', 'Export to CSV', 'Lead List Cleanup', 'Quick Follow-up Prep'],
    href: '/leads',
  },
  rozgar: {
    badge: 'Labour Hiring',
    shortIcon: 'R',
    heroIcon: 'RZ',
    accent: '#4678f6',
    surface: 'linear-gradient(135deg,#6a98ff 0%,#4678f6 50%,#2f5de3 100%)',
    softSurface: 'linear-gradient(135deg,#eef4ff,#e9f0ff)',
    border: '#d7e4ff',
    description: 'Search available workers, receive applications, and manage labour hiring without leaving your dashboard.',
    summary: 'Dedicated labour marketplace and company hiring panel for fast worker sourcing.',
    features: ['Search Labour', 'Receive Worker Applications', 'Company Hiring Panel', 'Rozgar Dashboard', 'Worker Shortlisting', 'Hiring Activity Review'],
    href: '/labour/company/search',
  },
  crm: {
    badge: 'CRM Workflow',
    shortIcon: 'CRM',
    heroIcon: 'CM',
    accent: '#13a36b',
    surface: 'linear-gradient(135deg,#39cf92 0%,#13a36b 55%,#0b8053 100%)',
    softSurface: 'linear-gradient(135deg,#effcf7,#eafaf2)',
    border: '#cff1e1',
    description: 'Track call outcomes, capture notes, and move every prospect through a clear follow-up pipeline.',
    summary: 'Daily sales follow-up workspace for call tracking, notes, and lead stage management.',
    features: ['Call Tracking', 'Follow-up Reminders', 'Lead Status', 'Notes & History', 'Opportunity Tracking', 'Team Handover Notes'],
    href: '/leads',
  },
  whatsapp: {
    badge: 'Messaging Automation',
    shortIcon: 'WA',
    heroIcon: 'WA',
    accent: '#1e9b66',
    surface: 'linear-gradient(135deg,#48c98a 0%,#1e9b66 55%,#117b50 100%)',
    softSurface: 'linear-gradient(135deg,#f1fcf5,#e9f9ef)',
    border: '#d4f0df',
    description: 'Automate customer replies, nurture leads, and keep conversations moving on WhatsApp.',
    summary: 'WhatsApp-first outreach and auto-response workflows for customer communication.',
    features: ['Auto Replies', 'Bulk Messaging', 'Lead Nurturing', 'Message Templates', 'Customer Follow-up', 'Quick Response Queues'],
    href: '/leads',
  },
  shopify: {
    badge: 'Store Operations',
    shortIcon: 'S',
    heroIcon: 'SP',
    accent: '#8a9952',
    surface: 'linear-gradient(135deg,#b4c86b 0%,#8a9952 55%,#6f7f3d 100%)',
    softSurface: 'linear-gradient(135deg,#fbfdf2,#f6fae8)',
    border: '#e4ebc8',
    description: 'Organize catalog, pricing, and store operations for a cleaner Shopify workflow.',
    summary: 'Storefront operations support for listings, pricing, and order visibility.',
    features: ['Catalog Setup', 'Product Organization', 'Pricing Workflow', 'Store Readiness Checklist', 'Order Snapshot', 'Collection Planning'],
    href: '/leads',
  },
  inventory: {
    badge: 'Inventory Control',
    shortIcon: 'INV',
    heroIcon: 'IN',
    accent: '#d0842d',
    surface: 'linear-gradient(135deg,#efb15e 0%,#d0842d 55%,#a8671d 100%)',
    softSurface: 'linear-gradient(135deg,#fff8ef,#fff3e4)',
    border: '#f2dec5',
    description: 'Monitor stock, materials, and dispatch activity in a more organized operations dashboard.',
    summary: 'Inventory and production visibility for stock movement, materials, and dispatch planning.',
    features: ['Stock Monitoring', 'Material Tracking', 'Dispatch Planning', 'Low Stock Review', 'Batch Visibility', 'Movement Notes'],
    href: '/leads',
  },
  chatbot: {
    badge: 'AI Assistant',
    shortIcon: 'AI',
    heroIcon: 'AI',
    accent: '#d14f8a',
    surface: 'linear-gradient(135deg,#ef8db6 0%,#d14f8a 55%,#ab376d 100%)',
    softSurface: 'linear-gradient(135deg,#fff3f8,#fdebf3)',
    border: '#f5d4e4',
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

export default function DashboardClient({
  user,
  modules,
}: {
  user: DashboardUser
  modules: DashboardModule[]
}) {
  const assignedModules = modules.filter(module => module.isAssigned)
  const inactiveModules = modules.filter(module => !module.isAssigned)

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

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const overviewCards = [
    { label: 'Assigned', value: assignedModules.length, tone: '#ecfdf3', text: '#0f8a4b' },
    { label: 'Inactive', value: inactiveModules.length, tone: '#fff7ed', text: '#c26b13' },
    { label: 'Total', value: modules.length, tone: '#eef4ff', text: '#275fe6' },
    { label: 'Status', value: user.status || 'active', tone: '#f5f3ff', text: '#6b46ff' },
  ]

  const heroStats = [
    {
      label: 'Workspace State',
      value: activeModuleRecord?.isAssigned ? 'Live for your account' : 'Inactive for your account',
    },
    {
      label: 'Primary Use',
      value: activeMeta.badge,
    },
    {
      label: 'Feature Coverage',
      value: `${featureList.length} capabilities`,
    },
  ]

  return (
    <div className="dashboard-shell">
      <style jsx>{`
        .dashboard-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(108, 92, 231, 0.08), transparent 24%),
            radial-gradient(circle at top right, rgba(47, 128, 237, 0.09), transparent 22%),
            linear-gradient(180deg, #f7f9fc 0%, #f2f5fa 52%, #eef2f8 100%);
          color: #0f172a;
          font-family: Inter, "Segoe UI", Tahoma, sans-serif;
        }

        .promo-wrap {
          padding: 18px 24px 0;
        }

        .promo-bar {
          max-width: 1480px;
          margin: 0 auto;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(18px);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05);
          flex-wrap: wrap;
        }

        .promo-pill {
          border-radius: 999px;
          background: linear-gradient(135deg, #ff6b4a, #e43f3f);
          color: white;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.03em;
        }

        .promo-text {
          font-size: 14px;
          color: #334155;
          text-align: center;
        }

        .promo-cta {
          text-decoration: none;
          border-radius: 999px;
          background: #111827;
          color: white;
          padding: 9px 14px;
          font-size: 13px;
          font-weight: 800;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          margin-top: 18px;
          background: rgba(248, 250, 252, 0.78);
          backdrop-filter: blur(18px);
          border-top: 1px solid rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid rgba(226, 232, 240, 0.9);
        }

        .topbar-inner {
          max-width: 1480px;
          margin: 0 auto;
          padding: 18px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .brand-mark {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 900;
          color: white;
          background: linear-gradient(135deg, #7d9fe8 0%, #5e7fd3 100%);
          box-shadow: 0 20px 36px rgba(49, 83, 175, 0.25);
          flex-shrink: 0;
        }

        .brand-title {
          font-size: 30px;
          line-height: 1;
          font-weight: 900;
          color: #162236;
          margin-bottom: 5px;
        }

        .brand-subtitle {
          font-size: 12px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #64748b;
        }

        .account {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }

        .account-block {
          text-align: right;
        }

        .account-name {
          font-size: 16px;
          font-weight: 900;
          color: #162236;
          margin-bottom: 4px;
        }

        .account-email {
          font-size: 13px;
          color: #64748b;
        }

        .logout-btn {
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #dc2626;
          border-radius: 14px;
          padding: 12px 18px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 900;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .logout-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(220, 38, 38, 0.12);
          background: #ffe7eb;
        }

        .page {
          max-width: 1480px;
          margin: 0 auto;
          padding: 24px;
        }

        .layout {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 22px;
          align-items: start;
        }

        .sidebar {
          position: sticky;
          top: 102px;
          border-radius: 28px;
          overflow: hidden;
          background: linear-gradient(180deg, #0f172a 0%, #152238 100%);
          border: 1px solid rgba(30, 41, 59, 0.86);
          box-shadow: 0 28px 55px rgba(15, 23, 42, 0.18);
          color: white;
        }

        .sidebar-inner {
          padding: 20px;
        }

        .sidebar-card {
          border-radius: 24px;
          padding: 20px;
          background:
            radial-gradient(circle at top right, rgba(255,255,255,0.14), transparent 40%),
            linear-gradient(145deg, rgba(122, 154, 232, 0.34), rgba(53, 84, 156, 0.38));
          border: 1px solid rgba(255,255,255,0.12);
          margin-bottom: 16px;
        }

        .eyebrow {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(226, 232, 240, 0.82);
          margin-bottom: 10px;
          font-weight: 800;
        }

        .sidebar-name {
          font-size: 28px;
          line-height: 1.08;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .sidebar-copy {
          font-size: 13px;
          line-height: 1.75;
          color: rgba(226, 232, 240, 0.86);
        }

        .plan-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .plan-chip {
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: white;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }

        .overview-box {
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .overview-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #64748b;
          margin-bottom: 7px;
          font-weight: 800;
        }

        .overview-value {
          font-size: 20px;
          font-weight: 900;
          text-transform: capitalize;
        }

        .module-group-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #8da2c0;
          margin: 0 0 12px;
          font-weight: 800;
        }

        .module-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .module-button {
          width: 100%;
          border-radius: 20px;
          padding: 14px;
          text-align: left;
          cursor: pointer;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: white;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }

        .module-button:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 16px 28px rgba(15, 23, 42, 0.14);
        }

        .module-button.is-selected {
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 18px 28px rgba(15, 23, 42, 0.18);
        }

        .module-button-inner {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .module-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 900;
          flex-shrink: 0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);
        }

        .module-copy {
          min-width: 0;
          flex: 1;
        }

        .module-topline {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 7px;
        }

        .module-name {
          font-size: 15px;
          line-height: 1.35;
          font-weight: 900;
          color: white;
        }

        .module-pill {
          flex-shrink: 0;
          min-width: 82px;
          text-align: center;
          border-radius: 999px;
          padding: 5px 8px;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .module-status {
          font-size: 12px;
          color: rgba(226, 232, 240, 0.72);
          line-height: 1.55;
        }

        .content {
          min-width: 0;
        }

        .hero {
          position: relative;
          overflow: hidden;
          border-radius: 30px;
          padding: 28px;
          margin-bottom: 20px;
          box-shadow: 0 30px 65px rgba(15, 23, 42, 0.18);
          color: white;
        }

        .hero-orb {
          position: absolute;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          pointer-events: none;
        }

        .hero-orb.one {
          width: 240px;
          height: 240px;
          top: -72px;
          right: -34px;
        }

        .hero-orb.two {
          width: 210px;
          height: 210px;
          bottom: -68px;
          right: 130px;
          background: rgba(255,255,255,0.11);
        }

        .hero-orb.three {
          width: 160px;
          height: 160px;
          top: 36px;
          left: 55%;
          background: rgba(255,255,255,0.08);
        }

        .hero-inner {
          position: relative;
          z-index: 1;
        }

        .hero-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .hero-left {
          max-width: 760px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 7px 12px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.18);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .hero-title-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .hero-icon {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.18);
          color: white;
          font-size: 17px;
          font-weight: 900;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.16);
        }

        .hero-title {
          font-size: 40px;
          line-height: 0.98;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .hero-description {
          max-width: 720px;
          font-size: 15px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.88);
        }

        .hero-right {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: flex-end;
        }

        .state-pill {
          min-width: 180px;
          text-align: center;
          border-radius: 999px;
          padding: 11px 16px;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.2);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: white;
        }

        .launch-btn {
          text-decoration: none;
          border-radius: 16px;
          background: white;
          color: #111827;
          padding: 14px 18px;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .launch-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 22px 40px rgba(15, 23, 42, 0.24);
        }

        .waiting-chip {
          border-radius: 16px;
          padding: 14px 18px;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.88);
          font-size: 13px;
          font-weight: 800;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .hero-stat {
          border-radius: 20px;
          padding: 18px;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .hero-stat-label {
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.76);
          margin-bottom: 8px;
          font-weight: 800;
        }

        .hero-stat-value {
          font-size: 17px;
          line-height: 1.45;
          font-weight: 900;
          color: white;
        }

        .workspace {
          border-radius: 28px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 24px 55px rgba(15, 23, 42, 0.06);
          overflow: hidden;
        }

        .workspace-head {
          padding: 24px;
          border-bottom: 1px solid #edf2f7;
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
          gap: 18px;
          align-items: start;
        }

        .section-kicker {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .workspace-title {
          font-size: 28px;
          line-height: 1.05;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .workspace-copy {
          font-size: 14px;
          line-height: 1.8;
          color: #475569;
        }

        .assignment-card {
          border-radius: 22px;
          padding: 18px;
        }

        .assignment-title {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .assignment-state {
          font-size: 22px;
          line-height: 1.1;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .assignment-copy {
          font-size: 13px;
          line-height: 1.72;
          color: #475569;
        }

        .workspace-body {
          padding: 24px;
        }

        .portfolio-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .portfolio-card {
          border-radius: 20px;
          padding: 15px;
          background: #fff;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 118px;
        }

        .portfolio-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .portfolio-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 900;
        }

        .portfolio-label {
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .portfolio-name {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.4;
        }

        .portfolio-status {
          font-size: 12px;
          color: #64748b;
          line-height: 1.6;
        }

        .quick-panel {
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 22px;
        }

        .quick-title {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 9px;
        }

        .quick-headline {
          font-size: 22px;
          line-height: 1.2;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .quick-copy {
          max-width: 820px;
          font-size: 13px;
          line-height: 1.8;
          color: #475569;
          margin-bottom: 16px;
        }

        .quick-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .dark-action,
        .light-action {
          text-decoration: none;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 900;
        }

        .dark-action {
          background: #0f172a;
          color: white;
        }

        .light-action {
          background: white;
        }

        .block-title {
          font-size: 16px;
          line-height: 1.2;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 14px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .feature-card {
          border-radius: 22px;
          padding: 18px;
          min-height: 160px;
          display: flex;
          flex-direction: column;
          border: 1px solid;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.08);
        }

        .feature-index {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: 900;
          margin-bottom: 14px;
        }

        .feature-name {
          font-size: 18px;
          line-height: 1.3;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .feature-copy {
          font-size: 13px;
          line-height: 1.75;
          color: #64748b;
        }

        .insight-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr 0.9fr;
          gap: 14px;
        }

        .insight-card {
          border-radius: 22px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          background: white;
          min-height: 100%;
        }

        .insight-card.soft {
          background: #f8fafc;
        }

        .insight-label {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .insight-headline {
          font-size: 21px;
          line-height: 1.2;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .insight-copy {
          font-size: 13px;
          line-height: 1.8;
          color: #475569;
        }

        .cta-box {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
        }

        .cta-button {
          text-decoration: none;
          text-align: center;
          border-radius: 14px;
          padding: 14px 16px;
          color: white;
          font-size: 13px;
          font-weight: 900;
        }

        .cta-disabled {
          text-align: center;
          border-radius: 14px;
          padding: 14px 16px;
          background: #e2e8f0;
          color: #64748b;
          font-size: 13px;
          font-weight: 900;
        }

        @media (max-width: 1240px) {
          .layout {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: static;
          }

          .workspace-head,
          .insight-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 860px) {
          .topbar-inner {
            align-items: flex-start;
            flex-direction: column;
          }

          .account {
            width: 100%;
            justify-content: space-between;
          }

          .hero {
            padding: 22px;
          }

          .hero-title {
            font-size: 32px;
          }

          .hero-stats {
            grid-template-columns: 1fr;
          }

          .overview-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 640px) {
          .promo-wrap,
          .page {
            padding-left: 14px;
            padding-right: 14px;
          }

          .topbar-inner {
            padding: 16px 14px;
          }

          .brand-title {
            font-size: 24px;
          }

          .account {
            align-items: flex-start;
            flex-direction: column;
          }

          .hero-title-row {
            align-items: flex-start;
          }

          .hero-title {
            font-size: 28px;
          }

          .hero-right {
            width: 100%;
            align-items: stretch;
          }

          .workspace-head,
          .workspace-body,
          .sidebar-inner {
            padding: 18px;
          }

          .feature-grid,
          .portfolio-strip,
          .overview-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="promo-wrap">
        <div className="promo-bar">
          <span className="promo-pill">Limited Time Offer</span>
          <span className="promo-text">Get 30% OFF on all plans. Upgrade your workspace access anytime.</span>
          <a href="/pricing" className="promo-cta">
            Claim Offer
          </a>
        </div>
      </div>

      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark">SV</div>
            <div>
              <div className="brand-title">ScaleVyapar Client Hub</div>
              <div className="brand-subtitle">Module Workspace</div>
            </div>
          </div>

          <div className="account">
            <div className="account-block">
              <div className="account-name">{user.name}</div>
              <div className="account-email">{user.email}</div>
            </div>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="page">
        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-inner">
              <div className="sidebar-card">
                <div className="eyebrow">Client Overview</div>
                <div className="sidebar-name">{user.name}</div>
                <div className="sidebar-copy">
                  Review every assigned module from one premium workspace, jump into tools quickly, and keep visibility on the full client setup.
                </div>
                <div className="plan-chip-row">
                  <span className="plan-chip">{user.plan || 'Client Account'}</span>
                  <span className="plan-chip">{(user.status || 'active').toUpperCase()}</span>
                </div>
              </div>

              <div className="overview-grid">
                {overviewCards.map(card => (
                  <div key={card.label} className="overview-box" style={{ background: card.tone }}>
                    <div className="overview-label">{card.label}</div>
                    <div className="overview-value" style={{ color: card.text }}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="module-group-title">Assigned Modules</div>
              <div className="module-list" style={{ marginBottom: inactiveModules.length > 0 ? 18 : 0 }}>
                {assignedModules.map(module => {
                  const moduleKey = resolveModuleKey(module)
                  const meta = MODULE_META[moduleKey] || MODULE_META.crm
                  const selected = activeModule === moduleKey

                  return (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(moduleKey)}
                      className={`module-button${selected ? ' is-selected' : ''}`}
                      style={{
                        borderColor: selected ? meta.border : 'rgba(148,163,184,0.12)',
                        background: selected ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <div className="module-button-inner">
                        <div className="module-icon" style={{ background: meta.surface }}>
                          {module.icon || meta.shortIcon}
                        </div>
                        <div className="module-copy">
                          <div className="module-topline">
                            <div className="module-name">{module.name}</div>
                            <span className="module-pill" style={{ background: '#eaf8ef', color: '#208853' }}>
                              Active
                            </span>
                          </div>
                          <div className="module-status">{getModuleStatus(module)}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {inactiveModules.length > 0 ? (
                <>
                  <div className="module-group-title">Inactive Modules</div>
                  <div className="module-list">
                    {inactiveModules.map(module => {
                      const moduleKey = resolveModuleKey(module)
                      const meta = MODULE_META[moduleKey] || MODULE_META.crm
                      const selected = activeModule === moduleKey

                      return (
                        <button
                          key={module.id}
                          onClick={() => setActiveModule(moduleKey)}
                          className={`module-button${selected ? ' is-selected' : ''}`}
                          style={{
                            borderColor: selected ? meta.border : 'rgba(148,163,184,0.12)',
                            background: selected ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)',
                          }}
                        >
                          <div className="module-button-inner">
                            <div className="module-icon" style={{ background: 'rgba(148,163,184,0.22)' }}>
                              {module.icon || meta.shortIcon}
                            </div>
                            <div className="module-copy">
                              <div className="module-topline">
                                <div className="module-name">{module.name}</div>
                                <span className="module-pill" style={{ background: '#eef2f7', color: '#64748b' }}>
                                  Inactive
                                </span>
                              </div>
                              <div className="module-status">{getModuleStatus(module)}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </aside>

          <main className="content">
            <section className="hero" style={{ background: activeMeta.surface }}>
              <div className="hero-orb one" />
              <div className="hero-orb two" />
              <div className="hero-orb three" />

              <div className="hero-inner">
                <div className="hero-header">
                  <div className="hero-left">
                    <div className="hero-badge">{activeMeta.badge}</div>

                    <div className="hero-title-row">
                      <div className="hero-icon">{activeMeta.heroIcon}</div>
                      <div className="hero-title">{activeModuleRecord?.name || 'Module Workspace'}</div>
                    </div>

                    <div className="hero-description">{moduleDescription}</div>
                  </div>

                  <div className="hero-right">
                    <div className="state-pill">
                      {activeModuleRecord?.isAssigned ? 'Assigned To Client' : 'Pending Assignment'}
                    </div>

                    {activeModuleRecord?.isAssigned ? (
                      <a href={activeHref} target="_blank" rel="noreferrer" className="launch-btn">
                        Open module in new tab
                      </a>
                    ) : (
                      <div className="waiting-chip">Waiting for assignment</div>
                    )}
                  </div>
                </div>

                <div className="hero-stats">
                  {heroStats.map(card => (
                    <div key={card.label} className="hero-stat">
                      <div className="hero-stat-label">{card.label}</div>
                      <div className="hero-stat-value">{card.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="workspace">
              <div className="workspace-head">
                <div>
                  <div className="section-kicker" style={{ color: activeMeta.accent }}>
                    Module Detail
                  </div>
                  <div className="workspace-title">{activeModuleRecord?.name || 'Module Overview'}</div>
                  <div className="workspace-copy">{moduleDescription}</div>
                </div>

                <div
                  className="assignment-card"
                  style={{
                    background: activeMeta.softSurface,
                    border: `1px solid ${activeMeta.border}`,
                  }}
                >
                  <div className="assignment-title" style={{ color: activeMeta.accent }}>
                    Assignment Status
                  </div>
                  <div className="assignment-state">
                    {activeModuleRecord?.isAssigned ? 'Enabled for you' : 'Inactive for now'}
                  </div>
                  <div className="assignment-copy">
                    {activeModuleRecord?.isAssigned
                      ? 'This module is already assigned to your account. You can open it directly and use the tools listed below.'
                      : 'This module exists in ScaleVyapar, but it is not assigned to your client account yet. You can review what it includes before activation.'}
                  </div>
                </div>
              </div>

              <div className="workspace-body">
                <div className="block-title">Your module portfolio</div>
                <div className="portfolio-strip">
                  {modules.map(module => {
                    const moduleKey = resolveModuleKey(module)
                    const meta = MODULE_META[moduleKey] || MODULE_META.crm

                    return (
                      <div key={module.id} className="portfolio-card">
                        <div className="portfolio-top">
                          <div className="portfolio-icon" style={{ background: meta.surface }}>
                            {module.icon || meta.shortIcon}
                          </div>
                          <div
                            className="portfolio-label"
                            style={{
                              background: module.isAssigned ? '#eaf8ef' : '#eef2f7',
                              color: module.isAssigned ? '#208853' : '#64748b',
                            }}
                          >
                            {module.isAssigned ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        <div className="portfolio-name">{module.name}</div>
                        <div className="portfolio-status">{getModuleStatus(module)}</div>
                      </div>
                    )
                  })}
                </div>

                {activeKey === 'rozgar' ? (
                  <div
                    className="quick-panel"
                    style={{
                      background: activeMeta.softSurface,
                      border: `1px solid ${activeMeta.border}`,
                    }}
                  >
                    <div className="quick-title" style={{ color: activeMeta.accent }}>
                      Rozgar Quick Actions
                    </div>
                    <div className="quick-headline">
                      Hiring tools for labour sourcing and worker applications
                    </div>
                    <div className="quick-copy">
                      Open the labour search interface to browse available workers, or jump directly into the company panel to review incoming applications, shortlist workers, and continue the hiring flow.
                    </div>
                    <div className="quick-actions">
                      <a href="/labour/company/search" target="_blank" rel="noreferrer" className="dark-action">
                        Search Labour
                      </a>
                      <a
                        href="/labour/company/panel"
                        target="_blank"
                        rel="noreferrer"
                        className="light-action"
                        style={{ color: activeMeta.accent, border: `1px solid ${activeMeta.border}` }}
                      >
                        Receive Worker Applications
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="block-title">What you can do in this module</div>
                <div className="feature-grid">
                  {featureList.map((feature, index) => (
                    <div
                      key={feature}
                      className="feature-card"
                      style={{
                        borderColor: activeMeta.border,
                        background: index % 2 === 0 ? 'white' : activeMeta.softSurface,
                      }}
                    >
                      <div className="feature-index" style={{ background: activeMeta.surface }}>
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="feature-name">{feature}</div>
                      <div className="feature-copy">
                        {activeModuleRecord?.isAssigned
                          ? `Use ${feature.toLowerCase()} from your assigned ${activeModuleRecord?.name || 'module'} workspace whenever you need it.`
                          : `This capability is part of ${activeModuleRecord?.name || 'this module'} and becomes available after the module is assigned to your account.`}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="insight-grid">
                  <div className="insight-card">
                    <div className="insight-label" style={{ color: activeMeta.accent }}>
                      Module Summary
                    </div>
                    <div className="insight-headline">Premium visibility across your workspace</div>
                    <div className="insight-copy">
                      {moduleSummary} {activeModuleRecord?.isAssigned
                        ? 'Your account already has access, so you can open the module directly from this dashboard.'
                        : 'It is shown here in inactive mode so you can review it clearly before it is assigned.'}
                    </div>
                  </div>

                  <div
                    className="insight-card soft"
                    style={{
                      background: activeMeta.softSurface,
                      borderColor: activeMeta.border,
                    }}
                  >
                    <div className="insight-label" style={{ color: activeMeta.accent }}>
                      Workspace Behavior
                    </div>
                    <div className="insight-headline">
                      {activeModuleRecord?.isAssigned ? 'Ready to operate' : 'Visible but locked'}
                    </div>
                    <div className="insight-copy">
                      {activeModuleRecord?.isAssigned
                        ? 'This module is active for your client account, and all existing workflows, links, and permissions remain unchanged.'
                        : 'This module remains inactive until assigned, while still allowing you to understand its purpose and capabilities in the workspace.'}
                    </div>
                  </div>

                  <div
                    className="insight-card cta-box"
                    style={{
                      background: 'white',
                      borderColor: activeMeta.border,
                    }}
                  >
                    <div>
                      <div className="insight-label" style={{ color: activeMeta.accent }}>
                        Next Step
                      </div>
                      <div className="insight-headline">
                        {activeModuleRecord?.isAssigned ? 'Open and continue your work' : 'Keep this module on standby'}
                      </div>
                      <div className="insight-copy">
                        {activeModuleRecord?.isAssigned
                          ? 'You already have access. Open the module in a new tab and continue from the current workflow without interruption.'
                          : 'This module is visible for planning and awareness, but it will stay inactive until it is assigned to this client account.'}
                      </div>
                    </div>

                    {activeModuleRecord?.isAssigned ? (
                      <a
                        href={activeHref}
                        target="_blank"
                        rel="noreferrer"
                        className="cta-button"
                        style={{ background: activeMeta.accent }}
                      >
                        Open {activeModuleRecord?.name}
                      </a>
                    ) : (
                      <div className="cta-disabled">Inactive for this client</div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
