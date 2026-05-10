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
