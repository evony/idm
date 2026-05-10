import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  const { id } = await params;

  const match = await db.leagueMatch.findUnique({
    where: { id },
    include: {
      club1: {
        include: {
          profile: {
            select: { name: true, logo: true },
            include: {
              members: {
                where: { leftAt: null },
                include: {
                  player: {
                    select: {
                      id: true,
                      gamertag: true,
                      avatar: true,
                      tier: true,
                      points: true,
                      totalWins: true,
                      totalMvp: true,
                    },
                  },
                },
                orderBy: { role: 'desc' },
              },
            },
          },
        },
      },
      club2: {
        include: {
          profile: {
            select: { name: true, logo: true },
            include: {
              members: {
                where: { leftAt: null },
                include: {
                  player: {
                    select: {
                      id: true,
                      gamertag: true,
                      avatar: true,
                      tier: true,
                      points: true,
                      totalWins: true,
                      totalMvp: true,
                    },
                  },
                },
                orderBy: { role: 'desc' },
              },
            },
          },
        },
      },
    },
  });

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { headers,  status: 404 });
  }

  // Try to find MVP player from tournament matches for this week
  let mvpPlayer: { id: string; gamertag: string; avatar: string | null; tier: string } | null = null;
  if (match.status === 'completed') {
    const tournamentMatch = await db.match.findFirst({
      where: {
        status: 'completed',
        mvpPlayerId: { not: null },
        tournament: {
          weekNumber: match.week,
          division: match.club1.division,
          status: 'completed',
        },
      },
      include: {
        mvpPlayer: {
          select: {
            id: true,
            gamertag: true,
            avatar: true,
            tier: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });
    if (tournamentMatch?.mvpPlayer) {
      mvpPlayer = tournamentMatch.mvpPlayer;
    }
  }

  const result = {
    id: match.id,
    week: match.week,
    score1: match.score1,
    score2: match.score2,
    status: match.status,
    format: match.format,
    mvpPlayer,
    club1: {
      id: match.club1.id,
      name: match.club1.profile?.name || '',
      logo: match.club1.profile?.logo || null,
      members: (match.club1.profile?.members || []).map(m => ({
        id: m.player.id,
        gamertag: m.player.gamertag,
        avatar: m.player.avatar,
        tier: m.player.tier,
        role: m.role,
        points: m.player.points,
        totalWins: m.player.totalWins,
        totalMvp: m.player.totalMvp,
      })),
    },
    club2: {
      id: match.club2.id,
      name: match.club2.profile?.name || '',
      logo: match.club2.profile?.logo || null,
      members: (match.club2.profile?.members || []).map(m => ({
        id: m.player.id,
        gamertag: m.player.gamertag,
        avatar: m.player.avatar,
        tier: m.player.tier,
        role: m.role,
        points: m.player.points,
        totalWins: m.player.totalWins,
        totalMvp: m.player.totalMvp,
      })),
    },
  };

  return NextResponse.json(result, { headers });
}
