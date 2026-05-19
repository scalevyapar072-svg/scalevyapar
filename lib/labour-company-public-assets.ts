export const DEFAULT_ROZGAR_LOGO_SRC = '/images/rozgar/rozgar-logo-main.png'
export const DEFAULT_CONTACT_SUPPORT_SRC = '/images/rozgar/contact-support.png'

export function normalizeWebsiteAssetPath(src: string | null | undefined, fallback: string) {
  if (typeof src !== 'string' || !src.trim()) {
    return fallback
  }

  const normalized = src
    .trim()
    .replace(/\.pwg$/i, '.png')
    .replace(/^\/?public\//i, '/')

  if (/^https?:\/\//i.test(normalized)) {
    return normalized
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`
}
