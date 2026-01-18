import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Review } from '@/models/Review';
import { logger } from '@/lib/logger';
import { extractAuthUser } from '@/lib/apiAuth';

// GET existing rating for an order
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Verify authentication
    const user = extractAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const customerId = user.userId;
    const { id } = await params;

    // Get the order
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to the customer
    if (order.userId.toString() !== customerId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - This is not your order' },
        { status: 403 }
      );
    }

    // Find existing review
    const existingReview = await Review.findOne({ orderId: order._id }).lean();

    if (!existingReview) {
      return NextResponse.json({
        success: true,
        hasReview: false,
        review: null,
      });
    }

    return NextResponse.json({
      success: true,
      hasReview: true,
      review: {
        _id: existingReview._id,
        restaurantRating: existingReview.restaurantRating,
        restaurantComment: existingReview.restaurantComment,
        restaurantRatedAt: existingReview.restaurantRatedAt,
        deliveryRating: existingReview.deliveryRating,
        deliveryComment: existingReview.deliveryComment,
        deliveryRatedAt: existingReview.deliveryRatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching rating:', error);
    logger.error('rating_fetch_error', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch rating',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Verify authentication
    const user = extractAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const customerId = user.userId;

    const { id } = await params;
    const body = await req.json();
    
    // Support both direct fields and ratingType-based submission
    const { ratingType, rating, comment } = body;
    let { restaurantRating, restaurantComment, deliveryRating, deliveryComment } = body;

    // If using ratingType format, map to specific fields
    if (ratingType === 'restaurant' && rating) {
      restaurantRating = rating;
      restaurantComment = comment || '';
    } else if (ratingType === 'delivery' && rating) {
      deliveryRating = rating;
      deliveryComment = comment || '';
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Validate ratings if provided
    if (restaurantRating !== undefined && restaurantRating !== null && (restaurantRating < 1 || restaurantRating > 5)) {
      return NextResponse.json(
        { success: false, message: 'Restaurant rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (deliveryRating !== undefined && deliveryRating !== null && (deliveryRating < 1 || deliveryRating > 5)) {
      return NextResponse.json(
        { success: false, message: 'Delivery rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Require at least one rating
    if (!restaurantRating && !deliveryRating) {
      return NextResponse.json(
        { success: false, message: 'Please provide at least one rating' },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to the customer
    if (order.userId.toString() !== customerId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - This is not your order' },
        { status: 403 }
      );
    }

    // Check if order is delivered
    if (order.status.toLowerCase() !== 'delivered') {
      return NextResponse.json(
        { success: false, message: 'Can only rate delivered orders' },
        { status: 400 }
      );
    }

    // Update order with ratings (keep for backward compatibility)
    const updateData: Record<string, number | string | Date> = {};

    if (restaurantRating) {
      updateData['ratings.restaurant.rating'] = restaurantRating;
      if (restaurantComment) {
        updateData['ratings.restaurant.comment'] = restaurantComment;
      }
      updateData['ratings.restaurant.ratedAt'] = new Date();
    }

    if (deliveryRating) {
      updateData['ratings.delivery.rating'] = deliveryRating;
      if (deliveryComment) {
        updateData['ratings.delivery.comment'] = deliveryComment;
      }
      updateData['ratings.delivery.ratedAt'] = new Date();
    }

    await Order.findByIdAndUpdate(id, { $set: updateData });

    // Save to Review collection
    const reviewUpdateData: Record<string, number | string | Date> = {};

    if (restaurantRating) {
      reviewUpdateData.restaurantRating = restaurantRating;
      reviewUpdateData.restaurantComment = restaurantComment || '';
      reviewUpdateData.restaurantRatedAt = new Date();
    }

    if (deliveryRating) {
      reviewUpdateData.deliveryRating = deliveryRating;
      reviewUpdateData.deliveryComment = deliveryComment || '';
      reviewUpdateData.deliveryRatedAt = new Date();
    }

    // Try to find and update existing review
    const existingReview = await Review.findOne({ orderId: order._id });

    if (existingReview) {
      // Update existing review - only update the fields being submitted
      await Review.findByIdAndUpdate(
        existingReview._id,
        { $set: reviewUpdateData },
        { new: true }
      );
    } else {
      // Create new review with all required fields
      const newReviewData = {
        customerId: customerId,
        orderId: order._id,
        batchNumber: order.batchNumber,
        restaurantId: order.restaurantId,
        deliveryGuyId: order.deliveryPersonId,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        isVerified: true,
        isPublished: true,
        isFlagged: false,
        ...reviewUpdateData,
      };
      
      await Review.create(newReviewData);
    }

    logger.info('order_rated', {
      context: {
        orderId: id,
        customerId,
        hasRestaurantRating: !!restaurantRating,
        restaurantRatingValue: restaurantRating || null,
        hasDeliveryRating: !!deliveryRating,
        deliveryRatingValue: deliveryRating || null,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully',
    });
  } catch (error) {
    console.error('Rating submission error:', error);
    logger.error('rating_submission_error', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit rating',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE rating
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Verify authentication
    const user = extractAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const customerId = user.userId;
    const { id } = await params;

    // Get the order
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to the customer
    if (order.userId.toString() !== customerId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - This is not your order' },
        { status: 403 }
      );
    }

    // Delete review
    const deletedReview = await Review.findOneAndDelete({ 
      orderId: order._id,
      customerId: customerId 
    });

    if (!deletedReview) {
      return NextResponse.json(
        { success: false, message: 'No rating found to delete' },
        { status: 404 }
      );
    }

    // Clear ratings from order
    await Order.findByIdAndUpdate(id, { 
      $unset: { 
        'ratings.restaurant': 1,
        'ratings.delivery': 1 
      } 
    });

    logger.info('rating_deleted', {
      context: {
        orderId: id,
        customerId,
        reviewId: deletedReview._id.toString(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    console.error('Rating deletion error:', error);
    logger.error('rating_deletion_error', error as Error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete rating',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
