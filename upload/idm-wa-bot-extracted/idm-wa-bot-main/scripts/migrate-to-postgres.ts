/**
 * Migration script: Sync data from local SQLite to Neon PostgreSQL
 * Uses Bun's built-in SQLite for reading, Prisma for writing to PostgreSQL.
 * Handles ID mismatches between databases by building a player ID mapping.
 * 
 * Usage: DATABASE_URL="postgresql://..." bun run scripts/migrate-to-postgres.ts
 */

import { Database } from 'bun:sqlite';
import { PrismaClient } from '@prisma/client';

const SQLITE_PATH = '/home/z/my-project/db/custom.db';
const sqlite = new Database(SQLITE_PATH);
const pg = new PrismaClient();

function queryAll(sql: string): any[] {
  return sqlite.query(sql).all() as any[];
}

// Global ID mapping: SQLite ID → PostgreSQL ID
const playerIdMap = new Map<string, string>();
const seasonIdMap = new Map<string, string>();
const clubProfileIdMap = new Map<string, string>();
const accountIdMap = new Map<string, string>();

async function main() {
  console.log('🔄 Starting SQLite → PostgreSQL migration...\n');

  // Verify connection
  try {
    await pg.$queryRaw`SELECT 1`;
    console.log('✅ PostgreSQL connection verified\n');
  } catch (e) {
    console.error('❌ PostgreSQL connection failed:', e);
    process.exit(1);
  }

  // ════════════════════════════════════════
  // PHASE 1: Build ID mappings
  // ════════════════════════════════════════
  console.log('🔗 Building ID mappings...');

  // Player ID map (match by gamertag)
  const sqlitePlayers = queryAll('SELECT id, gamertag FROM Player');
  const pgPlayers = await pg.player.findMany({ select: { id: true, gamertag: true } });
  const pgPlayerByGamertag = new Map(pgPlayers.map(p => [p.gamertag, p.id]));
  
  for (const p of sqlitePlayers) {
    const pgId = pgPlayerByGamertag.get(p.gamertag);
    if (pgId) {
      playerIdMap.set(p.id, pgId);
      if (pgId !== p.id) {
        console.log(`   🔄 Player ID remap: ${p.gamertag} ${p.id} → ${pgId}`);
      }
    }
  }
  console.log(`   ✅ Player ID map: ${playerIdMap.size} entries`);

  // Season ID map (match by number+division)
  const sqliteSeasons = queryAll('SELECT id, number, division FROM Season');
  const pgSeasons = await pg.season.findMany({ select: { id: true, number: true, division: true } });
  const pgSeasonByComposite = new Map(pgSeasons.map(s => [`${s.number}:${s.division}`, s.id]));
  
  for (const s of sqliteSeasons) {
    const pgId = pgSeasonByComposite.get(`${s.number}:${s.division}`);
    if (pgId) {
      seasonIdMap.set(s.id, pgId);
      if (pgId !== s.id) console.log(`   🔄 Season ID remap: S${s.number}:${s.division} ${s.id} → ${pgId}`);
    }
  }
  console.log(`   ✅ Season ID map: ${seasonIdMap.size} entries`);

  // Club Profile ID map (match by name)
  const sqliteClubs = queryAll('SELECT id, name FROM ClubProfile');
  const pgClubs = await pg.clubProfile.findMany({ select: { id: true, name: true } });
  const pgClubByName = new Map(pgClubs.map(c => [c.name, c.id]));
  
  for (const c of sqliteClubs) {
    const pgId = pgClubByName.get(c.name);
    if (pgId) {
      clubProfileIdMap.set(c.id, pgId);
      if (pgId !== c.id) console.log(`   🔄 Club ID remap: ${c.name} ${c.id} → ${pgId}`);
    }
  }
  console.log(`   ✅ Club Profile ID map: ${clubProfileIdMap.size} entries`);

  // Account ID map (match by username)
  const sqliteAccounts = queryAll('SELECT id, username FROM Account');
  const pgAccounts = await pg.account.findMany({ select: { id: true, username: true } });
  const pgAccountByName = new Map(pgAccounts.map(a => [a.username, a.id]));
  
  for (const a of sqliteAccounts) {
    const pgId = pgAccountByName.get(a.username);
    if (pgId) {
      accountIdMap.set(a.id, pgId);
      if (pgId !== a.id) console.log(`   🔄 Account ID remap: ${a.username} ${a.id} → ${pgId}`);
    }
  }
  console.log(`   ✅ Account ID map: ${accountIdMap.size} entries`);

  // Helper: map player ID
  function mapPlayerId(sqliteId: string | null): string | null {
    if (!sqliteId) return null;
    return playerIdMap.get(sqliteId) || sqliteId;
  }
  function mapSeasonId(sqliteId: string | null): string | null {
    if (!sqliteId) return null;
    return seasonIdMap.get(sqliteId) || sqliteId;
  }
  function mapClubProfileId(sqliteId: string | null): string | null {
    if (!sqliteId) return null;
    return clubProfileIdMap.get(sqliteId) || sqliteId;
  }
  function mapAccountId(sqliteId: string | null): string | null {
    if (!sqliteId) return null;
    return accountIdMap.get(sqliteId) || sqliteId;
  }

  // ════════════════════════════════════════
  // PHASE 2: Update player data
  // ════════════════════════════════════════
  console.log('\n📦 Phase 2: Updating player data...');
  const sqlitePlayerData = queryAll('SELECT * FROM Player');
  let playersUpdated = 0;
  
  for (const p of sqlitePlayerData) {
    const pgId = playerIdMap.get(p.id);
    if (!pgId) {
      console.log(`   ⚠️  Player ${p.gamertag} (${p.id}) not in PostgreSQL, skipping`);
      continue;
    }
    await pg.player.update({
      where: { id: pgId },
      data: {
        name: p.name,
        gamertag: p.gamertag,
        division: p.division,
        tier: p.tier || 'B',
        avatar: p.avatar,
        points: p.points || 0,
        totalWins: p.totalWins || 0,
        totalMvp: p.totalMvp || 0,
        streak: p.streak || 0,
        maxStreak: p.maxStreak || 0,
        matches: p.matches || 0,
        isActive: Boolean(p.isActive),
        phone: p.phone,
        waNumber: p.waNumber,
        city: p.city || '',
        joki: p.joki,
        registrationStatus: p.registrationStatus || 'approved',
      },
    });
    playersUpdated++;
  }
  console.log(`   ✅ Players: ${playersUpdated} updated`);

  // ════════════════════════════════════════
  // PHASE 3: Update season data (champion, sultan)
  // ════════════════════════════════════════
  console.log('\n📦 Phase 3: Updating season data...');
  const sqliteSeasonData = queryAll('SELECT * FROM Season');
  let seasonsUpdated = 0;
  
  for (const s of sqliteSeasonData) {
    const pgId = seasonIdMap.get(s.id);
    if (!pgId) continue;
    
    await pg.season.update({
      where: { id: pgId },
      data: {
        name: s.name,
        status: s.status,
        endDate: s.endDate ? new Date(s.endDate) : null,
        championClubId: mapClubProfileId(s.championClubId),
        championPlayerId: mapPlayerId(s.championPlayerId),
        championPlayerPoints: s.championPlayerPoints,
        championPlayerSnapshot: s.championPlayerSnapshot,
        championClubSnapshot: s.championClubSnapshot,
        championSquad: s.championSquad,
        sultanPlayerId: mapPlayerId(s.sultanPlayerId),
      },
    });
    seasonsUpdated++;
  }
  console.log(`   ✅ Seasons: ${seasonsUpdated} updated`);

  // ════════════════════════════════════════
  // PHASE 4: Update club profiles
  // ════════════════════════════════════════
  console.log('\n📦 Phase 4: Updating club profiles...');
  const sqliteClubData = queryAll('SELECT * FROM ClubProfile');
  let clubsUpdated = 0;
  
  for (const c of sqliteClubData) {
    const pgId = clubProfileIdMap.get(c.id);
    if (!pgId) continue;
    
    await pg.clubProfile.update({
      where: { id: pgId },
      data: {
        name: c.name,
        logo: c.logo,
        bannerImage: c.bannerImage,
      },
    });
    clubsUpdated++;
  }
  console.log(`   ✅ Club Profiles: ${clubsUpdated} updated`);

  // ════════════════════════════════════════
  // PHASE 5: Sync club members
  // ════════════════════════════════════════
  console.log('\n📦 Phase 5: Syncing club members...');
  const sqliteMembers = queryAll('SELECT * FROM ClubMember');
  const pgMembers = await pg.clubMember.findMany();
  const pgMemberKeys = new Set(pgMembers.map(m => `${m.profileId}:${m.playerId}`));
  
  let membersCreated = 0, membersDeleted = 0;
  
  // Delete stale members first (members not in SQLite)
  const sqliteMemberKeys = new Set(
    sqliteMembers.map(m => `${mapClubProfileId(m.profileId)}:${mapPlayerId(m.playerId)}`)
  );
  for (const pm of pgMembers) {
    const key = `${pm.profileId}:${pm.playerId}`;
    if (!sqliteMemberKeys.has(key)) {
      try {
        await pg.clubMember.delete({ where: { id: pm.id } });
        membersDeleted++;
      } catch (e: any) { /* skip */ }
    }
  }
  
  // Upsert members from SQLite
  for (const m of sqliteMembers) {
    const profileId = mapClubProfileId(m.profileId);
    const playerId = mapPlayerId(m.playerId);
    if (!profileId || !playerId) continue;
    
    const key = `${profileId}:${playerId}`;
    if (!pgMemberKeys.has(key)) {
      try {
        await pg.clubMember.create({
          data: {
            id: m.id, profileId, playerId,
            role: m.role || 'member', joinedAt: new Date(m.joinedAt),
            leftAt: m.leftAt ? new Date(m.leftAt) : null,
          }
        });
        membersCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping member ${key}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Club Members: ${membersCreated} created, ${membersDeleted} deleted`);

  // ════════════════════════════════════════
  // PHASE 6: Sync club season entries
  // ════════════════════════════════════════
  console.log('\n📦 Phase 6: Syncing club season entries...');
  const sqliteClubEntries = queryAll('SELECT * FROM Club');
  const pgClubEntries = await pg.club.findMany();
  const pgClubEntryMap = new Map(
    pgClubEntries.map(c => [`${c.profileId}:${c.seasonId}:${c.division}`, c])
  );
  
  let clubEntriesCreated = 0, clubEntriesUpdated = 0;
  
  for (const c of sqliteClubEntries) {
    const profileId = mapClubProfileId(c.profileId);
    const seasonId = mapSeasonId(c.seasonId);
    if (!profileId || !seasonId) continue;
    
    const key = `${profileId}:${seasonId}:${c.division}`;
    const existing = pgClubEntryMap.get(key);
    
    if (existing) {
      await pg.club.update({
        where: { id: existing.id },
        data: {
          wins: c.wins || 0, losses: c.losses || 0,
          points: c.points || 0, gameDiff: c.gameDiff || 0,
        },
      });
      clubEntriesUpdated++;
    } else {
      try {
        await pg.club.create({
          data: {
            id: c.id, profileId, division: c.division, seasonId,
            wins: c.wins || 0, losses: c.losses || 0,
            points: c.points || 0, gameDiff: c.gameDiff || 0,
          }
        });
        clubEntriesCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping club entry ${key}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Club Season Entries: ${clubEntriesCreated} created, ${clubEntriesUpdated} updated`);

  // ════════════════════════════════════════
  // PHASE 7: Sync accounts
  // ════════════════════════════════════════
  console.log('\n📦 Phase 7: Syncing accounts...');
  const sqliteAccountData = queryAll('SELECT * FROM Account');
  let accountsUpdated = 0;
  
  for (const a of sqliteAccountData) {
    const pgId = accountIdMap.get(a.id);
    if (!pgId) continue;
    
    const mappedPlayerId = mapPlayerId(a.playerId);
    
    await pg.account.update({
      where: { id: pgId },
      data: {
        playerId: mappedPlayerId!,
        username: a.username,
        passwordHash: a.passwordHash,
        email: a.email,
        phone: a.phone,
        donorBadgeCount: a.donorBadgeCount || 0,
        sawerBadgeTier: a.sawerBadgeTier || 'none',
        lastLoginAt: a.lastLoginAt ? new Date(a.lastLoginAt) : null,
      },
    });
    accountsUpdated++;
  }
  console.log(`   ✅ Accounts: ${accountsUpdated} updated`);

  // ════════════════════════════════════════
  // PHASE 8: Sync skins
  // ════════════════════════════════════════
  console.log('\n📦 Phase 8: Syncing skins...');
  const sqliteSkins = queryAll('SELECT * FROM Skin');
  const pgSkins = await pg.skin.findMany();
  const pgSkinByType = new Map(pgSkins.map(s => [s.type, s]));
  
  let skinsCreated = 0;
  for (const s of sqliteSkins) {
    if (!pgSkinByType.has(s.type)) {
      try {
        await pg.skin.create({
          data: {
            id: s.id, type: s.type, displayName: s.displayName,
            description: s.description, icon: s.icon, colorClass: s.colorClass,
            priority: s.priority || 0, duration: s.duration || 'permanent',
            isActive: Boolean(s.isActive),
            createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt),
          }
        });
        skinsCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping skin ${s.type}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Skins: ${skinsCreated} created`);

  // ════════════════════════════════════════
  // PHASE 9: Sync player skins
  // ════════════════════════════════════════
  console.log('\n📦 Phase 9: Syncing player skins...');
  const sqlitePlayerSkins = queryAll('SELECT * FROM PlayerSkin');
  const pgPlayerSkins = await pg.playerSkin.findMany();
  const pgPSKeys = new Set(pgPlayerSkins.map(ps => `${ps.accountId}:${ps.skinId}`));
  
  let playerSkinsCreated = 0;
  for (const ps of sqlitePlayerSkins) {
    const accountId = mapAccountId(ps.accountId);
    if (!accountId) continue;
    
    // Find the PG skin ID by type
    const sqliteSkin = sqliteSkins.find(s => s.id === ps.skinId);
    const pgSkin = sqliteSkin ? pgSkinByType.get(sqliteSkin.type) : null;
    if (!pgSkin) continue;
    
    const key = `${accountId}:${pgSkin.id}`;
    if (!pgPSKeys.has(key)) {
      try {
        await pg.playerSkin.create({
          data: {
            id: ps.id, accountId, skinId: pgSkin.id,
            awardedBy: ps.awardedBy, reason: ps.reason,
            expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : null,
            createdAt: new Date(ps.createdAt),
          }
        });
        playerSkinsCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping player skin: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Player Skins: ${playerSkinsCreated} created`);

  // ════════════════════════════════════════
  // PHASE 10: Sync tournaments
  // ════════════════════════════════════════
  console.log('\n📦 Phase 10: Syncing tournaments...');
  const sqliteTournaments = queryAll('SELECT * FROM Tournament');
  const pgTournaments = await pg.tournament.findMany();
  const pgTournamentByComposite = new Map(
    pgTournaments.map(t => [`${t.weekNumber}:${t.division}:${t.seasonId}`, t])
  );
  
  let tournamentsCreated = 0;
  for (const t of sqliteTournaments) {
    const seasonId = mapSeasonId(t.seasonId);
    if (!seasonId) continue;
    
    const key = `${t.weekNumber}:${t.division}:${seasonId}`;
    if (!pgTournamentByComposite.has(key)) {
      try {
        await pg.tournament.create({
          data: {
            id: t.id, name: t.name, weekNumber: t.weekNumber, division: t.division,
            status: t.status, format: t.format || 'single_elimination',
            defaultMatchFormat: t.defaultMatchFormat || 'BO1',
            seasonId, prizePool: t.prizePool || 0, bpm: t.bpm,
            location: t.location,
            scheduledAt: t.scheduledAt ? new Date(t.scheduledAt) : null,
            finalizedAt: t.finalizedAt ? new Date(t.finalizedAt) : null,
            completedAt: t.completedAt ? new Date(t.completedAt) : null,
            createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt),
          }
        });
        tournamentsCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping tournament ${t.name}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Tournaments: ${tournamentsCreated} created`);

  // ════════════════════════════════════════
  // PHASE 11: Sync teams
  // ════════════════════════════════════════
  console.log('\n📦 Phase 11: Syncing teams...');
  const sqliteTeams = queryAll('SELECT * FROM Team');
  const pgTeams = await pg.team.findMany();
  const pgTeamIds = new Set(pgTeams.map(t => t.id));
  
  let teamsCreated = 0;
  for (const t of sqliteTeams) {
    if (!pgTeamIds.has(t.id)) {
      try {
        await pg.team.create({
          data: {
            id: t.id, name: t.name, tournamentId: t.tournamentId,
            power: t.power || 0, isWinner: Boolean(t.isWinner), rank: t.rank,
          }
        });
        teamsCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping team ${t.name}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Teams: ${teamsCreated} created`);

  // ════════════════════════════════════════
  // PHASE 12: Sync team players
  // ════════════════════════════════════════
  console.log('\n📦 Phase 12: Syncing team players...');
  const sqliteTeamPlayers = queryAll('SELECT * FROM TeamPlayer');
  const pgTeamPlayers = await pg.teamPlayer.findMany();
  const pgTPKeys = new Set(pgTeamPlayers.map(tp => `${tp.teamId}:${tp.playerId}`));
  
  let teamPlayersCreated = 0;
  for (const tp of sqliteTeamPlayers) {
    const playerId = mapPlayerId(tp.playerId);
    if (!playerId) continue;
    
    const key = `${tp.teamId}:${playerId}`;
    if (!pgTPKeys.has(key)) {
      try {
        await pg.teamPlayer.create({
          data: { id: tp.id, teamId: tp.teamId, playerId, tier: tp.tier || 'B' }
        });
        teamPlayersCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping team player ${key}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Team Players: ${teamPlayersCreated} created`);

  // ════════════════════════════════════════
  // PHASE 13: Sync participations
  // ════════════════════════════════════════
  console.log('\n📦 Phase 13: Syncing participations...');
  const sqliteParticipations = queryAll('SELECT * FROM Participation');
  const pgParticipations = await pg.participation.findMany();
  const pgPKeys = new Map(pgParticipations.map(p => [`${p.playerId}:${p.tournamentId}`, p]));
  
  let participationsCreated = 0;
  for (const p of sqliteParticipations) {
    const playerId = mapPlayerId(p.playerId);
    if (!playerId) continue;
    
    const key = `${playerId}:${p.tournamentId}`;
    if (!pgPKeys.has(key)) {
      try {
        await pg.participation.create({
          data: {
            id: p.id, playerId, tournamentId: p.tournamentId,
            status: p.status || 'registered', tierOverride: p.tierOverride,
            pointsEarned: p.pointsEarned || 0, isMvp: Boolean(p.isMvp),
            isWinner: Boolean(p.isWinner), createdAt: new Date(p.createdAt),
          }
        });
        participationsCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping participation ${key}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Participations: ${participationsCreated} created`);

  // ════════════════════════════════════════
  // PHASE 14: Sync matches
  // ════════════════════════════════════════
  console.log('\n📦 Phase 14: Syncing matches...');
  const sqliteMatches = queryAll('SELECT * FROM Match');
  const pgMatches = await pg.match.findMany();
  const pgMatchIds = new Set(pgMatches.map(m => m.id));
  
  let matchesCreated = 0;
  for (const m of sqliteMatches) {
    if (!pgMatchIds.has(m.id)) {
      try {
        await pg.match.create({
          data: {
            id: m.id, tournamentId: m.tournamentId, round: m.round || 1,
            matchNumber: m.matchNumber || 1, bracket: m.bracket || 'upper',
            groupLabel: m.groupLabel, format: m.format || 'BO1',
            team1Id: m.team1Id, team2Id: m.team2Id,
            score1: m.score1, score2: m.score2,
            status: m.status || 'pending', winnerId: m.winnerId, loserId: m.loserId,
            mvpPlayerId: mapPlayerId(m.mvpPlayerId),
            scheduledAt: m.scheduledAt ? new Date(m.scheduledAt) : null,
            completedAt: m.completedAt ? new Date(m.completedAt) : null,
            createdAt: new Date(m.createdAt),
          }
        });
        matchesCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping match ${m.id}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Matches: ${matchesCreated} created`);

  // ════════════════════════════════════════
  // PHASE 15: Sync donations
  // ════════════════════════════════════════
  console.log('\n📦 Phase 15: Syncing donations...');
  const sqliteDonations = queryAll('SELECT * FROM Donation');
  const pgDonations = await pg.donation.findMany();
  const pgDonationIds = new Set(pgDonations.map(d => d.id));
  
  let donationsCreated = 0;
  for (const d of sqliteDonations) {
    if (!pgDonationIds.has(d.id)) {
      try {
        await pg.donation.create({
          data: {
            id: d.id, donorName: d.donorName, amount: d.amount, message: d.message,
            type: d.type || 'weekly', division: d.division || 'male',
            status: d.status || 'pending',
            tournamentId: d.tournamentId,
            seasonId: mapSeasonId(d.seasonId),
            playerId: mapPlayerId(d.playerId),
            createdAt: new Date(d.createdAt),
          }
        });
        donationsCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping donation ${d.id}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Donations: ${donationsCreated} created`);

  // ════════════════════════════════════════
  // PHASE 16: Sync player points
  // ════════════════════════════════════════
  console.log('\n📦 Phase 16: Syncing player points...');
  const sqlitePlayerPoints = queryAll('SELECT * FROM PlayerPoint');
  const pgPlayerPoints = await pg.playerPoint.findMany();
  const pgPPIds = new Set(pgPlayerPoints.map(pp => pp.id));
  
  let playerPointsCreated = 0;
  for (const pp of sqlitePlayerPoints) {
    if (!pgPPIds.has(pp.id)) {
      const playerId = mapPlayerId(pp.playerId);
      if (!playerId) continue;
      
      try {
        await pg.playerPoint.create({
          data: {
            id: pp.id, playerId, tournamentId: pp.tournamentId,
            matchId: pp.matchId, seasonId: mapSeasonId(pp.seasonId),
            amount: pp.amount, reason: pp.reason, description: pp.description,
            createdAt: new Date(pp.createdAt),
          }
        });
        playerPointsCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping player point ${pp.id}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Player Points: ${playerPointsCreated} created`);

  // ════════════════════════════════════════
  // PHASE 17: Sync player season stats
  // ════════════════════════════════════════
  console.log('\n📦 Phase 17: Syncing player season stats...');
  const sqliteSeasonStats = queryAll('SELECT * FROM PlayerSeasonStats');
  const pgSeasonStats = await pg.playerSeasonStats.findMany();
  const pgSSMap = new Map(pgSeasonStats.map(s => [`${s.playerId}:${s.seasonId}`, s]));
  
  let seasonStatsCreated = 0, seasonStatsUpdated = 0;
  for (const s of sqliteSeasonStats) {
    const playerId = mapPlayerId(s.playerId);
    const seasonId = mapSeasonId(s.seasonId);
    if (!playerId || !seasonId) continue;
    
    const key = `${playerId}:${seasonId}`;
    const existing = pgSSMap.get(key);
    const data = {
      points: s.points || 0, totalWins: s.totalWins || 0, totalMvp: s.totalMvp || 0,
      streak: s.streak || 0, maxStreak: s.maxStreak || 0, matches: s.matches || 0,
      rank: s.rank, tier: s.tier || 'B',
    };
    
    if (existing) {
      await pg.playerSeasonStats.update({ where: { id: existing.id }, data });
      seasonStatsUpdated++;
    } else {
      try {
        await pg.playerSeasonStats.create({
          data: { id: s.id, playerId, seasonId, division: s.division, createdAt: new Date(s.createdAt), ...data }
        });
        seasonStatsCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping season stats ${key}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Player Season Stats: ${seasonStatsCreated} created, ${seasonStatsUpdated} updated`);

  // ════════════════════════════════════════
  // PHASE 18: Sync achievements + player achievements
  // ════════════════════════════════════════
  console.log('\n📦 Phase 18: Syncing achievements...');
  const sqliteAchievements = queryAll('SELECT * FROM Achievement');
  const pgAchievements = await pg.achievement.findMany();
  const pgAchByName = new Map(pgAchievements.map(a => [a.name, a]));
  
  let achievementsCreated = 0;
  const achIdMap = new Map<string, string>(); // sqlite ID → pg ID
  
  for (const a of sqliteAchievements) {
    const pgAch = pgAchByName.get(a.name);
    if (pgAch) {
      achIdMap.set(a.id, pgAch.id);
    } else {
      try {
        const created = await pg.achievement.create({
          data: {
            id: a.id, name: a.name, displayName: a.displayName,
            description: a.description, category: a.category, icon: a.icon,
            tier: a.tier || 'bronze', criteria: a.criteria,
            rewardPoints: a.rewardPoints || 0, isActive: Boolean(a.isActive),
            createdAt: new Date(a.createdAt), updatedAt: new Date(a.updatedAt),
          }
        });
        achIdMap.set(a.id, created.id);
        achievementsCreated++;
      } catch (e: any) {
        console.log(`   ⚠️  Skipping achievement ${a.name}: ${e.message?.substring(0, 80)}`);
      }
    }
  }
  console.log(`   ✅ Achievements: ${achievementsCreated} created`);

  // Player Achievements
  const sqlitePlayerAchievements = queryAll('SELECT * FROM PlayerAchievement');
  const pgPA = await pg.playerAchievement.findMany();
  const pgPAKeys = new Set(pgPA.map(pa => `${pa.playerId}:${pa.achievementId}`));
  
  let playerAchievementsCreated = 0;
  for (const pa of sqlitePlayerAchievements) {
    const playerId = mapPlayerId(pa.playerId);
    const achievementId = achIdMap.get(pa.achievementId);
    if (!playerId || !achievementId) continue;
    
    const key = `${playerId}:${achievementId}`;
    if (!pgPAKeys.has(key)) {
      try {
        await pg.playerAchievement.create({
          data: {
            id: pa.id, playerId, achievementId,
            tournamentId: pa.tournamentId, earnedAt: new Date(pa.earnedAt), context: pa.context,
          }
        });
        playerAchievementsCreated++;
      } catch (e: any) { /* skip */ }
    }
  }
  console.log(`   ✅ Player Achievements: ${playerAchievementsCreated} created`);

  // ════════════════════════════════════════
  // PHASE 19: Sync tournament prizes
  // ════════════════════════════════════════
  console.log('\n📦 Phase 19: Syncing tournament prizes...');
  const sqlitePrizes = queryAll('SELECT * FROM TournamentPrize');
  const pgPrizes = await pg.tournamentPrize.findMany();
  const pgPrizeIds = new Set(pgPrizes.map(p => p.id));
  
  let prizesCreated = 0;
  for (const p of sqlitePrizes) {
    if (!pgPrizeIds.has(p.id)) {
      try {
        await pg.tournamentPrize.create({
          data: {
            id: p.id, tournamentId: p.tournamentId, label: p.label,
            position: p.position || 0, prizeAmount: p.prizeAmount || 0,
            pointsPerPlayer: p.pointsPerPlayer || 0, recipientCount: p.recipientCount || 1,
            createdAt: new Date(p.createdAt),
          }
        });
        prizesCreated++;
      } catch (e: any) { /* skip */ }
    }
  }
  console.log(`   ✅ Tournament Prizes: ${prizesCreated} created`);

  // ════════════════════════════════════════
  // PHASE 20: Sync admins
  // ════════════════════════════════════════
  console.log('\n📦 Phase 20: Syncing admins...');
  const sqliteAdmins = queryAll('SELECT * FROM Admin');
  let adminsUpdated = 0;
  
  for (const a of sqliteAdmins) {
    const pgId = accountIdMap.get(a.id); // Not really account, but admin
    // Try to update by username
    try {
      const pgAdmin = await pg.admin.findFirst({ where: { username: a.username } });
      if (pgAdmin) {
        await pg.admin.update({
          where: { id: pgAdmin.id },
          data: {
            passwordHash: a.passwordHash,
            role: a.role || 'admin',
            sessionInvalidatedAt: a.sessionInvalidatedAt ? new Date(a.sessionInvalidatedAt) : null,
          }
        });
        adminsUpdated++;
      }
    } catch (e: any) { /* skip */ }
  }
  console.log(`   ✅ Admins: ${adminsUpdated} updated`);

  // ════════════════════════════════════════
  // PHASE 21: Sync CMS settings + sections + cards
  // ════════════════════════════════════════
  console.log('\n📦 Phase 21: Syncing CMS data...');
  
  // CMS Settings - upsert by key
  const sqliteCmsSettings = queryAll('SELECT * FROM CmsSetting');
  let cmsSettingsUpserted = 0;
  for (const s of sqliteCmsSettings) {
    try {
      await pg.cmsSetting.upsert({
        where: { key: s.key },
        update: { value: s.value, type: s.type || 'text', updatedAt: new Date(s.updatedAt) },
        create: { id: s.id, key: s.key, value: s.value, type: s.type || 'text', updatedAt: new Date(s.updatedAt) },
      });
      cmsSettingsUpserted++;
    } catch (e: any) { /* skip */ }
  }
  console.log(`   ✅ CMS Settings: ${cmsSettingsUpserted} upserted`);

  // CMS Sections - upsert by slug
  const sqliteCmsSections = queryAll('SELECT * FROM CmsSection');
  const sectionIdMap = new Map<string, string>(); // sqlite ID → pg ID
  
  let cmsSectionsUpserted = 0;
  for (const s of sqliteCmsSections) {
    try {
      const result = await pg.cmsSection.upsert({
        where: { slug: s.slug },
        update: {
          title: s.title, subtitle: s.subtitle, description: s.description,
          bannerUrl: s.bannerUrl, isActive: Boolean(s.isActive), order: s.order || 0,
          updatedAt: new Date(s.updatedAt),
        },
        create: {
          id: s.id, slug: s.slug, title: s.title, subtitle: s.subtitle,
          description: s.description, bannerUrl: s.bannerUrl,
          isActive: Boolean(s.isActive), order: s.order || 0,
          createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt),
        },
      });
      sectionIdMap.set(s.id, result.id);
      cmsSectionsUpserted++;
    } catch (e: any) { /* skip */ }
  }
  console.log(`   ✅ CMS Sections: ${cmsSectionsUpserted} upserted`);

  // CMS Cards
  const sqliteCmsCards = queryAll('SELECT * FROM CmsCard');
  const pgCmsCards = await pg.cmsCard.findMany();
  const pgCardIds = new Set(pgCmsCards.map(c => c.id));
  
  let cmsCardsCreated = 0;
  for (const c of sqliteCmsCards) {
    const sectionId = sectionIdMap.get(c.sectionId);
    if (!sectionId) continue;
    
    if (!pgCardIds.has(c.id)) {
      try {
        await pg.cmsCard.create({
          data: {
            id: c.id, sectionId, title: c.title, subtitle: c.subtitle,
            description: c.description, imageUrl: c.imageUrl, videoUrl: c.videoUrl,
            linkUrl: c.linkUrl, tag: c.tag, tagColor: c.tagColor,
            isActive: Boolean(c.isActive), order: c.order || 0,
            createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt),
          }
        });
        cmsCardsCreated++;
      } catch (e: any) { /* skip */ }
    }
  }
  console.log(`   ✅ CMS Cards: ${cmsCardsCreated} created`);

  // ════════════════════════════════════════
  // PHASE 22: Sync audit logs
  // ════════════════════════════════════════
  console.log('\n📦 Phase 22: Syncing audit logs...');
  const sqliteLogs = queryAll('SELECT * FROM AuditLog');
  const pgLogs = await pg.auditLog.findMany();
  const pgLogIds = new Set(pgLogs.map(l => l.id));
  
  let logsCreated = 0;
  for (const l of sqliteLogs) {
    if (!pgLogIds.has(l.id)) {
      try {
        await pg.auditLog.create({
          data: {
            id: l.id, adminId: l.adminId, adminName: l.adminName,
            action: l.action, entity: l.entity, entityId: l.entityId,
            details: l.details, metadata: l.metadata, createdAt: new Date(l.createdAt),
          }
        });
        logsCreated++;
      } catch (e: any) { /* skip silently */ }
    }
  }
  console.log(`   ✅ Audit Logs: ${logsCreated} created`);

  // ════════════════════════════════════════
  // FINAL VERIFICATION
  // ════════════════════════════════════════
  console.log('\n🔍 Final Verification...\n');
  
  const counts: Record<string, [number, number]> = {
    'Player': [queryAll('SELECT COUNT(*) as c FROM Player')[0].c, await pg.player.count()],
    'Season': [queryAll('SELECT COUNT(*) as c FROM Season')[0].c, await pg.season.count()],
    'ClubProfile': [queryAll('SELECT COUNT(*) as c FROM ClubProfile')[0].c, await pg.clubProfile.count()],
    'Club': [queryAll('SELECT COUNT(*) as c FROM Club')[0].c, await pg.club.count()],
    'Tournament': [queryAll('SELECT COUNT(*) as c FROM Tournament')[0].c, await pg.tournament.count()],
    'Match': [queryAll('SELECT COUNT(*) as c FROM Match')[0].c, await pg.match.count()],
    'Team': [queryAll('SELECT COUNT(*) as c FROM Team')[0].c, await pg.team.count()],
    'Participation': [queryAll('SELECT COUNT(*) as c FROM Participation')[0].c, await pg.participation.count()],
    'Donation': [queryAll('SELECT COUNT(*) as c FROM Donation')[0].c, await pg.donation.count()],
    'PlayerPoint': [queryAll('SELECT COUNT(*) as c FROM PlayerPoint')[0].c, await pg.playerPoint.count()],
    'Skin': [queryAll('SELECT COUNT(*) as c FROM Skin')[0].c, await pg.skin.count()],
    'PlayerSkin': [queryAll('SELECT COUNT(*) as c FROM PlayerSkin')[0].c, await pg.playerSkin.count()],
    'Account': [queryAll('SELECT COUNT(*) as c FROM Account')[0].c, await pg.account.count()],
    'PlayerSeasonStats': [queryAll('SELECT COUNT(*) as c FROM PlayerSeasonStats')[0].c, await pg.playerSeasonStats.count()],
    'Achievement': [queryAll('SELECT COUNT(*) as c FROM Achievement')[0].c, await pg.achievement.count()],
    'PlayerAchievement': [queryAll('SELECT COUNT(*) as c FROM PlayerAchievement')[0].c, await pg.playerAchievement.count()],
  };
  
  console.log('═══════════════════════════════════════════════');
  console.log('            Migration Comparison');
  console.log('═══════════════════════════════════════════════');
  console.log('Entity                 SQLite  PostgreSQL');
  console.log('───────────────────────────────────────────────');
  for (const [key, [sq, pgCount]] of Object.entries(counts)) {
    const match = sq == pgCount ? '✅' : '⚠️ ';
    console.log(`${key.padEnd(22)} ${String(sq).padStart(5)}  ${String(pgCount).padStart(5)} ${match}`);
  }
  console.log('═══════════════════════════════════════════════');

  // Verify champion data
  const pgSeasonsFinal = await pg.season.findMany({
    select: { number: true, division: true, status: true, championPlayerId: true, sultanPlayerId: true,
      championPlayer: { select: { gamertag: true } },
      sultanPlayer: { select: { gamertag: true } },
    }
  });
  console.log('\n🏆 Season Champion Status in PostgreSQL:');
  for (const s of pgSeasonsFinal) {
    console.log(`  Season ${s.number} ${s.division}: champion=${s.championPlayer?.gamertag || 'NONE'}, sultan=${s.sultanPlayer?.gamertag || 'NONE'}`);
  }

  console.log('\n🎉 Migration complete!');
  sqlite.close();
}

main()
  .catch(e => { console.error('❌ Migration failed:', e); process.exit(1); })
  .finally(() => pg.$disconnect());
