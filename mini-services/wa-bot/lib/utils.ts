/**
 * IDM WA Bot — Utility Functions
 */

/**
 * Generate a 4-digit verification code (unique enough for registration)
 */
export function generateVerificationCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

/**
 * Format a WA number to standard format (remove @s.whatsapp.net suffix)
 */
export function cleanWaNumber(jid: string): string {
  return jid.replace('@s.whatsapp.net', '').replace('@c.us', '')
}

/**
 * Check if a WA number is a group JID
 */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us')
}

/**
 * Check if a WA number is a status broadcast
 */
export function isStatusBroadcast(jid: string): boolean {
  return jid === 'status@broadcast'
}

/**
 * Normalize tier input (accept both uppercase and lowercase)
 */
export function normalizeTier(tier: string): string | null {
  const t = tier.toUpperCase().trim()
  if (['S', 'A', 'B'].includes(t)) return t
  return null
}

/**
 * Normalize division input
 * Accept: M, F, male, female, laki, perempuan
 */
export function normalizeDivision(input: string): string | null {
  const d = input.trim().toUpperCase()
  if (d === 'M' || d === 'MALE' || d === 'LAKI') return 'male'
  if (d === 'F' || d === 'FEMALE' || d === 'PEREMPUAN') return 'female'
  return null
}

/**
 * Format division for display
 */
export function displayDivision(division: string): { symbol: string; label: string } {
  if (division === 'male') return { symbol: '♂', label: 'M' }
  return { symbol: '♀', label: 'F' }
}

/**
 * Tier display emoji
 */
export function tierEmoji(tier: string): string {
  switch (tier.toUpperCase()) {
    case 'S': return '💎'
    case 'A': return '🥈'
    case 'B': return '🥉'
    default: return '🏅'
  }
}

/**
 * Tier display label
 */
export function tierLabel(tier: string): string {
  switch (tier.toUpperCase()) {
    case 'S': return 'Pro'
    case 'A': return 'Menengah'
    case 'B': return 'Pemula'
    default: return tier.toUpperCase()
  }
}

/**
 * Rate limiter — simple in-memory per-WA-number
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10 // max messages per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

export function checkRateLimit(waNumber: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(waNumber)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(waNumber, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false // rate limited
  }

  entry.count++
  return true
}

/**
 * Clean up expired rate limit entries (run periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000)

/**
 * Generate a unique gamertag from a name
 * If the name is already taken, append a number
 */
export async function generateUniqueGamertag(name: string, db: any): Promise<string> {
  const base = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  if (!base) return `player_${Date.now()}`

  let gamertag = base
  let suffix = 1

  while (await db.player.findUnique({ where: { gamertag } })) {
    gamertag = `${base}${suffix}`
    suffix++
  }

  return gamertag
}
