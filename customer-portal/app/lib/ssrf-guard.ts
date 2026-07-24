import { promises as dns } from 'dns'
import { isIP } from 'net'

/**
 * Best-effort SSRF guard for outbound fetches of user-supplied URLs.
 * Blocks loopback, link-local (incl. cloud metadata 169.254.169.254),
 * and RFC1918/ULA private ranges — both when given directly as the
 * hostname and after DNS resolution (defends against DNS rebinding).
 * Not a substitute for network-level egress controls, but stops the
 * obvious cases at the application boundary.
 */

function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true
  const [a, b] = parts
  if (a === 127) return true // loopback
  if (a === 10) return true // RFC1918
  if (a === 172 && b >= 16 && b <= 31) return true // RFC1918
  if (a === 192 && b === 168) return true // RFC1918
  if (a === 169 && b === 254) return true // link-local incl. cloud metadata
  if (a === 0) return true // "this network"
  return false
}

function isBlockedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::1') return true // loopback
  if (lower.startsWith('::ffff:')) {
    return isBlockedIPv4(lower.slice('::ffff:'.length))
  }
  if (lower.startsWith('fe80:')) return true // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // ULA fc00::/7
  return false
}

function isBlockedIP(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4) return isBlockedIPv4(ip)
  if (version === 6) return isBlockedIPv6(ip)
  return true // not a recognizable IP — treat as unsafe
}

export async function assertPublicHttpUrl(url: URL): Promise<void> {
  const hostname = url.hostname

  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    throw new Error('URL host is not allowed')
  }

  if (isIP(hostname)) {
    if (isBlockedIP(hostname)) {
      throw new Error('URL host is not allowed')
    }
    return
  }

  let addresses: string[]
  try {
    const resolved = await dns.lookup(hostname, { all: true })
    addresses = resolved.map((r) => r.address)
  } catch {
    throw new Error('URL host could not be resolved')
  }

  if (addresses.length === 0 || addresses.some(isBlockedIP)) {
    throw new Error('URL host is not allowed')
  }
}
