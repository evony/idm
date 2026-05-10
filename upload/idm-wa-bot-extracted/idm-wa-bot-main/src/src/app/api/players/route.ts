import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division');
  const tier = searchParams.get('tier');
  const registrationStatus = searchParams.get('registrationStatus');

  const where: Record<string, string | boolean> = { isActive: true };
  if (division) where.division = division;
  if (tier) where.tier = tier;
  if (registrationStatus) where.registrationStatus = registrationStatus;

  const players = await db.player.findMany({
    where,
    orderBy: { points: 'desc' },
    include: {
      clubMembers: {
        include: {
          club: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  return NextResponse.json(players);
}

export async function POST(request: Request) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { name, gamertag, division, tier, avatar, city, phone, joki, points, clubId } = body;

  if (!name || !gamertag || !division) {
    return NextResponse.json({ error: 'Nama, gamertag, dan division wajib diisi' }, { status: 400 });
  }

  if (!['male', 'female'].includes(division)) {
    return NextResponse.json({ error: 'Division harus male atau female' }, { status: 400 });
  }

  try {
    // Create player
    const player = await db.player.create({
      data: {
        name: name.trim(),
        gamertag: gamertag.trim(),
        division,
        tier: tier || 'B',
        avatar: avatar || null,
        city: city?.trim() || '',
        phone: phone?.trim() || null,
        joki: joki?.trim() || null,
        points: points || 0,
        registrationStatus: 'approved',
        isActive: true,
      },
    });

    // If club is provided, add as member
    if (clubId) {
      const club = await db.club.findUnique({ where: { id: clubId } });
      if (club) {
        await db.clubMember.create({
          data: {
            clubId,
            playerId: player.id,
            role: 'member',
          },
        });
      }
    }

    return NextResponse.json(player, { status: 201 });
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message?.includes('Unique')) {
      return NextResponse.json({ error: 'Gamertag sudah digunakan' }, { status: 409 });
    }
    console.error('Create player error:', error);
    return NextResponse.json({ error: 'Gagal membuat player' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Player ID wajib diisi' }, { status: 400 });
  }

  try {
    // Soft delete by setting isActive to false
    const player = await db.player.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, player });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Delete player error:', error);
    return NextResponse.json({ error: 'Gagal menghapus player' }, { status: 500 });
  }
}
