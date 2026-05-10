import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';

export function requireAdmin(request: Request): { username: string; role: string } | NextResponse {
  const cookieHeader = request.headers.get('cookie');
  const session = getSessionFromCookies(cookieHeader);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}
