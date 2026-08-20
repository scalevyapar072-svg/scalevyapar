export const LABOUR_AGENT_CANONICAL_PREFIX = '/labour/agent'
export const LABOUR_AGENT_SUBDOMAIN_HOSTNAME = 'agent.rozgar.scalevyapar.in'

export function isLabourAgentSubdomainHost(hostname?: string | null) {
  return hostname?.toLowerCase() === LABOUR_AGENT_SUBDOMAIN_HOSTNAME
}

export function toLabourAgentPublicPath(path: string, hostname?: string | null): string {
  if (!path || !isLabourAgentSubdomainHost(hostname)) {
    return path
  }

  if (path === LABOUR_AGENT_CANONICAL_PREFIX) {
    return '/'
  }

  if (path.startsWith(`${LABOUR_AGENT_CANONICAL_PREFIX}/`)) {
    const mapped = path.slice(LABOUR_AGENT_CANONICAL_PREFIX.length)
    return mapped || '/'
  }

  return path
}
