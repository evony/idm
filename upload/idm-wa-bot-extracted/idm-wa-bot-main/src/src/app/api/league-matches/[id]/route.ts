import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { score1, score2 } = body;

  const match = await db.leagueMatch.findUnique({
    where: { id },
    include: { club1: true, club2: true },
  });

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  const updated = await db.leagueMatch.update({
    where: { id },
    data: {
      score1,
      score2,
      status: 'completed',
    },
  });

  // BO3 scoring: Based on game wins (NOT match)
  // 2-0 → +2 / 0,  2-1 → +2 / +1
  const club1Wins = (score1 || 0) > (score2 || 0);
  const club2Wins = (score2 || 0) > (score1 || 0);

  if (club1Wins) {
    const club1Points = score2 === 0 ? 2 : 2; // Always +2 for match win
    const club2Points = score2 === 1 ? 1 : 0; // +1 if they won a game
    const gameDiff = (score1 || 0) - (score2 || 0);

    await db.club.update({
      where: { id: match.club1Id },
      data: { wins: { increment: 1 }, points: { increment: club1Points }, gameDiff: { increment: gameDiff } },
    });
    await db.club.update({
      where: { id: match.club2Id },
      data: { losses: { increment: 1 }, points: { increment: club2Points }, gameDiff: { increment: -gameDiff } },
    });
  } else if (club2Wins) {
    const club2Points = score1 === 0 ? 2 : 2;
    const club1Points = score1 === 1 ? 1 : 0;
    const gameDiff = (score2 || 0) - (score1 || 0);

    await db.club.update({
      where: { id: match.club2Id },
      data: { wins: { increment: 1 }, points: { increment: club2Points }, gameDiff: { increment: gameDiff } },
    });
    await db.club.update({
      where: { id: match.club1Id },
      data: { losses: { increment: 1 }, points: { increment: club1Points }, gameDiff: { increment: -gameDiff } },
    });
  }

  return NextResponse.json(updated);
}
