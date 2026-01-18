import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { DeliveryPerson } from "@/models/DeliveryPerson";

export const runtime = "nodejs";
import { deliveryPersonSchema } from "@/lib/schemas/deliveryPersonSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/delivery-persons - Get all delivery persons
export const GET = withLogging(async (req: NextRequest) => {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const isAvailable = searchParams.get("isAvailable");

    const skip = (page - 1) * limit;

    const filter: any = {};
    if (isAvailable) filter.isAvailable = isAvailable === "true";

    const [deliveryPersons, total] = await Promise.all([
      DeliveryPerson.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ rating: -1 })
        .lean(),
      DeliveryPerson.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: deliveryPersons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("delivery_persons_fetch_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch delivery persons" },
      { status: 500 }
    );
  }
});

// POST /api/delivery-persons - Create delivery person
export const POST = withLogging(async (req: NextRequest) => {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(deliveryPersonSchema, body);
    if (!validationResult.success || !validationResult.data) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    const {
      name,
      email,
      phoneNumber,
      vehicleType,
      vehicleNumber,
      isAvailable,
    } = validationResult.data;

    const deliveryPerson = await DeliveryPerson.create({
      name,
      email,
      phoneNumber,
      vehicleType,
      vehicleNumber,
      isAvailable: isAvailable || true,
    });

    return NextResponse.json(
      { message: "Delivery person created successfully", data: deliveryPerson },
      { status: 201 }
    );
  } catch (error) {
    logger.error("delivery_person_create_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to create delivery person" },
      { status: 500 }
    );
  }
});
