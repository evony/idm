import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { verifyAdmin } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // First check: if super admin already exists, just return success (idempotent)
    const existing = await db.admin.findFirst({ where: { role: 'super_admin' } });
    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Super admin already exists',
        admin: { id: existing.id, username: existing.username, role: existing.role },
      });
    }

    // If any other admin exists (but no super_admin yet), require auth to create super_admin
    const anyAdmin = await db.admin.findFirst();
    if (anyAdmin) {
      const admin = await verifyAdmin(request);
      if (!admin) {
        return NextResponse.json({ error: 'Unauthorized - Admin login required to create super admin' }, { status: 401 });
      }
    }

    // No admin exists at all — safe to create super admin (first-time setup)
    const username = process.env.ADMIN_USERNAME || 'jose';
    const password = process.env.ADMIN_PASSWORD || 'tazevsta';
    const passwordHash = await hashPassword(password);
    const admin = await db.admin.create({
      data: {
        username,
        passwordHash,
        role: 'super_admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully',
      admin: { id: admin.id, username: admin.username, role: admin.role },
    });
  } catch (error) {
    console.error('Init admin error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize admin' },
      { status: 500 }
    );
  }
}
