export const ROZGAR_CANONICAL_PREFIX = '/labour/company'
export const ROZGAR_SUBDOMAIN_HOSTNAME = 'rozgar.scalevyapar.in'

export function isRozgarSubdomainHost(hostname?: string | null) {
  return hostname?.toLowerCase() === ROZGAR_SUBDOMAIN_HOSTNAME
}

export function toRozgarPublicPath(path: string, hostname?: string | null): string {
  if (!path || !isRozgarSubdomainHost(hostname)) {
    return path
  }

  const canonicalSearchPath = `${ROZGAR_CANONICAL_PREFIX}/search`

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path)
      const mappedPath = toRozgarPublicPath(`${url.pathname}${url.search}${url.hash}`, hostname)
      return `${url.protocol}//${ROZGAR_SUBDOMAIN_HOSTNAME}${mappedPath}`
    } catch {
      return path
    }
  }

  if (
    path === canonicalSearchPath ||
    path.startsWith(`${canonicalSearchPath}?`) ||
    path.startsWith(`${canonicalSearchPath}#`)
  ) {
    return path
  }

  if (path === ROZGAR_CANONICAL_PREFIX) {
    return '/'
  }

  if (path.startsWith(`${ROZGAR_CANONICAL_PREFIX}/`)) {
    const mapped = path.slice(ROZGAR_CANONICAL_PREFIX.length)
    return mapped || '/'
  }

  return path
}

export function normalizeRozgarCurrentPath(pathname: string, hostname?: string | null): string {
  if (!pathname) {
    return pathname
  }

  if (!isRozgarSubdomainHost(hostname)) {
    return pathname
  }

  if (pathname === ROZGAR_CANONICAL_PREFIX) {
    return '/'
  }

  if (pathname.startsWith(`${ROZGAR_CANONICAL_PREFIX}/`)) {
    return pathname.slice(ROZGAR_CANONICAL_PREFIX.length) || '/'
  }

  return pathname
}

export function toRozgarAbsoluteUrl(path: string, hostname?: string | null): string {
  const publicPath = toRozgarPublicPath(path, hostname)
  if (!isRozgarSubdomainHost(hostname) || /^https?:\/\//i.test(publicPath)) {
    return publicPath
  }
  return `https://${ROZGAR_SUBDOMAIN_HOSTNAME}${publicPath}`
}
