import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { UserRole } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: NextRequest) {
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

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if order exists and is not already assigned
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.deliveryPersonId) {
      return NextResponse.json({ message: 'Order already assigned to another delivery person' }, { status: 400 });
    }

    // Assign order to this delivery person
    order.deliveryPersonId = decoded.userId as any;
    order.status = 'picked_by_delivery';
    
    console.log('Assigning order:', {
      orderId: order._id,
      deliveryPersonId: decoded.userId,
      status: order.status
    });
    
    // Add to order timeline
    if (!order.orderTimeline) {
      order.orderTimeline = {};
    }
    order.orderTimeline.ready = order.orderTimeline.ready || new Date();

    const savedOrder = await order.save();
    
    console.log('Order saved. deliveryPersonId:', savedOrder.deliveryPersonId);

    return NextResponse.json({ 
      message: 'Order assigned successfully',
      order: savedOrder,
      deliveryPersonId: savedOrder.deliveryPersonId
    });
  } catch (error) {
    console.error('Error assigning order:', error);
    return NextResponse.json(
      { message: 'Failed to assign order' },
      { status: 500 }
    );
  }
}
