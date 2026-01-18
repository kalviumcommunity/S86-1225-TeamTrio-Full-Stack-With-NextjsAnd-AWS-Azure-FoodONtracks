import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';

export const runtime = "nodejs";
import { Order } from '@/models/Order';
import { DeliveryPerson } from '@/models/DeliveryPerson';
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

    if (decoded.role !== UserRole.DELIVERY_GUY) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get delivery person details
    const deliveryPerson = await DeliveryPerson.findOne({ userId: decoded.userId });

    // Get orders assigned to this delivery guy
    const [todayOrders, pendingPickups, inTransitOrders, completedOrders] = await Promise.all([
      Order.countDocuments({
        deliveryPersonId: decoded.userId,
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      Order.countDocuments({
        deliveryPersonId: decoded.userId,
        status: { $in: ['ready', 'confirmed', 'preparing'] },
      }),
      Order.countDocuments({
        deliveryPersonId: decoded.userId,
        status: { $in: ['picked_up', 'in_transit'] },
      }),
      Order.countDocuments({
        deliveryPersonId: decoded.userId,
        status: 'delivered',
        updatedAt: { $gte: today, $lt: tomorrow },
      }),
    ]);

    // Calculate earnings (₹50 per delivery)
    const earnings = completedOrders * 50;

    return NextResponse.json({
      todayDeliveries: todayOrders,
      pendingPickups,
      inTransit: inTransitOrders,
      completed: completedOrders,
      earnings,
      rating: deliveryPerson?.rating || 4.5,
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    return NextResponse.json(
      { message: 'Failed to fetch delivery stats' },
      { status: 500 }
    );
  }
}
