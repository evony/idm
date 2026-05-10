import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division') || 'male';

  // Get active season (must be sequential — everything else depends on it)
  const season = await db.season.findFirst({
    where: { division, status: 'active' },
    orderBy: { number: 'desc' },
  });

  if (!season) {
    return NextResponse.json({ hasData: false, division }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  }

  // Run ALL independent queries in parallel
  const [
    activeTournament,
    totalPlayers,
    divisionDonations,
    seasonDonations,
    topPlayers,
    clubs,
    recentMatches,
    upcomingMatches,
    playoffMatches,
    tournaments,
    leagueMatches,
  ] = await Promise.all([
    // Active/recent tournament
    db.tournament.findFirst({
      where: { division, seasonId: season.id },
      orderBy: { weekNumber: 'desc' },
      include: {
        teams: { include: { teamPlayers: { include: { player: true } } } },
        matches: { include: { team1: true, team2: true, mvpPlayer: true } },
        participations: { include: { player: true } },
        donations: true,
      },
    }),

    // Total players
    db.player.count({ where: { division, isActive: true } }),

    // ALL donations for the division (replaces separate donations + topDonors queries)
    db.donation.findMany({
      where: { tournament: { division } },
    }),

    // Season donations
    db.donation.findMany({
      where: { seasonId: season.id },
    }),

    // Top players leaderboard
    db.player.findMany({
      where: { division },
      orderBy: [{ points: 'desc' }, { totalWins: 'desc' }],
      take: 10,
    }),

    // Clubs standings
    db.club.findMany({
      where: { seasonId: season.id },
      orderBy: [{ points: 'desc' }, { gameDiff: 'desc' }],
      include: { _count: { select: { members: true } } },
    }),

    // Recent matches
    db.leagueMatch.findMany({
      where: { seasonId: season.id, status: 'completed' },
      orderBy: { week: 'desc' },
      take: 3,
      include: { club1: true, club2: true },
    }),

    // Upcoming matches
    db.leagueMatch.findMany({
      where: { seasonId: season.id, status: 'upcoming' },
      orderBy: { week: 'asc' },
      take: 3,
      include: { club1: true, club2: true },
    }),

    // Playoff matches
    db.playoffMatch.findMany({
      where: { seasonId: season.id },
      include: { club1: true, club2: true },
      orderBy: { round: 'asc' },
    }),

    // Tournaments list — enriched with winner teams & MVP participations
    // (replaces separate completedTournaments and mvpParticipations queries)
    db.tournament.findMany({
      where: { division, seasonId: season.id },
      orderBy: { weekNumber: 'asc' },
      include: {
        _count: { select: { teams: true, participations: true } },
        teams: {
          where: { isWinner: true },
          include: { teamPlayers: { include: { player: true } } },
        },
        participations: {
          where: { isMvp: true },
          include: { player: true },
        },
      },
    }),

    // All league matches grouped by week
    db.leagueMatch.findMany({
      where: { seasonId: season.id },
      orderBy: [{ week: 'asc' }],
      include: { club1: true, club2: true },
    }),
  ]);

  // ── Compute derived values in-memory (no extra DB queries) ──

  // Total prize pool — filter weekly donations from the division-wide set
  const totalPrizePool = divisionDonations
    .filter(d => d.type === 'weekly')
    .reduce((sum, d) => sum + d.amount, 0);

  // Season donation total
  const seasonDonationTotal = seasonDonations.reduce((sum, d) => sum + d.amount, 0);

  // Top donors — computed in-memory from divisionDonations instead of groupBy query
  const donorAccum = new Map<string, { totalAmount: number; donationCount: number }>();
  for (const d of divisionDonations) {
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

  // Completed tournaments — filtered in-memory from already-fetched list
  const completedTournaments = tournaments.filter(t => t.status === 'completed');

  // Weekly champions — derived from completedTournaments (no new query)
  const weeklyChampions = completedTournaments.map(t => {
    const winnerTeam = t.teams[0]; // Only 1 winning team
    const mvpParticipation = t.participations.find(p => p.isMvp); // Admin-assigned MVP
    const mvpPlayer = mvpParticipation?.player;
    return {
      weekNumber: t.weekNumber,
      tournamentName: t.name,
      prizePool: t.prizePool,
      completedAt: t.completedAt,
      winnerTeam: winnerTeam ? {
        name: winnerTeam.name,
        players: winnerTeam.teamPlayers.map(tp => ({
          id: tp.player.id,
          gamertag: tp.player.gamertag,
          avatar: tp.player.avatar,
          tier: tp.player.tier,
          points: tp.player.points,
          totalWins: tp.player.totalWins,
          totalMvp: tp.player.totalMvp,
          streak: tp.player.streak,
          matches: tp.player.matches,
        })),
      } : null,
      mvp: mvpPlayer ? { id: mvpPlayer.id, gamertag: mvpPlayer.gamertag, avatar: mvpPlayer.avatar, tier: mvpPlayer.tier, totalMvp: mvpPlayer.totalMvp, points: mvpPlayer.points } : null,
    };
  });

  // Season progress
  const totalWeeks = 11; // 11 weeks per season
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

  return NextResponse.json({
    hasData: true,
    division,
    season,
    activeTournament,
    totalPlayers,
    totalPrizePool,
    seasonDonationTotal,
    topPlayers,
    clubs,
    recentMatches,
    upcomingMatches,
    playoffMatches,
    tournaments,
    weeklyChampions,
    leagueMatches,
    topDonors,
    mvpHallOfFame,
    seasonProgress: {
      totalWeeks,
      completedWeeks,
      percentage: Math.round((completedWeeks / totalWeeks) * 100),
    },
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
    },
  });
}
