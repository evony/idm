import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { createAuditLog } from '@/lib/audit';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division');
  const tier = searchParams.get('tier');
  const registrationStatus = searchParams.get('registrationStatus');

  const where: Record<string, string | boolean> = { isActive: true };
  if (division) where.division = division;
  if (tier) where.tier = tier;
  // Default: only approved players (public leaderboard). Admin can pass registrationStatus to see others.
  if (registrationStatus) {
    where.registrationStatus = registrationStatus;
  } else {
    where.registrationStatus = 'approved';
  }

  const players = await db.player.findMany({
    where,
    orderBy: { points: 'desc' },
    include: {
      clubMembers: {
        where: { leftAt: null },
        include: {
          profile: {
            select: { id: true, name: true, logo: true }
          }
        }
      },
      account: {
        select: { id: true }
      }
    }
  });

  return NextResponse.json(players, { headers });
}

export async function POST(request: Request) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const { name, gamertag, division, tier, avatar, city, phone, joki, points, clubId } = body;

  if (!name || !gamertag || !division) {
    return NextResponse.json({ error: 'Nama, nickname, dan division wajib diisi' }, { status: 400 });
  }

  if (!['male', 'female'].includes(division)) {
    return NextResponse.json({ error: 'Division harus male atau female' }, { status: 400 });
  }

  try {
    // Check if gamertag already exists (including soft-deleted / inactive players)
    const existingPlayer = await db.player.findUnique({
      where: { gamertag: gamertag.trim() },
    });

    if (existingPlayer) {
      if (!existingPlayer.isActive) {
        // Reactivate soft-deleted player instead of failing
        const reactivated = await db.player.update({
          where: { id: existingPlayer.id },
          data: {
            name: name.trim(),
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

        // If club is provided, add as member via ClubProfile
        if (clubId) {
          const existingMembership = await db.clubMember.findFirst({
            where: { playerId: reactivated.id, leftAt: null },
          });
          if (!existingMembership) {
            const club = await db.club.findUnique({ where: { id: clubId } });
            if (club) {
              await db.clubMember.create({
                data: {
                  profileId: club.profileId,
                  playerId: reactivated.id,
                  role: 'member',
                },
              });
            }
          }
        }

        await createAuditLog({
          adminId: authResult.id,
          adminName: authResult.username,
          action: 'update',
          entity: 'player',
          entityId: reactivated.id,
          details: `Reactivate player: ${reactivated.name} (${reactivated.gamertag})`,
        });

        return NextResponse.json(reactivated, { status: 200 });
      }

      // Active player with same gamertag but pending/rejected — admin can approve by updating
      if (existingPlayer.registrationStatus === 'pending' || existingPlayer.registrationStatus === 'rejected') {
        const approved = await db.player.update({
          where: { id: existingPlayer.id },
          data: {
            name: name.trim(),
            division,
            tier: tier || 'B',
            avatar: avatar || null,
            city: city?.trim() || '',
            phone: phone?.trim() || null,
            joki: joki?.trim() || null,
            registrationStatus: 'approved',
            isActive: true,
          },
        });

        // If club is provided, add as member via ClubProfile
        if (clubId) {
          const existingMembership = await db.clubMember.findFirst({
            where: { playerId: approved.id, leftAt: null },
          });
          if (!existingMembership) {
            const club = await db.club.findUnique({ where: { id: clubId } });
            if (club) {
              await db.clubMember.create({
                data: {
                  profileId: club.profileId,
                  playerId: approved.id,
                  role: 'member',
                },
              });
            }
          }
        }

        await createAuditLog({
          adminId: authResult.id,
          adminName: authResult.username,
          action: 'update',
          entity: 'player',
          entityId: approved.id,
          details: `Approve pending player: ${approved.name} (${approved.gamertag})`,
        });

        return NextResponse.json(approved, { status: 200 });
      }

      // Active + approved player with same gamertag — truly a duplicate
      return NextResponse.json({
        error: `Nickname "${gamertag.trim()}" sudah digunakan oleh pemain aktif "${existingPlayer.name}".`,
        hint: 'Gunakan nickname lain, atau nonaktifkan pemain lama terlebih dahulu.',
        existingPlayer: { id: existingPlayer.id, name: existingPlayer.name, gamertag: existingPlayer.gamertag, division: existingPlayer.division },
      }, { status: 409 });
    }

    // Create new player
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

    // If club is provided, add as member via ClubProfile
    if (clubId) {
      const club = await db.club.findUnique({ where: { id: clubId } });
      if (club) {
        await db.clubMember.create({
          data: {
            profileId: club.profileId,
            playerId: player.id,
            role: 'member',
          },
        });
      }
    }

    await createAuditLog({
      adminId: authResult.id,
      adminName: authResult.username,
      action: 'create',
      entity: 'player',
      entityId: player.id,
      details: `Create player: ${player.name} (${player.gamertag})`,
    });

    return NextResponse.json(player, { status: 201 });
  } catch (e: unknown) {
    const error = e as Error;
    if (error.message?.includes('Unique')) {
      return NextResponse.json({ error: 'Nickname sudah digunakan' }, { status: 409 });
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

    await createAuditLog({
      adminId: authResult.id,
      adminName: authResult.username,
      action: 'delete',
      entity: 'player',
      entityId: player.id,
      details: `Delete player: ${player.name} (${player.gamertag})`,
    });

    return NextResponse.json({ success: true, player });
  } catch (e: unknown) {
    const error = e as Error;
    console.error('Delete player error:', error);
    return NextResponse.json({ error: 'Gagal menghapus player' }, { status: 500 });
  }
}
