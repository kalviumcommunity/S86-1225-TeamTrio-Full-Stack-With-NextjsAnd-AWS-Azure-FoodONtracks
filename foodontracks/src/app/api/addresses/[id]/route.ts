import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateAddressSchema } from "@/lib/schemas/addressSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/addresses/[id]
export const GET = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  let idStr: string | undefined = undefined;
  try {
    const { id } = await params;
    idStr = id;
    const addressId = parseInt(id);

    if (isNaN(addressId)) {
      return NextResponse.json(
        { error: "Invalid address ID" },
        { status: 400 }
      );
    }

    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ data: address });
  } catch (error) {
    logger.error("address_fetch_error", { id: idStr, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to fetch address" },
      { status: 500 }
    );
  }
});

// PUT /api/addresses/[id]
export const PUT = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  let idStr: string | undefined = undefined;
  try {
    const { id } = await params;
    idStr = id;
    const addressId = parseInt(id);

    if (isNaN(addressId)) {
      return NextResponse.json(
        { error: "Invalid address ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(updateAddressSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    const address = await prisma.address.update({
      where: { id: addressId },
      data: validationResult.data as any,
    });

    return NextResponse.json({
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    logger.error("address_update_error", { id: idStr, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
});

// DELETE /api/addresses/[id]
export const DELETE = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  let idStr: string | undefined = undefined;
  try {
    const { id } = await params;
    idStr = id;
    const addressId = parseInt(id);

    if (isNaN(addressId)) {
      return NextResponse.json(
        { error: "Invalid address ID" },
        { status: 400 }
      );
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    return NextResponse.json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    logger.error("address_delete_error", { id: idStr, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
});
