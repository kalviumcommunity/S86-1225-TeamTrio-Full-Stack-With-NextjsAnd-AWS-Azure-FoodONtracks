import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { logger } from '@/lib/logger';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ batchNumber: string }> }
) {
  try {
    await dbConnect();
    const { batchNumber } = await params;

    if (!batchNumber) {
      return NextResponse.json(
        { error: 'Batch number is required' },
        { status: 400 }
      );
    }

    // Try to find by batchNumber first, then by orderNumber as fallback
    let order = await Order.findOne({ batchNumber }).lean().exec();
    
    if (!order) {
      // Try finding by orderNumber instead
      order = await Order.findOne({ orderNumber: batchNumber }).lean().exec();
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found with this batch number or order number' },
        { status: 404 }
      );
    }

    // Manually populate if needed, with error handling
    const populatedOrder: any = { ...order };

    // Try to populate restaurant if it exists
    if (order.restaurantId) {
      try {
        const Restaurant = mongoose.model('Restaurant');
        const restaurant = await Restaurant.findById(order.restaurantId)
          .select('name location cuisineType')
          .lean()
          .exec();
        if (restaurant) {
          populatedOrder.restaurantId = restaurant;
        }
      } catch (err) {
        logger.warn('Failed to populate restaurant', { context: { error: err } });
      }
    }

    // Try to populate delivery person if it exists
    if (order.deliveryPersonId) {
      try {
        const User = mongoose.model('User');
        const deliveryPerson = await User.findById(order.deliveryPersonId)
          .select('name phoneNumber email vehicleNumber')
          .lean()
          .exec();
        if (deliveryPerson) {
          populatedOrder.deliveryPersonId = deliveryPerson;
        }
      } catch (err) {
        logger.warn('Failed to populate delivery person', { context: { error: err } });
      }
    }

    // Log for debugging
    logger.info('Batch order found', { 
      context: {
        batchNumber, 
        hasDeliveryPerson: !!populatedOrder.deliveryPersonId,
        deliveryPersonData: populatedOrder.deliveryPersonId 
      }
    });

    return NextResponse.json({ data: populatedOrder });
  } catch (error) {
    logger.error('error_fetching_batch', error as Error, {
      context: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      }
    });
    return NextResponse.json(
      { error: 'Failed to fetch batch tracking details' },
      { status: 500 }
    );
  }
}
