/**
 * IDM WA Bot - PostgreSQL Database Layer
 * Direct database access for bot-specific queries
 */

import { Pool } from 'pg';
import type { BotConfig, WaRegistration, PlayerData, LeaderboardEntry, SeasonData } from './types';

let pool: Pool | null = null;

export function initDatabase(config: BotConfig): Pool {
  if (pool) return pool;

  // Strip sslmode from URL since pg library handles it via ssl option
  const cleanUrl = config.databaseUrl.replace(/[?&]sslmode=[^&]+/, '');
  const needsSsl = config.databaseUrl.includes('sslmode=require') || config.databaseUrl.includes('neon.tech') || config.databaseUrl.includes('railway');

  pool = new Pool({
    connectionString: cleanUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected pool error:', err.message);
  });

  // Test connection
  pool.query('SELECT 1 as test').then(() => {
    console.log('[DB] ✅ PostgreSQL connected successfully');
  }).catch((err) => {
    console.error('[DB] ⚠️ PostgreSQL connection test failed:', err.message);
    console.log('[DB] Bot will continue running but DB operations may fail');
  });

  console.log('[DB] PostgreSQL pool initialized');
  return pool;
}

export function getPool(): Pool {
  if (!pool) throw new Error('Database not initialized. Call initDatabase() first.');
  return pool;
}

// ─── Player Queries ──────────────────────────────

export async function findPlayerByGamertag(gamertag: string): Promise<PlayerData | null> {
  const db = getPool();
  const result = await db.query(
    `SELECT p.*, cm."role" as club_role, cp.name as club_name
     FROM "Player" p
     LEFT JOIN "ClubMember" cm ON cm."playerId" = p.id AND cm."leftAt" IS NULL
     LEFT JOIN "ClubProfile" cp ON cp.id = cm."profileId"
     WHERE p.gamertag ILIKE $1 AND p."isActive" = true
     LIMIT 1`,
    [gamertag]
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    gamertag: row.gamertag,
    name: row.name,
    division: row.division,
    tier: row.tier,
    points: row.points,
    totalWins: row.totalWins,
    totalMvp: row.totalMvp,
    matches: row.matches,
    streak: row.streak,
    maxStreak: row.maxStreak,
    avatar: row.avatar,
    club: row.club_name || undefined,
  };
}

export async function findPlayerByWaNumber(waNumber: string): Promise<PlayerData | null> {
  const db = getPool();
  const result = await db.query(
    `SELECT p.* FROM "Player" p WHERE p."waNumber" = $1 AND p."isActive" = true LIMIT 1`,
    [waNumber]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    gamertag: row.gamertag,
    name: row.name,
    division: row.division,
    tier: row.tier,
    points: row.points,
    totalWins: row.totalWins,
    totalMvp: row.totalMvp,
    matches: row.matches,
    streak: row.streak,
    maxStreak: row.maxStreak,
    avatar: row.avatar,
  };
}

// ─── Leaderboard Queries ──────────────────────────

export async function getLeaderboard(division: string, limit: number = 10): Promise<LeaderboardEntry[]> {
  const db = getPool();
  const result = await db.query(
    `SELECT p.id, p.gamertag, p.name, p.division, p.tier, p.points, 
            p."totalWins", p."totalMvp", p.matches, p.streak,
            cp.name as club_name
     FROM "Player" p
     LEFT JOIN "ClubMember" cm ON cm."playerId" = p.id AND cm."leftAt" IS NULL
     LEFT JOIN "ClubProfile" cp ON cp.id = cm."profileId"
     WHERE p.division = $1 AND p."isActive" = true
     ORDER BY p.points DESC, p."totalWins" DESC, p."totalMvp" DESC
     LIMIT $2`,
    [division, limit]
  );

  return result.rows.map((row, index) => ({
    rank: index + 1,
    id: row.id,
    gamertag: row.gamertag,
    name: row.name,
    division: row.division,
    tier: row.tier,
    points: row.points,
    totalWins: row.totalWins,
    totalMvp: row.totalMvp,
    matches: row.matches,
    streak: row.streak,
    club: row.club_name || undefined,
  }));
}

