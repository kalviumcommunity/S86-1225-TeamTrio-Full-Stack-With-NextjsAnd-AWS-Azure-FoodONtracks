import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateOrderSchema } from "@/lib/schemas/orderSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/orders/[id]
export const GET = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        restaurant: true,
        address: true,
        deliveryPerson: true,
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        tracking: {
          orderBy: { timestamp: "asc" },
        },
        payment: true,
        review: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ data: order });
  } catch (error) {
    logger.error("error_fetching_order", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
});

// PATCH /api/orders/[id] - Update order status
export const PATCH = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(updateOrderSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { status, specialInstructions, deliveryPersonId } = validationResult.data;

    // Update order and create tracking event in transaction
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          ...(status ? { status } : {}),
          ...(specialInstructions !== undefined ? { specialInstructions } : {}),
          ...(deliveryPersonId !== undefined ? { deliveryPersonId } : {}),
          ...(status === "DELIVERED" && !existingOrder.actualDeliveryTime ? { actualDeliveryTime: new Date() } : {}),
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      // Create tracking event if status changed
      if (status && status !== existingOrder.status) {
        await tx.orderTracking.create({
          data: {
            orderId,
            status,
          },
        });
      }

      return updatedOrder;
    });

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

// PUT /api/orders/[id] - Update order status (alias for PATCH)
export const PUT = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(updateOrderSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { status, specialInstructions, deliveryPersonId } = validationResult.data;

    // Update order and create tracking event in transaction
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          ...(status && { status }),
          ...(specialInstructions !== undefined && { specialInstructions }),
          ...(deliveryPersonId !== undefined && { deliveryPersonId }),
          ...(status === "DELIVERED" && !existingOrder.actualDeliveryTime && {
            actualDeliveryTime: new Date(),
          }),
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      // Create tracking event if status changed
      if (status && status !== existingOrder.status) {
        await tx.orderTracking.create({
          data: {
            orderId,
            status,
          },
        });
      }

      return updatedOrder;
    });

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
export const DELETE = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Check if order exists and can be cancelled
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

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
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      await tx.orderTracking.create({
        data: {
          orderId,
          status: "CANCELLED",
          notes: "Order cancelled by user",
        },
      });

      return updatedOrder;
    });

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
});
