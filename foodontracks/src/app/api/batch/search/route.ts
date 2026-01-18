/**
 * Batch Search API Endpoint
 * PUBLIC endpoint - allows anyone to search for orders by batch number
 * Returns full traceability information
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Order } from "@/models/Order";

export const runtime = "nodejs";
import { User } from "@/models/User";
import { Restaurant } from "@/models/Restaurant";
import { DeliveryPerson } from "@/models/DeliveryPerson";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

export const GET = withLogging(async (req: NextRequest) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const batchNumber = searchParams.get('batchNumber');

    if (!batchNumber) {
      return NextResponse.json(
        { success: false, message: 'Batch number is required' },
        { status: 400 }
      );
    }

    // Find order by batch number
    const order = await Order.findOne({ batchNumber });

    if (!order) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Order not found',
          batchNumber,
          hint: 'Please verify the batch number format: foodontrack-XXXXX'
        },
        { status: 404 }
      );
    }

    // Fetch related data
    const [customer, restaurant, deliveryPerson] = await Promise.all([
      User.findById(order.userId).select('name email phoneNumber'),
      Restaurant.findById(order.restaurantId).select('name address city phoneNumber cuisine'),
      order.deliveryPersonId 
        ? DeliveryPerson.findById(order.deliveryPersonId).select('name phoneNumber vehicleNumber')
        : null,
    ]);

    // Build traceability response
    const traceabilityData = {
      success: true,
      batchNumber: order.batchNumber,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        phoneNumber: order.phoneNumber,
        notes: order.notes,
        createdAt: order.createdAt,
      },
      timeline: {
        orderPlaced: order.orderTimeline?.orderPlaced || order.createdAt,
        confirmed: order.orderTimeline?.confirmed,
        preparing: order.orderTimeline?.preparing,
        ready: order.orderTimeline?.ready,
        delivered: order.orderTimeline?.delivered,
      },
      customer: customer ? {
        name: customer.name,
        phoneNumber: customer.phoneNumber,
      } : null,
      restaurant: restaurant ? {
        id: restaurant._id,
        name: restaurant.name,
        address: restaurant.address,
        city: restaurant.city,
        phoneNumber: restaurant.phoneNumber,
        cuisine: restaurant.cuisine,
      } : null,
      deliveryPerson: deliveryPerson ? {
        name: deliveryPerson.name,
        phoneNumber: deliveryPerson.phoneNumber,
        vehicleNumber: deliveryPerson.vehicleNumber,
      } : {
        message: 'Delivery person not assigned yet',
      },
      traceabilityFlow: [
        {
          stage: 'Order Placed',
          timestamp: order.orderTimeline?.orderPlaced || order.createdAt,
          status: 'completed',
          description: `Order placed by ${customer?.name || 'Customer'}`,
        },
        {
          stage: 'Restaurant Confirmation',
          timestamp: order.orderTimeline?.confirmed,
          status: order.status === 'pending' ? 'pending' : 'completed',
          description: `Order confirmed by ${restaurant?.name || 'Restaurant'}`,
        },
        {
          stage: 'Food Preparation',
          timestamp: order.orderTimeline?.preparing,
          status: ['pending', 'confirmed'].includes(order.status) ? 'pending' : 'completed',
          description: 'Food being prepared in kitchen',
        },
        {
          stage: 'Ready for Delivery',
          timestamp: order.orderTimeline?.ready,
          status: ['pending', 'confirmed', 'preparing'].includes(order.status) ? 'pending' : 'completed',
          description: deliveryPerson 
            ? `Assigned to ${deliveryPerson.name}` 
            : 'Awaiting delivery person assignment',
        },
        {
          stage: 'Delivered',
          timestamp: order.orderTimeline?.delivered,
          status: order.status === 'delivered' ? 'completed' : 'pending',
          description: order.status === 'delivered' 
            ? `Delivered successfully to ${order.deliveryAddress}` 
            : 'Delivery in progress',
        },
      ].filter(stage => stage.timestamp || stage.status === 'pending'),
    };

    logger.info('batch_search_success', {
      userId: order._id?.toString(),
      context: {
        batchNumber,
        status: order.status,
      },
    });

    return NextResponse.json(traceabilityData);
  } catch (error) {
    logger.error('batch_search_error', { 
      batchNumber: new URL(req.url).searchParams.get('batchNumber'),
      error: String(error) 
    });
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to search batch number',
        error: String(error),
      },
      { status: 500 }
    );
  }
});