// ─── Tournament / Match Queries ───────────────────

export async function getActiveTournament(division: string): Promise<SeasonData & { tournamentId?: string; tournamentName?: string; tournamentStatus?: string; weekNumber?: number } | null> {
  const db = getPool();
  const result = await db.query(
    `SELECT s.id, s.name, s.number, s.division, s.status,
            t.id as tournament_id, t.name as tournament_name, t.status as tournament_status, t."weekNumber"
     FROM "Season" s
     LEFT JOIN "Tournament" t ON t."seasonId" = s.id AND t.division = $1 
       AND t.status NOT IN ('completed', 'setup')
     WHERE s.division = $1 AND s.status = 'active'
     ORDER BY t."weekNumber" DESC
     LIMIT 1`,
    [division]
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    number: row.number,
    division: row.division,
    status: row.status,
    tournamentId: row.tournament_id,
    tournamentName: row.tournament_name,
    tournamentStatus: row.tournament_status,
    weekNumber: row.week_number,
  };
}

export async function getLiveMatches(division: string): Promise<any[]> {
  const db = getPool();
  const result = await db.query(
    `SELECT m.id, m.round, m."matchNumber", m."score1", m."score2", m.status, m.format,
            t1.name as team1_name, t2.name as team2_name,
            p.gamertag as mvp_gamertag
     FROM "Match" m
     JOIN "Team" t1 ON t1.id = m."team1Id"
     JOIN "Team" t2 ON t2.id = m."team2Id"
     LEFT JOIN "Player" p ON p.id = m."mvpPlayerId"
     JOIN "Tournament" tor ON tor.id = m."tournamentId"
     JOIN "Season" s ON s.id = tor."seasonId"
     WHERE s.division = $1 AND m.status = 'live'
     ORDER BY m.round, m."matchNumber"`,
    [division]
  );

  return result.rows.map(row => ({
    id: row.id,
    round: row.round,
    matchNumber: row.match_number,
    team1: { name: row.team1_name },
    team2: { name: row.team2_name },
    score1: row.score1,
    score2: row.score2,
    status: row.status,
    format: row.format,
    mvpPlayer: row.mvp_gamertag ? { gamertag: row.mvp_gamertag } : null,
  }));
}

export async function getNextMatch(gamertag: string): Promise<any | null> {
  const db = getPool();
  const result = await db.query(
    `SELECT m.id, m.round, m."matchNumber", m.status, m.format, m."scheduledAt",
            t1.name as team1_name, t2.name as team2_name,
            tor.name as tournament_name, tor."weekNumber"
     FROM "Match" m
     JOIN "Team" t1 ON t1.id = m."team1Id"
     JOIN "Team" t2 ON t2.id = m."team2Id"
     JOIN "Tournament" tor ON tor.id = m."tournamentId"
     JOIN "TeamPlayer" tp ON (tp."teamId" = t1.id OR tp."teamId" = t2.id)
     JOIN "Player" p ON p.id = tp."playerId"
     WHERE p.gamertag ILIKE $1 AND m.status IN ('pending', 'ready')
     ORDER BY m.round, m."matchNumber"
     LIMIT 1`,
    [gamertag]
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    round: row.round,
    matchNumber: row.match_number,
    team1: { name: row.team1_name },
    team2: { name: row.team2_name },
    status: row.status,
    format: row.format,
    scheduledAt: row.scheduled_at,
    tournament: { name: row.tournament_name, weekNumber: row.week_number },
  };
}

// ─── WA Registration Queries ──────────────────────

