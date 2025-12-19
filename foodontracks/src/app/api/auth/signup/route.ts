import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    // Do not return password
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return NextResponse.json({ success: true, message: 'Signup successful', user: safeUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Signup failed', error: err.message }, { status: 500 });
  }
}