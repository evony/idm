import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

// GET /api/clubs/[id] — Club detail with members
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const club = await db.club.findUnique({
    where: { id },
    include: {
      members: {
        include: { player: { select: { id: true, name: true, gamertag: true, division: true, tier: true, points: true, totalWins: true, totalMvp: true, streak: true, avatar: true } } },
        orderBy: [{ role: 'desc' }, { player: { gamertag: 'asc' } }],
      },
      season: { select: { id: true, name: true, division: true, status: true } },
      homeMatches: { include: { club2: { select: { name: true } } }, orderBy: { week: 'asc' }, take: 5 },
      awayMatches: { include: { club1: { select: { name: true } } }, orderBy: { week: 'asc' }, take: 5 },
    },
  });
  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  return NextResponse.json(club);
}

// PUT /api/clubs/[id] — Edit club (name, logo)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const { name, logo } = body;

  const club = await db.club.findUnique({ where: { id } });
  if (!club) return NextResponse.json({ error: 'Club tidak ditemukan' }, { status: 404 });

  // Check name uniqueness if renaming
  if (name && name !== club.name) {
    const existing = await db.club.findFirst({
      where: { name, seasonId: club.seasonId, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Nama club sudah digunakan di season ini' }, { status: 409 });
    }
  }

  const updated = await db.club.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(logo !== undefined && { logo }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/clubs/[id] — Delete club
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  const club = await db.club.findUnique({
    where: { id },
    include: { _count: { select: { members: true, homeMatches: true, awayMatches: true } } },
  });
  if (!club) return NextResponse.json({ error: 'Club tidak ditemukan' }, { status: 404 });

  // Check if club has matches — don't allow deletion if so
  if (club._count.homeMatches > 0 || club._count.awayMatches > 0) {
    return NextResponse.json({ error: 'Club tidak bisa dihapus karena sudah memiliki match' }, { status: 400 });
  }

  // Remove all members first, then delete club
  await db.clubMember.deleteMany({ where: { clubId: id } });
  await db.club.delete({ where: { id } });

  return NextResponse.json({ success: true, message: 'Club berhasil dihapus' });
}
