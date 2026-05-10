import { db } from '@/lib/db';
import { withDbRetry } from '@/lib/db-resilience';
import { NextResponse } from 'next/server';

// Force dynamic — this route is never statically rendered
export const dynamic = 'force-dynamic';

const LEAGUE_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  'Surrogate-Key': 'league-data',
  'Vary': 'Accept-Encoding',
};

const LEAGUE_CACHE_HEADERS_SHORT = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  'Surrogate-Key': 'league-data',
};

export async function GET() {
  const headers = new Headers();
  headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  try {
  // Get all Tarkam seasons (active + completed) — exclude Liga seasons
  const seasons = await withDbRetry(() => db.season.findMany({
    where: {
      status: { in: ['active', 'completed'] },
      division: { in: ['male', 'female'] },  // Only Tarkam seasons — exclude 'liga'
    },
    orderBy: { number: 'desc' },
    include: {
      championClub: {
        select: {
          id: true, name: true, logo: true,
          members: {
            where: { leftAt: null },
            include: {
              player: { select: { id: true, gamertag: true, division: true, tier: true, points: true, avatar: true } },
            },
          },
        },
      },
      championPlayer: {
        select: {
          id: true, gamertag: true, division: true, tier: true, points: true, avatar: true, totalWins: true, totalMvp: true,
        },
      },
    },
  }));

  if (!seasons || seasons.length === 0) {
    return NextResponse.json({ hasData: false, reason: 'no_season' }, {
      headers: LEAGUE_CACHE_HEADERS_SHORT,
    });
  }

  const season = seasons[0];
  const allSeasonIds = seasons.map(s => s.id);

  // ── Get ClubProfiles with their members ──
  // ClubProfile is persistent — name/logo/members are always there
  const clubProfiles = await withDbRetry(() => db.clubProfile.findMany({
    orderBy: { name: 'asc' },
    include: {
      members: {
        where: { leftAt: null },
        include: {
          player: { select: { id: true, gamertag: true, division: true, tier: true, points: true, avatar: true } },
        },
      },
      seasonEntries: {
        where: { seasonId: { in: allSeasonIds } },
      },
    },
  }));

  if (clubProfiles.length === 0) {
    return NextResponse.json({
      hasData: false, reason: 'no_clubs',
      season: { id: season.id, name: season.name, number: season.number },
      tarkamChampion: null,
    }, { headers: LEAGUE_CACHE_HEADERS_SHORT });
  }

  // ═══════════════════════════════════════════════════════════════
  // TARKAM MODE: Club points = sum of all active member player.points
  // This replaces the old Liga mode where points came from match results
  // ═══════════════════════════════════════════════════════════════
  const dedupedClubs = clubProfiles.map(profile => {
    const maleMembers = profile.members.filter(m => m.player.division === 'male');
    const femaleMembers = profile.members.filter(m => m.player.division === 'female');

    // Tarkam: Club points = sum of all active member player.points
    const malePoints = maleMembers.reduce((sum, m) => sum + m.player.points, 0);
    const femalePoints = femaleMembers.reduce((sum, m) => sum + m.player.points, 0);
    const tarkamPoints = malePoints + femalePoints;

    // Keep Liga stats for reference (from season entries) — but primary ranking is Tarkam
    let totalWins = 0, totalLosses = 0, totalGameDiff = 0;
    for (const entry of profile.seasonEntries) {
      totalWins += entry.wins;
      totalLosses += entry.losses;
      totalGameDiff += entry.gameDiff;
    }

    return {
      id: profile.id,
      name: profile.name,
      logo: profile.logo,
      bannerImage: profile.bannerImage,
      // Tarkam fields (primary)
      points: tarkamPoints,
      malePoints,
      femalePoints,
      // Liga fields (kept for reference/display)
      wins: totalWins,
      losses: totalLosses,
      gameDiff: totalGameDiff,
      memberCount: profile.members.length,
      maleMemberCount: maleMembers.length,
      femaleMemberCount: femaleMembers.length,
      members: profile.members.map(m => ({
        id: m.player.id,
        gamertag: m.player.gamertag,
        name: m.player.gamertag,
        division: m.player.division,
        tier: m.player.tier,
        points: m.player.points,
        role: m.role,
        avatar: m.player.avatar,
      })),
    };
  }).sort((a, b) => b.points - a.points); // Sort by Tarkam points desc

  // ═══════════════════════════════════════════════════════════════
  // TARKAM CHAMPION: #1 club by Tarkam points (not Liga championClubId)
  // ═══════════════════════════════════════════════════════════════
  const tarkamChampionClub = dedupedClubs.length > 0 ? dedupedClubs[0] : null;

  // Also check for Tarkam Player Champion from season data
  // championPlayerId on Season is for the Tarkam season player champion
  const championSeason = seasons.find(s => s.championPlayerId && s.championPlayer);
  const tarkamPlayerChampion = championSeason?.championPlayer ? {
    id: championSeason.championPlayer.id,
    gamertag: championSeason.championPlayer.gamertag,
    division: championSeason.championPlayer.division,
    tier: championSeason.championPlayer.tier,
    points: championSeason.championPlayer.points,
    totalWins: championSeason.championPlayer.totalWins,
    totalMvp: championSeason.championPlayer.totalMvp,
    avatar: championSeason.championPlayer.avatar,
    seasonNumber: championSeason.number,
  } : null;

  // Build tarkamChampion object (club champion)
  const tarkamChampion = tarkamChampionClub ? {
    id: tarkamChampionClub.id,
    name: tarkamChampionClub.name,
    logo: tarkamChampionClub.logo,
    seasonNumber: season.number,
    malePoints: tarkamChampionClub.malePoints,
    femalePoints: tarkamChampionClub.femalePoints,
    totalPoints: tarkamChampionClub.points,
    members: tarkamChampionClub.members,
  } : null;

  // All league matches (still relevant for display)
  const leagueMatches = await withDbRetry(() => db.leagueMatch.findMany({
    where: { seasonId: { in: allSeasonIds } },
    orderBy: [{ week: 'asc' }],
    include: {
      club1: { include: { profile: true } },
      club2: { include: { profile: true } },
    },
  }));

  // All playoff matches
  const playoffMatches = await withDbRetry(() => db.playoffMatch.findMany({
    where: { seasonId: { in: allSeasonIds } },
    include: {
      club1: { include: { profile: true } },
      club2: { include: { profile: true } },
    },
    orderBy: { round: 'asc' },
  }));

  // Top players — select only fields needed for display
  const topPlayers = await withDbRetry(() => db.player.findMany({
    where: { isActive: true, registrationStatus: 'approved' },
    orderBy: [{ points: 'desc' }, { totalWins: 'desc' }],
    select: {
      id: true,
      gamertag: true,
      division: true,
      tier: true,
      points: true,
      totalWins: true,
      totalMvp: true,
      streak: true,
      avatar: true,
    },
  }));

  // MVP candidates
  const mvpCandidates = await withDbRetry(() => db.participation.findMany({
    where: {
      isMvp: true,
      tournament: { seasonId: { in: allSeasonIds }, status: 'completed' },
    },
    include: { player: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  }));

  // Stats
  const totalClubs = dedupedClubs.length;
  const totalMatches = leagueMatches.length;
  const completedMatches = leagueMatches.filter(m => m.status === 'completed').length;
  const liveMatches = leagueMatches.filter(m => m.status === 'live').length;
  const weeks = [...new Set(leagueMatches.map(m => m.week))].sort((a: number, b: number) => a - b);
  const totalWeeks = weeks.length > 0 ? Math.max(...weeks) : 0;
  const isPreSeason = dedupedClubs.length > 0 && leagueMatches.length === 0;

  return NextResponse.json({
    hasData: true,
    preSeason: isPreSeason,
    season: { id: season.id, name: season.name, number: season.number },
    tarkamChampion,
    tarkamPlayerChampion,
    clubs: dedupedClubs,
    leagueMatches: leagueMatches.map(m => ({
      id: m.id, week: m.week, score1: m.score1, score2: m.score2,
      status: m.status, format: m.format,
      club1: { id: m.club1.id, name: m.club1.profile.name, logo: m.club1.profile.logo },
      club2: { id: m.club2.id, name: m.club2.profile.name, logo: m.club2.profile.logo },
    })),
    playoffMatches: playoffMatches.map(m => ({
      id: m.id, round: m.round, score1: m.score1, score2: m.score2,
      status: m.status, format: m.format,
      club1: { id: m.club1.id, name: m.club1.profile.name, logo: m.club1.profile.logo },
      club2: { id: m.club2.id, name: m.club2.profile.name, logo: m.club2.profile.logo },
    })),
    topPlayers: topPlayers.map(p => ({
      id: p.id, gamertag: p.gamertag, division: p.division,
      tier: p.tier, points: p.points, totalWins: p.totalWins,
      totalMvp: p.totalMvp, streak: p.streak, avatar: p.avatar,
    })),
    mvpCandidates: mvpCandidates.map(mp => ({
      id: mp.player.id, gamertag: mp.player.gamertag, tier: mp.player.tier,
      totalMvp: mp.player.totalMvp, points: mp.player.points,
      totalWins: mp.player.totalWins, streak: mp.player.streak,
      avatar: mp.player.avatar, division: mp.player.division,
    })),
    stats: { totalClubs, totalMatches, completedMatches, liveMatches, totalWeeks, playedWeeks: weeks.length },
    teamFormat: {
      size: 5, main: 3, substitute: 2,
      rule: 'Peserta bebas mix atau tidak mix dari divisi male dan female. Skuad champion dapat memilih anggota dari divisi mana saja.',
    },
  }, { headers: LEAGUE_CACHE_HEADERS });

  } catch (error: any) {
    console.error('[/api/league] Error:', error?.message || error);
    return NextResponse.json({
      hasData: false, reason: 'db_error', error: error?.message || 'Database connection failed',
      tarkamChampion: null,
    }, { status: 200, headers: LEAGUE_CACHE_HEADERS_SHORT });
  }
}
