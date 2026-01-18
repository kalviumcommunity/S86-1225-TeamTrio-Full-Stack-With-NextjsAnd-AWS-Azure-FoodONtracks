import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';

export const runtime = "nodejs";
import { Order } from '@/models/Order';
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

    if (decoded.role !== UserRole.RESTAURANT_OWNER) {
      return NextResponse.json({ message: 'Forbidden - Restaurant owner access required' }, { status: 403 });
    }

    await dbConnect();

    // If no restaurantId in token, fetch from user
    let restaurantId = decoded.restaurantId;
    if (!restaurantId) {
      const { User } = await import('@/models/User');
      const user = await User.findById(decoded.userId).select('restaurantId').lean();
      restaurantId = user?.restaurantId?.toString();
    }

    if (!restaurantId) {
      return NextResponse.json({ 
        message: 'No restaurant associated with this account',
        orders: []
      }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filter: any = { restaurantId };
    if (status) {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    return NextResponse.json(
      { message: 'Failed to fetch restaurant orders' },
      { status: 500 }
    );
  }
}
