export interface LoginPageFeatureItem {
  icon: string
  text: string
}

export interface LoginPageSettings {
  headline: string
  subtitle: string
  features: LoginPageFeatureItem[]
}

export interface LoginPageSettingsPayload {
  settings: LoginPageSettings
  storage: 'supabase' | 'json'
}

export const defaultLoginPageSettings: LoginPageSettings = {
  headline: 'Scale Your Business with Automation',
  subtitle: 'The all-in-one platform for lead generation, CRM, WhatsApp automation, and inventory management.',
  features: [
    { icon: '🎯', text: 'Google B2B Lead Extraction' },
    { icon: '💬', text: 'WhatsApp Automation' },
    { icon: '👥', text: 'CRM & Call Management' },
    { icon: '📦', text: 'Inventory Management' },
    { icon: '📸', text: 'AI Photo & Video Generation' }
  ]
}
