#!/usr/bin/env node
/**
 * IDM WA Bot — Main Entry Point (Railway-Ready v1.6)
 *
 * Changelog from v1.5:
 * - Prefix changed: "/" → "p" (e.g. "p help", "p daftar")
 * - setGroupSendFunction takes (text) only, sends to all COMMUNITY_GROUPS
 * - Uses handleMessage instead of routeCommand
 * - normalizeWaNumber: 08→62, +62→62 for admin check
 * - ADMIN_NUMBERS with fallback to ADMIN_WA_NUMBERS
 * - /commands endpoint updated with "p" prefix
 * - /test endpoint accepts "p" prefix
 * - Admin notification: "Ketik *p help*"
 *
 * Features:
 * - HTTP server starts FIRST on 0.0.0.0 (required for Docker/Railway)
 * - Persistent auth session via Railway Volume (mount at /data)
 * - /reset-qr endpoint to clear stuck auth sessions
 * - Auto-detect volume vs local auth storage
 * - WA/Prisma load lazily — health check always passes
 * - Group send function for broadcasting to community groups
 *
 * Railway Setup:
 * 1. Add a Volume to your service, mount at /data
 * 2. Set env vars: DATABASE_URL, DIRECT_DATABASE_URL
 * 3. Set: ADMIN_NUMBERS (or ADMIN_WA_NUMBERS), COMMUNITY_GROUPS
 * 4. Optional: PAYMENT_DANA, PAYMENT_OVO, PAYMENT_NAME, ADMIN_CONTACT
 * 5. PORT is auto-set by Railway
 *
 * Auth Session Storage:
 * - With Volume: /data/auth_info_baileys (persists across deploys)
 * - Without Volume: ./auth_info_baileys (lost on redeploy)
 */

// ============================================
// LOAD .env FILE — before reading any env vars
// ============================================
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
try {
  const envPath = join(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val; // don't override existing env
    }
    console.log('  📄 .env file loaded');
  }
} catch (_) { /* ignore */ }

// ============================================
// IMMEDIATE STARTUP LOG — before ANY async
// ============================================
console.log('═══════════════════════════════════════')
console.log('  🚀 IDM WA Bot starting...')
console.log(`  📦 Node: ${process.version}`)
console.log(`  📂 CWD: ${process.cwd()}`)
console.log(`  🔧 PORT env: ${process.env.PORT || '(not set, using 3004)'}`)
console.log(`  💾 DATABASE_URL: ${process.env.DATABASE_URL ? '✅ set' : '❌ missing'}`)
console.log(`  🛡️ ADMIN_NUMBERS: ${process.env.ADMIN_NUMBERS || process.env.ADMIN_WA_NUMBERS || '(not set)'}`)
console.log(`  💳 PAYMENT_DANA: ${process.env.PAYMENT_DANA ? '✅ set' : '❌ missing'}`)
console.log(`  💳 PAYMENT_OVO: ${process.env.PAYMENT_OVO ? '✅ set' : '❌ missing'}`)
console.log(`  📢 COMMUNITY_GROUPS: ${process.env.COMMUNITY_GROUPS || '(not set)'}`)
console.log(`  💾 Volume /data: ${existsSync('/data') ? '✅ mounted' : '❌ not found (using local)'}`)
console.log('═══════════════════════════════════════')

import http from 'http'
import fs from 'fs'
import path from 'path'

// ============================================
// HELPERS
// ============================================

/** Normalize WA number: 08→62, +62→62, strip @s.whatsapp.net */
function normalizeWaNumber(num: string): string {
  let n = num.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '')
  n = n.replace(/^\+/, '')
  if (/^08/.test(n)) n = '62' + n.substring(1)
  if (/^8\d{8,12}$/.test(n)) n = '62' + n
  return n
}

// ============================================
// CONFIGURATION
// ============================================

const PORT = parseInt(process.env.PORT || '3004', 10)

// Admin numbers: ADMIN_NUMBERS (preferred) or ADMIN_WA_NUMBERS (fallback)
// Supports: 628xxx, 08xxx, +628xxx — all normalized to 62
const ADMIN_NUMBERS_RAW = (process.env.ADMIN_NUMBERS || process.env.ADMIN_WA_NUMBERS || '').split(',').map(s => s.trim()).filter(Boolean)
const ADMIN_NUMBERS = ADMIN_NUMBERS_RAW.map(n => normalizeWaNumber(n))

