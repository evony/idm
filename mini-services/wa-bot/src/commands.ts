/**
 * IDM WA Bot - Command Handlers
 * All bot commands are processed here
 */

import type { CommandContext, BotConfig } from './types';
import type { ApiClient } from './api-client';
import * as db from './database';
import { isAdmin, formatPoints, tierEmoji, divisionLabel, statusEmoji, formatUptime, formatDate, truncate } from './utils';

interface CommandResult {
  text: string;
  mentions?: string[];
}

export class CommandHandler {
  private config: BotConfig;
  private api: ApiClient;
  private startTime: number;
  private messagesReceived: number = 0;
  private messagesSent: number = 0;
  private commandsProcessed: number = 0;

  constructor(config: BotConfig, api: ApiClient) {
    this.config = config;
    this.api = api;
    this.startTime = Date.now();
  }

  incrementReceived() { this.messagesReceived++; }
  incrementSent() { this.messagesSent++; }

  getStats() {
    return {
      messagesReceived: this.messagesReceived,
      messagesSent: this.messagesSent,
      commandsProcessed: this.commandsProcessed,
      uptime: Date.now() - this.startTime,
      startTime: new Date(this.startTime).toISOString(),
    };
  }

  async handle(ctx: CommandContext): Promise<CommandResult | null> {
    this.commandsProcessed++;
    const { command } = ctx;

    // Log command
    await db.addWaLog({
      type: 'command',
      sender: ctx.sender,
      message: truncate(ctx.rawText, 200),
      command: command,
      groupId: ctx.groupId,
    }).catch(() => {});

    try {
      switch (command) {
        case 'help': return await this.cmdHelp(ctx);
        case 'daftar': return await this.cmdDaftar(ctx);
        case 'info': return await this.cmdInfo(ctx);
        case 'batal': return await this.cmdBatal(ctx);
        case 'ranking': return await this.cmdRanking(ctx);
        case 'status': return await this.cmdStatus(ctx);
        case 'recap': return await this.cmdRecap(ctx);
        case 'next': return await this.cmdNext(ctx);
        case 'live': return await this.cmdLive(ctx);
        // Admin commands
        case 'result': return await this.cmdResult(ctx);
        case 'mvp': return await this.cmdMvp(ctx);
        case 'start': return await this.cmdStart(ctx);
        case 'end': return await this.cmdEnd(ctx);
        case 'broadcast': return await this.cmdBroadcast(ctx);
        case 'ban': return await this.cmdBan(ctx);
        case 'unban': return await this.cmdUnban(ctx);
        case 'cekgrup': return await this.cmdCekGrup(ctx);
        case 'botinfo': return await this.cmdBotInfo(ctx);
        default:
          return { text: `❓ Command tidak dikenali: *${command}*\n\nKetik *p help* untuk melihat daftar command.` };
      }
    } catch (err: any) {
      console.error(`[CMD] Error in ${command}:`, err.message);
      await db.addWaLog({
        type: 'error',
        sender: ctx.sender,
        command: command,
        message: err.message,
        isError: true,
      }).catch(() => {});
      return { text: `⚠️ Terjadi error saat memproses command *${command}*.\n\n_${truncate(err.message, 200)}_\n\nCoba lagi nanti atau hubungi admin.` };
    }
  }

  // ══════════════════════════════════════════
  // PUBLIC COMMANDS
  // ══════════════════════════════════════════

  async cmdHelp(_ctx: CommandContext): Promise<CommandResult> {
    return {
      text: `📖 *TARKAM IDM Bot Commands*

🎮 *Player Commands:*
• *p daftar* <gamertag> <M/F> [nama] [club]
  Daftar peserta turnamen
• *p info* — Cek status registrasi kamu
• *p batal* — Batalkan registrasi pending
• *p ranking* [M/F] — Top 10 leaderboard
• *p status* [gamertag] — Cek stats pemain
• *p recap* [M/F] — Recap turnamen
• *p next* [gamertag] — Match selanjutnya
• *p live* [M/F] — Match sedang berlangsung
• *p botinfo* — Info bot

👑 *Admin Commands:*
• *p result* <matchId> <skor1>-<skor2>
• *p mvp* <matchId> <nickname>
• *p start* <tournamentId>
• *p end* <tournamentId>
• *p broadcast* <pesan>
• *p cekgrup*

💡 _M = Male, F = Female_
💡 _Pakai format: p daftar NickName M NamaAsli ClubName_`,
    };
  }

