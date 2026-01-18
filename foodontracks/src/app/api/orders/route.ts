import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";

export const runtime = "nodejs";
import { Order } from "@/models/Order";
import { User, UserRole } from "@/models/User";
import { Restaurant } from "@/models/Restaurant";
import { Address } from "@/models/Address";
import { MenuItem } from "@/models/MenuItem";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { orderSchema } from "@/lib/schemas/orderSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import { generateBatchNumber } from "@/lib/rbac";
import { withAuth, withPermission } from "@/lib/apiAuth";

// GET /api/orders - Get orders with RBAC filtering
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const userId = searchParams.get("userId");
    const restaurantId = searchParams.get("restaurantId");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (userId) filter.userId = userId;
    if (restaurantId) filter.restaurantId = restaurantId;
    if (status) filter.status = status;

    // Apply RBAC ownership filters
    if (user.role === UserRole.CUSTOMER) {
      filter.userId = user.userId;
    } else if (user.role === UserRole.RESTAURANT_OWNER) {
      filter.restaurantId = user.restaurantId;
    }
    // ADMIN sees all orders (no filter)

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email phone')
        .populate('restaurantId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Order.countDocuments(filter),
    ]);

    return sendSuccess(
      {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Orders fetched successfully"
    );
  } catch (error) {
    logger.error("error_fetching_orders", { error: String(error) });
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to fetch orders",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

// POST /api/orders - Create order (CUSTOMER only)
export const POST = withPermission('orders', 'create', async (req: NextRequest) => {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(orderSchema, body);
    if (!validationResult.success || !validationResult.data) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    const {
      userId,
      restaurantId,
      addressId,
      orderItems,
      deliveryFee,
      tax,
      discount,
      specialInstructions,
      paymentMethod,
    } = validationResult.data;

    // Verify user, restaurant, and address exist
    const [user, restaurant, address] = await Promise.all([
      User.findById(userId),
      Restaurant.findById(restaurantId),
      Address.findById(addressId),
    ]);

    if (!user || !restaurant || !address) {
      return sendError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "User, restaurant, or address not found",
        undefined,
        404
      );
    }

    // Fetch menu items and calculate total
    const menuItemIds = orderItems.map((item) => item.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

    if (menuItems.length !== menuItemIds.length) {
      return sendError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "Some menu items not found",
        undefined,
        404
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData = orderItems.map((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      const itemTotal = menuItem!.price * item.quantity;
      totalAmount += itemTotal;

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        priceAtTime: menuItem!.price,
      };
    });

    const finalTotal =
      totalAmount + (deliveryFee || 0) + (tax || 0) - (discount || 0);

    // Normalize payment method for Mongoose model (expects lowercase values)
    const normalizedPaymentMethod =
      paymentMethod === "CASH"
        ? "cash"
        : paymentMethod === "CARD"
        ? "card"
        : "online"; // UPI, WALLET, etc. treated as online

    // Create order with order items in a transaction
    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        // Generate unique batch number
        let batchNumber = generateBatchNumber();
        
        // Ensure batch number is unique
        let existing = await Order.findOne({ batchNumber }).session(session);
        while (existing) {
          batchNumber = generateBatchNumber();
          existing = await Order.findOne({ batchNumber }).session(session);
        }

        // Prepare order data with batch traceability
        const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
        const orderData = {
          userId,
          restaurantId,
          batchNumber, // foodontrack-XXXXX format
          orderNumber,
          status: "pending",
          totalAmount: finalTotal,
          deliveryAddress: address.street || `${address.city}, ${address.state}`,
          phoneNumber: specialInstructions?.match(/Phone:\s*([+\d\s-]+)/)?.[1]?.trim() || user.phoneNumber || '0000000000',
          paymentMethod: normalizedPaymentMethod,
          paymentStatus: 'completed',
          notes: specialInstructions,
          items: orderItemsData.map(item => ({
            menuItemId: new mongoose.Types.ObjectId(item.menuItemId),
            name: menuItems.find(mi => mi._id.toString() === item.menuItemId)?.name || 'Unknown',
            quantity: item.quantity,
            price: item.priceAtTime,
          })),
          orderTimeline: {
            orderPlaced: new Date(),
          },
        };

        console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
        const createdOrders = await Order.create([orderData], { session });
        order = createdOrders[0];

        logger.info('order_created_with_batch', {
          context: {
            orderId: order._id?.toString(),
            batchNumber,
            userId,
            restaurantId,
          }
        });
      });
    } finally {
      await session.endSession();
    }

    return sendSuccess(order, "Order created successfully", 201);
  } catch (error) {
    console.error('Order creation error details:', error);
    logger.error("error_creating_order", { 
      error: String(error), 
      stack: error instanceof Error ? error.stack : undefined,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to create order",
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});
