import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

// GET all sections with their cards
export async function GET() {
  const sections = await db.cmsSection.findMany({
    orderBy: { order: 'asc' },
    include: { cards: { orderBy: { order: 'asc' } } },
  });
  return NextResponse.json(sections, {
    headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10' },
  });
}

// POST create or update a section
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!(admin instanceof Object)) return admin; // 401 response

  const body = await request.json();
  const { id, slug, title, subtitle, description, bannerUrl, isActive, order } = body;

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  const section = id
    ? await db.cmsSection.update({
        where: { id },
        data: { slug, title, subtitle, description, bannerUrl, isActive, order },
      })
    : await db.cmsSection.create({
        data: { slug, title, subtitle, description, bannerUrl, isActive, order },
      });

  return NextResponse.json(section);
}

// DELETE a section
export async function DELETE(request: Request) {
  const admin = await requireAdmin(request);
  if (!(admin instanceof Object)) return admin;

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  await db.cmsCard.deleteMany({ where: { sectionId: id } });
  await db.cmsSection.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
