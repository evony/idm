import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division');
  const seasonId = searchParams.get('seasonId');
  const status = searchParams.get('status');

  const where: Record<string, unknown> = {};
  if (division) where.division = division;
  if (seasonId) where.seasonId = seasonId;
  if (status) where.status = status;

  const tournaments = await db.tournament.findMany({
    where,
    orderBy: { weekNumber: 'desc' },
    include: {
      _count: { select: { teams: true, participations: true, matches: true, prizes: true } },
      season: { select: { name: true, number: true } },
      teams: { where: { isWinner: true }, select: { id: true, name: true, isWinner: true } },
      prizes: { orderBy: { position: 'asc' } },
    },
  });

  return NextResponse.json(tournaments);
}

export async function POST(request: Request) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { name, weekNumber, division, seasonId, prizePool, format, defaultMatchFormat, bpm, location, scheduledAt } = body;

  if (!name || !weekNumber || !division || !seasonId) {
    return NextResponse.json({ error: 'Missing required fields: name, weekNumber, division, seasonId' }, { status: 400 });
  }

  const validFormats = ['single_elimination', 'double_elimination', 'group_stage'];
  const validMatchFormats = ['BO1', 'BO3', 'BO5'];

  if (format && !validFormats.includes(format)) {
    return NextResponse.json({ error: 'Invalid format. Use: single_elimination, double_elimination, group_stage' }, { status: 400 });
  }

  if (defaultMatchFormat && !validMatchFormats.includes(defaultMatchFormat)) {
    return NextResponse.json({ error: 'Invalid match format. Use: BO1, BO3, BO5' }, { status: 400 });
  }

  const tournament = await db.tournament.create({
    data: {
      name,
      weekNumber,
      division,
      seasonId,
      status: 'setup',
      format: format || 'single_elimination',
      defaultMatchFormat: defaultMatchFormat || 'BO1',
      prizePool: prizePool || 0,
      location: location || 'Online',
      bpm: bpm || 128,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  return NextResponse.json(tournament, { status: 201 });
}
