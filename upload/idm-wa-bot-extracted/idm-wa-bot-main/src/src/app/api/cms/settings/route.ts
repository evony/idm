import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

// GET all settings
export async function GET() {
  const settings = await db.cmsSetting.findMany({
    orderBy: { key: 'asc' },
  });
  // Convert to key-value object for easy frontend usage
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }
  return NextResponse.json({ settings, map }, {
    headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10' },
  });
}

// POST upsert a setting
export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!(admin instanceof Object)) return admin;

  const body = await request.json();
  const { key, value, type } = body;

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  const setting = await db.cmsSetting.upsert({
    where: { key },
    update: { value: value ?? '', type: type ?? 'text' },
    create: { key, value: value ?? '', type: type ?? 'text' },
  });

  return NextResponse.json(setting);
}

// DELETE a setting
export async function DELETE(request: Request) {
  const admin = await requireAdmin(request);
  if (!(admin instanceof Object)) return admin;

  const { key } = await request.json();
  if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 });

  await db.cmsSetting.delete({ where: { key } });
  return NextResponse.json({ success: true });
}