  async cmdDaftar(ctx: CommandContext): Promise<CommandResult> {
    const { args, sender } = ctx;

    if (args.length < 2) {
      return {
        text: `❌ Format salah!\n\n✏️ *p daftar* <gamertag> <M/F> [nama] [club]\n\n📌 Contoh:\n• p daftar NightWolf M\n• p daftar StarDancer F Rina Velvet\n\n💡 M = Male, F = Female`,
      };
    }

    const gamertag = args[0];
    const divInput = args[1].toUpperCase();
    const division = divInput === 'M' ? 'M' : divInput === 'F' ? 'F' : null;

    if (!division) {
      return { text: `❌ Divisi tidak valid! Gunakan *M* (Male) atau *F* (Female).\n\nContoh: p daftar NightWolf M` };
    }

    // Check if gamertag already exists and is active
    const existingPlayer = await db.findPlayerByGamertag(gamertag);
    if (existingPlayer) {
      return {
        text: `⚠️ Gamertag *${gamertag}* sudah terdaftar!\n\n📊 Stats: ${tierEmoji(existingPlayer.tier)} Tier ${existingPlayer.tier} | ${formatPoints(existingPlayer.points)} pts | ${existingPlayer.totalWins}W ${existingPlayer.matches}M\n\nKalau ini akun kamu, hubungi admin untuk verifikasi.`,
      };
    }

    // Check if sender already has pending registration
    const senderPhone = sender.split('@')[0];
    const existingReg = await db.getWaRegistration(senderPhone);
    if (existingReg && existingReg.status === 'pending') {
      return {
        text: `⚠️ Kamu sudah punya registrasi pending!\n\n📋 Gamertag: *${existingReg.gamertag}*\n📊 Divisi: ${divisionLabel(existingReg.division)}\n📅 Daftar: ${formatDate(existingReg.createdAt)}\n\nKetik *p batal* untuk membatalkan, atau tunggu admin approve.`,
      };
    }

    const name = args[2] || gamertag;
    const clubName = args[3] || '';

    // Find active tournament for this division
    const divisionFull = division === 'M' ? 'male' : 'female';
    let tournamentId: string | undefined;
    try {
      const activeTournament = await db.getActiveTournament(divisionFull);
      if (activeTournament?.tournamentId) {
        tournamentId = activeTournament.tournamentId;
      }
    } catch {}

    // Create registration
    const reg = await db.createWaRegistration({
      waNumber: senderPhone,
      gamertag,
      name,
      division,
      city: '',
      clubName: clubName || undefined,
      tournamentId,
    });

    return {
      text: `✅ *Registrasi Berhasil!*

📋 *Detail Pendaftaran:*
• Gamertag: *${gamertag}*
• Nama: ${name}
• Divisi: ${divisionLabel(division)}
• Club: ${clubName || '-'}
• Kode Verifikasi: \`${reg.verificationCode.slice(0, 8)}\`

⏳ Status: *Menunggu Approval Admin*

${tournamentId ? '🔗 Terhubung ke tournament aktif' : '⚠️ Belum ada tournament aktif, registrasi akan masuk antrian'}

💡 Admin akan memverifikasi dan approve pendaftaran kamu. Kamu akan dikabari setelah di-approve!`,
    };
  }

