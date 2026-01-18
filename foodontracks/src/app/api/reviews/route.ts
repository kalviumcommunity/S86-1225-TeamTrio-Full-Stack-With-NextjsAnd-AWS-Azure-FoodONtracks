import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";

export const runtime = "nodejs";
import { Review } from "@/models/Review";
import { Order } from "@/models/Order";
import { Restaurant } from "@/models/Restaurant";
import { reviewSchema } from "@/lib/schemas/reviewSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import { withLogging } from "@/lib/requestLogger";
import { extractAuthUser } from "@/lib/apiAuth";

// GET /api/reviews - Get all reviews with pagination
async function GET_handler(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const restaurantId = searchParams.get("restaurantId");
    const userId = searchParams.get("userId");
    const minRating = searchParams.get("minRating");

    const skip = (page - 1) * limit;

    const filter: any = {};
    if (restaurantId) filter.restaurantId = restaurantId;
    if (userId) filter.userId = userId;
    if (minRating) filter.rating = { $gte: parseInt(minRating) };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Review.countDocuments(filter),
    ]);

    return NextResponse.json({
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("error_fetching_reviews", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
export const GET = withLogging(GET_handler);

// POST /api/reviews - Create a review
async function POST_handler(req: NextRequest) {
  try {
    await dbConnect();
    
    // Verify authentication
    const user = extractAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(reviewSchema, body);
    if (!validationResult.success || !validationResult.data) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    const { userId, restaurantId, orderId, rating, comment } =
      validationResult.data;

    // Verify the authenticated user is the same as the userId in the request
    if (user.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - Cannot submit review for another user" },
        { status: 403 }
      );
    }

    // Check if order exists and is delivered
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify order belongs to the user
    if (order.userId.toString() !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - This order does not belong to you" },
        { status: 403 }
      );
    }

    // Fix: Check status case-insensitively
    if (order.status.toLowerCase() !== "delivered") {
      return NextResponse.json(
        { error: "Can only review delivered orders" },
        { status: 400 }
      );
    }

    // Verify order was from the specified restaurant
    if (order.restaurantId.toString() !== restaurantId) {
      return NextResponse.json(
        { error: "Order is not from the specified restaurant" },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ orderId });

    if (existingReview) {
      return NextResponse.json(
        { error: "Review already exists for this order" },
        { status: 409 }
      );
    }

    // Create review and update restaurant rating using transaction
    const session = await mongoose.startSession();
    let review;
    
    try {
      await session.withTransaction(async () => {
        // Create review with proper fields
        const [newReview] = await Review.create([{
          customerId: userId,
          restaurantId,
          orderId,
          batchNumber: order.batchNumber,
          restaurantRating: rating,
          restaurantComment: comment,
          restaurantRatedAt: new Date(),
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          isVerified: true,
          isPublished: true,
          isFlagged: false,
        }], { session });
        
        review = newReview;

        // Update Order.ratings for consistency
        await Order.findByIdAndUpdate(
          orderId,
          {
            $set: {
              'ratings.restaurant.rating': rating,
              'ratings.restaurant.comment': comment,
              'ratings.restaurant.ratedAt': new Date(),
            }
          },
          { session }
        );

        // Calculate new restaurant average rating from restaurantRating field
        const result = await Review.aggregate([
          { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId), restaurantRating: { $exists: true, $ne: null } } },
          { $group: { _id: null, avgRating: { $avg: "$restaurantRating" } } }
        ]).session(session);

        const avgRating = result[0]?.avgRating || 0;

        // Update restaurant rating
        await Restaurant.findByIdAndUpdate(
          restaurantId,
          { $set: { rating: avgRating } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    logger.info('review_created', { 
      context: { 
        userId, 
        restaurantId, 
        orderId, 
        rating 
      } 
    });

    return NextResponse.json(
      { message: "Review created successfully", data: review },
      { status: 201 }
    );
  } catch (error) {
    logger.error('error_creating_review', { 
      context: { 
        error: error instanceof Error ? error.message : String(error) 
      } 
    });
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

export const POST = withLogging(POST_handler);
