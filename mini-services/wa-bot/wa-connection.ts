/**
 * IDM WA Bot — WhatsApp Connection (Child Process)
 *
 * This runs as a forked child process from index.ts.
 * It handles the Baileys WhatsApp connection and communicates
 * status updates back to the parent via IPC.
 *
 * If this process crashes, the parent (HTTP server) stays alive
 * and automatically restarts this process.
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  ConnectionState,
  proto,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import P from 'pino'
import qrcode from 'qrcode-terminal'
import { handleMessage, setSendFunction } from './lib/commands'
import { cleanWaNumber, isGroupJid, isStatusBroadcast } from './lib/utils'

// ============================================
// CONFIGURATION
// ============================================

const PORT = 3004
const AUTH_FOLDER = './auth_info_baileys'
const ADMIN_WA_NUMBERS = process.env.ADMIN_WA_NUMBERS || ''
const ADMIN_WA_NAMES = process.env.ADMIN_WA_NAMES || ''
const RECONNECT_DELAY_MS = 10_000

// Set env for command module
process.env.ADMIN_WA_NUMBERS = ADMIN_WA_NUMBERS
process.env.ADMIN_WA_NAMES = ADMIN_WA_NAMES

// ============================================
// IPC HELPER — Send JSON messages to parent via stdout
// ============================================

function sendToParent(msg: any): void {
  // Output as JSON line to stdout — parent process parses these
  process.stdout.write(JSON.stringify(msg) + '\n')
}

// ============================================
// BAILEYS CONNECTION
// ============================================

const logger = P({ level: 'silent' })
let sock: ReturnType<typeof makeWASocket> | null = null

async function sendToWaNumber(number: string, text: string): Promise<void> {
  if (!sock) return
  const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`
  try {
    await sock.sendMessage(jid, { text })
  } catch (error) {
    sendToParent({ type: 'log', message: `Failed to send to ${number}: ${error}` })
  }
}

setSendFunction(sendToWaNumber)

async function connectToWhatsApp(): Promise<void> {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Baileys function, not a React hook
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER)
    const { version } = await fetchLatestBaileysVersion()

    sendToParent({ type: 'status', status: 'connecting' })

    sock = makeWASocket({
      version,
      logger,
      auth: state,
      printQRInTerminal: false, // Don't print QR in terminal — send via IPC
      browser: ['TARKAM Bot', 'Chrome', '1.0.0'],
      connectTimeoutMs: 60_000,
      defaultQueryTimeoutMs: 30_000,
      keepAliveIntervalMs: 25_000,
      markOnlineOnConnect: true,
      retryRequestDelayMs: 2500,
      maxMsgRetryCount: 2,
    })

    const store = makeInMemoryStore({ logger })
    store.bind(sock.ev)

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        // Send QR to parent via stdout (JSON)
        sendToParent({ type: 'qr', qr })
        sendToParent({ type: 'log', message: '📱 QR Code generated! Scan with WhatsApp.' })
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut
        const reason = `Code ${statusCode}: ${DisconnectReason[statusCode] || 'Unknown'}`

        sendToParent({ type: 'disconnect', reason })
        sendToParent({ type: 'log', message: `Connection closed. Reason: ${reason}. Reconnect: ${shouldReconnect}` })

        sock = null

        if (shouldReconnect) {
          setTimeout(() => connectToWhatsApp(), RECONNECT_DELAY_MS)
        } else {
          // Logged out — need new QR scan, delete auth and reconnect
          sendToParent({ type: 'log', message: 'Logged out. Will generate new QR code.' })
          setTimeout(() => connectToWhatsApp(), RECONNECT_DELAY_MS * 2)
        }
      } else if (connection === 'open') {
        sendToParent({ type: 'status', status: 'connected' })
        sendToParent({ type: 'log', message: '✅ WhatsApp Bot connected successfully!' })

        // Notify admins
        if (ADMIN_WA_NUMBERS) {
          const adminNumbers = ADMIN_WA_NUMBERS.split(',').map(n => n.trim()).filter(Boolean)
          for (const number of adminNumbers) {
            try {
              await sendToWaNumber(number, '🤖 *TARKAM Bot Online!*\n\nBot sudah terhubung.\nKetik *p help* untuk daftar perintah.')
            } catch {}
          }
        }
      }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return
      for (const msg of messages) {
        try {
          await handleMessage2(msg)
        } catch (error) {
          sendToParent({ type: 'log', message: `Error handling message: ${error}` })
        }
      }
    })
  } catch (error) {
    sendToParent({ type: 'disconnect', reason: `Connection error: ${error}` })
    sendToParent({ type: 'log', message: `Error: ${error}. Retrying in ${RECONNECT_DELAY_MS / 1000}s` })
    sock = null
    setTimeout(() => connectToWhatsApp(), RECONNECT_DELAY_MS)
  }
}

// ============================================
// MESSAGE HANDLER
// ============================================

async function handleMessage2(msg: proto.IWebMessageInfo): Promise<void> {
  if (!sock) return
  const key = msg.key
  if (key.fromMe) return

  const remoteJid = key.remoteJid || ''
  if (isStatusBroadcast(remoteJid)) return

  const messageContent = msg.message
  if (!messageContent) return

  const text =
    messageContent.conversation ||
    messageContent.extendedTextMessage?.text ||
    messageContent.imageMessage?.caption ||
    messageContent.videoMessage?.caption ||
    ''

  if (!text || typeof text !== 'string') return

  // Accept "p" prefix (case insensitive) and legacy "/", "!", "."
  const isCommand = /^[pP][\s.,]|^[\/!\.]/.test(text.trim())
  if (!isCommand) return

  const isGroup = isGroupJid(remoteJid)
  const participant = key.participant || remoteJid
  const pushName = msg.pushName || undefined

  // ★ replyFn sends to remoteJid (group JID for group, user JID for DM)
  // This ensures group replies stay in the group, not go to private chat
  const replyFn = async (replyText: string): Promise<void> => {
    if (!sock) return
    try {
      await sock.sendMessage(remoteJid, { text: replyText }, { quoted: msg })
    } catch {
      try { await sock.sendMessage(remoteJid, { text: replyText }) } catch {}
    }
  }

  sendToParent({ type: 'log', message: `${isGroup ? 'GROUP' : 'DM'} | ${cleanWaNumber(participant)} (${pushName || '-'}): ${text.substring(0, 80)}` })
  await handleMessage(text, participant, replyFn)
}

// ============================================
// START
// ============================================

sendToParent({ type: 'log', message: 'WA connection process started' })
connectToWhatsApp()

// Keep alive — don't let process exit on uncaught errors
process.on('uncaughtException', (error) => {
  sendToParent({ type: 'log', message: `Uncaught exception: ${error?.message || error}` })
})

process.on('unhandledRejection', (reason) => {
  sendToParent({ type: 'log', message: `Unhandled rejection: ${reason}` })
})
