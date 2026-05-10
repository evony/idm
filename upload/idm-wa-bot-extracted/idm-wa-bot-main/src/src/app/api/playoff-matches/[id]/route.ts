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

  const match = await db.playoffMatch.findUnique({ where: { id } });
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  const updated = await db.playoffMatch.update({
    where: { id },
    data: { score1, score2, status: 'completed' },
  });

  return NextResponse.json(updated);
}
