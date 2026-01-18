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
    };

    if (decoded.role !== UserRole.DELIVERY_GUY) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Get orders assigned to this delivery person (not delivered or cancelled)
    const batches = await Order.find({
      deliveryPersonId: decoded.userId,
      status: { $nin: ['delivered', 'cancelled'] },
    })
      .populate('restaurantId', 'name location')
      .populate('userId', 'name email phoneNumber')
      .sort({ createdAt: -1 })
      .lean();

    // Transform to match the expected format
    const formattedBatches = batches.map((order: any) => ({
      _id: order._id,
      batchNumber: order.batchNumber,
      restaurantId: {
        _id: order.restaurantId?._id || '',
        name: order.restaurantId?.name || 'Unknown Restaurant',
        address: order.restaurantId?.location || 'Address not available',
      },
      orderId: {
        _id: order._id,
        deliveryAddress: order.trainDetails 
          ? `Train ${order.trainDetails.trainNumber}, Coach ${order.trainDetails.coach}, Seat ${order.trainDetails.seatNumber}`
          : order.deliveryAddress || 'Address not provided',
        customerName: order.trainDetails?.passengerName || order.userId?.name || 'Customer',
        customerPhone: order.trainDetails?.passengerPhone || order.userId?.phoneNumber || order.phoneNumber || 'N/A',
      },
      status: order.status.toUpperCase(),
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
      })),
      preparedAt: order.orderTimeline?.preparing,
      packedAt: order.orderTimeline?.ready,
      pickedUpAt: order.orderTimeline?.ready,
      inTransitAt: order.updatedAt,
    }));

    return NextResponse.json({ batches: formattedBatches });
  } catch (error) {
    console.error('Error fetching assigned batches:', error);
    return NextResponse.json(
      { message: 'Failed to fetch assigned batches' },
      { status: 500 }
    );
  }
}