export async function createWaRegistration(data: {
  waNumber: string;
  gamertag: string;
  name: string;
  division: string;
  city: string;
  clubName?: string;
  tournamentId?: string;
}): Promise<WaRegistration> {
  const db = getPool();
  const result = await db.query(
    `INSERT INTO "WaRegistration" ("waNumber", "gamertag", "name", "division", "city", "clubName", "tournamentId", "status", "verificationCode", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', gen_random_uuid(), NOW(), NOW())
     RETURNING *`,
    [data.waNumber, data.gamertag, data.name, data.division, data.city, data.clubName || null, data.tournamentId || null]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    waNumber: row.waNumber,
    gamertag: row.gamertag,
    name: row.name,
    division: row.division,
    city: row.city,
    clubName: row.clubName,
    verificationCode: row.verificationCode,
    status: row.status,
    assignedTier: row.assignedTier,
    playerId: row.playerId,
    tournamentId: row.tournamentId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

export async function getWaRegistration(waNumber: string): Promise<WaRegistration | null> {
  const db = getPool();
  const result = await db.query(
    `SELECT * FROM "WaRegistration" WHERE "waNumber" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [waNumber]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    waNumber: row.waNumber,
    gamertag: row.gamertag,
    name: row.name,
    division: row.division,
    city: row.city,
    clubName: row.clubName,
    verificationCode: row.verificationCode,
    status: row.status,
    assignedTier: row.assignedTier,
    playerId: row.playerId,
    tournamentId: row.tournamentId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

export async function cancelWaRegistration(waNumber: string): Promise<boolean> {
  const db = getPool();
  const result = await db.query(
    `DELETE FROM "WaRegistration" WHERE "waNumber" = $1 AND status = 'pending'`,
    [waNumber]
  );
  return (result.rowCount ?? 0) > 0;
}

// ─── Tournament Recap ─────────────────────────────

export async function getTournamentRecap(division: string): Promise<any> {
  const db = getPool();

  const [seasonRes, playersRes, matchesRes, clubsRes] = await Promise.all([
    db.query(
      `SELECT * FROM "Season" WHERE division = $1 AND status = 'active' LIMIT 1`,
      [division]
    ),
    db.query(
      `SELECT COUNT(*) as total, SUM(CASE WHEN "totalWins" > 0 THEN 1 ELSE 0 END) as active_players
       FROM "Player" WHERE division = $1 AND "isActive" = true`,
      [division]
    ),
    db.query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
              SUM(CASE WHEN status = 'live' THEN 1 ELSE 0 END) as live
       FROM "Match" m
       JOIN "Tournament" t ON t.id = m."tournamentId"
       JOIN "Season" s ON s.id = t."seasonId"
       WHERE s.division = $1`,
      [division]
    ),
    db.query(
      `SELECT cp.name, c.points, c.wins, c.losses
       FROM "Club" c
       JOIN "ClubProfile" cp ON cp.id = c."profileId"
       JOIN "Season" s ON s.id = c."seasonId"
       WHERE s.division = $1 AND s.status = 'active'
       ORDER BY c.points DESC
       LIMIT 5`,
      [division]
    ),
  ]);

  const season = seasonRes.rows[0] || null;

  // Get top 5 players
  const topPlayersRes = await db.query(
    `SELECT p.gamertag, p.name, p.tier, p.points, p."totalWins", p."totalMvp", p.streak,
            cp.name as club_name
     FROM "Player" p
     LEFT JOIN "ClubMember" cm ON cm."playerId" = p.id AND cm."leftAt" IS NULL
     LEFT JOIN "ClubProfile" cp ON cp.id = cm."profileId"
     WHERE p.division = $1 AND p."isActive" = true
     ORDER BY p.points DESC LIMIT 5`,
    [division]
  );

  return {
    season: season ? { name: season.name, number: season.number, status: season.status } : null,
    players: { total: playersRes.rows[0]?.total || 0, active: playersRes.rows[0]?.active_players || 0 },
    matches: { total: matchesRes.rows[0]?.total || 0, completed: matchesRes.rows[0]?.completed || 0, live: matchesRes.rows[0]?.live || 0 },
    topPlayers: topPlayersRes.rows,
    topClubs: clubsRes.rows,
  };
}

