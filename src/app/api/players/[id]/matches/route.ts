import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Surrogate-Key': 'league-data',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const { id } = await params;

    // 1. Find the player by ID with club membership (via ClubProfile)
    const player = await db.player.findUnique({
      where: { id },
      include: {
        clubMembers: {
          where: { leftAt: null },
          include: {
            profile: {
              select: { id: true, name: true, logo: true },
            },
          },
          take: 1,
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { headers,  status: 404 });
    }

    const clubMembership = player.clubMembers[0];
    const clubProfile = clubMembership?.profile ?? null;

    // 2. Find league matches — via club membership
    // Need to find the Club season entries for this profile to get clubIds for match lookups
    let leagueMatches: Array<{
      id: string;
      week: number;
      score1: number | null;
      score2: number | null;
      status: string;
      format: string;
      isHome: boolean;
      club1: { id: string; name: string; logo: string | null };
      club2: { id: string; name: string; logo: string | null };
      result: 'win' | 'loss' | 'upcoming' | null;
    }> = [];

    if (clubProfile) {
      // Get all club season entries for this profile
      const clubEntries = await db.club.findMany({
        where: { profileId: clubProfile.id },
        select: { id: true },
      });
      const clubIds = clubEntries.map(c => c.id);

      if (clubIds.length > 0) {
        // Get all league matches where player's club entries are home or away
        const allLeagueMatches = await db.leagueMatch.findMany({
          where: {
            OR: [
              { club1Id: { in: clubIds } },
              { club2Id: { in: clubIds } },
            ],
          },
          include: {
            club1: { include: { profile: { select: { id: true, name: true, logo: true } } } },
            club2: { include: { profile: { select: { id: true, name: true, logo: true } } } },
          },
          orderBy: { week: 'desc' },
        });

        leagueMatches = allLeagueMatches.map((m) => {
          const isHome = clubIds.includes(m.club1Id);
          let result: 'win' | 'loss' | 'upcoming' | null = null;

          if (m.status === 'completed' && m.score1 !== null && m.score2 !== null) {
            if (isHome) {
              result = m.score1 > m.score2 ? 'win' : 'loss';
            } else {
              result = m.score2 > m.score1 ? 'win' : 'loss';
            }
          } else if (m.status === 'upcoming' || m.status === 'live') {
            result = 'upcoming';
          }

          return {
            id: m.id,
            week: m.week,
            score1: m.score1,
            score2: m.score2,
            status: m.status,
            format: m.format,
            isHome,
            club1: { id: m.club1.id, name: m.club1.profile?.name || '', logo: m.club1.profile?.logo || null },
            club2: { id: m.club2.id, name: m.club2.profile?.name || '', logo: m.club2.profile?.logo || null },
            result,
          };
        });
      }
    }

    // 3. Find tournament matches — via team memberships
    const teamPlayers = await db.teamPlayer.findMany({
      where: { playerId: id },
      include: { team: true },
    });

    const teamIds = teamPlayers.map((tp) => tp.teamId);

    let tournamentMatches: Array<{
      id: string;
      round: number;
      score1: number | null;
      score2: number | null;
      status: string;
      format: string;
      tournamentName: string;
      weekNumber: number;
      team1: { id: string; name: string };
      team2: { id: string; name: string } | null;
      mvpPlayer: { id: string; gamertag: string } | null;
      playerTeamId: string;
      result: 'win' | 'loss' | null;
    }> = [];

    if (teamIds.length > 0) {
      // Get matches where any of the player's teams are team1 or team2
      const matchesAsTeam1 = await db.match.findMany({
        where: { team1Id: { in: teamIds } },
        include: {
          team1: { select: { id: true, name: true } },
          team2: { select: { id: true, name: true } },
          mvpPlayer: { select: { id: true, gamertag: true } },
          tournament: { select: { name: true, weekNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const matchesAsTeam2 = await db.match.findMany({
        where: { team2Id: { in: teamIds } },
        include: {
          team1: { select: { id: true, name: true } },
          team2: { select: { id: true, name: true } },
          mvpPlayer: { select: { id: true, gamertag: true } },
          tournament: { select: { name: true, weekNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const allMatches = [...matchesAsTeam1, ...matchesAsTeam2].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Deduplicate
      const seenIds = new Set<string>();

      tournamentMatches = allMatches
        .filter((m) => {
          if (seenIds.has(m.id)) return false;
          seenIds.add(m.id);
          return true;
        })
        .map((m) => {
          const isTeam1 = teamIds.includes(m.team1Id ?? '');
          const playerTeamId = isTeam1
            ? m.team1Id!
            : m.team2Id!;

          let result: 'win' | 'loss' | null = null;
          if (m.status === 'completed' && m.score1 !== null && m.score2 !== null) {
            if (isTeam1) {
              result = m.score1 > m.score2 ? 'win' : 'loss';
            } else {
              result = m.score2 > m.score1 ? 'win' : 'loss';
            }
          }

          return {
            id: m.id,
            round: m.round,
            score1: m.score1,
            score2: m.score2,
            status: m.status,
            format: m.format,
            tournamentName: m.tournament.name,
            weekNumber: m.tournament.weekNumber,
            team1: { id: m.team1!.id, name: m.team1!.name },
            team2: m.team2 ? { id: m.team2.id, name: m.team2.name } : null,
            mvpPlayer: m.mvpPlayer,
            playerTeamId,
            result,
          };
        });
    }

    return NextResponse.json(
      {
        player: {
          id: player.id,
          gamertag: player.gamertag,
          division: player.division,
          tier: player.tier,
          club: clubProfile ? { id: clubProfile.id, name: clubProfile.name, logo: clubProfile.logo } : null,
        },
        leagueMatches,
        tournamentMatches,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[API /players/[id]/matches] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player matches' },
      { headers,  status: 500 }
    );
  }
}
