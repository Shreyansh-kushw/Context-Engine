// Lightweight client-side cookie helpers (no external dependency).

export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value,
  )}; expires=${expires}; path=/; SameSite=Lax`
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`))
  if (!match) return null
  return decodeURIComponent(match.split('=').slice(1).join('='))
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

export const JOB_COOKIE = 'context_job_id'
export const OWNER_TOKEN_COOKIE = 'context_owner_token'

export function generateOwnerToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `owner_${crypto.randomUUID().replace(/-/g, '')}`
  }
  return `owner_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
}

export function getOwnerToken(): string | null {
  return getCookie(OWNER_TOKEN_COOKIE)
}

export function getOrCreateOwnerToken(): string {
  const existing = getOwnerToken()
  if (existing) return existing

  const newToken = generateOwnerToken()
  // Store owner token with 365 days expiry so user keeps ownership across sessions
  setCookie(OWNER_TOKEN_COOKIE, newToken, 365)
  return newToken
}

export function truncateJobId(id: string, head = 8, tail = 4): string {
  if (!id) return ''
  if (id.length <= head + tail + 1) return id
  return `${id.slice(0, head)}…${id.slice(-tail)}`
}

