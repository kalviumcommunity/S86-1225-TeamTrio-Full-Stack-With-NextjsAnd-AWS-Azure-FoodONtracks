import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReviewSchema } from "@/lib/schemas/reviewSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import { withLogging } from "@/lib/requestLogger";

// GET /api/reviews - Get all reviews with pagination
async function GET_handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const restaurantId = searchParams.get("restaurantId");
    const userId = searchParams.get("userId");
    const minRating = searchParams.get("minRating");

    const skip = (page - 1) * limit;

    const where: {
      restaurantId?: number;
      userId?: number;
      rating?: { gte: number };
    } = {};
    if (restaurantId) where.restaurantId = parseInt(restaurantId);
    if (userId) where.userId = parseInt(userId);
    if (minRating) where.rating = { gte: parseInt(minRating) };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where }),
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
    const body = await req.json();

    // Validate input using Zod schema
    const validationResult = validateData(createReviewSchema, body);
    if (!validationResult.success) {
      return NextResponse.json(validationResult, { status: 400 });
    }

    const { userId, restaurantId, orderId, rating, comment } = validationResult.data;

    // Check if order exists and is delivered
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Can only review delivered orders" },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { orderId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Review already exists for this order" },
        { status: 409 }
      );
    }

    // Create review and update restaurant rating
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          userId,
          restaurantId,
          orderId,
          rating,
          comment,
        },
      });

      // Update restaurant average rating
      const avgRating = await tx.review.aggregate({
        where: { restaurantId },
        _avg: { rating: true },
      });

      await tx.restaurant.update({
        where: { id: restaurantId },
        data: { rating: avgRating._avg.rating || 0 },
      });

      return newReview;
    });

    return NextResponse.json(
      { message: "Review created successfully", data: review },
      { status: 201 }
    );
  } catch (error) {
    logger.error("error_creating_review", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

export const POST = withLogging(POST_handler);
