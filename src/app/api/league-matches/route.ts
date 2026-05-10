import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { createAuditLog } from '@/lib/audit';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

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
      club1: { include: { profile: { select: { name: true, logo: true } } } },
      club2: { include: { profile: { select: { name: true, logo: true } } } },
    },
  });

  return NextResponse.json(matches, { headers });
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

  await createAuditLog({
    adminId: authResult.id,
    adminName: authResult.username,
    action: 'create',
    entity: 'match',
    entityId: match.id,
    details: `Membuat league match week ${week}`,
  });

  return NextResponse.json(match, { status: 201 });
}
