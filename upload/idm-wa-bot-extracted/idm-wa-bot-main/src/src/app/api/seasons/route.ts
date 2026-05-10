import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division');

  const where: Record<string, string | undefined> = {};
  if (division) where.division = division;

  const seasons = await db.season.findMany({
    where,
    orderBy: { number: 'desc' },
    include: {
      _count: { select: { tournaments: true, clubs: true } },
    },
  });

  return NextResponse.json(seasons);
}

export async function POST(request: Request) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { name, number, division, startDate, endDate } = body;

  if (!name || !number || !division) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const season = await db.season.create({
    data: {
      name,
      number,
      division,
      status: 'active',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  return NextResponse.json(season, { status: 201 });
}
