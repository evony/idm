import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { createAuditLog } from '@/lib/audit';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get('seasonId');

  const where: Record<string, unknown> = {};
  if (seasonId) where.seasonId = seasonId;

  const matches = await db.playoffMatch.findMany({
    where,
    orderBy: [{ round: 'asc' }],
    include: { club1: { include: { profile: { select: { name: true, logo: true } } } }, club2: { include: { profile: { select: { name: true, logo: true } } } } },
  });

  return NextResponse.json(matches, { headers });
}

export async function POST(request: Request) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { seasonId, club1Id, club2Id, round, format } = body;

  if (!seasonId || !club1Id || !club2Id || !round) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const match = await db.playoffMatch.create({
    data: {
      seasonId,
      club1Id,
      club2Id,
      round,
      format: format || 'BO5',
      status: 'upcoming',
    },
  });

  await createAuditLog({
    adminId: authResult.id,
    adminName: authResult.username,
    action: 'create',
    entity: 'match',
    entityId: match.id,
    details: `Membuat playoff match round ${round}`,
  });

  return NextResponse.json(match, { status: 201 });
}
