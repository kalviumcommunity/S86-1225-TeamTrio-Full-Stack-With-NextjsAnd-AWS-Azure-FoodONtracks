import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateRestaurantSchema } from "@/lib/schemas/restaurantSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/restaurants/[id] - Get a specific restaurant
export const GET = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const restaurantId = parseInt(id);

    if (isNaN(restaurantId)) {
      return NextResponse.json(
        { error: "Invalid restaurant ID" },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { category: "asc" },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: restaurant });
  } catch (error) {
    logger.error("error_fetching_restaurant", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch restaurant" },
      { status: 500 }
    );
  }
});

// PUT /api/restaurants/[id] - Update a restaurant
export const PUT = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const restaurantId = parseInt(id);

    if (isNaN(restaurantId)) {
      return NextResponse.json(
        { error: "Invalid restaurant ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(updateRestaurantSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    // Check if restaurant exists
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!existingRestaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Update restaurant
    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: validationResult.data,
    });

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
export const DELETE = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const restaurantId = parseInt(id);

    if (isNaN(restaurantId)) {
      return NextResponse.json(
        { error: "Invalid restaurant ID" },
        { status: 400 }
      );
    }

    // Check if restaurant exists
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!existingRestaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Delete restaurant
    await prisma.restaurant.delete({
      where: { id: restaurantId },
    });

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
});
