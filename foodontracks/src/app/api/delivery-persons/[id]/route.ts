import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateDeliveryPersonSchema } from "@/lib/schemas/deliveryPersonSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/delivery-persons/[id] - Get specific delivery person
export const GET = withLogging(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const deliveryPersonId = parseInt(id);

    if (isNaN(deliveryPersonId)) {
      return NextResponse.json(
        { error: "Invalid delivery person ID" },
        { status: 400 }
      );
    }

    const deliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { id: deliveryPersonId },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            restaurant: {
              select: {
                name: true,
                city: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!deliveryPerson) {
      return NextResponse.json(
        { error: "Delivery person not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: deliveryPerson });
  } catch (error) {
    logger.error("delivery_person_fetch_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch delivery person" },
      { status: 500 }
    );
  }
});

// PUT /api/delivery-persons/[id] - Update delivery person
export const PUT = withLogging(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const deliveryPersonId = parseInt(id);

    if (isNaN(deliveryPersonId)) {
      return NextResponse.json(
        { error: "Invalid delivery person ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input using Zod schema
    const validationResult = validateData(updateDeliveryPersonSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    // Check if delivery person exists
    const existingDeliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { id: deliveryPersonId },
    });

    if (!existingDeliveryPerson) {
      return NextResponse.json(
        { error: "Delivery person not found" },
        { status: 404 }
      );
    }

    const { email, phoneNumber } = validationResult.data;

    // Check for email uniqueness if email is being updated
    if (email && email !== existingDeliveryPerson.email) {
      const emailExists = await prisma.deliveryPerson.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
    }

    // Check for phone number uniqueness if being updated
    if (phoneNumber && phoneNumber !== existingDeliveryPerson.phoneNumber) {
      const phoneExists = await prisma.deliveryPerson.findUnique({
        where: { phoneNumber },
      });

      if (phoneExists) {
        return NextResponse.json(
          { error: "Phone number already exists" },
          { status: 409 }
        );
      }
    }

    const updatedDeliveryPerson = await prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: validationResult.data,
    });

    return NextResponse.json({
      message: "Delivery person updated successfully",
      data: updatedDeliveryPerson,
    });
  } catch (error) {
    logger.error("delivery_person_update_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to update delivery person" },
      { status: 500 }
    );
  }
});

// DELETE /api/delivery-persons/[id] - Delete delivery person
export const DELETE = withLogging(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const deliveryPersonId = parseInt(id);

    if (isNaN(deliveryPersonId)) {
      return NextResponse.json(
        { error: "Invalid delivery person ID" },
        { status: 400 }
      );
    }

    // Check if delivery person exists
    const existingDeliveryPerson = await prisma.deliveryPerson.findUnique({
      where: { id: deliveryPersonId },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!existingDeliveryPerson) {
      return NextResponse.json(
        { error: "Delivery person not found" },
        { status: 404 }
      );
    }

    // Check if delivery person has active orders
    const activeOrders = await prisma.order.count({
      where: {
        deliveryPersonId: deliveryPersonId,
        status: {
          in: ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"],
        },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete delivery person with ${activeOrders} active order(s). Please complete or reassign orders first.`,
        },
        { status: 400 }
      );
    }

    await prisma.deliveryPerson.delete({
      where: { id: deliveryPersonId },
    });

    return NextResponse.json({
      message: "Delivery person deleted successfully",
    });
  } catch (error) {
    logger.error("delivery_person_delete_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to delete delivery person" },
      { status: 500 }
    );
  }
});
