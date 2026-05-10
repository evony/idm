import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List banners by placement
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {};
    if (placement) where.placement = placement;
    if (activeOnly) {
      where.isActive = true;
      const now = new Date();
      where.OR = [
        { startDate: null, endDate: null },
        { startDate: null, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: null },
        { startDate: { lte: now }, endDate: { gte: now } },
      ];
    }

    const banners = await db.sponsorBanner.findMany({
      where,
      include: {
        sponsor: {
          select: { id: true, name: true, logo: true },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}

// POST - Create new banner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sponsorId, placement, imageUrl, linkUrl, width, height, displayOrder, startDate, endDate } = body;

    if (!sponsorId || !placement || !imageUrl) {
      return NextResponse.json({ error: 'sponsorId, placement, and imageUrl are required' }, { status: 400 });
    }

    const banner = await db.sponsorBanner.create({
      data: {
        sponsorId,
        placement,
        imageUrl,
        linkUrl,
        width,
        height,
        displayOrder: displayOrder || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        sponsor: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}
