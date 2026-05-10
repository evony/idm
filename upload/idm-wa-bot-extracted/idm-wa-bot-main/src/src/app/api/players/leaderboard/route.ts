import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division');
  const seasonId = searchParams.get('seasonId');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: Record<string, unknown> = {};
  if (division) where.division = division;

  const players = await db.player.findMany({
    where,
    orderBy: [{ points: 'desc' }, { totalWins: 'desc' }, { maxStreak: 'desc' }],
    take: limit,
    include: {
      clubMembers: seasonId ? { where: { club: { seasonId } }, include: { club: true } } : false,
    },
  });

  const leaderboard = players.map((p, idx) => ({
    rank: idx + 1,
    id: p.id,
    name: p.name,
    gamertag: p.gamertag,
    tier: p.tier,
    avatar: p.avatar,
    points: p.points,
    totalWins: p.totalWins,
    totalMvp: p.totalMvp,
    streak: p.streak,
    maxStreak: p.maxStreak,
    matches: p.matches,
    club: (p.clubMembers as unknown as { club: { name: string } }[] | undefined)?.[0]?.club?.name || null,
  }));

  return NextResponse.json(leaderboard);
}
