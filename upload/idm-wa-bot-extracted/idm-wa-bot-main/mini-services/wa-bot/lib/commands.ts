// ============================================================
// TARKAM WA Bot - commands.ts v2.0 PREMIUM
// ============================================================
// Prefix: "p" (contoh: p help, p daftar, p ranking)
// Premium template: TARKAM branding + website footer
// Footer: https://idolmeta.vercel.app
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Types ───────────────────────────────────────────────────
type SendFunction = (to: string, text: string) => Promise<void>;
type GroupSendFunction = (text: string) => Promise<void>;
type ReplyFunction = (text: string) => Promise<void>;

let sendFn: SendFunction | null = null;
let groupSendFn: GroupSendFunction | null = null;

// ─── Per-Message Reply Context ────────────────────────────────
let activeReplyFn: ReplyFunction | null = null;

// ─── Admin Numbers ───────────────────────────────────────────
const ADMIN_NUMBERS_RAW = (process.env.ADMIN_NUMBERS || process.env.ADMIN_WA_NUMBERS || '').split(',').map(s => s.trim()).filter(Boolean);

// ─── Normalize WA Number ────────────────────────────────────
function normalizeWaNumber(num: string): string {
  let n = num.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '');
  n = n.replace(/^\+/, '');
  if (/^08/.test(n)) n = '62' + n.substring(1);
  if (/^8\d{8,12}$/.test(n)) n = '62' + n;
  return n;
}

const ADMIN_NUMBERS = ADMIN_NUMBERS_RAW.map(n => normalizeWaNumber(n));

// ─── Premium Template System ─────────────────────────────────
const WEBSITE_URL = 'https://idolmeta.vercel.app';

/** Premium header for TARKAM bot messages */
function header(title: string): string {
  return `┌──────────────────────────────────┐\n│  ⚡ TARKAM · Tournament Bot v2.0  │\n└──────────────────────────────────┘\n\n${title}\n${'─'.repeat(34)}`;
}

/** Premium footer with website link */
function footer(): string {
  return `${'─'.repeat(34)}\n🌐 ${WEBSITE_URL}`;
}

/** Wrap content with premium header + footer */
function premium(title: string, body: string): string {
  return `${header(title)}\n\n${body}\n\n${footer()}`;
}

/** Premium error message */
function premiumError(title: string, body: string): string {
  return `${header(title)}\n\n${body}\n\n${footer()}`;
}

/** Premium success message */
function premiumSuccess(title: string, body: string): string {
  return `${header(title)}\n\n${body}\n\n${footer()}`;
}

/** Premium broadcast message for group announcements */
function premiumBroadcast(title: string, body: string): string {
  return `${header(title)}\n\n${body}\n\n${footer()}`;
}

// ─── Send Function Registration ──────────────────────────────
export function setSendFunction(fn: SendFunction) {
  sendFn = fn;
}

export function setGroupSendFunction(fn: GroupSendFunction) {
  groupSendFn = fn;
}

async function reply(to: string, text: string) {
  if (activeReplyFn) {
    await activeReplyFn(text);
    return;
  }
  if (sendFn) await sendFn(to, text);
}

async function broadcastToGroup(text: string) {
  if (groupSendFn) await groupSendFn(text);
}

// ─── Helpers ─────────────────────────────────────────────────
function isAdmin(sender: string): boolean {
  const num = normalizeWaNumber(sender);
  return ADMIN_NUMBERS.includes(num);
}

function extractSenderNumber(sender: string): string {
  return normalizeWaNumber(sender);
}

/** Convert WA number (62812xxx) to local phone format (0812xxx) for matching Player.phone */
function waNumberToLocalPhone(waNum: string): string {
  let n = waNum.replace(/^\+/, '');
  if (n.startsWith('62') && n.length >= 10) {
    n = '0' + n.slice(2);
  }
  return n;
}

async function findTeamByName(name: string, tournamentId?: string) {
  const team = await prisma.team.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      ...(tournamentId ? { tournamentId } : {}),
    },
    include: { teamPlayers: { include: { player: true } } },
  });
  if (team) return team;

  const player = await prisma.player.findFirst({
    where: { gamertag: { equals: name, mode: 'insensitive' } },
  });
  if (!player) return null;

  const teamPlayer = await prisma.teamPlayer.findFirst({
    where: { playerId: player.id },
    include: { team: { include: { teamPlayers: { include: { player: true } } } } },
  });
  return teamPlayer?.team || null;
}

function calculateWinPoints(streak: number): number {
  let pts = 3;
  if (streak >= 5) pts += 2;
  else if (streak >= 3) pts += 1;
  return pts;
}

