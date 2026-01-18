import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';

export const runtime = "nodejs";
import { Batch } from '@/models/Batch';
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
      restaurantId?: string;
    };

    if (decoded.role !== UserRole.RESTAURANT_OWNER || !decoded.restaurantId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const batches = await Batch.find({ restaurantId: decoded.restaurantId })
      .populate('orderId', 'orderNumber deliveryAddress customerName')
      .populate('deliveryGuyId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ batches });
  } catch (error) {
    console.error('Error fetching restaurant batches:', error);
    return NextResponse.json(
      { message: 'Failed to fetch restaurant batches' },
      { status: 500 }
    );
  }
}
