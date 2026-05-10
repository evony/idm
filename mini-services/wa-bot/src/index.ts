/**
 * IDM WA Bot - Entry Point
 * Starts Express HTTP server and WhatsApp Bot
 */

import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env from this service's directory with override=true
// This ensures our DATABASE_URL takes precedence over the main project's .env
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dirname, '../.env'), override: true });
import express from 'express';
import QRCode from 'qrcode';
import { WABot } from './bot';
import { ApiClient } from './api-client';
import { initDatabase, updateBotStatus, addWaLog } from './database';
import type { BotConfig } from './types';

// ─── Load Configuration ──────────────────────────

const config: BotConfig = {
  port: parseInt(process.env.PORT || '3004'),
  databaseUrl: process.env.DATABASE_URL || '',
  directDatabaseUrl: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '',
  idmApiUrl: process.env.IDM_API_URL || 'http://localhost:3000',
  adminNumbers: (process.env.BOT_ADMIN_NUMBERS || '').split(',').filter(Boolean).map(n => n.trim()),
  groupJids: (process.env.BOT_GROUP_JIDS || '').split(',').filter(Boolean).map(j => j.trim()),
  sessionName: process.env.BOT_SESSION_NAME || 'idm-tarkam-bot',
  welcomeMessage: process.env.BOT_WELCOME_MESSAGE || '👋 Selamat datang di TARKAM IDM Bot! Ketik *p help* untuk melihat daftar command.',
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate required config
if (!config.databaseUrl) {
  console.error('❌ DATABASE_URL is required. Set it in .env file.');
  process.exit(1);
}

// ─── Initialize Services ─────────────────────────

const db = initDatabase(config);
const api = new ApiClient(config);
const bot = new WABot(config, api);

// ─── Express HTTP Server ─────────────────────────

const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'idm-wa-bot', timestamp: new Date().toISOString() });
});

