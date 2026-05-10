import { db } from './db'

/**
 * Update bot status in database
 */
export async function updateBotStatus(status: string) {
  try {
    let bot = await db.whatsAppBot.findFirst()
    if (!bot) {
      bot = await db.whatsAppBot.create({
        data: {
          name: 'TARKAM Bot',
          status,
          autoReply: true,
        },
      })
    } else {
      await db.whatsAppBot.update({
        where: { id: bot.id },
        data: {
          status,
          ...(status === 'online' ? { lastConnectedAt: new Date() } : {}),
        },
      })
    }
  } catch (err) {
    console.error('Failed to update bot status:', err)
  }
}

/**
 * Increment message counters
 */
export async function incrementCounter(field: 'messagesSent' | 'messagesReceived') {
  try {
    const bot = await db.whatsAppBot.findFirst()
    if (bot) {
      await db.whatsAppBot.update({
        where: { id: bot.id },
        data: { [field]: { increment: 1 } },
      })
    }
  } catch (err) {
    console.error('Failed to increment counter:', err)
  }
}

/**
 * Log message to database
 */
export async function logMessage(
  type: string,
  sender: string | null,
  message: string | null,
  command: string | null,
  response: string | null,
  groupId?: string | null,
  isError: boolean = false,
  metadata?: Record<string, unknown>
) {
  try {
    await db.whatsAppLog.create({
      data: {
        type,
        sender,
        message: message ? message.substring(0, 1000) : null,
        command,
        response: response ? response.substring(0, 1000) : null,
        groupId: groupId || null,
        isError,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (err) {
    console.error('Failed to log message:', err)
  }
}

/**
 * Extract phone number from JID
 * e.g., "628123456789@s.whatsapp.net" → "628123456789"
 * e.g., "628123456789-1234567890@g.us" → group JID (returned as-is)
 */
export function extractPhone(jid: string): string {
  return jid.split('@')[0]
}

/**
 * Check if JID is a group
 */
export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us')
}

/**
 * Check if JID is a private chat
 */
export function isPrivateJid(jid: string): boolean {
  return jid.endsWith('@.whatsapp.net') || jid.endsWith('@s.whatsapp.net')
}

/**
 * Format division for display
 */
export function formatDivision(div: string): string {
  const map: Record<string, string> = {
    M: 'Male',
    F: 'Female',
    male: 'Male',
    female: 'Female',
  }
  return map[div] || div
}

/**
 * Format tier with emoji
 */
export function formatTier(tier: string): string {
  const map: Record<string, string> = {
    S: '🥇 S',
    A: '🥈 A',
    B: '🥉 B',
  }
  return map[tier.toUpperCase()] || tier
}
