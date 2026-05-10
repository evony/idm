import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Surrogate-Key': 'league-data',
};

export async function GET(request: NextRequest) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const seasonId = searchParams.get('seasonId');

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId query parameter is required' },
        { headers,  status: 400 }
      );
    }

    // Find the club with profile
    const club = await db.club.findUnique({
      where: { id: clubId },
      include: { profile: { select: { name: true, logo: true } } },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { headers,  status: 404 });
    }

    // Use provided seasonId or fall back to the club's seasonId
    const effectiveSeasonId = seasonId || club.seasonId;

    // Build where clause for league matches
    const matchWhere: Record<string, unknown> = {
      seasonId: effectiveSeasonId,
      OR: [{ club1Id: clubId }, { club2Id: clubId }],
    };

    // Get all league matches for this club in the season
    const matches = await db.leagueMatch.findMany({
      where: matchWhere,
      include: {
        club1: { include: { profile: { select: { name: true, logo: true } } } },
        club2: { include: { profile: { select: { name: true, logo: true } } } },
      },
      orderBy: { week: 'asc' },
    });

    const formattedMatches = matches.map((m) => {
      const isHome = m.club1Id === clubId;
      const opponent = isHome
        ? { id: m.club2.id, name: m.club2.profile?.name, logo: m.club2.profile?.logo }
        : { id: m.club1.id, name: m.club1.profile?.name, logo: m.club1.profile?.logo };

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
        opponent,
        result,
      };
    });

    return NextResponse.json(
      {
        club: { id: club.id, name: club.profile.name, logo: club.profile.logo },
        matches: formattedMatches,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[API /league-matches/club] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch club schedule' },
      { headers,  status: 500 }
    );
  }
}
