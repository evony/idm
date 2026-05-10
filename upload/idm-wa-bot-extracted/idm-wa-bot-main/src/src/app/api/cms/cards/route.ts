import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

// GET cards (optionally filter by sectionId)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get('sectionId');

  const cards = await db.cmsCard.findMany({
    where: sectionId ? { sectionId } : undefined,
    orderBy: { order: 'asc' },
    include: { section: { select: { slug: true, title: true } } },
  });

  return NextResponse.json(cards, {
    headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10' },
  });
}

// POST create or update a card
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!(admin instanceof Object)) return admin;

  const body = await request.json();
  const { id, sectionId, title, subtitle, description, imageUrl, linkUrl, tag, tagColor, isActive, order } = body;

  if (!sectionId) {
    return NextResponse.json({ error: 'sectionId is required' }, { status: 400 });
  }

  const card = id
    ? await db.cmsCard.update({
        where: { id },
        data: { sectionId, title, subtitle, description, imageUrl, linkUrl, tag, tagColor, isActive, order },
      })
    : await db.cmsCard.create({
        data: { sectionId, title, subtitle, description, imageUrl, linkUrl, tag, tagColor, isActive, order },
      });

  return NextResponse.json(card);
}

// DELETE a card
export async function DELETE(request: Request) {
  const admin = await requireAdmin(request);
  if (!(admin instanceof Object)) return admin;

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await db.cmsCard.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
