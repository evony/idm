import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

const VALID_TIERS = ['S', 'A', 'B'];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { playerId, tier, approve, approvals } = body;

  const tournament = await db.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
  }

  // Support both single and bulk approval
  const items: { playerId: string; tier?: string; approve: boolean }[] = [];
  if (approvals && Array.isArray(approvals)) {
    items.push(...approvals);
  } else if (playerId) {
    items.push({ playerId, tier, approve: approve !== false });
  } else {
    return NextResponse.json(
      { error: 'playerId or approvals array required' },
      { status: 400 }
    );
  }

  const results: { playerId: string; status: string }[] = [];
  const errors: { playerId: string; error: string }[] = [];

  for (const item of items) {
    const participation = await db.participation.findUnique({
      where: { playerId_tournamentId: { playerId: item.playerId, tournamentId: id } },
    });

    if (!participation) {
      errors.push({ playerId: item.playerId, error: 'Player not registered' });
      continue;
    }

    if (item.approve) {
      const tierValue = item.tier;
      if (tierValue && !VALID_TIERS.includes(tierValue)) {
        errors.push({ playerId: item.playerId, error: `Invalid tier: ${tierValue}. Must be S, A, or B` });
        continue;
      }

      await db.participation.update({
        where: { id: participation.id },
        data: {
          status: 'approved',
          ...(tierValue && { tierOverride: tierValue }),
        },
      });
      results.push({ playerId: item.playerId, status: 'approved' });
    } else {
      await db.participation.update({
        where: { id: participation.id },
        data: { status: 'rejected' },
      });
      results.push({ playerId: item.playerId, status: 'rejected' });
    }
  }

  // Update tournament status to "approval" if in "registration"
  if (tournament.status === 'registration' && results.length > 0) {
    await db.tournament.update({ where: { id }, data: { status: 'approval' } });
  }

  // Single approval: return simple response
  if (!approvals && playerId) {
    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0].error }, { status: 400 });
    }
    return NextResponse.json({ success: true, status: results[0].status });
  }

  // Bulk approval: return summary
  return NextResponse.json({
    processed: results.length,
    errorCount: errors.length,
    results,
    errors,
  });
}
