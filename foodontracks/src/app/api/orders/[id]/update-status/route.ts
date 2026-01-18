import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { UserRole } from '@/types/user';
import { logger } from '@/lib/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    const { status } = await req.json();
    const { id: orderId } = await params;

    if (!status) {
      return NextResponse.json(
        { message: 'Status is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Role-based authorization for status updates
    const allowedStatuses: Record<string, string[]> = {
      [UserRole.RESTAURANT_OWNER]: ['confirmed', 'preparing', 'ready', 'cancelled'],
      [UserRole.DELIVERY_GUY]: ['picked_by_delivery', 'out_for_delivery', 'delivered'],
      [UserRole.ADMIN]: ['pending', 'confirmed', 'preparing', 'ready', 'picked_by_delivery', 'out_for_delivery', 'delivered', 'cancelled'],
      [UserRole.CUSTOMER]: ['cancelled'], // Can only cancel pending orders
    };

    const userAllowedStatuses = allowedStatuses[decoded.role as UserRole] || [];

    if (!userAllowedStatuses.includes(status)) {
      return NextResponse.json(
        { message: `You are not authorized to set status to: ${status}` },
        { status: 403 }
      );
    }

    // Additional validation: customers can only cancel their own pending orders
    if (decoded.role === UserRole.CUSTOMER) {
      if (order.userId.toString() !== decoded.userId) {
        return NextResponse.json(
          { message: 'You can only cancel your own orders' },
          { status: 403 }
        );
      }
      if (order.status !== 'pending' && status === 'cancelled') {
        return NextResponse.json(
          { message: 'Only pending orders can be cancelled' },
          { status: 400 }
        );
      }
    }

    // Update order status
    order.status = status;

    // Update order timeline
    if (!order.orderTimeline) {
      order.orderTimeline = {};
    }

    const statusTimelineMap: Record<string, keyof typeof order.orderTimeline> = {
      'confirmed': 'confirmed',
      'preparing': 'preparing',
      'ready': 'ready',
      'delivered': 'delivered',
    };

    if (statusTimelineMap[status]) {
      order.orderTimeline[statusTimelineMap[status]] = new Date();
    }

    await order.save();

    logger.info('order_status_updated', {
      endpoint: `/api/orders/${orderId}/update-status`,
      statusCode: 200,
      meta: {
        orderId: order._id.toString(),
        newStatus: status,
        updatedBy: decoded.userId,
        role: decoded.role,
      },
    });

    return NextResponse.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    logger.error('order_status_update_error', { error: String(error) });
    return NextResponse.json(
      { message: 'Failed to update order status', error: String(error) },
      { status: 500 }
    );
  }
}