/** Fetch payment info from CMS settings and build a WhatsApp-friendly payment section */
async function buildPaymentSection(): Promise<string> {
  const paymentSettings = await prisma.cmsSetting.findMany({
    where: {
      key: {
        in: [
          'registration_admin_wa_link',
          'registration_payment_instructions',
          'donation_dana_number',
          'donation_ovo_number',
          'donation_shopeepay_number',
          'donation_payment_holder',
        ],
      },
    },
  });
  const pMap: Record<string, string> = {};
  for (const s of paymentSettings) {
    if (s.value) pMap[s.key] = s.value;
  }

  const holder = pMap['donation_payment_holder'];
  const dana = pMap['donation_dana_number'];
  const ovo = pMap['donation_ovo_number'];
  const shopee = pMap['donation_shopeepay_number'];
  const adminWaLink = pMap['registration_admin_wa_link'];
  const instructions = pMap['registration_payment_instructions'];

  if (!holder && !dana && !ovo && !shopee && !adminWaLink) {
    return `\n\n${'─'.repeat(34)}\n💳 *PEMBAYARAN REGISTRASI*\n\n💡  Silakan hubungi admin untuk konfirmasi pembayaran dan informasi biaya pendaftaran.`;
  }

  let section = `\n\n${'─'.repeat(34)}\n💳 *PEMBAYARAN REGISTRASI*`;

  if (holder) {
    section += `\n\n👤 Atas Nama: *${holder}*`;
  }

  if (dana || ovo || shopee) {
    section += '\n\n📱 *Metode Pembayaran:*';
    if (dana) section += `\n├ 💵 DANA: ${dana}`;
    if (ovo) section += `\n├ 💜 OVO: ${ovo}`;
    if (shopee) section += `\n└ 🧡 ShopeePay: ${shopee}`;
  }

  if (instructions) {
    section += `\n\n📝 ${instructions}`;
  }

  if (adminWaLink) {
    section += `\n\n💬 Konfirmasi pembayaran:`;
    section += `\n${adminWaLink}`;
  }

  return section;
}

// ─── Command: p help ─────────────────────────────────────────
async function cmdHelp(args: string[], sender: string) {
  const adminNote = isAdmin(sender) ? `

  👑  Admin
  ├ p broadcast <pesan>
  ├ p cekgrup
  ├ p result <matchId> <skor1>-<skor2>
  ├ p mvp <matchId> <nickname>
  ├ p start <tournamentId>
  ├ p end <tournamentId>
  ├ p ban <nickname>
  └ p unban <nickname>` : '';

  const body = `  📝  Pendaftaran
  ├ p daftar <nickname> <M/F> [club]
  ├ p info          → Cek status daftar
  └ p batal         → Batalkan daftar

  🏆  Turnamen
  ├ p ranking       → Leaderboard
  ├ p status        → Skor pemain
  ├ p recap         → Rekap turnamen
  ├ p next          → Match selanjutnya
  └ p live          → Match berlangsung${adminNote}

💡  Contoh Penggunaan
  › p daftar bambang m
  › p daftar bambang m Gymshark
  › p status bambang`;

  await reply(sender, premium('📋  PANDUAN COMMAND', body));
}

