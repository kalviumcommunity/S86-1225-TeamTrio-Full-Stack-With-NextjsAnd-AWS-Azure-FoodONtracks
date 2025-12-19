import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

export async function GET(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    const token = auth?.split(' ')[1];
    if (!token) return NextResponse.json({ success: false, message: 'Token missing' }, { status: 401 });

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 403 });
    }

    // return some user info
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Error', error: err.message }, { status: 500 });
  }
}