// Bot status
app.get('/status', async (_req, res) => {
  try {
    const botConn = bot.getConnectionStatus();
    const cmdStats = bot.getCommandHandler().getStats();

    res.json({
      service: 'idm-wa-bot',
      version: '1.0.0',
      waStatus: botConn.status,
      phoneNumber: botConn.phoneNumber,
      uptime: cmdStats.uptime,
      messagesReceived: cmdStats.messagesReceived,
      messagesSent: cmdStats.messagesSent,
      commandsProcessed: cmdStats.commandsProcessed,
      startTime: cmdStats.startTime,
      lastConnectedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get bot commands info
app.get('/commands', (_req, res) => {
  res.json({
    service: 'idm-wa-bot',
    commands: [
      { cmd: 'p help', desc: 'Bantuan & daftar command', usage: 'p help' },
      { cmd: 'p daftar', desc: 'Daftar peserta turnamen', usage: 'p daftar <nickname> <M/F> [nama] [club]' },
      { cmd: 'p info', desc: 'Cek status registrasi', usage: 'p info' },
      { cmd: 'p batal', desc: 'Batalkan registrasi', usage: 'p batal' },
      { cmd: 'p ranking', desc: 'Top 10 leaderboard', usage: 'p ranking [M/F]' },
      { cmd: 'p status', desc: 'Cek stats pemain', usage: 'p status [nickname]' },
      { cmd: 'p recap', desc: 'Recap turnamen', usage: 'p recap [M/F]' },
      { cmd: 'p next', desc: 'Match selanjutnya', usage: 'p next [nickname]' },
      { cmd: 'p live', desc: 'Match sedang berlangsung', usage: 'p live [M/F]' },
      { cmd: 'p botinfo', desc: 'Info bot', usage: 'p botinfo' },
      { cmd: 'p result', desc: 'Admin: Input hasil match', usage: 'p result <matchId> <skor1>-<skor2>' },
      { cmd: 'p mvp', desc: 'Admin: Set MVP', usage: 'p mvp <matchId> <nickname>' },
      { cmd: 'p start', desc: 'Admin: Mulai turnamen', usage: 'p start <tournamentId>' },
      { cmd: 'p end', desc: 'Admin: Akhiri turnamen', usage: 'p end <tournamentId>' },
      { cmd: 'p broadcast', desc: 'Admin: Broadcast pesan', usage: 'p broadcast <pesan>' },
      { cmd: 'p ban', desc: 'Admin: Ban player', usage: 'p ban <gamertag>' },
      { cmd: 'p unban', desc: 'Admin: Unban player', usage: 'p unban <gamertag>' },
      { cmd: 'p cekgrup', desc: 'Admin: Info grup', usage: 'p cekgrup' },
    ],
  });
});

// Restart bot (useful for admin control)
app.post('/restart', async (_req, res) => {
  try {
    await bot.stop();
    setTimeout(() => bot.start(), 3000);
    res.json({ success: true, message: 'Bot restarting...' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// QR Code HTML page — shows scannable QR for WhatsApp pairing
app.get('/qr-html', async (_req, res) => {
  try {
    const qrString = bot.getLastQr();
    const connStatus = bot.getConnectionStatus();

    if (connStatus.status === 'connected') {
      res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>IDM WA Bot - Connected</title>
<style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#0a0c16;color:#f5e6c8}
.card{text-align:center;padding:2rem;border-radius:1rem;border:1px solid rgba(229,190,74,0.2);background:rgba(18,20,35,0.9)}
h1{color:#4ade80;font-size:1.5rem}p{color:#a89878;margin-top:0.5rem}</style></head>
<body><div class="card"><h1>✅ WhatsApp Connected</h1><p>Phone: ${connStatus.phoneNumber || 'Unknown'}</p></div></body></html>`);
      return;
    }

    if (!qrString) {
      res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>IDM WA Bot - Waiting QR</title>
<style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#0a0c16;color:#f5e6c8}
.card{text-align:center;padding:2rem;border-radius:1rem;border:1px solid rgba(229,190,74,0.2);background:rgba(18,20,35,0.9)}
h1{color:#e5be4a;font-size:1.5rem}p{color:#a89878;margin-top:0.5rem}
.spin{display:inline-block;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}</style></head>
<body><div class="card"><h1><span class="spin">⏳</span> Menunggu QR Code...</h1><p>Status: ${connStatus.status}</p><p>QR akan muncul otomatis saat bot meminta pairing.</p><p><button onclick="location.reload()" style="padding:0.5rem 1rem;border-radius:0.5rem;border:1px solid #e5be4a;background:transparent;color:#e5be4a;cursor:pointer">🔄 Refresh</button></p></div></body></html>`);
      return;
    }

    // Generate QR as data URL
    const qrDataUrl = await QRCode.toDataURL(qrString, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>IDM WA Bot - QR Code</title>
<style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#0a0c16;color:#f5e6c8}
.card{text-align:center;padding:2rem;border-radius:1rem;border:1px solid rgba(229,190,74,0.2);background:rgba(18,20,35,0.9);max-width:480px}
h1{color:#e5be4a;font-size:1.5rem}p{color:#a89878;margin-top:0.5rem}
img{border-radius:0.75rem;margin:1rem 0;max-width:100%}
.expiry{font-size:0.8rem;color:#f87171;margin-top:0.5rem}</style></head>
<body><div class="card">
<h1>📱 Scan QR Code</h1>
<p>Buka WhatsApp → Perangkat tertaut → Tautkan perangkat</p>
<img src="${qrDataUrl}" alt="WhatsApp QR Code" />
<p class="expiry">⏰ QR berlaku 60 detik. Refresh jika sudah expired.</p>
<p><button onclick="location.reload()" style="padding:0.5rem 1rem;border-radius:0.5rem;border:1px solid #e5be4a;background:transparent;color:#e5be4a;cursor:pointer">🔄 Refresh QR</button></p>
</div></body></html>`);
  } catch (err: any) {
    res.status(500).send(`Error generating QR: ${err.message}`);
  }
});

// ─── Start Server ─────────────────────────────────

app.listen(config.port, () => {
  console.log(`\n🚀 IDM WA Bot HTTP server running on port ${config.port}`);
  console.log(`📡 IDM API URL: ${config.idmApiUrl}`);
  console.log(`🗄️  Database: ${config.databaseUrl.includes('neon.tech') ? 'Neon PostgreSQL' : 'PostgreSQL'}`);
  console.log(`👑 Admin numbers: ${config.adminNumbers.length || 'none configured'}`);
  console.log(`💬 Group JIDs: ${config.groupJids.length || 'none configured'}\n`);
});

// ─── Start WhatsApp Bot (non-blocking) ───────────

// Only start WA connection if ENABLE_WA=true
// In sandbox/dev, bot runs in API-only mode
const enableWA = process.env.ENABLE_WA === 'true';

async function startBot() {
  if (!enableWA) {
    console.log('[MAIN] 📡 WA connection disabled (ENABLE_WA not set). Running in API-only mode.');
    console.log('[MAIN] Set ENABLE_WA=true in .env to connect to WhatsApp.');
    await updateBotStatus({ status: 'offline' }).catch(() => {});
    return;
  }

  try {
    await updateBotStatus({ status: 'connecting' });
    await bot.start();
    console.log('[MAIN] ✅ WhatsApp Bot initialized successfully');
    await addWaLog({ type: 'system', message: 'IDM WA Bot started' }).catch(() => {});
  } catch (err: any) {
    console.error('[MAIN] ⚠️ WhatsApp connection failed:', err.message || err);
    console.log('[MAIN] HTTP server is still running. Bot will auto-retry connection...');
    await addWaLog({ type: 'error', message: `Bot start failed: ${err.message || err}`, isError: true }).catch(() => {});
    await updateBotStatus({ status: 'offline' }).catch(() => {});
  }
}

// Start bot with a small delay to let Express bind first
setTimeout(() => startBot(), 2000);

// ─── Graceful Shutdown ────────────────────────────

const shutdown = async (signal: string) => {
  console.log(`\n[MAIN] Received ${signal}. Shutting down gracefully...`);
  try {
    await bot.stop();
    await updateBotStatus({ status: 'offline' });
    await addWaLog({ type: 'system', message: `Bot shutdown (${signal})` });
  } catch {}
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('[MAIN] Uncaught Exception:', err.message);
  addWaLog({ type: 'error', message: `Uncaught: ${err.message}`, isError: true }).catch(() => {});
});

process.on('unhandledRejection', (reason) => {
  console.error('[MAIN] Unhandled Rejection:', reason);
  addWaLog({ type: 'error', message: `Unhandled: ${reason}`, isError: true }).catch(() => {});
});
