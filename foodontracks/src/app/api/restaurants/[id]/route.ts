import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Restaurant } from "@/models/Restaurant";
import { RestaurantAddress } from "@/models/RestaurantAddress";

export const runtime = "nodejs";
import { restaurantUpdateSchema } from "@/lib/schemas/restaurantSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/restaurants/[id] - Get a specific restaurant

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Fetch physical address from RestaurantAddress collection
    const address = await RestaurantAddress.findOne({ restaurantId: id }).lean();

    const restaurantWithAddress = {
      ...restaurant.toObject(),
      physicalAddress: address ? {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country,
        landmark: address.landmark,
      } : null,
    };

    return NextResponse.json({ data: restaurantWithAddress });
  } catch (error) {
    logger.error("error_fetching_restaurant", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch restaurant" },
      { status: 500 }
    );
  }
}

// PUT /api/restaurants/[id] - Update a restaurant
export const PUT = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await dbConnect();
    const { id } = await params;

    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(restaurantUpdateSchema, body);
    if (!validationResult.success || !validationResult.data) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    // Update restaurant
    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $set: validationResult.data },
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Restaurant updated successfully",
      data: restaurant,
    });
  } catch (error) {
    logger.error("error_updating_restaurant", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to update restaurant" },
      { status: 500 }
    );
  }
});

// DELETE /api/restaurants/[id] - Delete a restaurant

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Delete restaurant
    const restaurant = await Restaurant.findByIdAndDelete(id);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Restaurant deleted successfully",
    });
  } catch (error) {
    logger.error("error_deleting_restaurant", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to delete restaurant" },
      { status: 500 }
    );
  }
}
