import type { WASocket, WAMessage } from '@whiskeysockets/baileys'
import { isGroupJid, extractPhone, logMessage, incrementCounter } from './bot-utils'
import { executeCommand } from './commands'

const COMMAND_PREFIX = 'p'

/**
 * Extract text content from a WhatsApp message
 */
function extractMessageText(msg: WAMessage): string {
  if (!msg.message) return ''

  // Try conversation text first
  if (msg.message.conversation) {
    return msg.message.conversation
  }

  // Try extended text message
  if (msg.message.extendedTextMessage?.text) {
    return msg.message.extendedTextMessage.text
  }

  // Try image caption
  if (msg.message.imageMessage?.caption) {
    return msg.message.imageMessage.caption
  }

  // Try video caption
  if (msg.message.videoMessage?.caption) {
    return msg.message.videoMessage.caption
  }

  return ''
}

/**
 * Handle incoming WhatsApp message
 * 
 * KEY FIX: When replying to messages from groups, we use `msg.key.remoteJid`
 * as the destination. This is the GROUP JID (e.g., "12345@g.us") for group messages,
 * and the USER JID (e.g., "12345@s.whatsapp.net") for private messages.
 * 
 * Previously the bot was using the sender's JID directly, which caused
 * group replies to go to private chat instead of the group.
 */
export async function handleMessage(sock: WASocket, msg: WAMessage) {
  const text = extractMessageText(msg).trim()
  if (!text) return

  // ─── Determine where to reply ───
  // This is THE FIX: use remoteJid, NOT the sender's JID
  const remoteJid = msg.key.remoteJid!  // This is the GROUP JID for group messages
  const senderJid = msg.key.participant || msg.key.remoteJid!  // The actual sender
  const fromGroup = isGroupJid(remoteJid)
  const senderPhone = extractPhone(fromGroup ? senderJid : remoteJid)

  // ─── Check if message is a command ───
  if (!text.toLowerCase().startsWith(COMMAND_PREFIX + ' ') && text.toLowerCase() !== COMMAND_PREFIX) {
    return // Not a command, ignore
  }

  // Parse command and arguments
  const parts = text.slice(COMMAND_PREFIX.length).trim().split(/\s+/)
  const commandName = parts[0]?.toLowerCase() || ''
  const args = parts.slice(1)

  if (!commandName || commandName === 'help') {
    // Empty "p" or "p help"
    const response = await executeCommand('help', [], senderPhone, remoteJid, fromGroup)
    await sendReply(sock, remoteJid, msg, response)
    return
  }

  // Log incoming command
  await logMessage('command', senderPhone, text, commandName, null, fromGroup ? remoteJid : null)
  await incrementCounter('messagesReceived')

  // Execute command
  try {
    const response = await executeCommand(commandName, args, senderPhone, remoteJid, fromGroup)

    // Send reply to the SAME chat where command was received (group or private)
    await sendReply(sock, remoteJid, msg, response)

    // Log outgoing
    await logMessage('outgoing', null, response, commandName, response, fromGroup ? remoteJid : null)
    await incrementCounter('messagesSent')
  } catch (err) {
    console.error(`Error executing command "${commandName}":`, err)
    const errorResponse = '❌ Terjadi kesalahan. Coba lagi nanti.'
    await sendReply(sock, remoteJid, msg, errorResponse)
    await logMessage('error', senderPhone, text, commandName, errorResponse, fromGroup ? remoteJid : null, true)
  }
}

/**
 * Send a reply message
 * 
 * CRITICAL: `to` is always the remoteJid from the original message.
 * For group messages, this will be the group JID (e.g., "12345@g.us")
 * For private messages, this will be the user JID (e.g., "12345@s.whatsapp.net")
 * 
 * This ensures group replies stay in the group, not in private chat.
 */
async function sendReply(sock: WASocket, to: string, quotedMsg: WAMessage, text: string) {
  try {
    await sock.sendMessage(to, { text }, { quoted: quotedMsg })
  } catch (err) {
    console.error('Failed to send reply:', err)
    // Fallback: send without quoting
    try {
      await sock.sendMessage(to, { text })
    } catch (fallbackErr) {
      console.error('Failed to send fallback reply:', fallbackErr)
    }
  }
}
