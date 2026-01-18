import { NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Review } from '@/models/Review';
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
    };

    if (decoded.role !== UserRole.DELIVERY_GUY) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Delivery person access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Fetch reviews from Review collection for this delivery person
    const reviews = await Review.find({
      deliveryGuyId: decoded.userId,
      deliveryRating: { $exists: true, $ne: null },
      isPublished: true,
    })
      .populate('customerId', 'name')
      .populate('orderId', 'items orderNumber batchNumber totalAmount createdAt deliveryAddress')
      .populate('restaurantId', 'name')
      .sort({ deliveryRatedAt: -1 })
      .lean();

    // Transform to match expected format
    interface PopulatedReview {
      _id: unknown;
      customerId?: { name?: string };
      restaurantId?: { name?: string };
      orderId?: {
        items?: Array<{ name: string; quantity: number }>;
        orderNumber?: string;
        totalAmount?: number;
        createdAt?: Date;
        deliveryAddress?: string;
      };
      orderNumber?: string;
      batchNumber?: string;
      totalAmount?: number;
      deliveryRating?: number;
      deliveryComment?: string;
      comment?: string;
      deliveryRatedAt?: Date;
      updatedAt?: Date;
      createdAt?: Date;
    }

    const transformedReviews = (reviews as PopulatedReview[]).map((review) => ({
      _id: review._id,
      orderNumber: review.orderNumber || review.orderId?.orderNumber,
      batchNumber: review.batchNumber,
      customerId: {
        name: review.customerId?.name || 'Customer',
      },
      restaurantId: {
        name: review.restaurantId?.name || 'Restaurant',
      },
      totalAmount: review.totalAmount || review.orderId?.totalAmount || 0,
      deliveryAddress: review.orderId?.deliveryAddress,
      createdAt: review.orderId?.createdAt || review.createdAt,
      ratings: {
        delivery: {
          rating: review.deliveryRating,
          comment: review.deliveryComment || review.comment || '',
          ratedAt: review.deliveryRatedAt || review.updatedAt || review.createdAt,
        },
      },
      items: review.orderId?.items || [],
    }));

    logger.info('delivery_reviews_fetched', {
      context: {
        deliveryPersonId: decoded.userId,
        reviewCount: reviews.length,
      }
    });

    return NextResponse.json({
      success: true,
      reviews: transformedReviews,
    });
  } catch (error) {
    logger.error('fetch_delivery_reviews_error', error as Error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
