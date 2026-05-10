import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionToken, getAdminById } from '@/lib/auth';

// Helper to verify admin from NextRequest with cookies
async function requireAdminFromNextRequest(request: NextRequest) {
  const token = request.cookies.get('idm-admin-session')?.value;
  console.log('requireAdmin: Token from cookie:', token ? token.substring(0, 30) + '...' : 'not found');

  if (!token) {
    return { error: 'No session token', status: 401 };
  }

  const session = verifySessionToken(token);
  console.log('requireAdmin: Session verification:', session);

  if (!session) {
    return { error: 'Invalid session', status: 401 };
  }

  const admin = await getAdminById(session.adminId);
  if (!admin) {
    return { error: 'Admin not found', status: 401 };
  }

  return { admin: { id: admin.id, username: admin.username, role: admin.role } };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const player = await db.player.findUnique({
    where: { id },
    include: {
      teamPlayers: { include: { team: { include: { tournament: true } } } },
      participations: { include: { tournament: true } },
      clubMembers: { include: { club: true } },
    },
  });

  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  return NextResponse.json(player);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminFromNextRequest(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await params;
  const body = await request.json();

  // Build update data object
  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.gamertag !== undefined) updateData.gamertag = body.gamertag;
  if (body.tier !== undefined) updateData.tier = body.tier;
  if (body.avatar !== undefined) updateData.avatar = body.avatar;
  if (body.points !== undefined) updateData.points = body.points;
  if (body.totalWins !== undefined) updateData.totalWins = body.totalWins;
  if (body.totalMvp !== undefined) updateData.totalMvp = body.totalMvp;
  if (body.streak !== undefined) updateData.streak = body.streak;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.registrationStatus !== undefined) updateData.registrationStatus = body.registrationStatus;
  if (body.city !== undefined) updateData.city = body.city;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.joki !== undefined) updateData.joki = body.joki;

  console.log('Updating player', id, 'with data:', updateData);

  const player = await db.player.update({
    where: { id },
    data: updateData,
  });

  console.log('Player updated:', player.id, 'avatar:', player.avatar);

  return NextResponse.json(player);
}
