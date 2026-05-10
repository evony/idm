/**
 * IDM WA Bot - Utility Functions
 */

import type { CommandContext, BotConfig } from './types';

/**
 * Parse a WhatsApp message into command context
 */
export function parseCommand(
  text: string,
  from: string,
  sender: string,
  senderName: string,
  isGroup: boolean,
  groupId?: string
): CommandContext | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Command prefix: "p " or "p*" or "P " (case-insensitive)
  const prefixMatch = trimmed.match(/^[pP][\s*]+(.*)$/);
  if (!prefixMatch) return null;

  const rest = prefixMatch[1].trim();
  if (!rest) return null;

  const parts = rest.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  return {
    from,
    sender,
    senderName: senderName || sender.split('@')[0],
    isGroup,
    groupId,
    isFromMe: false,
    args,
    rawText: trimmed,
    command,
  };
}

/**
 * Format phone number to JID
 */
export function toJid(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.includes('@')) return cleaned;
  if (cleaned.includes('-')) return `${cleaned}@g.us`;
  return `${cleaned}@s.whatsapp.net`;
}

/**
 * Extract phone number from JID
 */
export function fromJid(jid: string): string {
  return jid.split('@')[0];
}

/**
 * Check if sender is admin
 */
export function isAdmin(sender: string, config: BotConfig): boolean {
  const phone = fromJid(sender);
  return config.adminNumbers.some(admin => {
    const adminPhone = admin.replace(/[^0-9]/g, '');
    return phone === adminPhone || phone.endsWith(adminPhone);
  });
}

/**
 * Format points with thousand separator
 */
export function formatPoints(points: number): string {
  return points.toLocaleString('id-ID');
}

/**
 * Format date in Indonesian locale
 */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLen: number = 1000): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

/**
 * Get tier emoji
 */
export function tierEmoji(tier: string): string {
  switch (tier.toUpperCase()) {
    case 'S': return '💎';
    case 'A': return '🥈';
    case 'B': return '🥉';
    default: return '⭐';
  }
}

/**
 * Get division label
 */
export function divisionLabel(div: string): string {
  switch (div.toLowerCase()) {
    case 'male': case 'm': return '♂ Male';
    case 'female': case 'f': return '♀ Female';
    default: return div;
  }
}

/**
 * Get status emoji
 */
export function statusEmoji(status: string): string {
  switch (status) {
    case 'active': case 'main_event': return '🔴';
    case 'registration': return '📝';
    case 'completed': return '✅';
    case 'pending': return '⏳';
    case 'live': return '⚡';
    case 'upcoming': return '📅';
    default: return '⚪';
  }
}

/**
 * Uptime formatter
 */
export function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
