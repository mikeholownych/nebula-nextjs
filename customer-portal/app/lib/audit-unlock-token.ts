import { createHmac, timingSafeEqual } from 'crypto'

/**
 * HMAC-signed token binding an unlocked audit to the email that unlocked it.
 * Prevents a visitor from unlocking gated results just by setting an
 * `audit_unlock_{id}` cookie themselves — the cookie value must carry a
 * valid signature over `${auditId}:${email}` that only the server can produce.
 */

function getSecret(): string {
  const secret = process.env.AUDIT_UNLOCK_SECRET
  if (!secret) {
    throw new Error('AUDIT_UNLOCK_SECRET is not configured')
  }
  return secret
}

export function signAuditUnlock(auditId: string, email: string): string {
  const payload = `${auditId}:${email.trim().toLowerCase()}`
  const payloadB64 = Buffer.from(payload).toString('base64url')
  const sig = createHmac('sha256', getSecret()).update(payload).digest('base64url')
  return `${payloadB64}.${sig}`
}

export function readAuditUnlock(
  auditId: string,
  token: string | undefined,
): { email: string } | null {
  if (!token) return null
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null

  let secret: string
  try {
    secret = getSecret()
  } catch {
    return null
  }

  const payload = Buffer.from(payloadB64, 'base64url').toString('utf8')
  const expectedSig = createHmac('sha256', secret).update(payload).digest('base64url')

  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null
  }

  const separator = payload.indexOf(':')
  if (separator === -1) return null
  const tokenAuditId = payload.slice(0, separator)
  const email = payload.slice(separator + 1)
  if (
    tokenAuditId !== auditId ||
    email.length < 3 ||
    email.length > 254 ||
    !email.includes('@')
  ) {
    return null
  }
  return { email }
}

export function verifyAuditUnlock(auditId: string, token: string | undefined): boolean {
  return readAuditUnlock(auditId, token) !== null
}