// ─── Command: p daftar ───────────────────────────────────────
async function cmdDaftar(args: string[], sender: string) {
  const waNumber = extractSenderNumber(sender);

  if (args.length < 2) {
    const body = `❌ Format salah!

📝 *Format:*
p daftar <nickname> <M/F> [club]

💡 *Contoh:*
• p daftar bambang m
• p daftar bambang m Gymshark
• p daftar indy f Maximous

🏷️ M = Male Division
🏷️ F = Female Division`;
    await reply(sender, premiumError('DAFTAR', body));
    return;
  }

  const gamertag = args[0];
  const division = args[1].toUpperCase();

  if (!['M', 'F'].includes(division)) {
    const body = `❌ Divisi harus *M* atau *F*!

💡 *Contoh:* p daftar bambang m`;
    await reply(sender, premiumError('DAFTAR', body));
    return;
  }

  // Parse optional club — format: p daftar <nickname> <M/F> [club]
  // Name is always same as nickname
  const playerName = gamertag;
  const clubName = args[2] || '';

  // Find active tournament
  const tournament = await prisma.tournament.findFirst({
    where: { status: { in: ['registration', 'approval'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (!tournament) {
    await reply(sender, premiumError('DAFTAR', '❌ Belum ada turnamen yang buka pendaftaran.\n\nCek jadwal terbaru di website!'));
    return;
  }

  // ──── Duplicate Check 1: WaRegistration by waNumber ────
  // Only block if status is NOT rejected (rejected = boleh daftar ulang)
  const existing = await prisma.waRegistration.findFirst({
    where: { waNumber, tournamentId: tournament.id, status: { notIn: ['rejected'] } },
  });

  if (existing) {
    const body = `⚠️ Kamu sudah terdaftar!

🏆 ${tournament.name}
📋 Status: *${existing.status.toUpperCase()}*
💡 Ketik *p info* untuk detail lengkap`;
    await reply(sender, premium('DAFTAR', body));
    return;
  }

  // ──── Duplicate Check 2: WaRegistration by gamertag ────
  // Only block if status is NOT rejected (rejected = boleh daftar ulang)
  const existingGamertag = await prisma.waRegistration.findFirst({
    where: { gamertag: { equals: gamertag, mode: 'insensitive' }, tournamentId: tournament.id, status: { notIn: ['rejected'] } },
  });

  if (existingGamertag) {
    await reply(sender, premiumError('DAFTAR', `⚠️ Nickname *${gamertag}* sudah terdaftar!\n\nPilih nickname lain atau hubungi admin.`));
    return;
  }

  // ──── Duplicate Check 3: Player already has Participation in this tournament (web registration) ────
  // This prevents someone who registered via web/app from re-registering via WA bot
  // Exception: rejected participations allow re-registration
  const existingPlayer = await prisma.player.findFirst({
    where: { gamertag: { equals: gamertag, mode: 'insensitive' } },
  });

  if (existingPlayer) {
    const existingParticipation = await prisma.participation.findUnique({
      where: { playerId_tournamentId: { playerId: existingPlayer.id, tournamentId: tournament.id } },
    });

    if (existingParticipation && existingParticipation.status !== 'rejected') {
      const statusEmoji: Record<string, string> = {
        registered: '📝', approved: '✅', rejected: '❌', assigned: '🎯',
      };
      await reply(sender, premiumError('DAFTAR', `⚠️ Nickname *${gamertag}* sudah terdaftar di turnamen ini!

📋 Status: ${statusEmoji[existingParticipation.status] || '❓'} ${existingParticipation.status.toUpperCase()}
🏆 Turnamen: ${tournament.name}

💡 Kamu tidak perlu mendaftar lagi. Ketik *p info* untuk cek status.`));
      return;
    }
  }

  // ──── Duplicate Check 4: WA number matches existing Player who has Participation ────
  // This prevents someone from using a different gamertag with a WA number that's already linked to a registered player
  // WA numbers are stored as "62812xxx" while Player.phone may be "0812xxx", so check both formats
  const localPhone = waNumberToLocalPhone(waNumber);
  const playerByWaNumber = await prisma.player.findFirst({
    where: {
      OR: [
        { waNumber },
        { phone: { equals: waNumber } },
        { phone: { equals: localPhone } },
      ],
    },
  });

  if (playerByWaNumber && playerByWaNumber.id !== existingPlayer?.id) {
    const participationByPhone = await prisma.participation.findUnique({
      where: { playerId_tournamentId: { playerId: playerByWaNumber.id, tournamentId: tournament.id } },
    });

    if (participationByPhone && participationByPhone.status !== 'rejected') {
      const statusEmoji: Record<string, string> = {
        registered: '📝', approved: '✅', rejected: '❌', assigned: '🎯',
      };
      await reply(sender, premiumError('DAFTAR', `⚠️ Nomor WA ini sudah terdaftar di turnamen ini!

🎮 Akun terdaftar: *${playerByWaNumber.gamertag}*
📋 Status: ${statusEmoji[participationByPhone.status] || '❓'} ${participationByPhone.status.toUpperCase()}
🏆 Turnamen: ${tournament.name}

💡 Satu nomor WA hanya untuk satu peserta. Hubungi admin jika ada kendala.`));
      return;
    }
  }

  // Find or create Player (reuse existingPlayer from duplicate check 3)
  let player = existingPlayer;

  if (!player) {
    player = await prisma.player.create({
      data: {
        gamertag,
        name: playerName,
        division: division === 'M' ? 'male' : 'female',
        waNumber,
        isActive: true,
      },
    });
  } else {
    if (!player.waNumber) {
      await prisma.player.update({
        where: { id: player.id },
        data: { waNumber },
      });
    }
  }

  // Create or reactivate WaRegistration
  // If there's a previously rejected registration, reactivate it instead of creating duplicate
  const existingRejectedReg = await prisma.waRegistration.findFirst({
    where: {
      OR: [
        { waNumber, tournamentId: tournament.id },
        { gamertag: { equals: gamertag, mode: 'insensitive' }, tournamentId: tournament.id },
      ],
      status: 'rejected',
    },
  });

  if (existingRejectedReg) {
    await prisma.waRegistration.update({
      where: { id: existingRejectedReg.id },
      data: {
        gamertag,
        name: playerName,
        clubName,
        division,
        status: 'pending',
      },
    });
  } else {
    await prisma.waRegistration.create({
      data: {
        waNumber,
        gamertag,
        name: playerName,
        clubName,
        division,
        city: '',
        status: 'pending',
        tournamentId: tournament.id,
      },
    });
  }

  // Create or update Participation
  const existingParticipation = await prisma.participation.findUnique({
    where: { playerId_tournamentId: { playerId: player.id, tournamentId: tournament.id } },
  });

  if (!existingParticipation) {
    await prisma.participation.create({
      data: {
        playerId: player.id,
        tournamentId: tournament.id,
        status: 'registered',
      },
    });
  } else if (existingParticipation.status === 'rejected') {
    // Re-registration: update rejected participation back to registered
    await prisma.participation.update({
      where: { id: existingParticipation.id },
      data: { status: 'registered' },
    });
  }

  // ──── Fetch payment info from CMS settings ────
  const paymentSection = await buildPaymentSection();

  const body = `✅ *Pendaftaran Berhasil!*

🎮 Nickname: *${gamertag}*
👤 Nama: ${playerName}
🏛️ Club: ${clubName || '-'}
🏷️ Divisi: *${division === 'M' ? 'Male' : 'Female'}*
🏆 Turnamen: ${tournament.name}
⏳ Status: Menunggu konfirmasi${paymentSection}

💡 Ketik *p info* untuk cek status pendaftaran`;

  await reply(sender, premiumSuccess('DAFTAR', body));

  await broadcastToGroup(premiumBroadcast('🆕 PENDAFTARAN BARU', `🎮 *${gamertag}* (${division === 'M' ? 'Male' : 'Female'})${clubName ? `\n🏛️ ${clubName}` : ''}\n🏆 ${tournament.name}`));
}

// ─── Command: p info ─────────────────────────────────────────
async function cmdInfo(args: string[], sender: string) {
  const waNumber = extractSenderNumber(sender);

  const registration = await prisma.waRegistration.findFirst({
    where: { waNumber },
    orderBy: { createdAt: 'desc' },
    include: { tournament: true },
  });

  if (!registration) {
    await reply(sender, premiumError('INFO', `❌ Kamu belum terdaftar.\n\n📝 Ketik *p daftar <tag> <M/F>* untuk mendaftar.`));
    return;
  }

  const player = await prisma.player.findFirst({ where: { waNumber } });
  let partStatus = '-';
  if (player && registration.tournamentId) {
    const participation = await prisma.participation.findUnique({
      where: { playerId_tournamentId: { playerId: player.id, tournamentId: registration.tournamentId } },
    });
    partStatus = participation?.status || '-';
  }

  const emoji: Record<string, string> = {
    pending: '⏳', approved: '✅', rejected: '❌',
    registered: '📝', assigned: '🎯', expired: '⌛',
  };

  const body = `📋 *Status Pendaftaran*

🎮 Nickname: *${registration.gamertag}*
🏆 Turnamen: ${registration.tournament?.name || '-'}
🏛️ Club: ${registration.clubName || '-'}
🏷️ Divisi: ${registration.division === 'M' ? 'Male' : 'Female'}
📋 Registrasi: ${emoji[registration.status] || '❓'} ${registration.status.toUpperCase()}
📋 Partisipasi: ${emoji[partStatus] || '❓'} ${partStatus === '-' ? '-' : partStatus.toUpperCase()}
📅 Terdaftar: ${registration.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  // Show payment info if registration is still pending (not yet approved)
  let paymentReminder = '';
  if (registration.status === 'pending' || partStatus === 'registered') {
    paymentReminder = await buildPaymentSection();
  }

  await reply(sender, premium('INFO PEMAIN', body + paymentReminder));
}

// ─── Command: p batal ────────────────────────────────────────
async function cmdBatal(args: string[], sender: string) {
  const waNumber = extractSenderNumber(sender);

  // First, check if user has ANY registration regardless of status
  const anyRegistration = await prisma.waRegistration.findFirst({
    where: { waNumber },
    orderBy: { createdAt: 'desc' },
  });

  if (!anyRegistration) {
    await reply(sender, premiumError('BATAL', '❌ Kamu belum terdaftar.\n\n📝 Ketik *p daftar <nickname> <M/F>* untuk mendaftar.'));
    return;
  }

  // Check if registration is in a cancellable status
  const registration = await prisma.waRegistration.findFirst({
    where: { waNumber, status: { in: ['pending', 'registered'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (!registration) {
    // User has registration but it's already approved/rejected — can't self-cancel
    const statusEmoji: Record<string, string> = {
      pending: '⏳', approved: '✅', rejected: '❌',
      registered: '📝', assigned: '🎯',
    };
    const status = anyRegistration.status;
    let info = '';

    if (status === 'approved' || status === 'assigned') {
      info = `📋 Status pendaftaran kamu: *${statusEmoji[status] || '❓'} ${status.toUpperCase()}*

⚠️ Pendaftaran yang sudah disetujui tidak bisa dibatalkan sendiri.

💬 Hubungi admin untuk pembatalan.`;
    } else if (status === 'rejected') {
      info = `📋 Status pendaftaran kamu: *❌ REJECTED*

Pendaftaran sebelumnya sudah ditolak/dibatalkan.

💡 Mau daftar lagi? Ketik *p daftar <nickname> <M/F>*`;
    } else {
      info = `📋 Status pendaftaran kamu: *${statusEmoji[status] || '❓'} ${status.toUpperCase()}*

💬 Hubungi admin untuk pembatalan.`;
    }

    await reply(sender, premium('BATAL', info));
    return;
  }

  await prisma.waRegistration.update({
    where: { id: registration.id },
    data: { status: 'rejected' },
  });

  const player = await prisma.player.findFirst({ where: { waNumber } });
  if (player) {
    await prisma.participation.updateMany({
      where: { playerId: player.id, ...(registration.tournamentId ? { tournamentId: registration.tournamentId } : {}), status: 'registered' },
      data: { status: 'rejected' },
    });
  }

  const body = `✅ Pendaftaran dibatalkan.

🎮 Nickname: *${registration.gamertag}*
🏆 Turnamen: ${registration.tournament?.name || '-'}

💡 Mau daftar lagi? Ketik *p daftar <nickname> <M/F>*`;
  await reply(sender, premiumSuccess('BATAL', body));
}

// ─── Command: p ranking ──────────────────────────────────────
async function cmdRanking(args: string[], sender: string) {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    orderBy: [
      { points: 'desc' },
      { totalWins: 'desc' },
      { streak: 'desc' },
    ],
    take: 10,
  });

  if (players.length === 0) {
    await reply(sender, premiumError('LEADERBOARD', '❌ Belum ada data pemain.\n\nJadilah yang pertama! Daftar sekarang: *p daftar*'));
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const lines = players.map((p, i) => {
    const medal = i < 3 ? medals[i] : `${(i + 1).toString().padStart(2)}.`;
    const losses = p.matches - p.totalWins;
    const divTag = p.division === 'male' ? '🔵' : '🟣';
    return `${medal} *${p.gamertag}* ${divTag}\n    💎 ${p.points}pts │ 🎮 ${p.totalWins}W/${losses}L │ 🔥${p.streak}`;
  });

  const body = `🏆 *Top ${players.length} Pemain*\n\n${lines.join('\n\n')}\n\n💡 Cek statistik lengkap: *p status [nickname]*`;

  await reply(sender, premium('LEADERBOARD', body));
}

// ─── Command: p status ───────────────────────────────────────
async function cmdStatus(args: string[], sender: string) {
  let player;

  if (args.length > 0) {
    const gamertag = args.join(' ');
    player = await prisma.player.findFirst({
      where: { gamertag: { equals: gamertag, mode: 'insensitive' } },
    });
    if (!player) {
      await reply(sender, premiumError('STATUS', `❌ Pemain *${gamertag}* gak ketemu.\n\n💡 Cek leaderboard: *p ranking*`));
      return;
    }
  } else {
    const waNumber = extractSenderNumber(sender);
    player = await prisma.player.findFirst({ where: { waNumber } });
    if (!player) {
      await reply(sender, premiumError('STATUS', '❌ Kamu belum terdaftar.\n\n📝 Ketik *p daftar <tag> <M/F>* untuk mendaftar.'));
      return;
    }
  }

  const losses = player.matches - player.totalWins;
  const winRate = player.matches > 0 ? ((player.totalWins / player.matches) * 100).toFixed(1) : '0.0';
  const divEmoji = player.division === 'male' ? '🔵' : '🟣';
  const tier = player.tier || 'B';
  const tierMap: Record<string, string> = { 'S': '🟡 S-Tier', 'A': '🟢 A-Tier', 'B': '🔵 B-Tier', 'C': '⚪ C-Tier', 'D': '🟤 D-Tier' };

  const body = `${divEmoji} *${player.gamertag}* — ${player.division === 'male' ? 'Male' : 'Female'} Division

💎 Poin: *${player.points} pts*
🏆 Tier: *${tierMap[tier] || tier}*

🎮 *Rekam Jejak:*
├ 🎮 Menang: ${player.totalWins}
├ 💔 Kalah: ${losses}
├ 📈 Win Rate: ${winRate}%
├ 🎮 Total Match: ${player.matches}
└ 🔥 Streak: ${player.streak} (max ${player.maxStreak})

⭐ MVP: *${player.totalMvp}x*
📋 Status: ${player.isActive ? '✅ Aktif' : '🚫 Banned'}`;

  await reply(sender, premium('PROFIL PEMAIN', body));
}

// ─── Command: p recap ────────────────────────────────────────
async function cmdRecap(args: string[], sender: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { status: { in: ['main_event', 'approval', 'registration'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (!tournament) {
    await reply(sender, premiumError('REKAP', '❌ Gak ada turnamen aktif saat ini.\n\nCek jadwal terbaru di website!'));
    return;
  }

  const [totalMatches, completed, live, pending, totalTeams] = await Promise.all([
    prisma.match.count({ where: { tournamentId: tournament.id } }),
    prisma.match.count({ where: { tournamentId: tournament.id, status: 'completed' } }),
    prisma.match.count({ where: { tournamentId: tournament.id, status: 'live' } }),
    prisma.match.count({ where: { tournamentId: tournament.id, status: { in: ['pending', 'ready'] } } }),
    prisma.team.count({ where: { tournamentId: tournament.id } }),
  ]);

  const recentMatches = await prisma.match.findMany({
    where: { tournamentId: tournament.id, status: 'completed' },
    orderBy: { completedAt: 'desc' },
    take: 5,
    include: {
      team1: { include: { teamPlayers: { include: { player: true } } } },
      team2: { include: { teamPlayers: { include: { player: true } } } },
      mvpPlayer: true,
    },
  });

  const matchLines = recentMatches.map(m => {
    const winner = m.score1 > m.score2 ? m.team1.name : m.team2.name;
    const mvpText = m.mvpPlayer ? ` ⭐${m.mvpPlayer.gamertag}` : '';
    return `├ ${m.team1.name} ${m.score1}-${m.score2} ${m.team2.name} → 🏆${winner}${mvpText}`;
  });

  const recentText = matchLines.length > 0
    ? `\n\n🕐 *Hasil Terakhir:*\n${matchLines.join('\n')}`
    : '';

  const body = `🏆 ${tournament.name}
📋 Status: *${tournament.status.toUpperCase()}*

📊 *Statistik:*
├ 👥 Tim: ${totalTeams}
├ 🎮 Total Match: ${totalMatches}
├ ✅ Selesai: ${completed}
├ 🔴 Live: ${live}
└ ⏳ Menunggu: ${pending}${recentText}`;

  await reply(sender, premium('REKAP TURNAMEN', body));
}

// ─── Command: p next ─────────────────────────────────────────
async function cmdNext(args: string[], sender: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { status: { in: ['main_event', 'approval'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (!tournament) {
    await reply(sender, premiumError('NEXT MATCH', '❌ Gak ada turnamen aktif saat ini.'));
    return;
  }

  const nextMatch = await prisma.match.findFirst({
    where: {
      tournamentId: tournament.id,
      status: { in: ['pending', 'ready'] },
    },
    orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
    include: {
      team1: { include: { teamPlayers: { include: { player: true } } } },
      team2: { include: { teamPlayers: { include: { player: true } } } },
    },
  });

  if (!nextMatch) {
    await reply(sender, premium('NEXT MATCH', '✅ Semua match sudah selesai atau sedang live!\n\n🔴 Cek match live: *p live*'));
    return;
  }

  const t1 = nextMatch.team1.teamPlayers.map(tp => tp.player.gamertag).join(', ');
  const t2 = nextMatch.team2.teamPlayers.map(tp => tp.player.gamertag).join(', ');

  const body = `🏆 ${tournament.name}
🏷️ ${nextMatch.bracket.toUpperCase()} · Round ${nextMatch.round}
🎮 Format: BO ${nextMatch.format}
📋 Match #${nextMatch.matchNumber} · ${nextMatch.status.toUpperCase()}

🔴 *${nextMatch.team1.name}*
   ${t1 || '-'}

🎵 *VS* 🎵

🟢 *${nextMatch.team2.name}*
   ${t2 || '-'}`;

  await reply(sender, premium('NEXT MATCH', body));
}

// ─── Command: p live ─────────────────────────────────────────
async function cmdLive(args: string[], sender: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { status: { in: ['main_event'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (!tournament) {
    await reply(sender, premiumError('LIVE', '❌ Gak ada turnamen yang lagi jalan.'));
    return;
  }

  const liveMatches = await prisma.match.findMany({
    where: { tournamentId: tournament.id, status: 'live' },
    include: {
      team1: { include: { teamPlayers: { include: { player: true } } } },
      team2: { include: { teamPlayers: { include: { player: true } } } },
    },
  });

  if (liveMatches.length === 0) {
    await reply(sender, premium('LIVE', '✅ Gak ada match yang live sekarang.\n\n⏭️ Cek match selanjutnya: *p next*'));
    return;
  }

  const lines = liveMatches.map(m => {
    const t1 = m.team1.teamPlayers.map(tp => tp.player.gamertag).join(', ');
    const t2 = m.team2.teamPlayers.map(tp => tp.player.gamertag).join(', ');
    return `🔴 *LIVE* — ${m.bracket.toUpperCase()} R${m.round} #${m.matchNumber}

🎵 ${m.team1.name} *${m.score1}* - *${m.score2}* ${m.team2.name}
(${t1} vs ${t2})`;
  });

  await reply(sender, premium(`LIVE — ${tournament.name}`, lines.join('\n\n')));
}

// ─── Command: p result (ADMIN) ───────────────────────────────
async function cmdResult(args: string[], sender: string) {
  if (!isAdmin(sender)) {
    await reply(sender, premiumError('RESULT', '❌ Khusus admin.\n\n💡 Hubungi admin untuk input hasil match.'));
    return;
  }

  if (args.length < 2) {
    const body = `❌ Format salah!

📝 *Format:*
p result <matchId> <skor1>-<skor2>

💡 *Contoh:* p result abc123 2-1`;
    await reply(sender, premiumError('RESULT', body));
    return;
  }

  const matchId = args[0];
  const scoreParts = args[1].split('-');

  if (scoreParts.length !== 2) {
    await reply(sender, premiumError('RESULT', '❌ Format skor: <skor1>-<skor2>\n\n💡 *Contoh:* 2-1'));
    return;
  }

  const score1 = parseInt(scoreParts[0]);
  const score2 = parseInt(scoreParts[1]);

  if (isNaN(score1) || isNaN(score2)) {
    await reply(sender, premiumError('RESULT', '❌ Skor harus angka!'));
    return;
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      team1: { include: { teamPlayers: { include: { player: true } } } },
      team2: { include: { teamPlayers: { include: { player: true } } } },
      tournament: true,
    },
  });

  if (!match) {
    await reply(sender, premiumError('RESULT', `❌ Match *${matchId}* gak ketemu.`));
    return;
  }

  if (match.status === 'completed') {
    await reply(sender, premium('RESULT', `⚠️ Match udah selesai!\n\n📊 Skor: ${match.score1}-${match.score2}`));
    return;
  }

  const winnerTeamId = score1 > score2 ? match.team1Id : match.team2Id;
  const loserTeamId = score1 > score2 ? match.team2Id : match.team1Id;
  const winnerTeam = score1 > score2 ? match.team1 : match.team2;
  const isDraw = score1 === score2;

  // Update match
  await prisma.match.update({
    where: { id: matchId },
    data: {
      score1,
      score2,
      status: 'completed',
      completedAt: new Date(),
      winnerId: isDraw ? null : winnerTeamId,
      loserId: isDraw ? null : loserTeamId,
    },
  });

  if (!isDraw) {
    await prisma.team.update({
      where: { id: winnerTeamId },
      data: { isWinner: true },
    });
  }

  // Update player stats
  for (const tp of match.team1.teamPlayers) {
    const isWinner = !isDraw && match.team1Id === winnerTeamId;
    await updatePlayerStats(tp.player, isWinner, match);
  }
  for (const tp of match.team2.teamPlayers) {
    const isWinner = !isDraw && match.team2Id === winnerTeamId;
    await updatePlayerStats(tp.player, isWinner, match);
  }

  const resultBody = isDraw
    ? `🏁 *Hasil Match*\n\n🎵 ${match.team1.name} *${score1}* - *${score2}* ${match.team2.name}\n🤝 SERI!`
    : `🏁 *Hasil Match*\n\n🎵 ${match.team1.name} *${score1}* - *${score2}* ${match.team2.name}\n🏆 *${winnerTeam.name}* menang!`;

  await broadcastToGroup(premiumBroadcast('🏁 HASIL MATCH', resultBody));
  await reply(sender, premiumSuccess('RESULT', `✅ Hasil terinput!\n\n${resultBody}`));
}

/** Update player stats after a match */
async function updatePlayerStats(
  player: { id: string; streak: number; maxStreak: number },
  isWinner: boolean,
  match: { id: string; tournamentId: string }
) {
  const currentStreak = isWinner ? player.streak + 1 : 0;
  const newMaxStreak = Math.max(player.maxStreak, currentStreak);

  await prisma.player.update({
    where: { id: player.id },
    data: {
      matches: { increment: 1 },
      ...(isWinner ? { totalWins: { increment: 1 } } : {}),
      streak: currentStreak,
      maxStreak: newMaxStreak,
    },
  });

  if (isWinner) {
    const pts = calculateWinPoints(currentStreak);
    await prisma.player.update({
      where: { id: player.id },
      data: { points: { increment: pts } },
    });

    await prisma.playerPoint.create({
      data: {
        playerId: player.id,
        tournamentId: match.tournamentId,
        matchId: match.id,
        amount: pts,
        reason: currentStreak >= 5 ? 'win_streak_5' : currentStreak >= 3 ? 'win_streak_3' : 'win',
        description: `Match win (+${pts}pts${currentStreak >= 3 ? `, streak ${currentStreak}` : ''})`,
      },
    });
  }
}

// ─── Command: p mvp (ADMIN) ──────────────────────────────────
async function cmdMvp(args: string[], sender: string) {
  if (!isAdmin(sender)) {
    await reply(sender, premiumError('MVP', '❌ Khusus admin.'));
    return;
  }

  if (args.length < 2) {
    const body = `❌ Format salah!

📝 *Format:*
p mvp <matchId> <nickname>

💡 *Contoh:* p mvp abc123 PlayerOne`;
    await reply(sender, premiumError('MVP', body));
    return;
  }

  const matchId = args[0];
  const gamertag = args.slice(1).join(' ');

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    await reply(sender, premiumError('MVP', `❌ Match *${matchId}* gak ketemu.`));
    return;
  }

  if (match.status !== 'completed') {
    await reply(sender, premiumError('MVP', '❌ Match belum selesai!\n\n💡 Input hasil dulu: *p result <matchId> <skor>*'));
    return;
  }

  const player = await prisma.player.findFirst({
    where: { gamertag: { equals: gamertag, mode: 'insensitive' } },
  });

  if (!player) {
    await reply(sender, premiumError('MVP', `❌ Pemain *${gamertag}* gak ketemu.`));
    return;
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { mvpPlayerId: player.id },
  });

  await prisma.player.update({
    where: { id: player.id },
    data: {
      totalMvp: { increment: 1 },
      points: { increment: 2 },
    },
  });

  await prisma.playerPoint.create({
    data: {
      playerId: player.id,
      tournamentId: match.tournamentId,
      matchId: match.id,
      amount: 2,
      reason: 'mvp',
      description: 'MVP bonus (+2pts)',
    },
  });

  await broadcastToGroup(premiumBroadcast('⭐ MVP', `⭐ *${player.gamertag}* terpilih sebagai MVP Match #${match.matchNumber}!\n\n💎 +2 poin bonus`));
  await reply(sender, premiumSuccess('MVP', `✅ MVP diset: *${player.gamertag}*\n\nMatch #${match.matchNumber} · +2pts bonus`));
}

// ─── Command: p start (ADMIN) ────────────────────────────────
async function cmdStart(args: string[], sender: string) {
  if (!isAdmin(sender)) {
    await reply(sender, premiumError('START', '❌ Khusus admin.'));
    return;
  }

  if (args.length < 1) {
    await reply(sender, premiumError('START', '❌ Format: *p start <tournamentId>*'));
    return;
  }

  const tournamentId = args[0];

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    await reply(sender, premiumError('START', '❌ Turnamen gak ketemu.'));
    return;
  }

  if (tournament.status === 'main_event') {
    await reply(sender, premium('START', '⚠️ Turnamen udah jalan!'));
    return;
  }

  if (tournament.status === 'completed') {
    await reply(sender, premium('START', '⚠️ Turnamen udah selesai!'));
    return;
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: 'main_event' },
  });

  await prisma.match.updateMany({
    where: { tournamentId, status: 'pending' },
    data: { status: 'ready' },
  });

  await prisma.participation.updateMany({
    where: { tournamentId, status: 'registered' },
    data: { status: 'approved' },
  });

  await prisma.waRegistration.updateMany({
    where: { tournamentId, status: 'pending' },
    data: { status: 'approved' },
  });

  const teamCount = await prisma.team.count({ where: { tournamentId } });

  await broadcastToGroup(premiumBroadcast('🚀 TURNAMEN DIMULAI!', `🏆 ${tournament.name}\n👥 ${teamCount} tim bertanding\n🎮 Selamat bertanding! 💪`));
  await reply(sender, premiumSuccess('START', `✅ *${tournament.name}* dimulai!\n\n📋 Status: MAIN_EVENT\n👥 ${teamCount} tim siap bertanding`));
}

// ─── Command: p end (ADMIN) ──────────────────────────────────
async function cmdEnd(args: string[], sender: string) {
  if (!isAdmin(sender)) {
    await reply(sender, premiumError('END', '❌ Khusus admin.'));
    return;
  }

  if (args.length < 1) {
    await reply(sender, premiumError('END', '❌ Format: *p end <tournamentId>*'));
    return;
  }

  const tournamentId = args[0];

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    await reply(sender, premiumError('END', '❌ Turnamen gak ketemu.'));
    return;
  }

  if (tournament.status === 'completed') {
    await reply(sender, premium('END', '⚠️ Turnamen udah selesai!'));
    return;
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: 'completed' },
  });

  const topPlayers = await prisma.player.findMany({
    where: {
      participations: { some: { tournamentId } },
      isActive: true,
    },
    orderBy: [{ points: 'desc' }, { totalWins: 'desc' }],
    take: 3,
  });

  const medals = ['🥇', '🥈', '🥉'];
  const standings = topPlayers.map((p, i) => `${medals[i]} ${p.gamertag} — ${p.points}pts (${p.totalWins}W)`).join('\n');

  await broadcastToGroup(premiumBroadcast('🎊 TURNAMEN SELESAI!', `🏆 ${tournament.name}\n\n🏅 *Final Standings:*\n${standings}\n\n🙏 Makasih semua!`));
  await reply(sender, premiumSuccess('END', `✅ *${tournament.name}* selesai!\n\n📋 Status: COMPLETED`));
}