// ─── Match Result & MVP (Admin) ───────────────────

export async function updateMatchResult(matchId: string, score1: number, score2: number): Promise<any> {
  const db = getPool();

  // Get match info
  const matchRes = await db.query(`SELECT * FROM "Match" WHERE id = $1`, [matchId]);
  if (matchRes.rows.length === 0) throw new Error('Match tidak ditemukan');
  const match = matchRes.rows[0];

  const winnerId = score1 > score2 ? match.team1Id : score2 > score1 ? match.team2Id : null;

  await db.query(
    `UPDATE "Match" SET "score1" = $1, "score2" = $2, "winnerId" = $3, "loserId" = $4, status = 'completed', "completedAt" = NOW() WHERE id = $5`,
    [score1, score2, winnerId, score1 > score2 ? match.team2Id : match.team1Id, matchId]
  );

  return { matchId, score1, score2, winner: winnerId ? 'team1' : score2 > score1 ? 'team2' : 'draw' };
}

export async function setMatchMvp(matchId: string, playerGamertag: string): Promise<any> {
  const db = getPool();

  const playerRes = await db.query(`SELECT id FROM "Player" WHERE gamertag ILIKE $1`, [playerGamertag]);
  if (playerRes.rows.length === 0) throw new Error(`Player "${playerGamertag}" tidak ditemukan`);

  await db.query(
    `UPDATE "Match" SET "mvpPlayerId" = $1 WHERE id = $2`,
    [playerRes.rows[0].id, matchId]
  );

  return { matchId, mvp: playerGamertag };
}

// ─── WhatsApp Bot Status Management ───────────────

export async function getBotStatus(): Promise<any> {
  const db = getPool();
  const result = await db.query(`SELECT * FROM "WhatsAppBot" LIMIT 1`);
  return result.rows[0] || null;
}

export async function updateBotStatus(data: { status?: string; messagesSent?: number; messagesReceived?: number; lastConnectedAt?: string }): Promise<void> {
  const db = getPool();
  const existing = await getBotStatus();

  if (!existing) {
    // Generate a cuid-like ID
    const id = 'bot_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await db.query(
      `INSERT INTO "WhatsAppBot" (id, name, status, "messagesSent", "messagesReceived", "lastConnectedAt", "createdAt", "updatedAt")
       VALUES ($1, 'TARKAM Bot', $2, $3, $4, $5, NOW(), NOW())`,
      [id, data.status || 'online', data.messagesSent || 0, data.messagesReceived || 0, data.lastConnectedAt || null]
    );
  } else {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.status !== undefined) { updates.push(`status = $${idx++}`); values.push(data.status); }
    if (data.messagesSent !== undefined) { updates.push(`"messagesSent" = $${idx++}`); values.push(data.messagesSent); }
    if (data.messagesReceived !== undefined) { updates.push(`"messagesReceived" = $${idx++}`); values.push(data.messagesReceived); }
    if (data.lastConnectedAt !== undefined) { updates.push(`"lastConnectedAt" = $${idx++}`); values.push(data.lastConnectedAt); }
    updates.push(`"updatedAt" = NOW()`);

    if (updates.length > 0) {
      values.push(existing.id);
      await db.query(
        `UPDATE "WhatsAppBot" SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      );
    }
  }
}

// ─── WhatsApp Log ─────────────────────────────────

export async function addWaLog(data: { type: string; sender?: string; message?: string; command?: string; response?: string; groupId?: string; isError?: boolean; metadata?: string }): Promise<void> {
  const db = getPool();
  await db.query(
    `INSERT INTO "WhatsAppLog" (type, sender, message, command, response, "groupId", "isError", metadata, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [data.type, data.sender || null, data.message ? data.message.slice(0, 500) : null, data.command || null, data.response ? data.response.slice(0, 500) : null, data.groupId || null, data.isError || false, data.metadata || null]
  );
}
