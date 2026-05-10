import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

// POST /api/clubs/[id]/members — Add member to club
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id: clubId } = await params;
  const body = await request.json();
  const { playerId, role } = body;

  if (!playerId) {
    return NextResponse.json({ error: 'Player ID wajib diisi' }, { status: 400 });
  }

  // Validate club exists
  const club = await db.club.findUnique({
    where: { id: clubId },
    include: { _count: { select: { members: true } } },
  });
  if (!club) {
    return NextResponse.json({ error: 'Club tidak ditemukan' }, { status: 404 });
  }

  // Validate player exists
  const player = await db.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: 'Player tidak ditemukan' }, { status: 404 });
  }

  // Check if player is already in this club
  const existing = await db.clubMember.findUnique({
    where: { clubId_playerId: { clubId, playerId } },
  });
  if (existing) {
    return NextResponse.json({ error: 'Player sudah menjadi anggota club ini' }, { status: 409 });
  }

  // Check if player is in another club in the same season
  const otherMembership = await db.clubMember.findFirst({
    where: {
      playerId,
      club: { seasonId: club.seasonId },
      clubId: { not: clubId },
    },
    include: { club: { select: { name: true } } },
  });
  if (otherMembership) {
    return NextResponse.json({
      error: `Player sudah terdaftar di club "${otherMembership.club.name}" di season yang sama. Hapus dulu dari club tersebut.`,
    }, { status: 409 });
  }

  // If adding as captain, check if there's already a captain
  const memberRole = role === 'captain' ? 'captain' : 'member';
  if (memberRole === 'captain') {
    const currentCaptain = await db.clubMember.findFirst({
      where: { clubId, role: 'captain' },
    });
    if (currentCaptain) {
      // Demote existing captain to member
      await db.clubMember.update({
        where: { id: currentCaptain.id },
        data: { role: 'member' },
      });
    }
  }

  const member = await db.clubMember.create({
    data: {
      clubId,
      playerId,
      role: memberRole,
    },
    include: { player: { select: { id: true, gamertag: true, name: true, division: true, tier: true, points: true } } },
  });

  return NextResponse.json(member, { status: 201 });
}

// GET /api/clubs/[id]/members — List members of club
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clubId } = await params;

  const club = await db.club.findUnique({ where: { id: clubId } });
  if (!club) {
    return NextResponse.json({ error: 'Club tidak ditemukan' }, { status: 404 });
  }

  const members = await db.clubMember.findMany({
    where: { clubId },
    include: {
      player: { select: { id: true, gamertag: true, name: true, division: true, tier: true, points: true, totalWins: true, totalMvp: true, streak: true, avatar: true, isActive: true } },
    },
    orderBy: [{ role: 'desc' }, { player: { gamertag: 'asc' } }],
  });

  return NextResponse.json(members);
}

// DELETE /api/clubs/[id]/members — Remove member from club
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id: clubId } = await params;
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId');

  if (!playerId) {
    return NextResponse.json({ error: 'Player ID wajib diisi' }, { status: 400 });
  }

  const membership = await db.clubMember.findUnique({
    where: { clubId_playerId: { clubId, playerId } },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Player bukan anggota club ini' }, { status: 404 });
  }

  // If removing captain, auto-assign the first remaining member as captain
  if (membership.role === 'captain') {
    const otherMembers = await db.clubMember.findMany({
      where: { clubId, playerId: { not: playerId } },
      orderBy: { player: { gamertag: 'asc' } },
      take: 1,
    });
    if (otherMembers.length > 0) {
      await db.clubMember.update({
        where: { id: otherMembers[0].id },
        data: { role: 'captain' },
      });
    }
  }

  await db.clubMember.delete({
    where: { clubId_playerId: { clubId, playerId } },
  });

  return NextResponse.json({ success: true, message: 'Anggota berhasil dihapus dari club' });
}