// ─── Command: p ban (ADMIN) ──────────────────────────────────
async function cmdBan(args: string[], sender: string) {
  if (!isAdmin(sender)) {
    await reply(sender, premiumError('BAN', '❌ Khusus admin.'));
    return;
  }

  if (args.length < 1) {
    await reply(sender, premiumError('BAN', '❌ Format: *p ban <nickname>*'));
    return;
  }

  const gamertag = args.join(' ');

  const player = await prisma.player.findFirst({
    where: { gamertag: { equals: gamertag, mode: 'insensitive' } },
  });

  if (!player) {
    await reply(sender, premiumError('BAN', `❌ Pemain *${gamertag}* gak ketemu.`));
    return;
  }

  if (!player.isActive) {
    await reply(sender, premium('BAN', `⚠️ *${gamertag}* udah di-ban.`));
    return;
  }

  await prisma.player.update({
    where: { id: player.id },
    data: { isActive: false },
  });

  await broadcastToGroup(premiumBroadcast('🚫 BAN', `🚫 *${gamertag}* di-ban oleh admin.`));
  await reply(sender, premiumSuccess('BAN', `🚫 *${gamertag}* berhasil di-ban.`));
}

// ─── Command: p unban (ADMIN) ────────────────────────────────
async function cmdUnban(args: string[], sender: string) {
  if (!isAdmin(sender)) {
    await reply(sender, premiumError('UNBAN', '❌ Khusus admin.'));
    return;
  }

  if (args.length < 1) {
    await reply(sender, premiumError('UNBAN', '❌ Format: *p unban <nickname>*'));
    return;
  }

  const gamertag = args.join(' ');

  const player = await prisma.player.findFirst({
    where: { gamertag: { equals: gamertag, mode: 'insensitive' } },
  });

  if (!player) {
    await reply(sender, premiumError('UNBAN', `❌ Pemain *${gamertag}* gak ketemu.`));
    return;
  }

  if (player.isActive) {
    await reply(sender, premium('UNBAN', `⚠️ *${gamertag}* gak di-ban.`));
    return;
  }

  await prisma.player.update({
    where: { id: player.id },
    data: { isActive: true },
  });

  await broadcastToGroup(premiumBroadcast('✅ UNBAN', `✅ *${gamertag}* di-unban oleh admin.`));
  await reply(sender, premiumSuccess('UNBAN', `✅ *${gamertag}* berhasil di-unban.`));
}