// Community groups for broadcast
const COMMUNITY_GROUPS = (process.env.COMMUNITY_GROUPS || '').split(',').map(s => s.trim()).filter(Boolean)

// Keep legacy env vars for backward compat
process.env.ADMIN_WA_NUMBERS = ADMIN_NUMBERS_RAW.join(',')
process.env.ADMIN_WA_NAMES = process.env.ADMIN_WA_NAMES || ''

// ============================================
// AUTH SESSION PATH — Railway Volume support
// ============================================

const AUTH_FOLDER = fs.existsSync('/data')
  ? '/data/auth_info_baileys'
  : './auth_info_baileys'

if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true })
  console.log(`[AUTH] Created auth directory: ${AUTH_FOLDER}`)
} else {
  console.log(`[AUTH] Using auth directory: ${AUTH_FOLDER}`)
  const credsPath = path.join(AUTH_FOLDER, 'creds.json')
  if (fs.existsSync(credsPath)) {
    console.log(`[AUTH] ✅ Existing session found (will try to reconnect)`)
  } else {
    console.log(`[AUTH] No existing session (will generate QR code)`)
  }
}

// ============================================
// GLOBAL STATE
// ============================================

let waStatus: 'disconnected' | 'connecting' | 'connected' | 'not_loaded' = 'not_loaded'
let qrCodeData: string | null = null
let lastConnectedAt: string | null = null
let lastDisconnectReason: string | null = null
let reconnectAttempts = 0
let modulesLoaded = false
let loadError: string | null = null
let activeSock: any = null
const startTime = new Date().toISOString()
const msgCounter = { in: 0, out: 0 }

// ============================================
// HELPER: Delete auth session files
// ============================================

function deleteAuthSession(): { deleted: boolean; path: string; error?: string } {
  try {
    if (!fs.existsSync(AUTH_FOLDER)) {
      return { deleted: false, path: AUTH_FOLDER, error: 'Auth folder does not exist' }
    }

    const files = fs.readdirSync(AUTH_FOLDER)
    for (const file of files) {
      const filePath = path.join(AUTH_FOLDER, file)
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true })
      } else {
        fs.unlinkSync(filePath)
      }
    }

    console.log(`[AUTH] 🗑️ Deleted ${files.length} auth files from ${AUTH_FOLDER}`)
    return { deleted: true, path: AUTH_FOLDER }
  } catch (error: any) {
    console.error(`[AUTH] ❌ Failed to delete auth:`, error.message)
    return { deleted: false, path: AUTH_FOLDER, error: error.message }
  }
}