  async cmdInfo(ctx: CommandContext): Promise<CommandResult> {
    const senderPhone = ctx.sender.split('@')[0];

    // Check WA registration
    const reg = await db.getWaRegistration(senderPhone);

    // Check if linked player exists
    const player = await db.findPlayerByWaNumber(senderPhone);

    let text = `📱 *Info Akun Kamu*\n\n`;
    text += `📞 Nomor: ${senderPhone}\n\n`;

    if (reg) {
      text += `📋 *Registrasi WA:*\n`;
      text += `• Gamertag: *${reg.gamertag}*\n`;
      text += `• Divisi: ${divisionLabel(reg.division)}\n`;
      text += `• Status: *${reg.status === 'pending' ? '⏳ Menunggu' : reg.status === 'approved' ? '✅ Disetujui' : reg.status === 'rejected' ? '❌ Ditolak' : reg.status === 'registered' ? '📝 Terdaftar' : reg.status}*\n`;
      text += `• Tier: ${reg.assignedTier ? `${tierEmoji(reg.assignedTier)} ${reg.assignedTier}` : 'Belum ditentukan'}\n`;
      text += `• Daftar: ${formatDate(reg.createdAt)}\n\n`;
    } else {
      text += `📋 Belum ada registrasi WA.\nKetik *p daftar <gamertag> <M/F>* untuk mendaftar.\n\n`;
    }

    if (player) {
      text += `🎮 *Profil Player:*\n`;
      text += `• ${tierEmoji(player.tier)} Tier ${player.tier}\n`;
      text += `• ${divisionLabel(player.division)}\n`;
      text += `• ${formatPoints(player.points)} pts\n`;
      text += `• ${player.totalWins}W / ${player.matches}M | ${player.totalMvp} MVP\n`;
      text += `• Streak: ${player.streak}🔥 (Max: ${player.maxStreak})\n`;
      if (player.club) text += `• Club: ${player.club}\n`;
    }

    return { text };
  }

  async cmdBatal(ctx: CommandContext): Promise<CommandResult> {
    const senderPhone = ctx.sender.split('@')[0];
    const cancelled = await db.cancelWaRegistration(senderPhone);

    if (cancelled) {
      return { text: `✅ Registrasi pending kamu berhasil dibatalkan.\n\nKetik *p daftar <gamertag> <M/F>* untuk mendaftar ulang.` };
    }
    return { text: `❌ Tidak ada registrasi pending yang bisa dibatalkan.\n\nKetik *p info* untuk cek status registrasi kamu.` };
  }

  async cmdRanking(ctx: CommandContext): Promise<CommandResult> {
    const divInput = (ctx.args[0] || 'M').toUpperCase();
    const division = divInput === 'F' ? 'female' : 'male';

    const leaderboard = await db.getLeaderboard(division, 10);

    if (leaderboard.length === 0) {
      return { text: `📊 Belum ada data ranking untuk divisi ${divisionLabel(division)}.` };
    }

    const medals = ['🥇', '🥈', '🥉'];
    let text = `🏆 *Top 10 Leaderboard — ${divisionLabel(division)}*\n\n`;

    leaderboard.forEach((entry, i) => {
      const medal = i < 3 ? medals[i] : `${i + 1}.`;
      const tier = tierEmoji(entry.tier);
      text += `${medal} *${entry.gamertag}* ${tier}\n`;
      text += `   ${formatPoints(entry.points)} pts · ${entry.totalWins}W · ${entry.totalMvp} MVP · 🔥${entry.streak}\n`;
      if (entry.club) text += `   🏠 ${entry.club}\n`;
    });

    text += `\n💡 Ketik *p status <gamertag>* untuk detail pemain`;
    return { text };
  }

  async cmdStatus(ctx: CommandContext): Promise<CommandResult> {
    const gamertag = ctx.args[0];

    if (!gamertag) {
      // Show own status
      const senderPhone = ctx.sender.split('@')[0];
      const player = await db.findPlayerByWaNumber(senderPhone);
      if (!player) {
        return { text: `❌ Kamu belum terhubung ke akun player.\n\nKetik *p status <gamertag>* untuk cek stats pemain lain.` };
      }
      return this.formatPlayerStatus(player);
    }

    const player = await db.findPlayerByGamertag(gamertag);
    if (!player) {
      return { text: `❌ Player *${gamertag}* tidak ditemukan.\n\nPastikan gamertag benar (case-insensitive).` };
    }

    return this.formatPlayerStatus(player);
  }

