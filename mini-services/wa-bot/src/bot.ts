/**
 * IDM WA Bot - WhatsApp Bot Core (Baileys)
 * Handles WhatsApp Web connection, message processing, and QR code generation
 */

import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
  type WAMessage,
  type BaileysEventMap,
  type ConnectionState,
  type proto,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import type { BotConfig } from './types';
import { CommandHandler } from './commands';
import { ApiClient } from './api-client';
import { parseCommand, fromJid } from './utils';
import * as db from './database';

// Baileys DisconnectReason doesn't have 'banned' in all versions
const BANNED_STATUS = 403;

export class WABot {
  private config: BotConfig;
  private api: ApiClient;
  private commandHandler: CommandHandler;
  private socket: WASocket | null = null;
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'banned' = 'disconnected';
  private phoneNumber: string = '';
  private lastQr: string | null = null;
  private qrTimestamp: number = 0;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 50;
  private reconnectDelay: number = 5000;
  private shouldReconnect: boolean = true;

  constructor(config: BotConfig, api: ApiClient) {
    this.config = config;
    this.api = api;
    this.commandHandler = new CommandHandler(config, api);
  }

  getCommandHandler(): CommandHandler {
    return this.commandHandler;
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      phoneNumber: this.phoneNumber,
    };
  }

  /** Get the last QR code string (for /qr-html endpoint) */
  getLastQr(): string | null {
    // QR expires after 60 seconds
    if (this.lastQr && Date.now() - this.qrTimestamp < 60000) {
      return this.lastQr;
    }
    return null;
  }

  async start(): Promise<void> {
    console.log('[BOT] Starting WhatsApp Bot...');
    try {
      await this.connect();
    } catch (err: any) {
      console.error('[BOT] ⚠️ Failed to connect to WhatsApp:', err.message || err);
      console.log('[BOT] Bot running in API-only mode. WA connection will be retried automatically.');
      // Don't throw — keep Express server running
    }
  }

  async stop(): Promise<void> {
    console.log('[BOT] Stopping WhatsApp Bot...');
    this.shouldReconnect = false;
    if (this.socket) {
      this.socket.end(undefined);
      this.socket = null;
    }
    this.connectionStatus = 'disconnected';
    await db.updateBotStatus({ status: 'offline' }).catch(() => {});
  }

  private async connect(): Promise<void> {
    try {
      const { version } = await fetchLatestBaileysVersion();
      console.log(`[BOT] Using WA Web version: ${version.join('.')}`);

      const { state, saveCreds } = await useMultiFileAuthState(
        `sessions/${this.config.sessionName}`
      );

      this.socket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: {
          level: 'silent',
          info: () => {},
          debug: () => {},
          trace: () => {},
          warn: () => {},
          error: () => {},
          fatal: () => {},
          child: () => ({
            level: 'silent',
            info: () => {},
            debug: () => {},
            trace: () => {},
            warn: () => {},
            error: () => {},
            fatal: () => {},
            child: function() { return this; },
          }),
        } as any,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
      });

      this.shouldReconnect = true;

      // Save credentials on update
      this.socket.ev.on('creds.update', saveCreds);

      // Handle connection updates
      this.socket.ev.on('connection.update', this.onConnectionUpdate.bind(this));

      // Handle incoming messages
      this.socket.ev.on('messages.upsert', this.onMessagesUpsert.bind(this));

      this.connectionStatus = 'connecting';
      console.log('[BOT] Socket created, waiting for connection...');
    } catch (err: any) {
      console.error('[BOT] Connection error:', err.message);
      this.connectionStatus = 'disconnected';
      this.scheduleReconnect();
    }
  }

  private async onConnectionUpdate(update: Partial<BaileysEventMap['connection.update']>) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.lastQr = qr;
      this.qrTimestamp = Date.now();
      console.log('\n═══════════════════════════════════════');
      console.log('  📱 Scan QR Code dengan WhatsApp kamu');
      console.log('  🌐 Atau buka /qr-html di browser');
      console.log('═══════════════════════════════════════\n');
      QRCode.generate(qr, { small: true });
      console.log('\n═══════════════════════════════════════\n');
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`[BOT] Connection closed. Status: ${statusCode}, Should reconnect: ${shouldReconnect}`);

      if (statusCode === DisconnectReason.loggedOut) {
        this.connectionStatus = 'banned';
        console.log('[BOT] Device logged out. Need to re-scan QR.');
        await db.updateBotStatus({ status: 'error' }).catch(() => {});
        // Clear auth and reconnect to get new QR
        try {
          const fs = await import('fs');
          const path = await import('path');
          const sessionDir = path.join(process.cwd(), 'sessions', this.config.sessionName);
          if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
          }
          console.log('[BOT] Auth cleared. Reconnecting for new QR...');
        } catch {}
        this.scheduleReconnect();
      } else if (statusCode === 403 || statusCode === DisconnectReason.connectionClosed) {
        this.connectionStatus = 'banned';
        console.log('[BOT] Number banned by WhatsApp.');
        await db.updateBotStatus({ status: 'banned' }).catch(() => {});
      } else {
        this.connectionStatus = 'disconnected';
        if (shouldReconnect && this.shouldReconnect) {
          this.scheduleReconnect();
        }
      }
    }

    if (connection === 'open') {
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      console.log('[BOT] ✅ WhatsApp Connected Successfully!');

      // Get phone number
      try {
        const me = this.socket?.user;
        if (me?.id) {
          this.phoneNumber = me.id.split('@')[0].split(':')[0];
          console.log(`[BOT] Phone: ${this.phoneNumber}`);
        }
      } catch {}

      await db.updateBotStatus({
        status: 'online',
        lastConnectedAt: new Date().toISOString(),
      }).catch(() => {});
    }
  }

  private async onMessagesUpsert({ messages, type }: BaileysEventMap['messages.upsert']) {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        await this.processMessage(msg);
      } catch (err: any) {
        console.error('[BOT] Error processing message:', err.message);
      }
    }
  }

  private async processMessage(msg: proto.IWebMessageInfo) {
    // Skip messages from self
    if (msg.key.fromMe) return;

    // Skip status broadcasts
    if (msg.key.remoteJid === 'status@broadcast') return;

    const from = msg.key.remoteJid || '';
    const sender = msg.key.participant || msg.key.remoteJid || '';
    const isGroup = from.endsWith('@g.us');

    // Get message text
    const text = this.getMessageText(msg);
    if (!text) return;

    this.commandHandler.incrementReceived();

    // Parse command
    const ctx = parseCommand(text, from, sender, '', isGroup, isGroup ? from : undefined);
    if (!ctx) {
      // Check if it's a greeting or common message (auto-reply)
      await this.handleNonCommand(from, sender, text, isGroup);
      return;
    }

    console.log(`[CMD] ${fromJid(sender)}: ${ctx.command} ${ctx.args.join(' ')}`);

    // Process command
    const result = await this.commandHandler.handle(ctx);
    if (result && this.socket) {
      await this.sendMessage(from, result.text);
    }
  }

  private async handleNonCommand(from: string, sender: string, text: string, isGroup: boolean) {
    const lowerText = text.toLowerCase().trim();

    // Auto-reply for greetings (only in DM, not groups)
    if (!isGroup) {
      if (/^(halo|hai|hi|hello|hey|hey|pagi|siang|sore|malam|assalam)/i.test(lowerText)) {
        const greeting = this.getGreeting();
        await this.sendMessage(from, `${greeting}\n\nKetik *p help* untuk melihat daftar command yang tersedia. 🎮`);
        return;
      }

      // Auto-reply for unknown messages
      if (lowerText.length > 2) {
        // Check if they might be trying to use a command
        if (lowerText.startsWith('p') && !lowerText.startsWith('p ')) {
          await this.sendMessage(from, `❓ Maksudnya *p help*? Ketik *p help* untuk melihat daftar command. 😊`);
          return;
        }
      }
    }

    // Log non-command message
    await db.addWaLog({
      type: 'incoming',
      sender: fromJid(sender),
      message: text.slice(0, 200),
      groupId: isGroup ? from : undefined,
    }).catch(() => {});
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 11) return '🌅 Selamat pagi!';
    if (hour < 15) return '☀️ Selamat siang!';
    if (hour < 18) return '🌤️ Selamat sore!';
    return '🌙 Selamat malam!';
  }

  private async sendMessage(to: string, text: string) {
    if (!this.socket) return;

    try {
      await this.socket.sendMessage(to, { text });
      this.commandHandler.incrementSent();

      // Update bot stats
      const stats = this.commandHandler.getStats();
      await db.updateBotStatus({
        messagesSent: stats.messagesSent,
        messagesReceived: stats.messagesReceived,
      }).catch(() => {});
    } catch (err: any) {
      console.error('[BOT] Error sending message:', err.message);
    }
  }

  /**
   * Send broadcast message to all configured groups
   */
  async broadcast(text: string): Promise<number> {
    if (!this.socket) return 0;

    let sent = 0;
    for (const jid of this.config.groupJids) {
      try {
        await this.socket.sendMessage(jid, { text });
        sent++;
      } catch (err: any) {
        console.error(`[BOT] Broadcast error to ${jid}:`, err.message);
      }
    }
    return sent;
  }

  private getMessageText(msg: proto.IWebMessageInfo): string | null {
    try {
      // Direct text message
      if (msg.message?.conversation) {
        return msg.message.conversation;
      }
      // Extended text message (replies, etc)
      if (msg.message?.extendedTextMessage?.text) {
        return msg.message.extendedTextMessage.text;
      }
      // Image with caption
      if (msg.message?.imageMessage?.caption) {
        return msg.message.imageMessage.caption;
      }
      // Video with caption
      if (msg.message?.videoMessage?.caption) {
        return msg.message.videoMessage.caption;
      }
    } catch {}
    return null;
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[BOT] Max reconnect attempts (${this.maxReconnectAttempts}) reached. Stopping WA reconnection.`);
      console.log('[BOT] Bot continues running in API-only mode.');
      this.connectionStatus = 'disconnected';
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 120000);

    console.log(`[BOT] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(async () => {
      try {
        if (this.socket) {
          try { this.socket.end(undefined); } catch {}
          this.socket = null;
        }
        await this.connect();
      } catch (err: any) {
        console.error('[BOT] Reconnect failed:', err.message || err);
        // Don't re-throw — just let the next reconnect attempt happen
        this.scheduleReconnect();
      }
    }, delay);
  }
}
