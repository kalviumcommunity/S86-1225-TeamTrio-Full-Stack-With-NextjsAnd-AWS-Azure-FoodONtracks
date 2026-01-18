import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";

export const runtime = "nodejs";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { Restaurant } from "@/models/Restaurant";
import { orderUpdateSchema } from "@/lib/schemas/orderSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/orders/[id]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Manual population to avoid populate() errors
    let userData = null;
    let restaurantData = null;
    let deliveryPersonData = null;

    try {
      if (order.userId) {
        userData = await User.findById(order.userId).select('name email phone').lean();
      }
    } catch (err) {
      console.log('Failed to populate user:', err);
    }

    try {
      if (order.restaurantId) {
        restaurantData = await Restaurant.findById(order.restaurantId)
          .select('name location cuisineType address')
          .lean();
      }
    } catch (err) {
      console.log('Failed to populate restaurant:', err);
    }

    try {
      if (order.deliveryPersonId) {
        deliveryPersonData = await User.findById(order.deliveryPersonId)
          .select('name email phoneNumber vehicleType vehicleNumber')
          .lean();
      }
    } catch (err) {
      console.log('Failed to populate delivery person:', err);
    }

    const populatedOrder = {
      ...order,
      userId: userData || order.userId,
      restaurantId: restaurantData || order.restaurantId,
      deliveryPersonId: deliveryPersonData || order.deliveryPersonId,
    };

    return NextResponse.json({ data: populatedOrder });
  } catch (error) {
    console.error('Order fetch error:', error);
    logger.error("error_fetching_order", error as Error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order status
export const PATCH = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await dbConnect();
    const { id } = await params;

    const body = await req.json();
    const { status, batchTracking } = body;

    // Check if order exists
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      
      // Update timeline based on status
      if (status === 'confirmed' && !existingOrder.orderTimeline?.confirmed) {
        updateData['orderTimeline.confirmed'] = new Date();
      } else if (status === 'preparing' && !existingOrder.orderTimeline?.preparing) {
        updateData['orderTimeline.preparing'] = new Date();
      } else if (status === 'ready' && !existingOrder.orderTimeline?.ready) {
        updateData['orderTimeline.ready'] = new Date();
      } else if (status === 'delivered' && !existingOrder.orderTimeline?.delivered) {
        updateData['orderTimeline.delivered'] = new Date();
      }
    }

    if (batchTracking) {
      Object.keys(batchTracking).forEach(key => {
        updateData[`batchTracking.${key}`] = batchTracking[key];
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('userId', 'name email phone')
     .populate('restaurantId', 'name');

    logger.info("order_updated", { context: { orderId: id, updates: updateData } });

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    logger.error("error_updating_order", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
});

// PUT /api/orders/[id] - Update order status (alias for PATCH)
export const PUT = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await dbConnect();
    const { id } = await params;

    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(orderUpdateSchema, body);
    if (!validationResult.success || !validationResult.data) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await Order.findById(id);

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { status, specialInstructions, deliveryPersonId } =
      validationResult.data;

    // Update order and create tracking event in transaction
    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        const updateData: any = {};
        if (status) updateData.status = status;
        if (specialInstructions !== undefined) updateData.specialInstructions = specialInstructions;
        if (deliveryPersonId !== undefined) updateData.deliveryPersonId = deliveryPersonId;
        if (status === "DELIVERED" && !(existingOrder as any).actualDeliveryTime) {
          updateData.actualDeliveryTime = new Date();
        }

        order = await Order.findByIdAndUpdate(
          id,
          { $set: updateData },
          { new: true, session }
        );
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    logger.error("error_updating_order", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
});

// DELETE /api/orders/[id] - Cancel order
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Check if order exists and can be cancelled
    const existingOrder = await Order.findById(id);

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (["DELIVERED", "CANCELLED"].includes(existingOrder.status)) {
      return NextResponse.json(
        { error: "Cannot cancel order that is already delivered or cancelled" },
        { status: 400 }
      );
    }

    // Update status to cancelled
    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        order = await Order.findByIdAndUpdate(
          id,
          { $set: { status: "CANCELLED" } },
          { new: true, session }
        );

        // Note: Order tracking would be stored in Order model's tracking array
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    logger.error("error_cancelling_order", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
