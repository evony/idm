import { NextResponse } from 'next/server';
import { verifySessionToken, getAdminById } from './auth';

/**
 * Verify admin session from request cookies.
 * Works with both NextRequest and standard Request.
 * Returns the admin data if authenticated, or null if not.
 */
export async function verifyAdmin(request: Request) {
  // Extract cookie from request header (works with both Request and NextRequest)
  const cookieHeader = request.headers.get('cookie') || '';
  console.log('verifyAdmin: Cookie header preview:', cookieHeader.substring(0, 100) + '...');

  const sessionCookie = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('idm-admin-session='));

  console.log('verifyAdmin: Session cookie raw:', sessionCookie ? sessionCookie.substring(0, 60) + '...' : 'not found');

  if (!sessionCookie) return null;

  const token = sessionCookie.split('=')[1];
  console.log('verifyAdmin: Token extracted:', token ? token.substring(0, 40) + '...' : 'empty');
  if (!token) return null;

  const session = verifySessionToken(token);
  console.log('verifyAdmin: Token verification result:', session);

  if (!session) return null;

  const admin = await getAdminById(session.adminId);
  console.log('verifyAdmin: Admin lookup:', admin ? 'found' : 'not found');

  if (!admin) return null;

  return { id: admin.id, username: admin.username, role: admin.role };
}

/**
 * Helper to require admin auth in API routes.
 * Returns a response with 401 if not authenticated, or the admin data if authenticated.
 */
export async function requireAdmin(request: Request): Promise<{ id: string; username: string; role: string } | NextResponse> {
  const admin = await verifyAdmin(request);
  if (!admin) {
    console.log('requireAdmin: Unauthorized - returning 401');
    return NextResponse.json({ error: 'Unauthorized - Admin login required' }, { status: 401 });
  }
  return admin;
}
