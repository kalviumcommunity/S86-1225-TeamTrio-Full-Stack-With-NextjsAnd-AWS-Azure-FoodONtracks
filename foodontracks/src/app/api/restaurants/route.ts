import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Restaurant } from "@/models/Restaurant";
import { RestaurantAddress } from "@/models/RestaurantAddress";

export const runtime = "nodejs";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";
import { restaurantCreateSchema } from "@/lib/schemas/restaurantSchema";
import { validateData } from "@/lib/validationUtils";
 

// GET /api/restaurants - Get all restaurants with pagination
async function GET_handler(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const isActive = searchParams.get("isActive");
    const minRating = searchParams.get("minRating");

    const skip = (page - 1) * limit;

    let restaurantIds: any[] = [];
    
    // If filtering by city or state, first find matching addresses
    if (city || state) {
      const addressFilter: any = {};
      // Exact match for city (case-insensitive)
      if (city) {
        addressFilter.city = { 
          $regex: new RegExp(`^${city.trim()}$`, 'i') 
        };
      }
      // Exact match for state (case-insensitive)
      if (state) {
        addressFilter.state = { 
          $regex: new RegExp(`^${state.trim()}$`, 'i') 
        };
      }
      
      const addresses = await RestaurantAddress.find(addressFilter)
        .select('restaurantId')
        .lean();
      
      restaurantIds = addresses.map(addr => addr.restaurantId);
      
      // If no addresses match, return empty result
      if (restaurantIds.length === 0) {
        return sendSuccess(
          {
            restaurants: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
            },
          },
          "No restaurants found in the specified location"
        );
      }
    }

    const filter: any = {};
    if (restaurantIds.length > 0) {
      filter._id = { $in: restaurantIds };
    }
    if (isActive) filter.isActive = isActive === "true";
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter)
        .skip(skip)
        .limit(limit)
        .select('name email phoneNumber description address cuisine rating isActive imageUrl createdAt')
        .sort({ rating: -1 })
        .lean(),
      Restaurant.countDocuments(filter),
    ]);

    // Fetch addresses for each restaurant
    const restaurantWithAddresses = await Promise.all(
      restaurants.map(async (restaurant) => {
        const address = await RestaurantAddress.findOne({ 
          restaurantId: restaurant._id 
        }).lean();
        
        return {
          ...restaurant,
          physicalAddress: address ? {
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            landmark: address.landmark,
          } : null,
        };
      })
    );

    return sendSuccess(
      {
        restaurants: restaurantWithAddresses,
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
      ERROR_CODES.DATABASE_ERROR,
      "Failed to fetch restaurants",
      undefined,
      500
    );
  }
}

export const GET = withLogging(GET_handler);

// POST /api/restaurants - Create a new restaurant
async function POST_handler(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(restaurantCreateSchema, body);
    if (!validationResult.success || !validationResult.data) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    const {
      name,
      email,
      phone,
      description,
      address,
      city,
      state,
      postalCode,
    } = validationResult.data;

    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({
      $or: [{ email }, { phoneNumber: phone }]
    });

    if (existingRestaurant) {
      return sendError(
        ERROR_CODES.RESOURCE_ALREADY_EXISTS,
        "Restaurant with this email or phone number already exists",
        undefined,
        409
      );
    }

    // Create restaurant
    const restaurant = await Restaurant.create({
      name,
      email,
      phoneNumber: phone,
      description,
      address,
      city,
      state,
      zipCode: postalCode,
    });

    return sendSuccess(restaurant, "Restaurant created successfully", 201);
  } catch (error) {
    logger.error("error_creating_restaurant", { error: String(error) });
    return sendError(
      ERROR_CODES.DATABASE_ERROR,
      "Failed to create restaurant",
      undefined,
      500
    );
  }
}

export const POST = withLogging(POST_handler);