  private formatPlayerStatus(player: any): CommandResult {
    const winRate = player.matches > 0 ? ((player.totalWins / player.matches) * 100).toFixed(1) : '0';
    const mvpRate = player.matches > 0 ? ((player.totalMvp / player.matches) * 100).toFixed(1) : '0';

    return {
      text: `🎮 *${player.gamertag}* ${tierEmoji(player.tier)} Tier ${player.tier}

📊 *Stats — ${divisionLabel(player.division)}*
• Points: *${formatPoints(player.points)}*
• Wins: ${player.totalWins}/${player.matches} (${winRate}%)
• MVP: ${player.totalMvp} (${mvpRate}%)
• Streak: ${player.streak}🔥 (Max: ${player.maxStreak})
${player.club ? `• Club: ${player.club}` : ''}`,
    };
  }

  async cmdRecap(ctx: CommandContext): Promise<CommandResult> {
    const divInput = (ctx.args[0] || 'M').toUpperCase();
    const division = divInput === 'F' ? 'female' : 'male';

    const recap = await db.getTournamentRecap(division);

    let text = `📊 *Recap Turnamen — ${divisionLabel(division)}*\n\n`;

    if (recap.season) {
      text += `📅 Season: *${recap.season.name}* (${statusEmoji(recap.season.status)} ${recap.season.status})\n`;
    }
    text += `👥 Players: ${recap.players.total} total, ${recap.players.active} aktif\n`;
    text += `⚔️ Matches: ${recap.matches.total} total, ${recap.matches.completed} selesai, ${recap.matches.live} live\n\n`;

    if (recap.topPlayers.length > 0) {
      text += `🏆 *Top 5 Players:*\n`;
      recap.topPlayers.forEach((p: any, i: number) => {
        text += `${i + 1}. *${p.gamertag}* ${tierEmoji(p.tier)} — ${formatPoints(p.points)} pts | ${p.totalWins}W | ${p.totalMvp} MVP\n`;
      });
    }

    if (recap.topClubs.length > 0) {
      text += `\n🏠 *Top 5 Clubs:*\n`;
      recap.topClubs.forEach((c: any, i: number) => {
        text += `${i + 1}. *${c.name}* — ${formatPoints(c.points)} pts | ${c.wins}W ${c.losses}L\n`;
      });
    }

    return { text };
  }

  async cmdNext(ctx: CommandContext): Promise<CommandResult> {
    const gamertag = ctx.args[0];

    if (!gamertag) {
      // Try to find by WA number
      const senderPhone = ctx.sender.split('@')[0];
      const player = await db.findPlayerByWaNumber(senderPhone);
      if (!player) {
        return { text: `❌ Kamu belum terhubung ke akun player.\n\nKetik *p next <gamertag>* untuk cek match selanjutnya.` };
      }
      return this.formatNextMatch(player.gamertag);
    }

    return this.formatNextMatch(gamertag);
  }

  private async formatNextMatch(gamertag: string): Promise<CommandResult> {
    const match = await db.getNextMatch(gamertag);

    if (!match) {
      return { text: `📅 Tidak ada match selanjutnya untuk *${gamertag}*.\n\nMungkin semua match sudah selesai atau belum ada bracket.` };
    }

    return {
      text: `📅 *Match Selanjutnya*

⚔️ ${match.team1.name} VS ${match.team2.name}
📊 Round ${match.round} · Match #${match.matchNumber}
🎮 Format: ${match.format}
${match.scheduledAt ? `🕐 ${formatDate(match.scheduledAt)}` : '⏳ Belum dijadwalkan'}
${match.tournament ? `🏆 ${match.tournament.name} (Week ${match.tournament.weekNumber})` : ''}`,
    };
  }

