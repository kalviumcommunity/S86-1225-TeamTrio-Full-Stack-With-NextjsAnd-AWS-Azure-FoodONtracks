import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Address } from "@/models/Address";

export const runtime = "nodejs";
import { addressUpdateSchema } from "@/lib/schemas/addressSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/addresses/[id]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let idStr: string | undefined = undefined;
  try {
    await dbConnect();
    const { id } = await params;
    idStr = id;

    const address = await Address.findById(id);

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
}

// PUT /api/addresses/[id]
export const PUT = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  let idStr: string | undefined = undefined;
  try {
    await dbConnect();
    const { id } = await params;
    idStr = id;

    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(addressUpdateSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    if (!validationResult.data) {
      return NextResponse.json(
        { error: "Validation data is missing" },
        { status: 400 }
      );
    }

    const address = await Address.findByIdAndUpdate(
      id,
      { $set: validationResult.data },
      { new: true, runValidators: true }
    );

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let idStr: string | undefined = undefined;
  try {
    await dbConnect();
    const { id } = await params;
    idStr = id;

    await Address.findByIdAndDelete(id);

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
}
