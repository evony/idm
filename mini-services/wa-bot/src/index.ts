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
import { initDatabase, updateBotStatus, addWaLog, resetActiveSeasons } from './database';
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

// Disconnect bot — stops WA connection and clears auth session
app.post('/disconnect', async (_req, res) => {
  try {
    await bot.stop();
    // Clear auth session files so next start generates new QR
    try {
      const fs = await import('fs');
      const path = await import('path');
      const sessionDir = path.join(process.cwd(), 'sessions', config.sessionName);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
      console.log('[DISCONNECT] Auth session cleared. Next start will generate new QR.');
    } catch (e: any) {
      console.error('[DISCONNECT] Error clearing session:', e.message);
    }
    await addWaLog({ type: 'system', message: 'Bot disconnected via /disconnect endpoint' }).catch(() => {});
    res.json({ success: true, message: 'Bot disconnected. Session cleared. Restart to get new QR.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset season — resets active season data (tournament, points, etc.)
app.post('/reset-season', async (_req, res) => {
  try {
    const result = await resetActiveSeasons();
    await addWaLog({ type: 'system', message: `Season reset via /reset-season endpoint` }).catch(() => {});
    res.json(result);
  } catch (err: any) {
    await addWaLog({ type: 'error', message: `Season reset failed: ${err.message}`, isError: true }).catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

// Shared HTML styles for QR page
const qrPageStyles = `
body{font-family:system-ui,-apple-system,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#0a0c16;color:#f5e6c8}
.card{text-align:center;padding:2rem;border-radius:1.25rem;border:1px solid rgba(229,190,74,0.2);background:rgba(18,20,35,0.95);max-width:480px;width:90%}
h1{font-size:1.4rem;margin:0 0 0.5rem}p{color:#a89878;margin:0.25rem 0;font-size:0.9rem}
img{border-radius:0.75rem;margin:1rem 0;max-width:100%}
.expiry{font-size:0.8rem;color:#f87171;margin-top:0.5rem}
.btn{padding:0.6rem 1.2rem;border-radius:0.6rem;border:none;cursor:pointer;font-size:0.85rem;font-weight:600;transition:all 0.2s;display:inline-flex;align-items:center;gap:0.4rem}
.btn:hover{transform:translateY(-1px);filter:brightness(1.1)}
.btn:active{transform:translateY(0)}
.btn-gold{background:linear-gradient(135deg,#e5be4a,#c9972e);color:#0a0c16}
.btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff}
.btn-outline{background:transparent;border:1px solid rgba(229,190,74,0.4);color:#e5be4a}
.btn-green{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}
.btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
.actions{display:flex;flex-direction:column;gap:0.6rem;margin-top:1.2rem}
.actions-row{display:flex;gap:0.6rem;justify-content:center}
.spin{display:inline-block;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;top:1rem;left:50%;transform:translateX(-50%);padding:0.75rem 1.5rem;border-radius:0.75rem;font-size:0.85rem;font-weight:600;z-index:999;opacity:0;transition:opacity 0.3s;pointer-events:none}
.toast.show{opacity:1}
.toast-success{background:#22c55e;color:#fff}
.toast-error{background:#ef4444;color:#fff}
.toast-info{background:#3b82f6;color:#fff}
.confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:1000}
.confirm-box{background:#1a1c2e;border:1px solid rgba(229,190,74,0.3);border-radius:1rem;padding:2rem;text-align:center;max-width:360px;width:90%}
.confirm-box h3{color:#f87171;font-size:1.1rem;margin:0 0 0.75rem}
.confirm-box p{color:#a89878;font-size:0.85rem;margin-bottom:1.25rem}
.confirm-actions{display:flex;gap:0.75rem;justify-content:center}
`;

// QR Code HTML page — shows scannable QR for WhatsApp pairing
app.get('/qr-html', async (_req, res) => {
  try {
    const qrString = bot.getLastQr();
    const connStatus = bot.getConnectionStatus();

    // Shared action buttons HTML
    const actionButtons = `
    <div class="actions">
      <div class="actions-row">
        <button class="btn btn-gold" onclick="location.reload()">🔄 Refresh</button>
        <button class="btn btn-danger" onclick="confirmResetSeason()">🗑️ Reset Season</button>
      </div>
      <button class="btn btn-outline" onclick="confirmDisconnect()" style="width:100%">🔌 Disconnect Bot</button>
    </div>`;

    // Shared JavaScript
    const sharedJs = `
    <div id="toast" class="toast"></div>
    <script>
    function showToast(msg, type='info') {
      const t=document.getElementById('toast');
      t.textContent=msg;t.className='toast toast-'+type+' show';
      setTimeout(()=>t.classList.remove('show'),3000);
    }
    function confirmResetSeason() {
      const overlay=document.createElement('div');overlay.className='confirm-overlay';
      overlay.innerHTML='<div class="confirm-box"><h3>⚠️ Reset Season?</h3><p>Semua data turnamen, poin pemain, skin & badge season aktif akan dihapus. Aksi ini tidak bisa dibatalkan!</p><div class="confirm-actions"><button class="btn btn-danger" onclick="doReset(this)">Ya, Reset!</button><button class="btn btn-outline" onclick="this.closest(\\'.confirm-overlay\\').remove()">Batal</button></div></div>';
      document.body.appendChild(overlay);
    }
    function doReset(btn) {
      btn.disabled=true;btn.textContent='Mereset...';
      fetch('/reset-season',{method:'POST'}).then(r=>r.json()).then(d=>{
        btn.closest('.confirm-overlay').remove();
        if(d.success) showToast('✅ '+d.message,'success');
        else showToast('❌ '+(d.error||'Reset gagal'),'error');
      }).catch(e=>{btn.closest('.confirm-overlay').remove();showToast('❌ Error: '+e.message,'error')});
    }
    function confirmDisconnect() {
      const overlay=document.createElement('div');overlay.className='confirm-overlay';
      overlay.innerHTML='<div class="confirm-box"><h3>🔌 Disconnect Bot?</h3><p>Bot akan terputus dari WhatsApp. Kamu perlu scan QR ulang untuk menyambungkan kembali.</p><div class="confirm-actions"><button class="btn btn-danger" onclick="doDisconnect(this)">Ya, Disconnect!</button><button class="btn btn-outline" onclick="this.closest(\\'.confirm-overlay\\').remove()">Batal</button></div></div>';
      document.body.appendChild(overlay);
    }
    function doDisconnect(btn) {
      btn.disabled=true;btn.textContent='Disconnecting...';
      fetch('/disconnect',{method:'POST'}).then(r=>r.json()).then(d=>{
        btn.closest('.confirm-overlay').remove();
        if(d.success){showToast('✅ Bot disconnected','success');setTimeout(()=>location.reload(),1500)}
        else showToast('❌ '+(d.error||'Disconnect gagal'),'error');
      }).catch(e=>{btn.closest('.confirm-overlay').remove();showToast('❌ Error: '+e.message,'error')});
    }
    </script>`;

    if (connStatus.status === 'connected') {
      res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>IDM WA Bot - Connected</title>
<style>${qrPageStyles}</style></head>
<body><div class="card">
<h1 style="color:#4ade80">✅ WhatsApp Connected</h1>
<p>Phone: ${connStatus.phoneNumber || 'Unknown'}</p>
${actionButtons}
</div>${sharedJs}</body></html>`);
      return;
    }

    if (!qrString) {
      res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>IDM WA Bot - Waiting QR</title>
<style>${qrPageStyles}</style></head>
<body><div class="card">
<h1 style="color:#e5be4a"><span class="spin">⏳</span> Menunggu QR Code...</h1>
<p>Status: ${connStatus.status}</p>
<p>QR akan muncul otomatis saat bot meminta pairing.</p>
${actionButtons}
</div>${sharedJs}</body></html>`);
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
<style>${qrPageStyles}</style></head>
<body><div class="card">
<h1 style="color:#e5be4a">📱 Scan QR Code</h1>
<p>Buka WhatsApp → Perangkat tertaut → Tautkan perangkat</p>
<img src="${qrDataUrl}" alt="WhatsApp QR Code" />
<p class="expiry">⏰ QR berlaku 60 detik. Refresh jika sudah expired.</p>
${actionButtons}
</div>${sharedJs}</body></html>`);
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