// ─── Command: p broadcast (ADMIN) ────────────────────────────
async function cmdBroadcast(args: string[], sender: string) {
  if (!isAdmin(sender)) {
    await reply(sender, premiumError('BROADCAST', '❌ Khusus admin.'));
    return;
  }

  const message = args.join(' ');
  if (!message) {
    const body = `❌ Format salah!

📝 *Format:*
p broadcast <pesan>

💡 *Contoh:* p broadcast Turnamen mulai 20:30 WITA!`;
    await reply(sender, premiumError('BROADCAST', body));
    return;
  }

  await broadcastToGroup(premiumBroadcast('📢 PENGUMUMAN', message));
  await reply(sender, premiumSuccess('BROADCAST', '✅ Pengumuman terkirim ke grup!'));
}

// ─── Command: p cekgrup (ADMIN) ──────────────────────────────
async function cmdCekGrup(args: string[], sender: string) {
  if (!isAdmin(sender)) {
    await reply(sender, premiumError('BOT INFO', '❌ Khusus admin.'));
    return;
  }

  const body = `🤖 *TARKAM Bot Status*

├ ✅ Bot: Aktif
├ 📡 DM: ${sendFn ? '✅ OK' : '❌ Not Set'}
├ 📡 Group: ${groupSendFn ? '✅ OK' : '❌ Not Set'}
├ 👑 Admins: ${ADMIN_NUMBERS.length}
└ 🕐 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Makassar' })}`;

  await reply(sender, premium('BOT INFO', body));
}

