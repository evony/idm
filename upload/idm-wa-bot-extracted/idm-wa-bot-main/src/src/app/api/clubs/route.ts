import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get('seasonId');
  const division = searchParams.get('division');

  const where: Record<string, unknown> = {};
  if (seasonId) where.seasonId = seasonId;

  if (division) {
    where.season = { division };
  }

  const clubs = await db.club.findMany({
    where,
    orderBy: [{ points: 'desc' }, { gameDiff: 'desc' }],
    include: {
      _count: { select: { members: true } },
      season: { select: { name: true, division: true } },
    },
  });

  return NextResponse.json(clubs);
}

export async function POST(request: Request) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { name, division, logo, seasonId } = body;

  if (!name || !division || !seasonId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const club = await db.club.create({
    data: { name, division, logo: logo || null, seasonId },
  });

  return NextResponse.json(club, { status: 201 });
}
