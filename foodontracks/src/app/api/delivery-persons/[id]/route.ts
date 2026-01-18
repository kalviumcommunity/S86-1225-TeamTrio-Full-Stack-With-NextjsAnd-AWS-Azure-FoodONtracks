import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { DeliveryPerson } from "@/models/DeliveryPerson";

export const runtime = "nodejs";
import { Order } from "@/models/Order";
import { deliveryPersonUpdateSchema } from "@/lib/schemas/deliveryPersonSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/delivery-persons/[id] - Get specific delivery person

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const deliveryPerson = await DeliveryPerson.findById(id);

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
}

// PUT /api/delivery-persons/[id] - Update delivery person
export const PUT = withLogging(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await dbConnect();
    const { id } = await params;

    const body = await request.json();

    // Validate input using Zod schema
    const validationResult = validateData(deliveryPersonUpdateSchema, body);
    if (!validationResult.success || !validationResult.data) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    // Check if delivery person exists
    const existingDeliveryPerson = await DeliveryPerson.findById(id);

    if (!existingDeliveryPerson) {
      return NextResponse.json(
        { error: "Delivery person not found" },
        { status: 404 }
      );
    }

    const { email, phoneNumber } = validationResult.data;

    // Check for email uniqueness if email is being updated
    if (email && email !== existingDeliveryPerson.email) {
      const emailExists = await DeliveryPerson.findOne({ email });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
    }

    // Check for phone number uniqueness if being updated
    if (phoneNumber && phoneNumber !== existingDeliveryPerson.phoneNumber) {
      const phoneExists = await DeliveryPerson.findOne({ phoneNumber });

      if (phoneExists) {
        return NextResponse.json(
          { error: "Phone number already exists" },
          { status: 409 }
        );
      }
    }

    const updatedDeliveryPerson = await DeliveryPerson.findByIdAndUpdate(
      id,
      { $set: validationResult.data },
      { new: true, runValidators: true }
    );

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Check if delivery person exists
    const existingDeliveryPerson = await DeliveryPerson.findById(id);

    if (!existingDeliveryPerson) {
      return NextResponse.json(
        { error: "Delivery person not found" },
        { status: 404 }
      );
    }

    // Check if delivery person has active orders
    const activeOrders = await Order.countDocuments({
      deliveryPersonId: id,
      status: {
        $in: ["PENDING", "CONFIRMED", "PREPARING", "PICKED_UP"],
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

    await DeliveryPerson.findByIdAndDelete(id);

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
}
