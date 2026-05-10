import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const season = await db.season.findUnique({
    where: { id },
    include: {
      tournaments: { orderBy: { weekNumber: 'asc' } },
      clubs: { orderBy: { points: 'desc' } },
      donations: { orderBy: { createdAt: 'desc' } },
      _count: { select: { tournaments: true, clubs: true, donations: true } },
    },
  });

  if (!season) {
    return NextResponse.json({ error: 'Season not found' }, { status: 404 });
  }

  return NextResponse.json(season);
}
