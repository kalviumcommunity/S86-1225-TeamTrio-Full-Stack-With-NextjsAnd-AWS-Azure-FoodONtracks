import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { createRestaurantSchema } from "@/lib/schemas/restaurantSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import { withLogging } from "@/lib/requestLogger";

// GET /api/restaurants - Get all restaurants with pagination
async function GET_handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const city = searchParams.get("city");
    const isActive = searchParams.get("isActive");
    const minRating = searchParams.get("minRating");

    const skip = (page - 1) * limit;

    const where: {
      city?: { contains: string; mode: "insensitive" };
      isActive?: boolean;
      rating?: { gte: number };
    } = {};
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (isActive) where.isActive = isActive === "true";
    if (minRating) where.rating = { gte: parseFloat(minRating) };

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          description: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          rating: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              menuItems: true,
              orders: true,
              reviews: true,
            },
          },
        },
        orderBy: { rating: "desc" },
      }),
      prisma.restaurant.count({ where }),
    ]);

    return sendSuccess(
      {
        restaurants,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Restaurants fetched successfully"
    );
  } catch (error) {
    logger.error("error_fetching_restaurants", { error: String(error) });
    return sendError(
      "Failed to fetch restaurants",
      ERROR_CODES.DATABASE_FAILURE,
      500,
      error
    );
  }
}

export const GET = withLogging(GET_handler);

// POST /api/restaurants - Create a new restaurant
async function POST_handler(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(createRestaurantSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    const {
      name,
      email,
      phoneNumber,
      description,
      address,
      city,
      state,
      zipCode,
    } = validationResult.data;

    // Check if restaurant already exists
    const existingRestaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingRestaurant) {
      return sendError(
        "Restaurant with this email or phone number already exists",
        ERROR_CODES.DUPLICATE_ENTRY,
        409
      );
    }

    // Create restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        email,
        phoneNumber,
        description,
        address,
        city,
        state,
        zipCode,
      },
    });

    return sendSuccess(restaurant, "Restaurant created successfully", 201);
  } catch (error) {
    logger.error("error_creating_restaurant", { error: String(error) });
    return sendError(
      "Failed to create restaurant",
      ERROR_CODES.DATABASE_FAILURE,
      500,
      error
    );
  }
}

export const POST = withLogging(POST_handler);