// ============================================
// HTTP SERVER
// ============================================

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

  switch (url.pathname) {
    case '/health': {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        ok: true,
        service: 'idm-wa-bot',
        version: '1.6.0',
        port: PORT,
        waStatus,
        modulesLoaded,
        authPath: AUTH_FOLDER,
        hasVolume: fs.existsSync('/data'),
        loadError,
      }))
      break
    }

    case '/':
    case '/status': {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        service: 'idm-wa-bot',
        version: '1.6.0',
        waStatus,
        modulesLoaded,
        loadError,
        lastConnectedAt,
        lastDisconnectReason,
        qrAvailable: !!qrCodeData,
        reconnectAttempts,
        messages: msgCounter,
        startTime,
        authPath: AUTH_FOLDER,
        hasVolume: fs.existsSync('/data'),
        hasCreds: fs.existsSync(path.join(AUTH_FOLDER, 'creds.json')),
        timestamp: new Date().toISOString(),
        env: {
          hasDb: !!process.env.DATABASE_URL,
          hasAdmin: ADMIN_NUMBERS.length > 0,
          adminCount: ADMIN_NUMBERS.length,
          hasPaymentDana: !!process.env.PAYMENT_DANA,
          hasPaymentOvo: !!process.env.PAYMENT_OVO,
          hasCommunityGroups: COMMUNITY_GROUPS.length > 0,
          communityGroupCount: COMMUNITY_GROUPS.length,
          port: PORT,
          nodeVersion: process.version,
        }
      }, null, 2))
      break
    }

    case '/db-test': {
      try {
        const { db } = await import('./lib/db')
        const start = Date.now()
        await db.$queryRaw`SELECT 1`
        const latency = Date.now() - start
        const commandsModule = await import('./lib/commands')
        const cmdList = commandsModule.getCommandList()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          ok: true,
          db: 'connected',
          latency: `${latency}ms`,
          commandsRegistered: cmdList.length,
          commands: cmdList,
          modulesLoaded,
          dbUrl: process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, '//***@'),
        }, null, 2))
      } catch (error: any) {
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          ok: false,
          db: 'error',
          error: error?.message || String(error),
          dbUrl: process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, '//***@'),
          env: {
            hasDbUrl: !!process.env.DATABASE_URL,
            hasDirectUrl: !!process.env.DIRECT_DATABASE_URL,
          }
        }, null, 2))
      }
      break
    }

    case '/qr': {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(qrCodeData ? { qr: qrCodeData, status: waStatus } : waStatus === 'connected' ? { status: 'connected' } : { status: waStatus, message: 'QR not available' }))
      break
    }

    case '/qr-html': {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      if (qrCodeData) {
        res.end(`<!DOCTYPE html><html><head><title>TARKAM WA Bot</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;background:#0a0a0a;color:#fff;padding:20px}h1{font-size:1.5rem;margin-bottom:8px}.status{color:#888;margin-bottom:16px}img{border:16px solid white;border-radius:8px;max-width:90vw;max-height:60vh}.btn{margin-top:16px;padding:10px 24px;border:2px solid #ef4444;background:transparent;color:#ef4444;border-radius:8px;cursor:pointer;font-size:14px;transition:all 0.2s}.btn:hover{background:#ef4444;color:white}.info{margin-top:12px;color:#666;font-size:12px;max-width:400px;text-align:center}</style></head><body><h1>🤖 TARKAM WA Bot</h1><p class="status">Status: ${waStatus}</p><img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}"/><p class="info">Scan QR dengan WhatsApp → Perangkat tertaut → Tautkan perangkat</p><button class="btn" onclick="fetch('/reset-qr').then(r=>r.json()).then(d=>{alert(d.message);location.reload()})">🔄 Reset Session</button></body></html>`)
      } else if (waStatus === 'connected') {
        res.end(`<!DOCTYPE html><html><head><title>TARKAM WA Bot</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;margin:0;background:#0a0a0a;color:#fff}h1{font-size:1.5rem;margin-bottom:8px}.connected{color:#4ade80;font-size:24px;margin-bottom:16px}.btn{padding:10px 24px;border:2px solid #ef4444;background:transparent;color:#ef4444;border-radius:8px;cursor:pointer;font-size:14px;transition:all 0.2s}.btn:hover{background:#ef4444;color:white}.info{margin-top:12px;color:#666;font-size:12px}</style></head><body><h1>✅ TARKAM WA Bot</h1><p class="connected">Connected!</p><p class="info">Terhubung sejak: ${lastConnectedAt || '-'}</p><p class="info">Auth: ${AUTH_FOLDER} | Volume: ${fs.existsSync('/data') ? '✅' : '❌'}</p><button class="btn" onclick="if(confirm('Yakin ingin reset? Bot akan disconnect dan perlu scan QR ulang.')){fetch('/reset-qr').then(r=>r.json()).then(d=>{alert(d.message);location.reload()})}">🔄 Reset Session</button></body></html>`)
      } else {
        res.end(`<!DOCTYPE html><html><head><title>TARKAM WA Bot</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;margin:0;background:#0a0a0a;color:#fff}h1{font-size:1.5rem;margin-bottom:16px}.status{color:#888;margin-bottom:8px}.btn{margin-top:16px;padding:10px 24px;border:2px solid #3b82f6;background:transparent;color:#3b82f6;border-radius:8px;cursor:pointer;font-size:14px;transition:all 0.2s}.btn:hover{background:#3b82f6;color:white}.btn-danger{border-color:#ef4444;color:#ef4444;margin-top:8px}.btn-danger:hover{background:#ef4444;color:white}.info{margin-top:12px;color:#666;font-size:12px}</style></head><body><h1>⏳ TARKAM WA Bot</h1><p class="status">Status: ${waStatus}</p><p class="status">Reconnect attempts: ${reconnectAttempts}</p>${lastDisconnectReason ? `<p class="status">Last disconnect: ${lastDisconnectReason}</p>` : ''}<button class="btn" onclick="fetch('/restart').then(r=>r.json()).then(d=>{alert(d.message);setTimeout(()=>location.reload(),3000)})">🔁 Restart Connection</button><button class="btn btn-danger" onclick="if(confirm('Reset session? Bot akan disconnect dan perlu scan QR baru.')){fetch('/reset-qr').then(r=>r.json()).then(d=>{alert(d.message);setTimeout(()=>location.reload(),3000)})}">🔄 Reset Session</button><p class="info">Auth: ${AUTH_FOLDER} | Volume: ${fs.existsSync('/data') ? '✅' : '❌'}</p></body></html>`)
      }
      break
    }

    case '/commands': {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ commands: [
        { cmd: 'p help', desc: 'Bantuan & daftar command', usage: 'p help' },
        { cmd: 'p daftar', desc: 'Daftar turnamen', usage: 'p daftar <tag> <M/F> [nama] [club]' },
        { cmd: 'p info', desc: 'Cek status pendaftaran', usage: 'p info' },
        { cmd: 'p batal', desc: 'Batalkan pendaftaran', usage: 'p batal' },
        { cmd: 'p ranking', desc: 'Leaderboard top 10', usage: 'p ranking' },
        { cmd: 'p status', desc: 'Cek skor pemain', usage: 'p status [nickname]' },
        { cmd: 'p recap', desc: 'Rekap turnamen', usage: 'p recap' },
        { cmd: 'p next', desc: 'Match selanjutnya', usage: 'p next' },
        { cmd: 'p live', desc: 'Match sedang berlangsung', usage: 'p live' },
        { cmd: 'p result', desc: 'Admin: Input hasil match', usage: 'p result <matchId> <skor1>-<skor2>' },
        { cmd: 'p mvp', desc: 'Admin: Set MVP', usage: 'p mvp <matchId> <nickname>' },
        { cmd: 'p start', desc: 'Admin: Mulai turnamen', usage: 'p start <tournamentId>' },
        { cmd: 'p end', desc: 'Admin: Akhiri turnamen', usage: 'p end <tournamentId>' },
        { cmd: 'p ban', desc: 'Admin: Ban pemain', usage: 'p ban <nickname>' },
        { cmd: 'p unban', desc: 'Admin: Unban pemain', usage: 'p unban <nickname>' },
        { cmd: 'p broadcast', desc: 'Admin: Kirim pengumuman', usage: 'p broadcast <pesan>' },
        { cmd: 'p cekgrup', desc: 'Admin: Info bot & grup', usage: 'p cekgrup' },
      ]}, null, 2))
      break
    }

    case '/reset-qr': {
      console.log('[RESET] 🔄 Reset QR requested')

      if (activeSock) {
        try { activeSock.end(undefined) } catch {}
        activeSock = null
      }

      const result = deleteAuthSession()

      waStatus = 'disconnected'
      qrCodeData = null
      reconnectAttempts = 0
      lastDisconnectReason = null

      if (!fs.existsSync(AUTH_FOLDER)) {
        fs.mkdirSync(AUTH_FOLDER, { recursive: true })
      }

      setTimeout(() => {
        console.log('[RESET] Reconnecting with fresh session...')
        loadAndConnectWA()
      }, 2000)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        message: result.deleted
          ? '✅ Session reset! QR baru akan digenerate. Tunggu beberapa detik lalu buka /qr-html'
          : '⚠️ Tidak ada session untuk direset. QR baru akan digenerate.',
        result,
        authPath: AUTH_FOLDER,
      }))
      break
    }

    case '/test': {
      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'POST only', usage: 'POST /test {"command":"p help","waNumber":"6281234567890"}' }))
        break
      }
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', async () => {
        try {
          if (!modulesLoaded) {
            res.writeHead(503, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Modules not loaded yet', loadError }))
            return
          }
          const { command, waNumber: testWaNumber } = JSON.parse(body)
          if (!command) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'command is required', usage: 'POST /test {"command":"p help","waNumber":"6281234567890"}' }))
            return
          }
          const { handleMessage, setSendFunction: setSend } = await import('./lib/commands')
          const senderJid = `${testWaNumber || '6280000000000'}@s.whatsapp.net`
          const replies: string[] = []
          // Capture replies via replyFn (new architecture)
          const testReplyFn = async (text: string) => { replies.push(text) }
          await handleMessage(command, senderJid, testReplyFn)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ command, replies, waNumber: testWaNumber }))
        } catch (e: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: e.message }))
        }
      })
      break
    }

    case '/restart': {
      if (activeSock) {
        try { activeSock.end(undefined) } catch {}
        activeSock = null
      }
      waStatus = 'disconnected'
      reconnectAttempts = 0
      loadAndConnectWA()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: '🔄 Restarting WA connection...' }))
      break
    }

    case '/db-health': {
      try {
        const { db } = await import('./lib/db')
        const result = await db.$queryRaw`SELECT 1 as ok`
        const playerCount = await db.player.count()
        const seasonCount = await db.season.count()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          ok: true,
          db: 'connected',
          playerCount,
          seasonCount,
          result,
          env: {
            hasDbUrl: !!process.env.DATABASE_URL,
            hasDirectUrl: !!process.env.DIRECT_DATABASE_URL,
          }
        }, null, 2))
      } catch (e: any) {
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          ok: false,
          db: 'error',
          error: e.message,
          env: {
            hasDbUrl: !!process.env.DATABASE_URL,
            hasDirectUrl: !!process.env.DIRECT_DATABASE_URL,
          }
        }, null, 2))
      }
      break
    }

    case '/debug/commands': {
      try {
        const { getCommandList } = await import('./lib/commands')
        const cmds = getCommandList()
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          commandsRegistered: cmds.length,
          commands: cmds,
          modulesLoaded,
        }, null, 2))
      } catch (e: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message, modulesLoaded }))
      }
      break
    }

    default: {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found', endpoints: ['/', '/status', '/health', '/db-test', '/db-health', '/debug/commands', '/qr', '/qr-html', '/commands', '/test', '/restart', '/reset-qr'] }))
    }
  }
})

