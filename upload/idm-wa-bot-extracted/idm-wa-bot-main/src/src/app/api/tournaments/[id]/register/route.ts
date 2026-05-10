import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { playerId, playerIds } = body;

  // Support bulk registration
  const idsToRegister: string[] = playerIds || (playerId ? [playerId] : []);

  if (idsToRegister.length === 0) {
    return NextResponse.json({ error: 'playerId or playerIds required' }, { status: 400 });
  }

  const tournament = await db.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  if (tournament.status !== 'registration' && tournament.status !== 'setup') {
    return NextResponse.json({ error: 'Registration is not open' }, { status: 400 });
  }

  const results = { registered: 0, skipped: 0, errors: [] as string[] };

  for (const pid of idsToRegister) {
    // Check division match
    const player = await db.player.findUnique({ where: { id: pid } });
    if (!player) {
      results.errors.push(`Player ${pid} not found`);
      continue;
    }

    if (player.division !== tournament.division) {
      results.errors.push(`${player.gamertag}: division mismatch`);
      continue;
    }

    // Check if already registered
    const existing = await db.participation.findUnique({
      where: { playerId_tournamentId: { playerId: pid, tournamentId: id } },
    });
    if (existing) {
      results.skipped++;
      continue;
    }

    await db.participation.create({
      data: {
        playerId: pid,
        tournamentId: id,
        status: 'registered',
        pointsEarned: 0,
      },
    });
    results.registered++;
  }

  // Update tournament status to registration if it was setup
  if (tournament.status === 'setup') {
    await db.tournament.update({ where: { id }, data: { status: 'registration' } });
  }

  return NextResponse.json(results, { status: 201 });
}
