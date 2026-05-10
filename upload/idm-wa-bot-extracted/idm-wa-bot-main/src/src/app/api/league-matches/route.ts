import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get('seasonId');
  const week = searchParams.get('week');

  const where: Record<string, unknown> = {};
  if (seasonId) where.seasonId = seasonId;
  if (week) where.week = parseInt(week);

  const matches = await db.leagueMatch.findMany({
    where,
    orderBy: [{ week: 'asc' }],
    include: {
      club1: true,
      club2: true,
    },
  });

  return NextResponse.json(matches);
}

export async function POST(request: Request) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { seasonId, club1Id, club2Id, week, format } = body;

  if (!seasonId || !club1Id || !club2Id || !week) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const match = await db.leagueMatch.create({
    data: {
      seasonId,
      club1Id,
      club2Id,
      week,
      format: format || 'BO3',
      status: 'upcoming',
    },
  });

  return NextResponse.json(match, { status: 201 });
}
