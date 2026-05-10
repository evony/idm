import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, getAdminById } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('idm-admin-session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    // Verify admin still exists in DB
    const admin = await getAdminById(session.adminId);
    if (!admin) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