// ============================================
// START HTTP SERVER IMMEDIATELY
// ============================================

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════')
  console.log('  🤖 TARKAM WhatsApp Bot v1.6.0')
  console.log('═══════════════════════════════════════')
  console.log(`  📡 HTTP: ✅ Listening on 0.0.0.0:${PORT}`)
  console.log(`  🛡️ Admins: ${ADMIN_NUMBERS.length > 0 ? `✅ ${ADMIN_NUMBERS.length} number(s)` : '❌ none'}`)
  console.log(`  💾 DB: ${process.env.DATABASE_URL ? '✅ configured' : '❌ missing'}`)
  console.log(`  💳 Payment: ${process.env.PAYMENT_DANA ? '✅' : '❌'} DANA | ${process.env.PAYMENT_OVO ? '✅' : '❌'} OVO`)
  console.log(`  📢 Broadcast: ${COMMUNITY_GROUPS.length > 0 ? `✅ ${COMMUNITY_GROUPS.length} group(s)` : '❌ no groups'}`)
  console.log(`  🔧 Node: ${process.version}`)
  console.log(`  💾 Auth: ${AUTH_FOLDER}`)
  console.log(`  💾 Volume: ${fs.existsSync('/data') ? '✅ /data mounted' : '❌ no volume (local only)'}`)
  console.log('═══════════════════════════════════════')
  console.log(`  /health   → Railway health check`)
  console.log(`  /status   → Full bot status`)
  console.log(`  /qr-html  → QR code scanner page`)
  console.log(`  /reset-qr → Reset session & new QR`)
  console.log(`  /commands → List all commands`)
  console.log('═══════════════════════════════════════')
  console.log()

  console.log('[BOOT] Loading WA modules in background...')
  loadAndConnectWA()
})

