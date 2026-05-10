/**
 * WhatsApp Bot Service for Idol Meta Weekly
 * Using Baileys WhatsApp Web API
 * 
 * Port: 3001
 * Main API: http://localhost:3000
 */

import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { io } from 'socket.io-client';

const PORT = 3001;
const MAIN_API = 'http://localhost:3000';

// Logger setup
const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// Socket connection to main app
let mainSocket: ReturnType<typeof io> | null = null;

// Connect to main app socket
function connectToMainApp() {
  mainSocket = io(MAIN_API, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  });

  mainSocket.on('connect', () => {
    logger.info('Connected to main app');
  });

  mainSocket.on('disconnect', () => {
    logger.warn('Disconnected from main app');
  });

  // Listen for commands from main app
  mainSocket.on('wa:send', async (data: { to: string; message: string }) => {
    logger.info(`Send message to ${data.to}: ${data.message}`);
    // Handle send message request
  });

  mainSocket.on('wa:broadcast', async (data: { message: string }) => {
    logger.info(`Broadcast message: ${data.message}`);
    // Handle broadcast request
  });
}

// WhatsApp connection
async function startWhatsApp() {
  const { version } = await fetchLatestBaileysVersion();
  logger.info(`Using Baileys version ${version}`);

  const { state, saveCreds } = await useMultiFileAuthState('./auth'); // eslint-disable-line react-hooks/rules-of-hooks

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: true,
    getMessage: async (key) => ({ conversation: '' })
  });

  // Handle connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('QR Code received, scan with WhatsApp');
      qrcode.generate(qr, { small: true });
      
      // Send QR to main app
      mainSocket?.emit('wa:qr', { qr });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.info(`Connection closed. Reconnecting: ${shouldReconnect}`);
      
      if (shouldReconnect) {
        startWhatsApp();
      }
    }

    if (connection === 'open') {
      logger.info('WhatsApp connection opened!');
      mainSocket?.emit('wa:connected');
    }
  });

  // Save credentials
  sock.ev.on('creds.update', saveCreds);

  // Handle incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const message of messages) {
      if (!message.key.fromMe && message.message) {
        const from = message.key.remoteJid || '';
        const text = message.message.conversation || 
                    message.message.extendedTextMessage?.text || '';

        logger.info(`Message from ${from}: ${text}`);

        // Log to main app
        mainSocket?.emit('wa:message', { from, text });

        // Process commands
        if (text.startsWith('!')) {
          await handleCommand(sock, from, text);
        }
      }
    }
  });

  return sock;
}

// Command handler
async function handleCommand(sock: any, from: string, text: string) {
  const args = text.slice(1).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  logger.info(`Command: ${command}, Args: ${args.join(', ')}`);

  switch (command) {
    case 'help':
      await sock.sendMessage(from, {
        text: `🎮 *Idol Meta Weekly Bot*

Available Commands:
!daftar [tournament_id] [team_name] - Register for tournament
!jadwal - Show upcoming matches
!tim [team_name] - Show team info
!bracket [tournament_id] - Show bracket
!info - Show tournament info
!help - Show this help message`
      });
      break;

    case 'jadwal':
      // Fetch from API
      try {
        const response = await fetch(`${MAIN_API}/api/matches?status=SCHEDULED&limit=5`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          let scheduleText = '📅 *Upcoming Matches:*\n\n';
          data.data.forEach((match: any, i: number) => {
            scheduleText += `${i + 1}. ${match.homeTeam?.name || 'TBD'} vs ${match.awayTeam?.name || 'TBD'}\n`;
            scheduleText += `   🕐 ${match.scheduledAt ? new Date(match.scheduledAt).toLocaleString('id-ID') : 'TBD'}\n\n`;
          });
          await sock.sendMessage(from, { text: scheduleText });
        } else {
          await sock.sendMessage(from, { text: 'No upcoming matches found.' });
        }
      } catch (error) {
        await sock.sendMessage(from, { text: 'Failed to fetch schedule. Please try again later.' });
      }
      break;

    case 'info':
      await sock.sendMessage(from, {
        text: `🎮 *Idol Meta Weekly*

Professional Esports Tournament Platform

Features:
✅ Auto Bracket Generation
✅ Multiple Tournament Types
✅ Real-time Updates
✅ Prize Pool Management
✅ WhatsApp Integration

Register now and compete!`
      });
      break;

    default:
      await sock.sendMessage(from, {
        text: `Unknown command: ${command}\nType !help for available commands.`
      });
  }

  // Log command to main app
  mainSocket?.emit('wa:command', { from, command, args });
}

// Start service
async function main() {
  logger.info(`Starting WhatsApp Bot Service on port ${PORT}`);

  // Connect to main app
  connectToMainApp();

  // Start WhatsApp
  await startWhatsApp();

  logger.info('WhatsApp Bot Service started');
}

main().catch(console.error);