  async cmdLive(ctx: CommandContext): Promise<CommandResult> {
    const divInput = (ctx.args[0] || 'M').toUpperCase();
    const division = divInput === 'F' ? 'female' : 'male';

    const matches = await db.getLiveMatches(division);

    if (matches.length === 0) {
      return { text: `🔴 Tidak ada match live saat ini untuk divisi ${divisionLabel(division)}.\n\nCek lagi nanti!` };
    }

    let text = `🔴 *Live Matches — ${divisionLabel(division)}*\n\n`;
    matches.forEach((m: any) => {
      text += `⚔️ *${m.team1.name}* ${m.score1 ?? 0} - ${m.score2 ?? 0} *${m.team2.name}*\n`;
      text += `   Round ${m.round} · #${m.matchNumber} · ${m.format}\n`;
      if (m.mvpPlayer) text += `   💎 MVP: ${m.mvpPlayer.gamertag}\n`;
      text += `\n`;
    });

    return { text };
  }

  async cmdBotInfo(_ctx: CommandContext): Promise<CommandResult> {
    const stats = this.getStats();
    return {
      text: `🤖 *TARKAM IDM Bot*

📊 *Bot Stats:*
• Uptime: ${formatUptime(stats.uptime)}
• Pesan Masuk: ${stats.messagesReceived}
• Pesan Keluar: ${stats.messagesSent}
• Commands Diproses: ${stats.commandsProcessed}
• Mulai: ${formatDate(stats.startTime)}

🛠️ Tech: Baileys + Express + PostgreSQL
📝 Ketik *p help* untuk daftar command`,
    };
  }

  // ══════════════════════════════════════════
  // ADMIN COMMANDS
  // ══════════════════════════════════════════

  private requireAdmin(ctx: CommandContext): boolean {
    if (!isAdmin(ctx.sender, this.config)) {
      return false;
    }
    return true;
  }

  async cmdResult(ctx: CommandContext): Promise<CommandResult> {
    if (!this.requireAdmin(ctx)) {
      return { text: `⛔ Command ini hanya untuk admin.` };
    }

    const matchId = ctx.args[0];
    const scoreStr = ctx.args[1];

    if (!matchId || !scoreStr) {
      return { text: `❌ Format: *p result* <matchId> <skor1>-<skor2>\n\nContoh: p result abc123 2-1` };
    }

    const scoreParts = scoreStr.split('-');
    if (scoreParts.length !== 2) {
      return { text: `❌ Format skor salah! Gunakan: <skor1>-<skor2>\n\nContoh: 2-1` };
    }

    const score1 = parseInt(scoreParts[0]);
    const score2 = parseInt(scoreParts[1]);

    if (isNaN(score1) || isNaN(score2)) {
      return { text: `❌ Skor harus berupa angka!\n\nContoh: 2-1` };
    }

    const result = await db.updateMatchResult(matchId, score1, score2);

    return {
      text: `✅ *Match Result Updated!*

⚔️ Match: ${matchId}
📊 Score: ${score1} - ${score2}
🏆 Winner: ${result.winner === 'draw' ? 'Seri' : result.winner}`,
    };
  }

  async cmdMvp(ctx: CommandContext): Promise<CommandResult> {
    if (!this.requireAdmin(ctx)) {
      return { text: `⛔ Command ini hanya untuk admin.` };
    }

    const matchId = ctx.args[0];
    const gamertag = ctx.args[1];

    if (!matchId || !gamertag) {
      return { text: `❌ Format: *p mvp* <matchId> <nickname>\n\nContoh: p mvp abc123 NightWolf` };
    }

    const result = await db.setMatchMvp(matchId, gamertag);

    return {
      text: `✅ *MVP Set!*

💎 Match: ${matchId}
🏆 MVP: *${result.mvp}*`,
    };
  }