httpServer.on('error', (e: any) => {
  console.error('[HTTP] ❌ Server error:', e.message || e)
  if (e.code === 'EADDRINUSE') {
    console.error('[HTTP] Port in use, retrying in 5s...')
    setTimeout(() => {
      httpServer.close()
      httpServer.listen(PORT, '0.0.0.0')
    }, 5000)
  }
})

// ============================================
// LAZY MODULE LOADER
// ============================================

let connectWAFn: (() => Promise<void>) | null = null
let sendWAFn: ((number: string, text: string) => Promise<void>) | null = null

async function loadAndConnectWA(): Promise<void> {
  try {
    console.log('[BOOT] Step 1: Loading Baileys...')
    const baileys = await import('@whiskeysockets/baileys')
    console.log('[BOOT] Step 2: Loading commands...')
    const commandsModule = await import('./lib/commands')
    console.log('[BOOT] Step 3: Loading utils...')
    const utilsModule = await import('./lib/utils')
    console.log('[BOOT] Step 4: Loading pino...')
    const pino = await import('pino')
    console.log('[BOOT] Step 5: Loading qrcode-terminal...')
    const qrcode = (await import('qrcode-terminal')).default
    console.log('[BOOT] All modules imported successfully')

    // Quick database connectivity check
    try {
      const { db: testDb } = await import('./lib/db')
      const start = Date.now()
      await testDb.$queryRaw`SELECT 1`
      console.log(`[BOOT] ✅ Database connected (${Date.now() - start}ms)`)
    } catch (dbErr: any) {
      console.error(`[BOOT] ❌ Database connection FAILED: ${dbErr?.message}`)
      console.error(`[BOOT] DATABASE_URL: ${process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, '//***@')}`)
      console.error('[BOOT] Commands that need DB will return errors. Fix DATABASE_URL and redeploy.')
    }

    const {
      default: makeWASocket,
      DisconnectReason,
      useMultiFileAuthState,
      fetchLatestBaileysVersion,
    } = baileys as any

    const { setSendFunction, setGroupSendFunction } = commandsModule
    const { cleanWaNumber, isGroupJid, isStatusBroadcast } = utilsModule

    const logger = pino.default({ level: 'silent' })

    const RECONNECT_DELAY_MS = 15_000
    const MAX_RECONNECT = 100
    const MAX_CONSECUTIVE_QR_FAILURES = 6
    let consecutiveFailures = 0
    let isConnecting = false

    async function sendToWaNumber(number: string, text: string): Promise<void> {
      if (!activeSock) return
      const jid = number.includes('@') ? number : `${number}@s.whatsapp.net`
      try {
        await activeSock.sendMessage(jid, { text })
        msgCounter.out++
      } catch (e) { console.error('[SEND]', e) }
    }

    sendWAFn = sendToWaNumber

    // ★ Register personal send function (DM reply)
    setSendFunction(sendToWaNumber)

    // ★ Register GROUP send function — takes (text) only
    // Sends to ALL community groups configured in COMMUNITY_GROUPS env
    setGroupSendFunction(async (text: string) => {
      if (!activeSock) {
        console.error('[GROUP-SEND] ❌ No active socket')
        return
      }
      if (COMMUNITY_GROUPS.length === 0) {
        console.error('[GROUP-SEND] ❌ No COMMUNITY_GROUPS configured')
        return
      }
      for (const groupId of COMMUNITY_GROUPS) {
        const jid = groupId.includes('@g.us') ? groupId : `${groupId}@g.us`
        try {
          await activeSock.sendMessage(jid, { text })
          msgCounter.out++
          console.log(`[GROUP-SEND] ✅ Sent to ${jid}`)
        } catch (e) {
          console.error(`[GROUP-SEND] ❌ Failed to ${jid}:`, e)
        }
      }
    })

    async function connectWA(): Promise<void> {
      if (isConnecting) {
        console.log('[WA] ⚠️ Connection already in progress, skipping duplicate call')
        return
      }
      isConnecting = true

      if (activeSock) {
        console.log('[WA] Closing previous socket before reconnect...')
        try {
          activeSock.ev.removeAllListeners()
          activeSock.end(undefined)
        } catch {}
        activeSock = null
      }

      try {
        console.log(`[WA] Loading auth state from ${AUTH_FOLDER}...`)
        // eslint-disable-next-line react-hooks/rules-of-hooks -- useMultiFileAuthState is a Baileys function, not a React hook
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER)
        console.log('[WA] Fetching Baileys version...')
        const { version } = await fetchLatestBaileysVersion()

        waStatus = 'connecting'

        console.log(`[WA] Creating socket (version ${version.join('.')})...`)
        const sock = makeWASocket({
          version,
          logger,
          auth: state,
          printQRInTerminal: false,
          browser: ['TARKAM Bot', 'Chrome', '1.6.0'],
          connectTimeoutMs: 60_000,
          defaultQueryTimeoutMs: 30_000,
          keepAliveIntervalMs: 25_000,
          markOnlineOnConnect: true,
          retryRequestDelayMs: 2500,
          maxMsgRetryCount: 2,
        })

        activeSock = sock

        sock.ev.on('creds.update', saveCreds)

        sock.ev.on('connection.update', async (update: any) => {
          const { connection, lastDisconnect, qr } = update

          if (qr) {
            qrCodeData = qr
            reconnectAttempts = 0
            consecutiveFailures = 0
            console.log('\n📱 QR Code generated! Scan with WhatsApp:')
            qrcode.generate(qr, { small: true })
            console.log(`\n🌐 QR HTML: Visit /qr-html endpoint\n`)
          }

          if (connection === 'close') {
            let statusCode: number | undefined
            try {
              const error = lastDisconnect?.error
              if (error?.output?.statusCode) {
                statusCode = error.output.statusCode
              } else if (error?.statusCode) {
                statusCode = error.statusCode
              } else if (error?.data?.statusCode) {
                statusCode = error.data.statusCode
              }
            } catch {}
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut
            lastDisconnectReason = `Code ${statusCode}: ${DisconnectReason[statusCode] || 'Unknown'}`
            console.log(`[WA] Disconnected: ${lastDisconnectReason}`)
            waStatus = 'disconnected'
            qrCodeData = null

            if (activeSock === sock) {
              activeSock = null
            }

            if (statusCode === DisconnectReason.loggedOut) {
              console.log('[WA] 🚪 Logged out — deleting old session and generating new QR...')
              deleteAuthSession()
              if (!fs.existsSync(AUTH_FOLDER)) {
                fs.mkdirSync(AUTH_FOLDER, { recursive: true })
              }
            }

            if (statusCode === 440) {
              console.log('[WA] 🔄 Connection replaced — waiting 30s before retry to avoid loop...')
              isConnecting = false
              setTimeout(connectWA, 30_000)
              return
            }

            if (shouldReconnect || statusCode === DisconnectReason.loggedOut) {
              consecutiveFailures++
              reconnectAttempts++

              if (consecutiveFailures >= MAX_CONSECUTIVE_QR_FAILURES) {
                console.log(`[WA] ⚠️ ${consecutiveFailures} consecutive failures — auto-resetting session...`)
                deleteAuthSession()
                if (!fs.existsSync(AUTH_FOLDER)) {
                  fs.mkdirSync(AUTH_FOLDER, { recursive: true })
                }
                consecutiveFailures = 0
              }

              if (reconnectAttempts <= MAX_RECONNECT) {
                const delay = RECONNECT_DELAY_MS * Math.min(reconnectAttempts, 5)
                console.log(`[WA] Reconnecting in ${delay / 1000}s (${reconnectAttempts}/${MAX_RECONNECT})`)
                isConnecting = false
                setTimeout(connectWA, delay)
              } else {
                isConnecting = false
              }
            } else {
              isConnecting = false
            }
          } else if (connection === 'open') {
            waStatus = 'connected'
            reconnectAttempts = 0
            consecutiveFailures = 0
            isConnecting = false
            lastConnectedAt = new Date().toISOString()
            qrCodeData = null
            console.log('[WA] ✅ Connected! Session saved to:', AUTH_FOLDER)

            // Notify admins that bot is online
            for (const adminNum of ADMIN_NUMBERS) {
              const jid = `${adminNum}@s.whatsapp.net`
              try { await sendToWaNumber(jid, '🤖 *TARKAM Bot Online!*\nKetik *p help*') } catch {}
            }
          }
        })

        sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
          if (type !== 'notify') return
          for (const msg of messages) {
            try {
              const key = msg.key
              if (key.fromMe) continue
              const senderJid = key.remoteJid || ''
              if (isStatusBroadcast(senderJid)) continue

              const mc = msg.message
              if (!mc) continue
              const text = (mc.conversation || mc.extendedTextMessage?.text || mc.imageMessage?.caption || mc.videoMessage?.caption || '') as string
              if (!text) continue

              // ★ Accept "p" prefix (e.g. "p help", "p daftar tazos m")
              // Also accept "/", "!", "." for backwards compat
              const isCommand = /^[pP][\s.,]|^[\/!\.]/.test(text.trim())
              if (!isCommand) continue

              const currentSock = sock

              msgCounter.in++
              const isGroup = isGroupJid(senderJid)
              const participant = key.participant || senderJid

              // ★ replyFn sends to the GROUP JID for group messages, or private JID for DMs.
              // This is passed to handleMessage so the bot replies IN THE SAME CHAT
              // where the command was received, not always to DM.
              const replyFn = async (t: string) => {
                try { await currentSock.sendMessage(senderJid, { text: t }, { quoted: msg }) }
                catch { try { await currentSock.sendMessage(senderJid, { text: t }) } catch {} }
              }

              console.log(`[MSG] ${isGroup ? 'GRP' : 'DM'} ${cleanWaNumber(participant)}: ${text.substring(0, 60)}`)

              // ★ Use handleMessage from commands.ts
              // Pass replyFn so group replies stay in the group, not go to DM
              const { handleMessage } = await import('./lib/commands')
              await handleMessage(text, participant, replyFn)
            } catch (e) { console.error('[MSG]', e) }
          }
        })
      } catch (error) {
        console.error('[WA] Connection error:', error)
        waStatus = 'disconnected'
        activeSock = null
        isConnecting = false
        reconnectAttempts++
        consecutiveFailures++
        if (reconnectAttempts < MAX_RECONNECT) {
          console.log(`[WA] Retry in ${RECONNECT_DELAY_MS / 1000}s (${reconnectAttempts}/${MAX_RECONNECT})`)
          setTimeout(connectWA, RECONNECT_DELAY_MS)
        }
      }
    }

    connectWAFn = connectWA
    modulesLoaded = true
    loadError = null
    console.log('[BOOT] ✅ All modules loaded successfully')
    console.log('[BOOT] ✅ Send function registered')
    console.log('[BOOT] ✅ Group send function registered')
    console.log('[WA] Connecting...')
    await connectWA()

  } catch (error: any) {
    modulesLoaded = false
    loadError = error?.message || String(error)
    console.error('[BOOT] ❌ Failed to load modules:', loadError)
    console.error('[BOOT] Stack:', error?.stack)
    console.error('[BOOT] HTTP server is still running. Health check will pass.')
    console.error('[BOOT] Fix the error and redeploy.')

    setTimeout(loadAndConnectWA, 30_000)
  }
}

