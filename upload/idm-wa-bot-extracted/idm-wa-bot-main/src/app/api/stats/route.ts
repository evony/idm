import { db } from '@/lib/db';
import { SEASON_TOTAL_WEEKS } from '@/lib/constants';
import { NextResponse } from 'next/server';
import { buildSkinMap } from '@/lib/build-skin-map';

// Force dynamic — this route is never statically rendered
export const dynamic = 'force-dynamic';

// ── Smart Caching Strategy for /api/stats ──
// Same as /api/league: CDN caches 10s, browser never caches, Surrogate-Key for targeted purge.
// Admin mutations that affect standings/scores call revalidateTag('league-data').

const STATS_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  'Surrogate-Key': 'league-data',
  'Vary': 'Accept-Encoding',
};

const STATS_CACHE_HEADERS_SHORT = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  'Surrogate-Key': 'league-data',
};

export async function GET(request: Request) {
  const headers = new Headers();
  headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  try {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division') || 'semua';
  const isAllDivisions = division === 'semua';
  const divisionFilter = isAllDivisions ? { in: ['male', 'female'] } : division;

  // Find seasons for the SPECIFIC division requested (or both if "semua")
  // Male and Female are separate seasons with separate clubs, matches, tournaments
  const allSeasons = await db.season.findMany({
    where: { division: divisionFilter, status: { in: ['active', 'completed'] } },
    orderBy: { number: 'desc' },
    include: { _count: { select: { tournaments: true } } },
  });

  // Use the latest season for this division as the primary reference
  const season = allSeasons[0];

  if (!season) {
    return NextResponse.json({ hasData: false, division, allSeasons: [], weeklyChampions: [], weeklyTopPerformers: [], sultanOfWeekly: [], totalPlayers: 0, approvedPlayerCount: 0 }, {
      headers: STATS_CACHE_HEADERS_SHORT,
    });
  }

  // Find the latest season for this division that actually has clubs
  // This handles the case where a new Season is active but has no clubs yet,
  // while a previous season (completed) has clubs that should still be visible
  // NOTE: Must use divisionFilter (not raw division) so "semua" maps to { in: ['male', 'female'] }
  const seasonWithClubs = await db.season.findFirst({
    where: {
      division: divisionFilter,
      id: { in: allSeasons.map(s => s.id) },
      clubs: { some: {} },
    },
    orderBy: { number: 'desc' },
  });
  // Use the season that has clubs for all club/league-related queries, fall back to latest season
  // But for player leaderboard (per-season points), always use the LATEST active/completed season
  const activeSeasonId = season.id; // Latest season for this division (for per-season points & tournaments)
  const clubSeasonId = seasonWithClubs?.id || season.id; // Season with clubs (for club-related queries)
  const seasonForClubs = seasonWithClubs || season;

  // ═══ Active Tournament — smart lookup ═══
  // Priority 1: Find a non-completed tournament (registration, live, etc.) in the ACTIVE season
  // Priority 2: Find the latest tournament in the active season (any status)
  // Priority 3: Fall back to clubSeasonId (season with clubs/data)
  // This ensures newly created tournaments with "registration" status are found immediately,
  // even if the active season has no clubs yet.
  const activeTournament = await (async () => {
    // 1. Non-completed tournament in active season (most important)
    const activeNonCompleted = await db.tournament.findFirst({
      where: {
        seasonId: activeSeasonId,
        status: { not: 'completed' },
      },
      orderBy: { weekNumber: 'desc' },
      include: {
        teams: { include: { teamPlayers: { include: { player: true } } } },
        matches: { include: { team1: true, team2: true, mvpPlayer: true } },
        participations: { include: { player: true } },
        donations: true,
      },
    });
    if (activeNonCompleted) return activeNonCompleted;

    // 2. Latest tournament in active season (any status, including completed)
    const activeLatest = await db.tournament.findFirst({
      where: { seasonId: activeSeasonId },
      orderBy: { weekNumber: 'desc' },
      include: {
        teams: { include: { teamPlayers: { include: { player: true } } } },
        matches: { include: { team1: true, team2: true, mvpPlayer: true } },
        participations: { include: { player: true } },
        donations: true,
      },
    });
    if (activeLatest) return activeLatest;

    // 3. Fall back to clubSeasonId (season with clubs/data)
    return db.tournament.findFirst({
      where: { seasonId: clubSeasonId },
      orderBy: { weekNumber: 'desc' },
      include: {
        teams: { include: { teamPlayers: { include: { player: true } } } },
        matches: { include: { team1: true, team2: true, mvpPlayer: true } },
        participations: { include: { player: true } },
        donations: true,
      },
    });
  })();

  // Run ALL other independent queries in parallel
  const [
    totalPlayers,
    approvedPlayerCount,
    seasonDonations,
    seasonPointsRaw,
    allDivisionPlayers,
    clubs,
    recentMatches,
    upcomingMatches,
    playoffMatches,
    tournaments,
    leagueMatches,
  ] = await Promise.all([

    // Total players
    db.player.count({ where: { division: divisionFilter, isActive: true, registrationStatus: 'approved' } }),

    // Approved/assigned player count in active tournament
    db.participation.count({
      where: {
        status: { in: ['approved', 'assigned'] },
        tournament: { seasonId: clubSeasonId },
        player: { division: divisionFilter },
      },
    }),

    // ALL approved donations for this division — query by division field for correctness
    // Include all seasons for this division (handles legacy data where seasonId may be wrong)
    db.donation.findMany({
      where: {
        status: 'approved',
        division: divisionFilter,
        OR: [
          { seasonId: { in: allSeasons.map((s: { id: string }) => s.id) } },
          { seasonId: null },
        ],
      },
    }),

    // Per-season points aggregation — compute from PlayerPoint records
    // This ensures that when a new season starts, the leaderboard starts from 0
    db.playerPoint.groupBy({
      by: ['playerId'],
      where: { seasonId: activeSeasonId },
      _sum: { amount: true },
    }),

    // All active players for this division (needed for leaderboard even if no season points)
    db.player.findMany({
      where: { division: divisionFilter, isActive: true, registrationStatus: 'approved' },
      select: {
        id: true,
        name: true,
        gamertag: true,
        avatar: true,
        tier: true,
        points: true,
        totalWins: true,
        totalMvp: true,
        streak: true,
        maxStreak: true,
        matches: true,
        division: true,
        city: true,
        isActive: true,
        clubMembers: {
          where: { leftAt: null },
          include: { profile: { select: { id: true, name: true, logo: true } } },
          take: 1,
        },
      },
    }),

    // Clubs standings — use clubSeasonId (season with clubs)
    db.club.findMany({
      where: { seasonId: clubSeasonId },
      orderBy: [{ points: 'desc' }, { gameDiff: 'desc' }],
      include: { profile: { include: { _count: { select: { members: true } } } }, season: { select: { name: true, division: true } } },
    }),

    // Recent matches — use clubSeasonId (season with data)
    db.leagueMatch.findMany({
      where: { seasonId: clubSeasonId, status: 'completed' },
      orderBy: { week: 'desc' },
      take: 3,
      include: { club1: { include: { profile: true } }, club2: { include: { profile: true } } },
    }),

    // Upcoming matches
    db.leagueMatch.findMany({
      where: { seasonId: clubSeasonId, status: 'upcoming' },
      orderBy: { week: 'asc' },
      take: 3,
      include: { club1: { include: { profile: true } }, club2: { include: { profile: true } } },
    }),

    // Playoff matches
    db.playoffMatch.findMany({
      where: { seasonId: clubSeasonId },
      include: { club1: { include: { profile: true } }, club2: { include: { profile: true } } },
      orderBy: { round: 'asc' },
    }),

    // Tournaments list — fetch from ALL seasons for this division (not just activeSeasonId)
    // so that MVP Hall of Fame and weeklyChampions include completed seasons too
    db.tournament.findMany({
      where: { seasonId: { in: allSeasons.map((s: { id: string }) => s.id) } },
      orderBy: { weekNumber: 'asc' },
      include: {
        _count: { select: { teams: true, participations: true } },
        teams: {
          where: { isWinner: true },
          include: {
            teamPlayers: {
              include: {
                player: {
                  include: {
                    clubMembers: {
                      where: { leftAt: null },
                      include: { profile: { select: { id: true, name: true, logo: true } } },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
        participations: {
          where: { isMvp: true },
          include: { player: true },
        },
      },
    }),

    // All league matches grouped by week — use clubSeasonId (season with data)
    db.leagueMatch.findMany({
      where: { seasonId: clubSeasonId },
      orderBy: [{ week: 'asc' }],
      include: { club1: { include: { profile: true } }, club2: { include: { profile: true } } },
    }),
  ]);

  // ── Compute per-season topPlayers leaderboard ──
  // Build a map of playerId → per-season points from PlayerPoint aggregation
  const seasonPointsMap = new Map(seasonPointsRaw.map((sp: { playerId: string; _sum: { amount: number | null } }) => [sp.playerId, sp._sum.amount || 0]));

  // Merge: players with season points first (sorted by per-season points), then those without
  const topPlayers = (allDivisionPlayers as any[])
    .map(p => {
      const activeClub = p.clubMembers?.[0]?.profile;
      return {
        ...p,
        points: seasonPointsMap.get(p.id) || 0, // Override lifetime points with per-season points
        seasonPoints: seasonPointsMap.get(p.id) || 0,
        lifetimePoints: p.points,
        club: activeClub ? { id: activeClub.id, name: activeClub.name, logo: activeClub.logo } : undefined,
      };
    })
    .sort((a: any, b: any) => {
      if (b.seasonPoints !== a.seasonPoints) return b.seasonPoints - a.seasonPoints;
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
      return b.totalMvp - a.totalMvp;
    });

  // ── No more fallback logo/banner resolution needed ──
  // ClubProfile is now persistent — logo/banner are always on the profile
  // Clubs include their profile via { include: { profile: true } }

  // ── Compute derived values in-memory (no extra DB queries) ──

  // ═══ SKIN MAP — Build using shared utility ═══
  const playerIds = topPlayers.map((p: { id: string }) => p.id);
  const completedTournaments = tournaments.filter(t => t.status === 'completed');

  const skinMap = await buildSkinMap({
    playerIds,
    allSeasons: allSeasons as any[],
    completedTournaments: completedTournaments as any[],
  });

  // Total prize pool — filter weekly donations, per division
  const weeklyDonations = seasonDonations.filter(d => d.type === 'weekly');
  const totalPrizePool = weeklyDonations.reduce((sum, d) => sum + d.amount, 0);
  const malePrizePool = weeklyDonations.filter(d => d.division === 'male').reduce((sum, d) => sum + d.amount, 0);
  const femalePrizePool = weeklyDonations.filter(d => d.division === 'female').reduce((sum, d) => sum + d.amount, 0);

  // Season donation total
  const seasonDonationTotal = seasonDonations.reduce((sum, d) => sum + d.amount, 0);

  // Top donors — computed in-memory from seasonDonations instead of groupBy query
  const donorAccum = new Map<string, { totalAmount: number; donationCount: number }>();
  for (const d of seasonDonations) {
    const entry = donorAccum.get(d.donorName) ?? { totalAmount: 0, donationCount: 0 };
    donorAccum.set(d.donorName, {
      totalAmount: entry.totalAmount + d.amount,
      donationCount: entry.donationCount + 1,
    });
  }
  const topDonors = Array.from(donorAccum.entries())
    .map(([donorName, data]) => ({
      donorName,
      _sum: { amount: data.totalAmount },
      _count: { id: data.donationCount },
    }))
    .sort((a, b) => b._sum.amount - a._sum.amount)
    .slice(0, 5);

  // Build season lookup for tournament → season mapping
  const seasonLookup = new Map(allSeasons.map((s: { id: string; number: number; status: string }) => [s.id, s]));

  // Weekly champions — derived from completedTournaments (no new query)
  const weeklyChampions = completedTournaments.map(t => {
    const winnerTeam = t.teams[0]; // Only 1 winning team
    const mvpParticipation = t.participations.find(p => p.isMvp); // Admin-assigned MVP
    const mvpPlayer = mvpParticipation?.player;
    const tournamentSeason = seasonLookup.get(t.seasonId);
    return {
      weekNumber: t.weekNumber,
      tournamentName: t.name,
      prizePool: t.prizePool,
      completedAt: t.completedAt,
      seasonId: t.seasonId,
      seasonNumber: tournamentSeason?.number ?? 1,
      seasonStatus: tournamentSeason?.status ?? 'active',
      winnerTeam: winnerTeam ? {
        name: winnerTeam.name,
        players: winnerTeam.teamPlayers.map(tp => {
          const activeClub = (tp.player as any).clubMembers?.[0]?.profile;
          return {
            id: tp.player.id,
            gamertag: tp.player.gamertag,
            avatar: tp.player.avatar,
            tier: tp.player.tier,
            points: tp.player.points,
            totalWins: tp.player.totalWins,
            totalMvp: tp.player.totalMvp,
            streak: tp.player.streak,
            matches: tp.player.matches,
            club: activeClub ? { id: activeClub.id, name: activeClub.name, logo: activeClub.logo } : null,
            city: tp.player.city || null,
          };
        }),
      } : null,
      mvp: mvpPlayer ? { id: mvpPlayer.id, gamertag: mvpPlayer.gamertag, avatar: mvpPlayer.avatar, tier: mvpPlayer.tier, totalMvp: mvpPlayer.totalMvp, points: mvpPlayer.points } : null,
    };
  });

  // Season progress
  const completedWeeks = tournaments.filter(t => t.status === 'completed').length;

  // MVP Hall of Fame — computed in-memory from tournament participations instead of a separate query
  const mvpHallOfFame = completedTournaments
    .flatMap(t =>
      t.participations.map(p => ({
        _sortKey: p.createdAt as Date,
        id: p.player.id,
        gamertag: p.player.gamertag,
        avatar: p.player.avatar,
        tier: p.player.tier,
        totalMvp: p.player.totalMvp,
        points: p.player.points,
        totalWins: p.player.totalWins,
        streak: p.player.streak,
        weekNumber: t.weekNumber,
        tournamentName: t.name,
        prizePool: t.prizePool,
      }))
    )
    .sort((a, b) => +b._sortKey - +a._sortKey)
    .map(({ _sortKey, ...rest }) => rest);

  // Type for champion player in season info
  type SeasonChampionPlayer = {
    id: string;
    gamertag: string;
    avatar?: string | null;
    tier: string;
    points: number;
    totalWins: number;
    totalMvp: number;
    streak: number;
    maxStreak: number;
    matches: number;
    club?: string | { id: string; name: string; logo?: string | null } | null;
    city?: string | null;
    division?: string;
    /** Embedded skin flag — true for all season champions (virtual skin entry)
     *  Eliminates the need for a separate skinMap lookup in components */
    hasSeasonChampionSkin?: boolean;
  };

  // All seasons info for season selector — include champion player data
  // For completed seasons: use JSON snapshots (preserves historical data even when new seasons run)
  // For active seasons: query live player data (no snapshot exists yet)
  const allSeasonsInfo = await Promise.all(allSeasons.map(async (s: { id: string; name: string; number: number; status: string; startDate: Date | null; endDate: Date | null; championClubId: string | null; championPlayerId: string | null; championPlayerPoints: number | null; championPlayerSnapshot?: string | null; championClubSnapshot?: string | null; sultanPlayerId?: string | null; _count?: { tournaments?: number } }) => {
    let championPlayer: SeasonChampionPlayer | null = null;
    if (s.championPlayerId) {
      // Try to use snapshot for completed seasons (preserves historical stats)
      if (s.championPlayerSnapshot && s.status === 'completed') {
        try {
          const snapshot = JSON.parse(s.championPlayerSnapshot);
          championPlayer = {
            id: s.championPlayerId,
            gamertag: snapshot.gamertag || '',
            avatar: snapshot.avatar || null,
            tier: snapshot.tier || 'B',
            points: snapshot.points || 0, // Per-season points at time of closure
            totalWins: snapshot.totalWins || 0,
            totalMvp: snapshot.totalMvp || 0,
            streak: snapshot.streak || 0,
            maxStreak: snapshot.maxStreak || 0,
            matches: snapshot.matches || 0,
            club: snapshot.club || null,
            city: snapshot.city || null,
            division: snapshot.division,
            hasSeasonChampionSkin: true, // Season champions always have the virtual skin
          };

          // Enrich snapshot with live avatar/city/club if missing (backwards compat for old snapshots)
          if (!snapshot.avatar || !snapshot.city || (typeof snapshot.club === 'string' || !snapshot.club)) {
            const livePlayer = await db.player.findUnique({
              where: { id: s.championPlayerId },
              select: { avatar: true, city: true, clubMembers: { where: { leftAt: null }, include: { profile: { select: { id: true, name: true, logo: true } } }, take: 1 } },
            });
            if (livePlayer) {
              if (!snapshot.avatar && livePlayer.avatar) {
                championPlayer.avatar = livePlayer.avatar;
              }
              if (!snapshot.city && livePlayer.city) {
                championPlayer.city = livePlayer.city;
              }
              if (typeof snapshot.club === 'string' || !snapshot.club) {
                const activeClub = livePlayer.clubMembers[0]?.profile;
                if (activeClub) {
                  championPlayer.club = { id: activeClub.id, name: activeClub.name, logo: activeClub.logo };
                }
              }
            }
          }
        } catch {
          // Fallback to live data if snapshot is corrupted
        }
      }

      // Fallback: query live player data (for active seasons or if snapshot is missing/corrupted)
      if (!championPlayer) {
        const player = await db.player.findUnique({
          where: { id: s.championPlayerId },
          include: {
            clubMembers: {
              where: { leftAt: null },
              include: { profile: { select: { id: true, name: true, logo: true } } },
              take: 1,
            },
          },
        });
        if (player) {
          const activeClubProfile = player.clubMembers[0]?.profile;
          championPlayer = {
            id: player.id,
            gamertag: player.gamertag,
            avatar: player.avatar,
            tier: player.tier,
            points: s.championPlayerPoints ?? player.points, // Use snapshot per-season points if available
            totalWins: player.totalWins,
            totalMvp: player.totalMvp,
            streak: player.streak,
            maxStreak: player.maxStreak,
            matches: player.matches,
            club: activeClubProfile ? { id: activeClubProfile.id, name: activeClubProfile.name, logo: activeClubProfile.logo } : null,
            city: player.city || null,
            division: player.division,
            hasSeasonChampionSkin: true, // Season champions always have the virtual skin
          };
        }
      }
    }

    // Enrich champion club — use snapshot for completed seasons
    let championClub: { id: string; name: string; logo: string | null; members?: { id: string; gamertag: string; avatar: string | null; tier: string; points: number; division: string }[]; totalPoints?: number; maleScore?: number; femaleScore?: number } | null = null;
    if (s.championClubId) {
      // Try to use snapshot for completed seasons
      if (s.championClubSnapshot && s.status === 'completed') {
        try {
          const snapshot = JSON.parse(s.championClubSnapshot);
          championClub = {
            id: s.championClubId,
            name: snapshot.name || '',
            logo: snapshot.logo || null,
          };
        } catch {
          // Fallback to live data
        }
      }

      // Fallback: query live ClubProfile
      if (!championClub) {
        const profile = await db.clubProfile.findUnique({
          where: { id: s.championClubId },
          select: { id: true, name: true, logo: true },
        });
        if (profile) championClub = profile;
      }

      // Enrich with members and their per-season points for completed seasons
      if (championClub && s.status === 'completed') {
        // Get all members of this club
        const clubMembers = await db.clubMember.findMany({
          where: { profileId: s.championClubId, leftAt: null },
          include: {
            player: {
              select: { id: true, gamertag: true, avatar: true, tier: true, division: true },
            },
          },
        });

        // Get per-season points from PlayerSeasonStats
        // Query BOTH male and female seasons for this season number to get all member points
        const memberIds = clubMembers.map(cm => cm.player.id);
        const sameNumberSeasons = await db.season.findMany({
          where: { number: s.number },
          select: { id: true },
        });
        const seasonIds = sameNumberSeasons.map((as2: any) => as2.id);

        const seasonStats = await db.playerSeasonStats.findMany({
          where: {
            playerId: { in: memberIds },
            seasonId: { in: seasonIds },
          },
        });

        const statsMap = new Map<string, { points: number; tier: string }>();
        for (const ps of seasonStats) {
          const existing = statsMap.get(ps.playerId);
          if (existing) {
            existing.points += ps.points;
            // Keep the higher tier
            const tierOrder = ['S', 'A', 'B'];
            if (tierOrder.indexOf(ps.tier) < tierOrder.indexOf(existing.tier)) {
              existing.tier = ps.tier;
            }
          } else {
            statsMap.set(ps.playerId, { points: ps.points, tier: ps.tier });
          }
        }

        const members = clubMembers.map(cm => {
          const stat = statsMap.get(cm.player.id);
          return {
            id: cm.player.id,
            gamertag: cm.player.gamertag,
            avatar: cm.player.avatar,
            tier: stat?.tier || cm.player.tier,
            points: stat?.points || 0,
            division: cm.player.division,
          };
        }); // Include all members — even those with 0 points for correct member count

        const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
        const maleScore = members.filter(m => m.division === 'male').reduce((sum, m) => sum + m.points, 0);
        const femaleScore = members.filter(m => m.division === 'female').reduce((sum, m) => sum + m.points, 0);

        championClub.members = members;
        championClub.totalPoints = totalPoints;
        championClub.maleScore = maleScore;
        championClub.femaleScore = femaleScore;

        // Also update logo from live data if snapshot logo is missing
        if (!championClub.logo) {
          const profile = await db.clubProfile.findUnique({
            where: { id: s.championClubId },
            select: { logo: true },
          });
          if (profile?.logo) championClub.logo = profile.logo;
        }
      }
    }

    // Sultan of Season (top penyawer) — fetch from sultanPlayerId
    let sultanPlayer: { id: string; gamertag: string; avatar: string | null; division: string; tier: string; points: number; city: string | null; club: { id: string; name: string; logo: string | null } | null } | null = null;
    if (s.sultanPlayerId) {
      const sultan = await db.player.findUnique({
        where: { id: s.sultanPlayerId },
        select: {
          id: true, gamertag: true, avatar: true, division: true, tier: true,
          points: true, city: true,
          clubMembers: { where: { leftAt: null }, include: { profile: { select: { id: true, name: true, logo: true } } }, take: 1 },
        },
      });
      if (sultan) {
        const activeClub = sultan.clubMembers[0]?.profile;
        sultanPlayer = {
          id: sultan.id,
          gamertag: sultan.gamertag,
          avatar: sultan.avatar,
          division: sultan.division,
          tier: sultan.tier,
          points: sultan.points,
          city: sultan.city || null,
          club: activeClub ? { id: activeClub.id, name: activeClub.name, logo: activeClub.logo } : null,
        };
      }
    }

    return {
      id: s.id,
      name: s.name,
      number: s.number,
      status: s.status,
      startDate: s.startDate,
      endDate: s.endDate,
      tournamentCount: s._count?.tournaments ?? 0,
      championClubId: s.championClubId,
      championPlayerId: s.championPlayerId,
      championPlayer,
      championClub,
      sultanPlayerId: s.sultanPlayerId,
      sultanPlayer,
    };
  }));

  // ── Flatten club data for frontend compatibility ──
  // New schema: Club has profileId → ClubProfile (name, logo, bannerImage)
  // Frontend expects: { id, name, logo, wins, losses, points, gameDiff, _count: { members } }
  const flatClubs = clubs.map((c: any) => ({
    id: c.id,
    name: c.profile?.name || '',
    logo: c.profile?.logo || null,
    bannerImage: c.profile?.bannerImage || null,
    division: c.division,
    seasonId: c.seasonId,
    wins: c.wins,
    losses: c.losses,
    points: c.points,
    gameDiff: c.gameDiff,
    _count: { members: c.profile?._count?.members || 0 },
    profileId: c.profileId,
  }));

  // Flatten matches (club1/club2 now have nested profile)
  const flatRecentMatches = recentMatches.map((m: any) => ({
    ...m, club1: { id: m.club1?.id, name: m.club1?.profile?.name, logo: m.club1?.profile?.logo }, club2: { id: m.club2?.id, name: m.club2?.profile?.name, logo: m.club2?.profile?.logo },
  }));
  const flatUpcomingMatches = upcomingMatches.map((m: any) => ({
    ...m, club1: { id: m.club1?.id, name: m.club1?.profile?.name, logo: m.club1?.profile?.logo }, club2: { id: m.club2?.id, name: m.club2?.profile?.name, logo: m.club2?.profile?.logo },
  }));
  const flatPlayoffMatches = playoffMatches.map((m: any) => ({
    ...m, club1: { id: m.club1?.id, name: m.club1?.profile?.name, logo: m.club1?.profile?.logo }, club2: { id: m.club2?.id, name: m.club2?.profile?.name, logo: m.club2?.profile?.logo },
  }));
  const flatLeagueMatches = leagueMatches.map((m: any) => ({
    ...m, club1: { id: m.club1?.id, name: m.club1?.profile?.name, logo: m.club1?.profile?.logo }, club2: { id: m.club2?.id, name: m.club2?.profile?.name, logo: m.club2?.profile?.logo },
  }));

  // ═══ Compute Weekly Top Performers — "Bintang Minggu Ini" ═══
  // Composite score: points gained this week (40%), win rate (25%),
  // streak (15%), tournament winner bonus (10%), tier underdog bonus (10%)
  // Tie-break: lower tier wins (S=3, A=2, B=1 — lower = better underdog)
  let weeklyTopPerformers: any[] = [];

  // Find the latest tournament for the active season (completed or in-progress)
  const latestTournament = [...tournaments]
    .filter(t => t.seasonId === activeSeasonId)
    .sort((a, b) => b.weekNumber - a.weekNumber)[0];

  if (latestTournament) {
    // Query PlayerPoint records for this tournament to get per-player points gained this week
    const [weeklyPointsRaw, weeklyParticipations, weeklyMatchesRaw] = await Promise.all([
      db.playerPoint.groupBy({
        by: ['playerId'],
        where: { tournamentId: latestTournament.id },
        _sum: { amount: true },
      }),
      db.participation.findMany({
        where: { tournamentId: latestTournament.id, status: 'approved' },
        include: { player: true },
      }),
      // ═══ Query completed matches to calculate per-player match wins/losses ═══
      // This replaces the old isWinner-based W/L which only tracked tournament-level wins
      db.match.findMany({
        where: { tournamentId: latestTournament.id, status: 'completed' },
        include: {
          winner: { include: { teamPlayers: true } },
          loser: { include: { teamPlayers: true } },
        },
      }),
    ]);

    // Build map: playerId → { matchWins, matchLosses } from actual match results
    const matchStatsMap = new Map<string, { wins: number; losses: number }>();
    for (const match of weeklyMatchesRaw) {
      if (match.winner?.teamPlayers) {
        for (const tp of match.winner.teamPlayers) {
          const existing = matchStatsMap.get(tp.playerId) || { wins: 0, losses: 0 };
          existing.wins++;
          matchStatsMap.set(tp.playerId, existing);
        }
      }
      if (match.loser?.teamPlayers) {
        for (const tp of match.loser.teamPlayers) {
          const existing = matchStatsMap.get(tp.playerId) || { wins: 0, losses: 0 };
          existing.losses++;
          matchStatsMap.set(tp.playerId, existing);
        }
      }
    }

    // Build map: playerId → points gained this week
    const weeklyPointsMap = new Map(
      weeklyPointsRaw.map((wp: { playerId: string; _sum: { amount: number | null } }) => [wp.playerId, wp._sum.amount || 0])
    );

    // Build map: playerId → participation data
    const weeklyPartMap = new Map(
      weeklyParticipations.map((p: any) => [p.playerId, p])
    );

    // Build map: playerId → player from topPlayers (has season points, tier, streak, etc.)
    const topPlayersMap = new Map(
      topPlayers.map((p: any) => [p.id, p])
    );

    // Collect all players who earned points this week
    const candidates: any[] = [];
    for (const [playerId, weeklyPts] of weeklyPointsMap) {
      const player = topPlayersMap.get(playerId);
      if (!player) continue;

      const part = weeklyPartMap.get(playerId);
      const matchStats = matchStatsMap.get(playerId) || { wins: 0, losses: 0 };
      const totalMatches = matchStats.wins + matchStats.losses;
      const matchWinRate = totalMatches > 0 ? Math.round((matchStats.wins / totalMatches) * 100) : 0;

      candidates.push({
        id: player.id,
        gamertag: player.gamertag,
        avatar: player.avatar,
        tier: player.tier || 'B',
        points: player.seasonPoints ?? player.points ?? 0,
        weeklyPointsGained: weeklyPts,
        weeklyWins: matchStats.wins,
        weeklyLosses: matchStats.losses,
        weeklyMatches: totalMatches,
        weeklyWinRate: matchWinRate,
        streak: player.streak ?? 0,
        club: player.clubMembers?.[0]?.profile?.name ?? null,
      });
    }

    // Also include players who participated but may not have PlayerPoint records yet
    for (const [playerId, part] of weeklyPartMap) {
      if (weeklyPointsMap.has(playerId)) continue; // Already processed
      const player = topPlayersMap.get(playerId);
      if (!player) continue;

      const matchStats = matchStatsMap.get(playerId) || { wins: 0, losses: 0 };
      const totalMatches = matchStats.wins + matchStats.losses;
      const matchWinRate = totalMatches > 0 ? Math.round((matchStats.wins / totalMatches) * 100) : 0;

      candidates.push({
        id: player.id,
        gamertag: player.gamertag,
        avatar: player.avatar,
        tier: player.tier || 'B',
        points: player.seasonPoints ?? player.points ?? 0,
        weeklyPointsGained: part.pointsEarned ?? 0,
        weeklyWins: matchStats.wins,
        weeklyLosses: matchStats.losses,
        weeklyMatches: totalMatches,
        weeklyWinRate: matchWinRate,
        streak: player.streak ?? 0,
        club: player.clubMembers?.[0]?.profile?.name ?? null,
      });
    }

    // ═══ Compute Composite Score ═══
    // Normalize each factor to 0-100 scale, then apply weights
    // UPDATED: Win rate now uses match-level W/L instead of tournament-level isWinner
    if (candidates.length > 0) {
      const maxWeeklyPts = Math.max(...candidates.map(c => c.weeklyPointsGained), 1);
      const maxStreak = Math.max(...candidates.map(c => c.streak), 1);

      // Tier underdog score: B=100, A=50, S=0 (lower tier = higher score)
      const tierScore = (tier: string) => {
        const t = tier.toUpperCase();
        if (t === 'B') return 100;
        if (t === 'A') return 50;
        return 0; // S tier
      };

      for (const c of candidates) {
        const pointsNorm = (c.weeklyPointsGained / maxWeeklyPts) * 100;
        const winRateScore = c.weeklyWinRate; // Match-level win rate (0-100)
        const streakNorm = (c.streak / maxStreak) * 100;
        // Winner bonus: 100 if player has at least 1 match win, 0 if no wins at all
        const winnerBonus = c.weeklyWins > 0 ? 100 : 0;
        const underdogScore = tierScore(c.tier);

        c.compositeScore = Math.round(
          pointsNorm * 0.40 +      // Points gained (40%)
          winRateScore * 0.25 +     // Match win rate (25%)
          streakNorm * 0.15 +       // Streak momentum (15%)
          winnerBonus * 0.10 +      // Match winner bonus (10%)
          underdogScore * 0.10      // Tier underdog bonus (10%)
        );
      }

      // Sort by composite score DESC, then tie-break: lower tier first (B < A < S)
      const tierRank = (tier: string) => {
        const t = tier.toUpperCase();
        if (t === 'B') return 1; // Best underdog — wins tie
        if (t === 'A') return 2;
        return 3; // S — loses tie
      };

      candidates.sort((a, b) => {
        if (b.compositeScore !== a.compositeScore) return b.compositeScore - a.compositeScore;
        return tierRank(a.tier) - tierRank(b.tier); // Lower tier wins on tie
      });

      weeklyTopPerformers = candidates.slice(0, 5).map(c => ({
        ...c,
        division: c.division || division,
        weekNumber: latestTournament.weekNumber,
      }));
    }
  }

  // ═══ Compute Sultan of the Week — top penyawer per tournament ═══
  // For each tournament (week), find the donor with the highest total donation amount.
  // Uses existing seasonDonations data — no extra DB queries needed.
  const tournamentMap = new Map(tournaments.map((t: any) => [t.id, t]));

  // Group donations by tournamentId, then by donorName
  const tournamentDonors = new Map<string, Map<string, { totalAmount: number; donationCount: number }>>();
  for (const d of seasonDonations) {
    if (!d.tournamentId) continue;
    const tId = d.tournamentId as string;
    if (!tournamentMap.has(tId)) continue; // Only include donations for tournaments in our list

    let donorMap = tournamentDonors.get(tId);
    if (!donorMap) {
      donorMap = new Map();
      tournamentDonors.set(tId, donorMap);
    }
    const entry = donorMap.get(d.donorName) ?? { totalAmount: 0, donationCount: 0 };
    donorMap.set(d.donorName, {
      totalAmount: entry.totalAmount + d.amount,
      donationCount: entry.donationCount + 1,
    });
  }

  // Also include the active tournament's donations (which may not be in tournaments list if not yet saved)
  if (activeTournament?.donations?.length) {
    const tId = activeTournament.id;
    if (!tournamentDonors.has(tId)) {
      const donorMap = new Map<string, { totalAmount: number; donationCount: number }>();
      for (const d of activeTournament.donations) {
        if (d.status !== 'approved') continue;
        const entry = donorMap.get(d.donorName) ?? { totalAmount: 0, donationCount: 0 };
        donorMap.set(d.donorName, {
          totalAmount: entry.totalAmount + d.amount,
          donationCount: entry.donationCount + 1,
        });
      }
      if (donorMap.size > 0) {
        tournamentDonors.set(tId, donorMap);
      }
    }
  }

  // ═══ Build cross-division player map for Sultan of the Week donor matching ═══
  // IMPORTANT: A Female player can donate to a Male tournament (and vice versa).
  // The Sultan of the Week is per-tournament, regardless of the donor's own division.
  // Therefore, we must search ALL players from BOTH divisions when matching donors.
  const allPlayersForDonorMatching = await db.player.findMany({
    where: { isActive: true, registrationStatus: 'approved' },
    select: {
      id: true,
      name: true,
      gamertag: true,
      avatar: true,
      tier: true,
      points: true,
      totalWins: true,
      totalMvp: true,
      streak: true,
      division: true,
      clubMembers: {
        where: { leftAt: null },
        include: { profile: { select: { id: true, name: true, logo: true } } },
        take: 1,
      },
    },
  });

  const playerByGamertag = new Map(
    allPlayersForDonorMatching.map(p => {
      const activeClub = p.clubMembers?.[0]?.profile;
      return [p.gamertag?.toLowerCase(), { ...p, club: activeClub ? { id: activeClub.id, name: activeClub.name, logo: activeClub.logo } : null }];
    })
  );

  // For each tournament with donations, find the top donor
  const sultanOfWeekly: any[] = [];
  for (const [tId, donorMap] of tournamentDonors) {
    const tournament = tournamentMap.get(tId) || activeTournament;
    if (!tournament) continue;

    // Find top donor for this tournament
    const sortedDonors = Array.from(donorMap.entries())
      .sort((a, b) => b[1].totalAmount - a[1].totalAmount);
    if (sortedDonors.length === 0) continue;

    const [topDonorName, topDonorData] = sortedDonors[0];

    // Try to match donorName to a player (cross-division: matches ANY player regardless of division)
    const matchedPlayer = playerByGamertag.get(topDonorName?.toLowerCase());
    let playerInfo: {
      id: string;
      gamertag: string;
      avatar: string | null;
      tier: string;
      points: number;
      totalWins: number;
      totalMvp: number;
      streak: number;
      division: string;
      club: string | { id: string; name: string; logo?: string | null } | null;
    } | null = null;
    if (matchedPlayer) {
      playerInfo = {
        id: matchedPlayer.id,
        gamertag: matchedPlayer.gamertag,
        avatar: matchedPlayer.avatar,
        tier: matchedPlayer.tier,
        points: matchedPlayer.points,
        totalWins: matchedPlayer.totalWins,
        totalMvp: matchedPlayer.totalMvp,
        streak: matchedPlayer.streak,
        division: matchedPlayer.division, // The donor's ACTUAL division (may differ from tournament division)
        club: matchedPlayer.club || null,
      };
    }

    sultanOfWeekly.push({
      weekNumber: tournament.weekNumber,
      tournamentName: tournament.name,
      tournamentId: tId,
      tournamentDivision: tournament.division, // The tournament's division (male/female)
      donorName: topDonorName || 'Anonymous',
      totalAmount: topDonorData.totalAmount,
      donationCount: topDonorData.donationCount,
      player: playerInfo,
      isCrossDivision: playerInfo ? playerInfo.division !== tournament.division : false, // Flag for UI highlight
    });
  }

  // Sort by weekNumber ascending
  sultanOfWeekly.sort((a, b) => a.weekNumber - b.weekNumber);

  // ═══ SULTAN OF THE WEEK — Add virtual skin entries to skinMap ═══
  // Only the LATEST week's Sultan gets the sultan_weekly skin (current reigning Sultan)
  const SULTAN_WEEKLY_COLORS = JSON.stringify({
    frame: '#800020',
    name: '#C4A3A5|#800020|#5C0015',
    badge: 'rgba(128,0,32,0.2)|#C4A3A5',
    border: '#5C0015|#800020|#C4A3A5|#800020|#5C0015',
    glow: 'rgba(128,0,32,0.5)',
  });

  for (const sultan of sultanOfWeekly) {
    if (sultan.player?.id) {
      const pid = sultan.player.id;
      if (!skinMap[pid]) skinMap[pid] = [];
      // Only add if not already present
      if (!skinMap[pid].some(s => s.type === 'sultan_weekly')) {
        skinMap[pid].push({
          type: 'sultan_weekly',
          icon: '❤️',
          displayName: 'Sultan of the Week',
          colorClass: SULTAN_WEEKLY_COLORS,
          priority: 5,
          duration: 'weekly',
          reason: `Sultan of the Week ${sultan.tournamentName || 'W' + sultan.weekNumber}`,
          expiresAt: null,
        });
      }
    }
  }

  return NextResponse.json({
    hasData: true,
    division,
    season,
    allSeasons: allSeasonsInfo,
    seasonForClubs, // Season that has clubs — used by admin club management
    activeTournament,
    totalPlayers,
    approvedPlayerCount,
    totalPrizePool,
    malePrizePool,
    femalePrizePool,
    seasonDonationTotal,
    topPlayers,
    skinMap,
    clubs: flatClubs,
    recentMatches: flatRecentMatches,
    upcomingMatches: flatUpcomingMatches,
    playoffMatches: flatPlayoffMatches,
    tournaments,
    weeklyChampions,
    leagueMatches: flatLeagueMatches,
    topDonors,
    mvpHallOfFame,
    seasonProgress: {
      totalWeeks: SEASON_TOTAL_WEEKS,
      completedWeeks,
      percentage: SEASON_TOTAL_WEEKS > 0 ? Math.round((completedWeeks / SEASON_TOTAL_WEEKS) * 100) : 0,
    },
    weeklyTopPerformers,
    sultanOfWeekly,
  }, {
    headers: STATS_CACHE_HEADERS,
  });
  } catch (error) {
    console.error('[GET /api/stats]', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { headers,  status: 500 });
  }
}
