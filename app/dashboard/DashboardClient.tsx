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
    accent: '#6d5efc',
    surface: 'linear-gradient(135deg,#8b80ff 0%,#6d5efc 55%,#5544de 100%)',
    softSurface: 'linear-gradient(135deg,#f7f5ff,#f1eeff)',
    border: '#e2dcff',
    description: 'Create polished product visuals, ad creatives, and motion content for your catalog from one workspace.',
    summary: 'AI-powered creative production for product photos, ads, and short-form selling content.',
    features: ['AI Photo Generation', 'Photo Upscaling 4x', 'Video Ads', 'UGC Creator Videos', 'Background Cleanup', 'Creative Variants'],
    href: '/vizora',
  },
  leads: {
    badge: 'Lead Engine',
    shortIcon: 'LG',
    heroIcon: 'LE',
    accent: '#2787f5',
    surface: 'linear-gradient(135deg,#59b6ff 0%,#2787f5 55%,#1b64d8 100%)',
    softSurface: 'linear-gradient(135deg,#eff8ff,#eaf4ff)',
    border: '#cde4fb',
    description: 'Search businesses by location, export lead lists, and build a reliable outbound pipeline.',
    summary: 'Google-sourced B2B lead collection with filtering, list management, and export support.',
    features: ['Google Maps Scraper', 'Location Filters', 'Business Type Filters', 'Export to CSV', 'Lead Cleanup', 'Follow-up Preparation'],
    href: '/leads',
  },
  rozgar: {
    badge: 'Labour Hiring',
    shortIcon: 'R',
    heroIcon: 'RZ',
    accent: '#4177f6',
    surface: 'linear-gradient(135deg,#6d9cff 0%,#4177f6 55%,#2d5fdf 100%)',
    softSurface: 'linear-gradient(135deg,#eef4ff,#e9f0ff)',
    border: '#d6e3ff',
    description: 'Search workers, manage labour applications, and operate the hiring flow from one marketplace.',
    summary: 'Dedicated labour marketplace and company hiring panel for fast worker sourcing.',
    features: ['Search Labour', 'Receive Worker Applications', 'Company Hiring Panel', 'Rozgar Dashboard', 'Worker Shortlisting', 'Hiring Activity Review'],
    href: '/labour/company/search',
  },
  crm: {
    badge: 'CRM Workflow',
    shortIcon: 'CRM',
    heroIcon: 'CM',
    accent: '#0f9f6e',
    surface: 'linear-gradient(135deg,#41cf96 0%,#0f9f6e 55%,#0a7e57 100%)',
    softSurface: 'linear-gradient(135deg,#effcf7,#e9faf1)',
    border: '#d1f1e2',
    description: 'Track call outcomes, capture notes, and move every prospect through a clear follow-up pipeline.',
    summary: 'Daily sales follow-up workspace for call tracking, notes, and lead stage management.',
    features: ['Call Tracking', 'Follow-up Reminders', 'Lead Status', 'Notes and History', 'Opportunity Tracking', 'Team Handover Notes'],
    href: '/leads',
  },
  whatsapp: {
    badge: 'Messaging Automation',
    shortIcon: 'WA',
    heroIcon: 'WA',
    accent: '#1b9a64',
    surface: 'linear-gradient(135deg,#4cc989 0%,#1b9a64 55%,#11784f 100%)',
    softSurface: 'linear-gradient(135deg,#f1fcf5,#e9f9ef)',
    border: '#d4efde',
    description: 'Automate customer replies, nurture leads, and keep conversations moving on WhatsApp.',
    summary: 'WhatsApp-first outreach and auto-response workflows for customer communication.',
    features: ['Auto Replies', 'Bulk Messaging', 'Lead Nurturing', 'Message Templates', 'Customer Follow-up', 'Quick Response Queues'],
    href: '/leads',
  },
  shopify: {
    badge: 'Store Operations',
    shortIcon: 'S',
    heroIcon: 'SP',
    accent: '#8d9750',
    surface: 'linear-gradient(135deg,#b8c86d 0%,#8d9750 55%,#6e783d 100%)',
    softSurface: 'linear-gradient(135deg,#fbfdf2,#f6fae8)',
    border: '#e4eabe',
    description: 'Organize catalog, pricing, and store operations for a cleaner Shopify workflow.',
    summary: 'Storefront operations support for listings, pricing, and order visibility.',
    features: ['Catalog Setup', 'Product Organization', 'Pricing Workflow', 'Store Readiness', 'Order Snapshot', 'Collection Planning'],
    href: '/leads',
  },
  inventory: {
    badge: 'Inventory Control',
    shortIcon: 'INV',
    heroIcon: 'IN',
    accent: '#d1862e',
    surface: 'linear-gradient(135deg,#efb261 0%,#d1862e 55%,#a9671d 100%)',
    softSurface: 'linear-gradient(135deg,#fff8ef,#fff3e6)',
    border: '#f1dec4',
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
    surface: 'linear-gradient(135deg,#ed93bb 0%,#d14f8a 55%,#a8376c 100%)',
    softSurface: 'linear-gradient(135deg,#fff4f8,#fdebf3)',
    border: '#f4d4e4',
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
    { label: 'Assigned', value: assignedModules.length, bg: '#ecfdf3', color: '#0f8a4b' },
    { label: 'Inactive', value: inactiveModules.length, bg: '#fff7ed', color: '#c26b13' },
    { label: 'Total', value: modules.length, bg: '#eff6ff', color: '#2563eb' },
    { label: 'Status', value: user.status || 'active', bg: '#f5f3ff', color: '#6d28d9' },
  ]

  return (
    <div className="dashboardShell">
      <style jsx>{`
        .dashboardShell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(99, 102, 241, 0.06), transparent 24%),
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 22%),
            linear-gradient(180deg, #f8fafc 0%, #f3f6fb 50%, #eef2f7 100%);
          color: #0f172a;
          font-family: Inter, "Segoe UI", Tahoma, sans-serif;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(18px);
          background: rgba(248, 250, 252, 0.88);
          border-bottom: 1px solid rgba(226, 232, 240, 0.92);
        }

        .topbarInner {
          max-width: 1480px;
          margin: 0 auto;
          padding: 20px 28px;
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

        .brandMark {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7fa3ef 0%, #5d7ed3 100%);
          color: white;
          font-size: 18px;
          font-weight: 800;
          box-shadow: 0 16px 30px rgba(62, 94, 192, 0.2);
          flex-shrink: 0;
        }

        .brandTitle {
          font-size: 28px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #142136;
          margin-bottom: 5px;
        }

        .brandSubtitle {
          font-size: 11px;
          color: #64748b;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 500;
        }

        .account {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .accountText {
          text-align: right;
        }

        .accountName {
          font-size: 14px;
          font-weight: 700;
          color: #142136;
          margin-bottom: 4px;
        }

        .accountEmail {
          font-size: 12px;
          color: #64748b;
        }

        .logoutButton {
          border: 1px solid #fecaca;
          background: #fff5f5;
          color: #dc2626;
          border-radius: 12px;
          padding: 11px 16px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .logoutButton:hover {
          background: #ffe9e9;
          transform: translateY(-1px);
        }

        .pageWrap {
          max-width: 1480px;
          margin: 0 auto;
          padding: 22px 28px 34px;
        }

        .layoutGrid {
          display: grid;
          grid-template-columns: 300px minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }

        .sidebar {
          position: sticky;
          top: 98px;
          border-radius: 26px;
          background: rgba(255, 255, 255, 0.86);
          border: 1px solid rgba(226, 232, 240, 0.95);
          box-shadow: 0 22px 48px rgba(15, 23, 42, 0.07);
          overflow: hidden;
        }

        .sidebarInner {
          padding: 18px;
        }

        .overviewPanel {
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 18px;
          background:
            radial-gradient(circle at top right, rgba(255,255,255,0.22), transparent 35%),
            linear-gradient(145deg, #15233b 0%, #233556 55%, #30456f 100%);
          color: white;
        }

        .eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(226, 232, 240, 0.86);
          margin-bottom: 10px;
        }

        .overviewName {
          font-size: 22px;
          line-height: 1.08;
          font-weight: 800;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }

        .overviewCopy {
          font-size: 12px;
          line-height: 1.75;
          color: rgba(226, 232, 240, 0.9);
          margin-bottom: 14px;
        }

        .miniPills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .miniPill {
          border-radius: 999px;
          padding: 7px 11px;
          font-size: 10px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }

        .statCard {
          border-radius: 16px;
          padding: 14px;
        }

        .statLabel {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 8px;
        }

        .statValue {
          font-size: 18px;
          font-weight: 700;
          line-height: 1.2;
          text-transform: capitalize;
        }

        .groupTitle {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 12px;
        }

        .moduleList {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .moduleItem {
          width: 100%;
          border-radius: 18px;
          padding: 13px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .moduleItem:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 24px rgba(15, 23, 42, 0.05);
        }

        .moduleItem.selected {
          box-shadow: 0 16px 28px rgba(15, 23, 42, 0.07);
        }

        .moduleRow {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .moduleIcon {
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .moduleBody {
          flex: 1;
          min-width: 0;
        }

        .moduleHead {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 6px;
        }

        .moduleName {
          font-size: 14px;
          font-weight: 700;
          line-height: 1.35;
          color: #0f172a;
        }

        .moduleBadge {
          border-radius: 999px;
          min-width: 80px;
          padding: 5px 8px;
          text-align: center;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .moduleStatus {
          font-size: 11px;
          line-height: 1.55;
          color: #64748b;
        }

        .content {
          min-width: 0;
        }

        .heroCard {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          background: white;
          border: 1px solid rgba(226, 232, 240, 0.92);
          box-shadow: 0 24px 50px rgba(15, 23, 42, 0.06);
          margin-bottom: 18px;
        }

        .heroAccent {
          height: 5px;
          background: ${activeMeta.surface};
        }

        .heroInner {
          padding: 24px;
          background:
            radial-gradient(circle at top right, rgba(99,102,241,0.08), transparent 18%),
            linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95));
        }

        .heroTop {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          align-items: start;
          margin-bottom: 18px;
        }

        .heroBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          padding: 7px 11px;
          background: ${activeMeta.softSurface};
          border: 1px solid ${activeMeta.border};
          color: ${activeMeta.accent};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .heroTitleRow {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .heroIcon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${activeMeta.surface};
          color: white;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 16px 28px rgba(15, 23, 42, 0.1);
        }

        .heroTitle {
          font-size: 36px;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.04em;
          color: #0f172a;
        }

        .heroDescription {
          font-size: 14px;
          line-height: 1.75;
          color: #475569;
          max-width: 760px;
          font-weight: 400;
        }

        .heroActions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: flex-end;
        }

        .heroState {
          min-width: 180px;
          text-align: center;
          border-radius: 999px;
          padding: 10px 14px;
          background: ${activeMeta.softSurface};
          border: 1px solid ${activeMeta.border};
          color: ${activeModuleRecord?.isAssigned ? '#15803d' : '#64748b'};
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .heroLaunch {
          text-decoration: none;
          border-radius: 14px;
          background: #0f172a;
          color: white;
          padding: 13px 17px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 14px 26px rgba(15, 23, 42, 0.14);
          transition: all 0.2s ease;
        }

        .heroLaunch:hover {
          transform: translateY(-1px);
        }

        .heroDisabled {
          border-radius: 14px;
          background: #e2e8f0;
          color: #64748b;
          padding: 13px 17px;
          font-size: 12px;
          font-weight: 600;
        }

        .metricsGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .metricCard {
          border-radius: 18px;
          padding: 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
        }

        .metricLabel {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 8px;
        }

        .metricValue {
          font-size: 16px;
          font-weight: 700;
          line-height: 1.35;
          color: #0f172a;
        }

        .workspaceCard {
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(226, 232, 240, 0.94);
          box-shadow: 0 22px 48px rgba(15, 23, 42, 0.05);
          overflow: hidden;
        }

        .workspaceHeader {
          padding: 24px 24px 20px;
          border-bottom: 1px solid #edf2f7;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 18px;
          align-items: start;
        }

        .sectionKicker {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${activeMeta.accent};
          margin-bottom: 10px;
        }

        .sectionTitle {
          font-size: 28px;
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .sectionCopy {
          font-size: 13px;
          line-height: 1.75;
          color: #475569;
          font-weight: 400;
        }

        .statusCard {
          border-radius: 20px;
          background: ${activeMeta.softSurface};
          border: 1px solid ${activeMeta.border};
          padding: 16px;
        }

        .statusLabel {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: ${activeMeta.accent};
          margin-bottom: 8px;
        }

        .statusTitle {
          font-size: 19px;
          font-weight: 700;
          line-height: 1.15;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .statusCopy {
          font-size: 12px;
          line-height: 1.7;
          color: #475569;
          font-weight: 400;
        }

        .workspaceBody {
          padding: 22px 24px 28px;
        }

        .quickPanel {
          border-radius: 22px;
          background: ${activeMeta.softSurface};
          border: 1px solid ${activeMeta.border};
          padding: 18px;
          margin-bottom: 22px;
        }

        .quickLabel {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${activeMeta.accent};
          margin-bottom: 10px;
        }

        .quickTitle {
          font-size: 18px;
          font-weight: 700;
          line-height: 1.3;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .quickCopy {
          font-size: 12px;
          line-height: 1.75;
          color: #475569;
          max-width: 820px;
          margin-bottom: 16px;
        }

        .quickActions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .primaryAction,
        .secondaryAction {
          text-decoration: none;
          border-radius: 13px;
          padding: 11px 15px;
          font-size: 12px;
          font-weight: 700;
        }

        .primaryAction {
          background: #0f172a;
          color: white;
        }

        .secondaryAction {
          background: white;
          color: ${activeMeta.accent};
          border: 1px solid ${activeMeta.border};
        }

        .blockTitle {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 14px;
        }

        .featureGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .featureCard {
          border-radius: 22px;
          padding: 16px;
          min-height: 158px;
          border: 1px solid ${activeMeta.border};
          transition: all 0.2s ease;
        }

        .featureCard:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 28px rgba(15, 23, 42, 0.05);
        }

        .featureIndex {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${activeMeta.surface};
          color: white;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .featureName {
          font-size: 15px;
          font-weight: 700;
          line-height: 1.35;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .featureCopy {
          font-size: 12px;
          line-height: 1.75;
          color: #64748b;
          font-weight: 400;
        }

        .summaryGrid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 0.9fr;
          gap: 14px;
        }

        .summaryCard {
          border-radius: 22px;
          border: 1px solid #e2e8f0;
          background: white;
          padding: 18px;
          min-height: 100%;
        }

        .summaryCard.soft {
          background: ${activeMeta.softSurface};
          border-color: ${activeMeta.border};
        }

        .summaryLabel {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${activeMeta.accent};
          margin-bottom: 10px;
        }

        .summaryTitle {
          font-size: 18px;
          font-weight: 700;
          line-height: 1.25;
          color: #0f172a;
          margin-bottom: 10px;
        }

        .summaryCopy {
          font-size: 12px;
          line-height: 1.8;
          color: #475569;
          font-weight: 400;
        }

        .ctaCard {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
        }

        .ctaButton {
          text-decoration: none;
          text-align: center;
          border-radius: 14px;
          background: ${activeMeta.accent};
          color: white;
          padding: 13px 15px;
          font-size: 12px;
          font-weight: 700;
        }

        .ctaDisabled {
          text-align: center;
          border-radius: 14px;
          background: #e2e8f0;
          color: #64748b;
          padding: 13px 15px;
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 1260px) {
          .layoutGrid {
            grid-template-columns: 1fr;
          }

          .sidebar {
            position: static;
          }

          .workspaceHeader,
          .summaryGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .topbarInner {
            flex-direction: column;
            align-items: flex-start;
          }

          .account {
            width: 100%;
            justify-content: space-between;
          }

          .heroTop {
            grid-template-columns: 1fr;
          }

          .heroActions {
            align-items: stretch;
          }

          .metricsGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .pageWrap,
          .topbarInner {
            padding-left: 14px;
            padding-right: 14px;
          }

          .brandTitle {
            font-size: 23px;
          }

          .account {
            flex-direction: column;
            align-items: flex-start;
          }

          .statsGrid,
          .featureGrid,
          .summaryGrid {
            grid-template-columns: 1fr;
          }

          .heroTitle {
            font-size: 30px;
          }

          .workspaceHeader,
          .workspaceBody,
          .sidebarInner,
          .heroInner {
            padding-left: 18px;
            padding-right: 18px;
          }
        }
      `}</style>

      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <div className="brandMark">SV</div>
            <div>
              <div className="brandTitle">ScaleVyapar Client Hub</div>
              <div className="brandSubtitle">Module Workspace</div>
            </div>
          </div>

          <div className="account">
            <div className="accountText">
              <div className="accountName">{user.name}</div>
              <div className="accountEmail">{user.email}</div>
            </div>

            <button onClick={logout} className="logoutButton">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="pageWrap">
        <div className="layoutGrid">
          <aside className="sidebar">
            <div className="sidebarInner">
              <div className="overviewPanel">
                <div className="eyebrow">Client Overview</div>
                <div className="overviewName">{user.name}</div>
                <div className="overviewCopy">
                  Review every assigned module from one premium workspace, jump into tools quickly, and keep visibility on the full client setup.
                </div>
                <div className="miniPills">
                  <span className="miniPill">{user.plan || 'Client Account'}</span>
                  <span className="miniPill">{(user.status || 'active').toUpperCase()}</span>
                </div>
              </div>

              <div className="statsGrid">
                {overviewCards.map(card => (
                  <div key={card.label} className="statCard" style={{ background: card.bg }}>
                    <div className="statLabel">{card.label}</div>
                    <div className="statValue" style={{ color: card.color }}>
                      {card.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="groupTitle">Assigned Modules</div>
              <div className="moduleList" style={{ marginBottom: inactiveModules.length > 0 ? 18 : 0 }}>
                {assignedModules.map(module => {
                  const moduleKey = resolveModuleKey(module)
                  const meta = MODULE_META[moduleKey] || MODULE_META.crm
                  const selected = activeModule === moduleKey

                  return (
                    <button
                      key={module.id}
                      onClick={() => setActiveModule(moduleKey)}
                      className={`moduleItem${selected ? ' selected' : ''}`}
                      style={{
                        borderColor: selected ? meta.border : '#e2e8f0',
                        background: selected ? meta.softSurface : '#ffffff',
                      }}
                    >
                      <div className="moduleRow">
                        <div className="moduleIcon" style={{ background: meta.surface }}>
                          {module.icon || meta.shortIcon}
                        </div>

                        <div className="moduleBody">
                          <div className="moduleHead">
                            <div className="moduleName">{module.name}</div>
                            <span className="moduleBadge" style={{ background: '#eaf8ef', color: '#208853' }}>
                              Active
                            </span>
                          </div>
                          <div className="moduleStatus">{getModuleStatus(module)}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {inactiveModules.length > 0 ? (
                <>
                  <div className="groupTitle">Inactive Modules</div>
                  <div className="moduleList">
                    {inactiveModules.map(module => {
                      const moduleKey = resolveModuleKey(module)
                      const meta = MODULE_META[moduleKey] || MODULE_META.crm
                      const selected = activeModule === moduleKey

                      return (
                        <button
                          key={module.id}
                          onClick={() => setActiveModule(moduleKey)}
                          className={`moduleItem${selected ? ' selected' : ''}`}
                          style={{
                            borderColor: selected ? meta.border : '#e2e8f0',
                            background: selected ? meta.softSurface : '#ffffff',
                          }}
                        >
                          <div className="moduleRow">
                            <div className="moduleIcon" style={{ background: '#cbd5e1', color: '#334155' }}>
                              {module.icon || meta.shortIcon}
                            </div>

                            <div className="moduleBody">
                              <div className="moduleHead">
                                <div className="moduleName">{module.name}</div>
                                <span className="moduleBadge" style={{ background: '#eef2f7', color: '#64748b' }}>
                                  Inactive
                                </span>
                              </div>
                              <div className="moduleStatus">{getModuleStatus(module)}</div>
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
            <section className="heroCard">
              <div className="heroAccent" />
              <div className="heroInner">
                <div className="heroTop">
                  <div>
                    <div className="heroBadge">{activeMeta.badge}</div>

                    <div className="heroTitleRow">
                      <div className="heroIcon">{activeMeta.heroIcon}</div>
                      <div className="heroTitle">{activeModuleRecord?.name || 'Module Workspace'}</div>
                    </div>

                    <div className="heroDescription">{moduleDescription}</div>
                  </div>

                  <div className="heroActions">
                    <div className="heroState">
                      {activeModuleRecord?.isAssigned ? 'Assigned to Client' : 'Not Assigned Yet'}
                    </div>

                    {activeModuleRecord?.isAssigned ? (
                      <a href={activeHref} target="_blank" rel="noreferrer" className="heroLaunch">
                        Open module in new tab
                      </a>
                    ) : (
                      <div className="heroDisabled">Waiting for assignment</div>
                    )}
                  </div>
                </div>

                <div className="metricsGrid">
                  <div className="metricCard">
                    <div className="metricLabel">Workspace State</div>
                    <div className="metricValue">
                      {activeModuleRecord?.isAssigned ? 'Live for your account' : 'Inactive for your account'}
                    </div>
                  </div>

                  <div className="metricCard">
                    <div className="metricLabel">Primary Use</div>
                    <div className="metricValue">{activeMeta.badge}</div>
                  </div>

                  <div className="metricCard">
                    <div className="metricLabel">Feature Coverage</div>
                    <div className="metricValue">{featureList.length} capabilities</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="workspaceCard">
              <div className="workspaceHeader">
                <div>
                  <div className="sectionKicker">Module Detail</div>
                  <div className="sectionTitle">{activeModuleRecord?.name || 'Module Overview'}</div>
                  <div className="sectionCopy">{moduleDescription}</div>
                </div>

                <div className="statusCard">
                  <div className="statusLabel">Assignment Status</div>
                  <div className="statusTitle">
                    {activeModuleRecord?.isAssigned ? 'Enabled for you' : 'Inactive for now'}
                  </div>
                  <div className="statusCopy">
                    {activeModuleRecord?.isAssigned
                      ? 'This module is already assigned to your account. You can open it directly and continue your workflow without changes.'
                      : 'This module exists in ScaleVyapar, but it is not assigned to your client account yet. You can still review what it includes.'}
                  </div>
                </div>
              </div>

              <div className="workspaceBody">
                {activeKey === 'rozgar' ? (
                  <div className="quickPanel">
                    <div className="quickLabel">Rozgar Quick Actions</div>
                    <div className="quickTitle">Hiring tools for labour sourcing and worker applications</div>
                    <div className="quickCopy">
                      Open the labour search interface to browse available workers, or jump directly into the company panel to review incoming applications, shortlist workers, and continue the hiring flow.
                    </div>

                    <div className="quickActions">
                      <a href="/labour/company/search" target="_blank" rel="noreferrer" className="primaryAction">
                        Search Labour
                      </a>
                      <a href="/labour/company/panel" target="_blank" rel="noreferrer" className="secondaryAction">
                        Receive Worker Applications
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="blockTitle">What you can do in this module</div>
                <div className="featureGrid">
                  {featureList.map((feature, index) => (
                    <div
                      key={feature}
                      className="featureCard"
                      style={{ background: index % 2 === 0 ? '#ffffff' : activeMeta.softSurface }}
                    >
                      <div className="featureIndex">{String(index + 1).padStart(2, '0')}</div>
                      <div className="featureName">{feature}</div>
                      <div className="featureCopy">
                        {activeModuleRecord?.isAssigned
                          ? `Use ${feature.toLowerCase()} from your assigned ${activeModuleRecord?.name || 'module'} workspace whenever you need it.`
                          : `This capability is part of ${activeModuleRecord?.name || 'this module'} and becomes available once the module is assigned to your account.`}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summaryGrid">
                  <div className="summaryCard">
                    <div className="summaryLabel">Module Summary</div>
                    <div className="summaryTitle">Premium visibility across your workspace</div>
                    <div className="summaryCopy">
                      {moduleSummary} {activeModuleRecord?.isAssigned
                        ? 'Your account already has access, so you can open the module directly from this dashboard.'
                        : 'It is shown here in inactive mode so you can review it clearly before it is assigned.'}
                    </div>
                  </div>

                  <div className="summaryCard soft">
                    <div className="summaryLabel">Workspace Behavior</div>
                    <div className="summaryTitle">
                      {activeModuleRecord?.isAssigned ? 'Ready to operate' : 'Visible but locked'}
                    </div>
                    <div className="summaryCopy">
                      {activeModuleRecord?.isAssigned
                        ? 'This module is active for your client account, and all existing workflows, links, and permissions remain unchanged.'
                        : 'This module remains inactive until assigned, while still allowing you to understand its purpose and capabilities in the workspace.'}
                    </div>
                  </div>

                  <div className="summaryCard ctaCard">
                    <div>
                      <div className="summaryLabel">Next Step</div>
                      <div className="summaryTitle">
                        {activeModuleRecord?.isAssigned ? 'Open and continue your work' : 'Keep this module on standby'}
                      </div>
                      <div className="summaryCopy">
                        {activeModuleRecord?.isAssigned
                          ? 'You already have access. Open the module in a new tab and continue from the current workflow without interruption.'
                          : 'This module stays inactive until it is assigned to this client account.'}
                      </div>
                    </div>

                    {activeModuleRecord?.isAssigned ? (
                      <a href={activeHref} target="_blank" rel="noreferrer" className="ctaButton">
                        Open {activeModuleRecord?.name}
                      </a>
                    ) : (
                      <div className="ctaDisabled">Inactive for this client</div>
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