// ============================================
// PROCESS ERROR HANDLERS — never crash
// ============================================

process.on('uncaughtException', e => {
  console.error('[FATAL] Uncaught:', e?.message || e)
})

process.on('unhandledRejection', e => {
  console.error('[FATAL] Rejection:', e)
})

process.on('SIGTERM', () => {
  console.log('\n[SHUTDOWN] SIGTERM received.')
  if (activeSock) {
    try { activeSock.end(undefined) } catch {}
  }
  httpServer.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] SIGINT received.')
  if (activeSock) {
    try { activeSock.end(undefined) } catch {}
  }
  httpServer.close()
  process.exit(0)
})

// Ensure HTTP stays up
setInterval(() => {
  if (!httpServer.listening) {
    console.error('[CRITICAL] HTTP server stopped! Restarting on 0.0.0.0:' + PORT)
    httpServer.listen(PORT, '0.0.0.0')
  }
}, 30_000)

// Expire old registrations
setInterval(async () => {
  try {
    const { db } = await import('./lib/db')
    await db.waRegistration.updateMany({
      where: { status: 'pending', expiresAt: { lt: new Date() } },
      data: { status: 'expired' },
    })
  } catch {}
}, 10 * 60 * 1000)

// ============================================
// WA CONNECTION HEALTH CHECK
// ============================================
setInterval(() => {
  if (waStatus === 'connected' && activeSock) {
    return
  }
  if ((waStatus === 'disconnected' || waStatus === 'not_loaded') && modulesLoaded && connectWAFn) {
    console.log(`[HEALTH] WA ${waStatus}, triggering reconnect via connectWAFn...`)
    connectWAFn()
  }
}, 5 * 60 * 1000)
