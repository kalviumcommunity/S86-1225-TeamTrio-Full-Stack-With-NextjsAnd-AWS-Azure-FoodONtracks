import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

// GET /api/orders - Get all orders with pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const userId = searchParams.get("userId");
    const restaurantId = searchParams.get("restaurantId");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: {
      userId?: number;
      restaurantId?: number;
      status?: string;
    } = {};
    if (userId) where.userId = parseInt(userId);
    if (restaurantId) where.restaurantId = parseInt(restaurantId);
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
          address: true,
          deliveryPerson: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          orderItems: {
            include: {
              menuItem: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
          payment: {
            select: {
              paymentMethod: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
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
    console.error("Error fetching orders:", error);
    return sendError(
      "Failed to fetch orders",
      ERROR_CODES.DATABASE_FAILURE,
      500,
      error
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      restaurantId,
      addressId,
      orderItems, // Array of { menuItemId, quantity }
      deliveryFee,
      tax,
      discount,
      specialInstructions,
    } = body;

    // Validation
    if (
      !userId ||
      !restaurantId ||
      !addressId ||
      !orderItems ||
      orderItems.length === 0
    ) {
      return sendError(
        "Required fields: userId, restaurantId, addressId, orderItems",
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        400
      );
    }

    // Verify user, restaurant, and address exist
    const [user, restaurant, address] = await Promise.all([
      prisma.user.findUnique({ where: { id: parseInt(userId) } }),
      prisma.restaurant.findUnique({ where: { id: parseInt(restaurantId) } }),
      prisma.address.findUnique({ where: { id: parseInt(addressId) } }),
    ]);

    if (!user || !restaurant || !address) {
      return sendError(
        "User, restaurant, or address not found",
        ERROR_CODES.NOT_FOUND,
        404
      );
    }

    // Fetch menu items and calculate total
    const menuItemIds = orderItems.map(
      (item: { menuItemId: number; quantity: number }) => item.menuItemId
    );
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (menuItems.length !== menuItemIds.length) {
      return sendError(
        "Some menu items not found",
        ERROR_CODES.MENU_ITEM_NOT_FOUND,
        404
      );
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData = orderItems.map(
      (item: { menuItemId: number; quantity: number }) => {
        const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
        const itemTotal = menuItem!.price * item.quantity;
        totalAmount += itemTotal;

        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          priceAtTime: menuItem!.price,
        };
      }
    );

    const finalTotal =
      totalAmount + (deliveryFee || 0) + (tax || 0) - (discount || 0);

    // Create order with order items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: parseInt(userId),
          restaurantId: parseInt(restaurantId),
          addressId: parseInt(addressId),
          status: "PENDING",
          totalAmount: finalTotal,
          deliveryFee: deliveryFee || 0,
          tax: tax || 0,
          discount: discount || 0,
          specialInstructions,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      // Create initial tracking event
      await tx.orderTracking.create({
        data: {
          orderId: newOrder.id,
          status: "PENDING",
          notes: "Order received",
        },
      });

      return newOrder;
    });

    return sendSuccess(order, "Order created successfully", 201);
  } catch (error) {
    console.error("Error creating order:", error);
    return sendError(
      "Failed to create order",
      ERROR_CODES.DATABASE_FAILURE,
      500,
      error
    );
  }
}
