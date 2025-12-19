import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin and users API routes
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/users')) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ success: false, message: 'Token missing' }, { status: 401 });
    }

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);

      // Normalize role comparison for enums/strings
      const role = (decoded.role || '').toString().toUpperCase();

      // Admin-only guard
      if (pathname.startsWith('/api/admin') && role !== 'ADMIN') {
        return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
      }

      // Attach user info for downstream handlers via request headers
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', String(decoded.id ?? ''));
      requestHeaders.set('x-user-email', decoded.email ?? '');
      requestHeaders.set('x-user-role', role);

      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch (err) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/api/users/:path*'],
};