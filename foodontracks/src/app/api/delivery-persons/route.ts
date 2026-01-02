import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deliveryPersonSchema } from "@/lib/schemas/deliveryPersonSchema";
import { validateData } from "@/lib/validationUtils";

// GET /api/delivery-persons - Get all delivery persons
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const isAvailable = searchParams.get("isAvailable");

    const skip = (page - 1) * limit;

    const where: { isAvailable?: boolean } = {};
    if (isAvailable) where.isAvailable = isAvailable === "true";

    const [deliveryPersons, total] = await Promise.all([
      prisma.deliveryPerson.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: { rating: "desc" },
      }),
      prisma.deliveryPerson.count({ where }),
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
    console.error("Error fetching delivery persons:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery persons" },
      { status: 500 }
    );
  }
}

// POST /api/delivery-persons - Create delivery person
export async function POST(req: NextRequest) {
  try {
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

    const deliveryPerson = await prisma.deliveryPerson.create({
      data: {
        name,
        email,
        phoneNumber,
        vehicleType,
        vehicleNumber,
        isAvailable: isAvailable || true,
      },
    });

    return NextResponse.json(
      { message: "Delivery person created successfully", data: deliveryPerson },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating delivery person:", error);
    return NextResponse.json(
      { error: "Failed to create delivery person" },
      { status: 500 }
    );
  }
}
