import { NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { UserRole } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    if (decoded.role !== UserRole.DELIVERY_GUY) {
      return NextResponse.json({ message: 'Forbidden - Delivery person access required' }, { status: 403 });
    }

    await dbConnect();

    // Get orders that are ready for delivery but not assigned to any delivery person
    const availableOrders = await Order.find({
      status: { $in: ['ready', 'confirmed'] },
      $or: [
        { deliveryPersonId: { $exists: false } },
        { deliveryPersonId: null }
      ]
    })
      .populate('restaurantId', 'name location')
      .populate('userId', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ orders: availableOrders });
  } catch (error) {
    console.error('Error fetching available orders:', error);
    return NextResponse.json(
      { message: 'Failed to fetch available orders' },
      { status: 500 }
    );
  }
}
