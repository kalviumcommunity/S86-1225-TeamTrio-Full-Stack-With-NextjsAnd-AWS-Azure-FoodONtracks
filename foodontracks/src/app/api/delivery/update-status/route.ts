import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { UserRole } from '@/types/user';
import { logger } from '@/lib/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PATCH(req: NextRequest) {
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
      return NextResponse.json(
        { message: 'Forbidden - Delivery person access required' },
        { status: 403 }
      );
    }

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { message: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Valid statuses for delivery person
    const validStatuses = ['picked_by_delivery', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: `Invalid status. Allowed: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    await dbConnect();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Verify order is assigned to this delivery person
    if (order.deliveryPersonId?.toString() !== decoded.userId) {
      return NextResponse.json(
        { message: 'You can only update orders assigned to you' },
        { status: 403 }
      );
    }

    // Update order status
    order.status = status;

    // Update timeline
    if (!order.orderTimeline) {
      order.orderTimeline = {};
    }

    if (status === 'delivered') {
      order.orderTimeline.delivered = new Date();
      order.paymentStatus = order.paymentMethod === 'cash' ? 'completed' : order.paymentStatus;
    }

    await order.save();

    logger.info('delivery_status_updated', {
      userId: decoded.userId,
      context: {
        orderId: order._id.toString(),
        newStatus: status,
      },
    });

    return NextResponse.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    logger.error('delivery_status_update_error', { error: String(error) });
    return NextResponse.json(
      { message: 'Failed to update order status', error: String(error) },
      { status: 500 }
    );
  }
}
