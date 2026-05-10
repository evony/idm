import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { createAuditLog } from '@/lib/audit';
import { pusherTrigger, PUSHER_CHANNELS, PUSHER_EVENTS } from '@/lib/pusher';
import { NextResponse } from 'next/server';

// POST /api/donations — Submit a new donation (status: pending by default)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { donorName, amount, message, type, division, tournamentId, seasonId } = body;

    // Validate required fields
    if (!donorName || typeof donorName !== 'string' || !donorName.trim()) {
      return NextResponse.json({ error: 'Nama donatur wajib diisi' }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number' || amount < 1000) {
      return NextResponse.json({ error: 'Jumlah minimal Rp 1.000' }, { status: 400 });
    }

    if (amount > 100_000_000) {
      return NextResponse.json({ error: 'Jumlah maksimal Rp 100.000.000' }, { status: 400 });
    }

    const donationType = type === 'season' ? 'season' : 'weekly';
    const donationDivision = division === 'female' ? 'female' : 'male';

    // Find active season for THIS division if not provided
    let resolvedSeasonId = seasonId;
    if (!resolvedSeasonId) {
      const activeSeason = await db.season.findFirst({
        where: { status: 'active', division: donationDivision },
        orderBy: { createdAt: 'desc' },
      });
      resolvedSeasonId = activeSeason?.id || null;
    }

    // Find active tournament for weekly type if not provided
    // Include all non-completed statuses so donations can be linked even during finalization
    let resolvedTournamentId = tournamentId;
    if (donationType === 'weekly' && !resolvedTournamentId && resolvedSeasonId) {
      const activeTournament = await db.tournament.findFirst({
        where: { seasonId: resolvedSeasonId, status: { not: 'completed' } },
        orderBy: { weekNumber: 'desc' },
      });
      resolvedTournamentId = activeTournament?.id || null;
    }

    const donation = await db.donation.create({
      data: {
        donorName: donorName.trim(),
        amount,
        message: message?.trim() || null,
        type: donationType,
        division: donationDivision,
        status: 'pending',
        tournamentId: donationType === 'weekly' ? resolvedTournamentId : null,
        seasonId: resolvedSeasonId,
      },
    });

    // ═══ Auto-resolve playerId from donorName ↔ gamertag matching ═══
    // This links donations directly to players for reliable cross-division Sultan of the Week matching
    try {
      const matchedPlayer = await db.player.findFirst({
        where: {
          gamertag: { equals: donorName.trim() },
          isActive: true,
        },
        select: { id: true },
      });
      if (matchedPlayer) {
        await db.donation.update({
          where: { id: donation.id },
          data: { playerId: matchedPlayer.id },
        });
      }
    } catch (matchError) {
      // Don't fail donation creation if player matching fails
      console.warn('[DONATIONS_PLAYER_MATCH] Failed:', matchError);
    }

    // Pusher: Notify real-time clients about new donation
    void pusherTrigger(PUSHER_CHANNELS.FEED, PUSHER_EVENTS.FEED_UPDATED, {
      type: 'donation-created', donationId: donation.id, amount: donation.amount, donorName: donation.donorName,
    });

    return NextResponse.json({
      success: true,
      message: 'Terima kasih atas dukungan Anda! 🎉 Silakan lakukan pembayaran.',
      donation: {
        id: donation.id,
        donorName: donation.donorName,
        amount: donation.amount,
        type: donation.type,
        status: donation.status,
        createdAt: donation.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[DONATIONS_POST]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan saat memproses donasi' }, { status: 500 });
  }
}

// GET /api/donations — List donations (public: only approved; admin: all or filtered)
export async function GET(request: Request) {
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // "weekly" | "season"
    const seasonId = searchParams.get('seasonId');
    const status = searchParams.get('status'); // "pending" | "approved" | "rejected" | "all"
    const division = searchParams.get('division'); // "male" | "female"
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (seasonId) where.seasonId = seasonId;
    if (division) where.division = division;

    // Public requests only see approved; admin can request specific status
    if (status && status !== 'approved') {
      // Any status other than 'approved' (including 'all', 'pending', 'rejected') requires admin auth
      const authResult = await requireAdmin(request);
      if (authResult instanceof NextResponse) return authResult;

      if (status === 'all') {
        // No status filter — show all statuses
      } else {
        where.status = status;
      }
    } else if (!status) {
      // Default: only approved for public
      where.status = 'approved';
    }

    const donations = await db.donation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const total = await db.donation.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      donations,
      total: {
        amount: total._sum.amount || 0,
        count: total._count,
      },
    }, { headers });
  } catch (error) {
    console.error('[DONATIONS_GET]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { headers,  status: 500 });
  }
}