// ─── Command Router ──────────────────────────────────────────
const commands: Record<string, (args: string[], sender: string) => Promise<void>> = {
  help: cmdHelp,
  daftar: cmdDaftar,
  info: cmdInfo,
  batal: cmdBatal,
  ranking: cmdRanking,
  status: cmdStatus,
  recap: cmdRecap,
  next: cmdNext,
  live: cmdLive,
  result: cmdResult,
  mvp: cmdMvp,
  start: cmdStart,
  end: cmdEnd,
  ban: cmdBan,
  unban: cmdUnban,
  broadcast: cmdBroadcast,
  cekgrup: cmdCekGrup,
};

// ─── Message Handler ─────────────────────────────────────────
export async function handleMessage(text: string, sender: string, replyFn?: (text: string) => Promise<void>) {
  if (!text) return;

  const trimmed = text.trim();

  const isPCommand = /^[pP][\s.,]/.test(trimmed);
  if (!isPCommand) return;

  const content = trimmed.slice(2).trim();
  if (!content) return;

  const parts = content.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Set per-message reply function (for group replies)
  activeReplyFn = replyFn || null;

  const handler = commands[cmd];
  if (handler) {
    try {
      await handler(args, sender);
    } catch (error: any) {
      console.error(`[CMD ERROR] p ${cmd}:`, error.message);
      await reply(sender, premiumError('ERROR', `❌ Terjadi kesalahan.\n\n🔧 ${error.message || 'Coba lagi nanti.'}`));
    }
  } else {
    await reply(sender, premiumError('404', `❓ Command *${cmd}* gak dikenali.\n\n💡 Ketik *p help* untuk daftar command.`));
  }

  // Clear per-message reply function after handling
  activeReplyFn = null;
}

// ─── Command List (for API endpoint) ────────────────────────
export function getCommandList() {
  return Object.keys(commands).map(cmd => `p ${cmd}`);
}
