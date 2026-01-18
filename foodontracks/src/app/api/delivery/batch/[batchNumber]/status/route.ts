import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';

export const runtime = "nodejs";
import { Order } from '@/models/Order';
import { AuditLog } from '@/models/AuditLog';
import { UserRole } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ batchNumber: string }> }
) {
  try {
    const { batchNumber } = await params;
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

    const { status } = await req.json();

    await dbConnect();

    // Find the order
    const order = await Order.findOne({ batchNumber });
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Verify the order is assigned to this delivery person
    if (order.deliveryPersonId?.toString() !== decoded.userId) {
      return NextResponse.json(
        { message: 'You are not authorized to update this order' },
        { status: 403 }
      );
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      READY: ['PICKED_UP', 'OUT_FOR_DELIVERY'],
      CONFIRMED: ['PICKED_UP', 'OUT_FOR_DELIVERY'],
      PREPARING: ['PICKED_UP', 'OUT_FOR_DELIVERY'],
      PICKED_BY_DELIVERY: ['OUT_FOR_DELIVERY', 'DELIVERED'],
      PICKED_UP: ['OUT_FOR_DELIVERY', 'DELIVERED'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
    };

    const currentStatus = order.status.toUpperCase();
    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        {
          message: `Invalid status transition from ${order.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    // Update order status
    const oldStatus = order.status;
    order.status = status.toLowerCase();

    // Update timeline
    if (!order.orderTimeline) {
      order.orderTimeline = {};
    }
    
    if (status === 'PICKED_UP') {
      order.orderTimeline.ready = new Date();
    } else if (status === 'DELIVERED') {
      order.orderTimeline.delivered = new Date();
    }

    await order.save();

    // Create audit log
    try {
      await AuditLog.create({
        userId: decoded.userId,
        action: 'ORDER_STATUS_UPDATE',
        resource: 'Order',
        resourceId: order._id,
        details: {
          orderId: order._id,
          batchNumber: order.batchNumber,
          oldStatus,
          newStatus: order.status,
          updatedBy: decoded.userId,
        },
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't fail the request if audit log fails
    }

    return NextResponse.json({
      message: 'Order status updated successfully',
      order: {
        _id: order._id,
        batchNumber: order.batchNumber,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { message: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