  async cmdStart(ctx: CommandContext): Promise<CommandResult> {
    if (!this.requireAdmin(ctx)) {
      return { text: `⛔ Command ini hanya untuk admin.` };
    }

    const tournamentId = ctx.args[0];
    if (!tournamentId) {
      return { text: `❌ Format: *p start* <tournamentId>\n\nGunakan tournament ID untuk memulai turnamen.` };
    }

    // This would call the main app API to start tournament
    return { text: `🚀 Tournament *${tournamentId}* dimulai!\n\n⚠️ Note: Gunakan Admin Panel di web app untuk kontrol turnamen yang lebih lengkap.` };
  }

  async cmdEnd(ctx: CommandContext): Promise<CommandResult> {
    if (!this.requireAdmin(ctx)) {
      return { text: `⛔ Command ini hanya untuk admin.` };
    }

    const tournamentId = ctx.args[0];
    if (!tournamentId) {
      return { text: `❌ Format: *p end* <tournamentId>\n\nGunakan tournament ID untuk mengakhiri turnamen.` };
    }

    return { text: `🏁 Tournament *${tournamentId}* diakhiri!\n\n⚠️ Note: Gunakan Admin Panel di web app untuk finalisasi turnamen yang lebih lengkap.` };
  }

  async cmdBroadcast(ctx: CommandContext): Promise<CommandResult> {
    if (!this.requireAdmin(ctx)) {
      return { text: `⛔ Command ini hanya untuk admin.` };
    }

    const message = ctx.args.join(' ');
    if (!message) {
      return { text: `❌ Format: *p broadcast* <pesan>\n\nPesan akan dikirim ke semua grup yang bot ikuti.` };
    }

    // This is handled by the bot core (returned as special command)
    return {
      text: `📢 *Broadcast Message:*\n\n${message}\n\n_Pesan ini akan dikirim ke semua grup._`,
    };
  }

  async cmdBan(ctx: CommandContext): Promise<CommandResult> {
    if (!this.requireAdmin(ctx)) {
      return { text: `⛔ Command ini hanya untuk admin.` };
    }

    const gamertag = ctx.args[0];
    if (!gamertag) {
      return { text: `❌ Format: *p ban* <gamertag>` };
    }

    const player = await db.findPlayerByGamertag(gamertag);
    if (!player) {
      return { text: `❌ Player *${gamertag}* tidak ditemukan.` };
    }

    // Deactivate player
    const pool = db.getPool();
    await pool.query(`UPDATE "Player" SET "isActive" = false WHERE id = $1`, [player.id]);

    return { text: `🚫 Player *${gamertag}* telah di-ban (dinonaktifkan).` };
  }

  async cmdUnban(ctx: CommandContext): Promise<CommandResult> {
    if (!this.requireAdmin(ctx)) {
      return { text: `⛔ Command ini hanya untuk admin.` };
    }

    const gamertag = ctx.args[0];
    if (!gamertag) {
      return { text: `❌ Format: *p unban* <gamertag>` };
    }

    const pool = db.getPool();
    const result = await pool.query(
      `UPDATE "Player" SET "isActive" = true WHERE gamertag ILIKE $1 RETURNING gamertag`,
      [gamertag]
    );

    if (result.rows.length === 0) {
      return { text: `❌ Player *${gamertag}* tidak ditemukan.` };
    }

    return { text: `✅ Player *${gamertag}* telah di-unban (diaktifkan kembali).` };
  }

  async cmdCekGrup(ctx: CommandContext): Promise<CommandResult> {
    if (!this.requireAdmin(ctx)) {
      return { text: `⛔ Command ini hanya untuk admin.` };
    }

    const groupId = ctx.groupId;
    if (!groupId) {
      return { text: `❌ Command ini hanya bisa digunakan di dalam grup.` };
    }

    return {
      text: `📋 *Info Grup:*\n\n• Group JID: ${groupId}\n• Sender: ${ctx.sender.split('@')[0]}\n• Is Group: ${ctx.isGroup}\n\n✅ Bot aktif di grup ini.`,
    };
  }
}
