import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { createAuditLog } from '@/lib/audit';
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

  const match = await db.playoffMatch.findUnique({
    where: { id },
    include: { club1: { include: { profile: { select: { name: true, logo: true } } } }, club2: { include: { profile: { select: { name: true, logo: true } } } } },
  });
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  // Don't re-score already completed matches
  if (match.status === 'completed') {
    return NextResponse.json({ error: 'Match already completed — use undo first' }, { status: 400 });
  }

  if (!match.club1Id || !match.club2Id) {
    return NextResponse.json({ error: 'Both clubs must be set' }, { status: 400 });
  }

  const updated = await db.playoffMatch.update({
    where: { id },
    data: { score1, score2, status: 'completed' },
  });

  // BO3 scoring: same logic as league matches
  // Winner gets +2 pts, loser gets +1 pt if they won a game, +0 otherwise
  const club1Wins = (score1 || 0) > (score2 || 0);
  const club2Wins = (score2 || 0) > (score1 || 0);

  if (club1Wins) {
    const club2Points = score2 === 1 ? 1 : 0; // +1 if they won a game
    const gameDiff = (score1 || 0) - (score2 || 0);

    await db.club.update({
      where: { id: match.club1Id },
      data: { wins: { increment: 1 }, points: { increment: 2 }, gameDiff: { increment: gameDiff } },
    });
    await db.club.update({
      where: { id: match.club2Id },
      data: { losses: { increment: 1 }, points: { increment: club2Points }, gameDiff: { increment: -gameDiff } },
    });
  } else if (club2Wins) {
    const club1Points = score1 === 1 ? 1 : 0;
    const gameDiff = (score2 || 0) - (score1 || 0);

    await db.club.update({
      where: { id: match.club2Id },
      data: { wins: { increment: 1 }, points: { increment: 2 }, gameDiff: { increment: gameDiff } },
    });
    await db.club.update({
      where: { id: match.club1Id },
      data: { losses: { increment: 1 }, points: { increment: club1Points }, gameDiff: { increment: -gameDiff } },
    });
  }

  await createAuditLog({
    adminId: authResult.id,
    adminName: authResult.username,
    action: 'update',
    entity: 'match',
    entityId: id,
    details: `Update playoff match score: ${score1}-${score2}`,
  });

  return NextResponse.json(updated);
}