// PATCH /api/donations — Admin approve/reject donation
export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID donasi wajib diisi' }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status harus "approved" atau "rejected"' }, { status: 400 });
    }

    const donation = await db.donation.update({
      where: { id },
      data: { status },
    });

    // Auto-award sawer skin when a weekly donation is approved
    if (status === 'approved' && donation.type === 'weekly') {
      try {
        const { autoAwardSawerSkin } = await import('@/lib/sawer-auto-award');
        await autoAwardSawerSkin(donation.donorName);
      } catch (awardError) {
        console.warn('[SAWER_AUTO_AWARD] Failed:', awardError);
        // Don't fail the approval if auto-award fails
      }

      // ═══ Auto-award donor skin (Maroon Heart) to Sultan of the Week ═══
      // The top penyawer per tournament receives the donasi skin.
      // Use playerId if available, otherwise fall back to gamertag matching.
      try {
        const donorPlayerId = donation.playerId || (await db.player.findFirst({
          where: { gamertag: { equals: donation.donorName } },
          select: { id: true },
        }))?.id;

        if (donorPlayerId) {
          const account = await db.account.findUnique({
            where: { playerId: donorPlayerId },
          });
          if (account) {
            const donorSkin = await db.skin.findUnique({ where: { type: 'donor' } });
            if (donorSkin) {
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + 7); // 1 week duration

              // Upsert: if already has donor skin, extend; otherwise create
              const existing = await db.playerSkin.findUnique({
                where: { accountId_skinId: { accountId: account.id, skinId: donorSkin.id } },
              });
              if (existing) {
                await db.playerSkin.update({
                  where: { id: existing.id },
                  data: {
                    expiresAt,
                    reason: 'Sultan of the Week — donasi skin extended',
                  },
                });
              } else {
                await db.playerSkin.create({
                  data: {
                    accountId: account.id,
                    skinId: donorSkin.id,
                    reason: 'Sultan of the Week — donasi skin awarded',
                    expiresAt,
                  },
                });
              }

              // Increment donorBadgeCount (permanent heart badge)
              await db.account.update({
                where: { id: account.id },
                data: { donorBadgeCount: { increment: 1 } },
              });
            }
          }
        }
      } catch (donorSkinError) {
        console.warn('[DONOR_SKIN_AWARD] Failed:', donorSkinError);
        // Don't fail the approval if donor skin award fails
      }
    }

    // Trigger Pusher real-time event so marquee updates instantly for all users
    try {
      const { getPusher, PUSHER_CHANNELS, PUSHER_EVENTS } = await import('@/lib/pusher');
      const pusher = getPusher();
      if (pusher) {
        await pusher.trigger(PUSHER_CHANNELS.FEED, PUSHER_EVENTS.FEED_UPDATED, {
          type: status === 'approved' ? 'donation-approved' : 'donation-rejected',
          donation: {
            id: donation.id,
            donorName: donation.donorName,
            amount: donation.amount,
            type: donation.type,
            status: donation.status,
          },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (pusherError) {
      // Don't fail the request if Pusher fails — just log it
      console.warn('[Pusher] Failed to trigger feed event:', pusherError);
    }

    return NextResponse.json({
      success: true,
      message: status === 'approved' ? 'Donasi berhasil disetujui ✅' : 'Donasi ditolak ❌',
      donation: {
        id: donation.id,
        donorName: donation.donorName,
        amount: donation.amount,
        type: donation.type,
        status: donation.status,
      },
    });
  } catch (error) {
    console.error('[DONATIONS_PATCH]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

// DELETE /api/donations — Admin delete donation
export async function DELETE(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID donasi wajib diisi' }, { status: 400 });
    }

    await db.donation.delete({ where: { id } });

    await createAuditLog({
      adminId: admin.id,
      adminName: admin.username,
      action: 'delete',
      entity: 'donation',
      entityId: id,
    });

    return NextResponse.json({ success: true, message: 'Donasi berhasil dihapus' });
  } catch (error) {
    console.error('[DONATIONS_DELETE]', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
