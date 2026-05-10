import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const admin = await db.admin.findFirst();
    return NextResponse.json({ found: !!admin, admin: admin ? { username: admin.username } : null });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
