import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAddressSchema } from "@/lib/schemas/addressSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/addresses
export const GET = withLogging(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { isDefault: "desc" },
    });

    return NextResponse.json({ data: addresses });
  } catch (error) {
    logger.error("addresses_fetch_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
});

// POST /api/addresses
export const POST = withLogging(async (req: NextRequest) => {
  try {
    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(createAddressSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    const {
      userId,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      isDefault,
    } = validationResult.data as any;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        country,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(
      { message: "Address created successfully", data: address },
      { status: 201 }
    );
  } catch (error) {
    logger.error("address_create_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
});
