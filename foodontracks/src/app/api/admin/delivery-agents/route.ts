import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';

export const runtime = "nodejs";
import { DeliveryAgent } from '@/models/DeliveryAgent';
import { UserRole } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: NextRequest) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    if (decoded.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const agents = await DeliveryAgent.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('Error fetching delivery agents:', error);
    return NextResponse.json(
      { message: 'Failed to fetch delivery agents' },
      { status: 500 }
    );
  }
}
