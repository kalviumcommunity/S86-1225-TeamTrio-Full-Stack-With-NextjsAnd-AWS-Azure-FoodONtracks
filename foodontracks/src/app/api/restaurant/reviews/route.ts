import { NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { User } from '@/models/User';
import { logger } from '@/lib/logger';
import { UserRole } from '@/types/user';

export const runtime = "nodejs";
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      restaurantId?: string;
    };

    if (decoded.role !== UserRole.RESTAURANT_OWNER) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Restaurant owner access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Get restaurantId from token or user
    let restaurantId = decoded.restaurantId;
    if (!restaurantId) {
      const user = await User.findById(decoded.userId).select('restaurantId').lean();
      restaurantId = user?.restaurantId?.toString();
    }

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, message: 'No restaurant associated with this account' },
        { status: 400 }
      );
    }

    // Fetch reviews from Review collection for this restaurant
    const reviews = await Review.find({
      restaurantId: restaurantId,
      restaurantRating: { $exists: true, $ne: null },
      isPublished: true,
    })
      .populate('customerId', 'name')
      .populate('orderId', 'items orderNumber batchNumber totalAmount createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    logger.info('restaurant_reviews_query', {
      context: {
        restaurantId: restaurantId,
        foundReviews: reviews.length,
      }
    });

    // Transform to match expected format
    interface PopulatedReview {
      _id: unknown;
      customerId?: { name?: string };
      orderId?: { 
        items?: Array<{ name: string; quantity: number }>;
        orderNumber?: string;
        totalAmount?: number;
        createdAt?: Date;
      };
      orderNumber?: string;
      batchNumber?: string;
      totalAmount?: number;
      restaurantRating?: number;
      restaurantComment?: string;
      comment?: string;
      restaurantRatedAt?: Date;
      updatedAt?: Date;
      createdAt?: Date;
    }

    const transformedReviews = (reviews as PopulatedReview[]).map((review) => {
      // Handle case where orderId might not be populated
      const orderData = review.orderId || {};
      const items = orderData.items || [];
      
      return {
        _id: review._id,
        orderNumber: review.orderNumber || orderData.orderNumber || review.batchNumber,
        batchNumber: review.batchNumber,
        userId: {
          name: review.customerId?.name || 'Customer',
        },
        totalAmount: review.totalAmount || orderData.totalAmount || 0,
        createdAt: orderData.createdAt || review.createdAt,
        ratings: {
          restaurant: {
            rating: review.restaurantRating,
            comment: review.restaurantComment || review.comment || '',
            ratedAt: review.restaurantRatedAt || review.updatedAt || review.createdAt,
          },
        },
        items: items,
      };
    });

    logger.info('restaurant_reviews_fetched', {
      context: {
        restaurantId: restaurantId,
        reviewCount: reviews.length,
      }
    });

    return NextResponse.json({
      success: true,
      reviews: transformedReviews,
    });
  } catch (error) {
    logger.error('fetch_restaurant_reviews_error', error as Error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
