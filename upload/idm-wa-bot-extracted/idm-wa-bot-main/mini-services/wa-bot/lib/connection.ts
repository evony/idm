import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  type WASocket,
  type BaileysEventMap,
  type ConnectionState,
  type WAMessage,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys'
import QRCode from 'qrcode-terminal'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import { handleMessage } from './handlers'
import { db } from './db'
import { updateBotStatus, logMessage } from './bot-utils'

const logger = pino({ level: 'silent' }) // silence baileys debug logs
const SESSION_DIR = './sessions'

let sock: WASocket | null = null
let isConnected = false

export function getSocket(): WASocket | null {
  return sock
}

export function getConnectionStatus() {
  return {
    connected: isConnected,
    service: 'idm-wa-bot',
    waStatus: isConnected ? 'online' : 'offline',
    timestamp: new Date().toISOString(),
  }
}

export async function startBot() {
  console.log('🤖 Starting IDM TARKAM WhatsApp Bot...')

  // Get latest baileys version
  const { version } = await fetchLatestBaileysVersion()
  console.log(`📱 Using WA Web version: ${version.join('.')}`)

  // Load auth state
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)

  // Create socket
  sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 30_000,
    keepAliveIntervalMs: 25_000,
    retryRequestDelayMs: 1000,
    maxMsgRetryCount: 3,
    // Group settings
    emitOwnEvents: false,
    shouldIgnoreJid: (jid) => {
      // Ignore broadcast and status
      const isBroadcast = jid === 'status@broadcast'
      const isNewsletter = jid.includes('newsletter')
      return isBroadcast || isNewsletter
    },
  })

  // ─── Connection events ───
  sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n📱 Scan QR Code with WhatsApp:')
      QRCode.generate(qr, { small: true })
      console.log('\n')
    }

    if (connection === 'close') {
      isConnected = false
      await updateBotStatus('offline')

      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      console.log(`❌ Connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`)

      if (shouldReconnect) {
        // Reconnect after a delay
        setTimeout(() => startBot(), 3000)
      } else {
        console.log('🚫 Logged out. Please re-scan QR code.')
        // Clear session and restart for fresh QR
        setTimeout(() => startBot(), 5000)
      }
    }

    if (connection === 'open') {
      isConnected = true
      await updateBotStatus('online')
      console.log('✅ WhatsApp Bot connected successfully!')
      await logMessage('system', null, 'Bot connected to WhatsApp', null, null)
    }
  })

  // ─── Save credentials ───
  sock.ev.on('creds.update', saveCreds)

  // ─── Handle incoming messages ───
  sock.ev.on('messages.upsert', async (m: BaileysEventMap['messages.upsert']) => {
    if (m.type !== 'notify') return

    for (const msg of m.messages) {
      // Skip if message is from self
      if (msg.key.fromMe) continue

      // Skip if no message content
      if (!msg.message) continue

      try {
        await handleMessage(sock!, msg)
      } catch (err) {
        console.error('Error handling message:', err)
      }
    }
  })

  // ─── Group participants update ───
  sock.ev.on('group-participants.update', async (update) => {
    console.log(`👥 Group participants update: ${update.id} - ${update.action} - ${update.participants}`)
  })

  return sock
}
