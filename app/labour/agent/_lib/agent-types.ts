export type AgentLocale = 'en' | 'hi'

export type AgentDashboardCategory = {
  categoryId: string
  categoryName: string
  rewardAmount: number
}

export type AgentDashboardMetrics = {
  totalReferred: number
  registered: number
  kycPending: number
  qualified: number
  rejected: number
}

export type AgentDashboardEarnings = {
  lifetimeEarned: number
  pending: number
  available: number
  withdrawn: number
}

export type AgentDashboardHistoryItem = {
  referredWorkerName: string
  maskedMobile: string
  categoryId: string
  categoryName: string
  referralDate: string
  referralStatus: string
  kycStatus: string
  rewardSnapshot: number
  rewardStatus: string
  qualifiedAt: string
  rewardedAt: string
}

export type AgentDashboard = {
  enabled: boolean
  referralCode: string
  referralLink: string
  eligibleCategories: AgentDashboardCategory[]
  metrics: AgentDashboardMetrics
  earnings: AgentDashboardEarnings
  history: AgentDashboardHistoryItem[]
}

export type AgentPageData = {
  session: {
    workerId: string
    mobile: string
  }
  agentName: string
  agentStatus: 'active' | 'disabled'
  workerWalletBalance: number
  dashboard: AgentDashboard
}
