import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';

export const runtime = "nodejs";
import { Order } from '@/models/Order';
import { Batch } from '@/models/Batch';
import { Review } from '@/models/Review';
import { UserRole } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(req: NextRequest) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      restaurantId?: string;
    };

    if (decoded.role !== UserRole.RESTAURANT_OWNER) {
      return NextResponse.json({ message: 'Forbidden - Restaurant owner access required' }, { status: 403 });
    }

    await dbConnect();

    // If no restaurantId in token, fetch from user
    let restaurantId = decoded.restaurantId;
    if (!restaurantId) {
      const { User } = await import('@/models/User');
      const user = await User.findById(decoded.userId).select('restaurantId').lean();
      restaurantId = user?.restaurantId?.toString();
    }

    if (!restaurantId) {
      return NextResponse.json({ 
        totalOrders: 0,
        todayOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalBatches: 0,
        activeBatches: 0,
        totalReviews: 0,
        averageRating: '0.0',
      }, { status: 200 });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get stats
    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      totalBatches,
      activeBatches,
      totalReviews,
      averageRating,
    ] = await Promise.all([
      Order.countDocuments({ restaurantId }),
      Order.countDocuments({
        restaurantId,
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      Order.countDocuments({
        restaurantId,
        orderStatus: { $in: ['PENDING', 'PREPARING'] },
      }),
      Order.countDocuments({
        restaurantId,
        orderStatus: 'DELIVERED',
        updatedAt: { $gte: today, $lt: tomorrow },
      }),
      Batch.countDocuments({ restaurantId }),
      Batch.countDocuments({
        restaurantId,
        status: { $nin: ['DELIVERED', 'CANCELLED'] },
      }),
      Review.countDocuments({ restaurantId }),
      Review.aggregate([
        { $match: { restaurantId, isPublished: true } },
        { $group: { _id: null, avgRating: { $avg: '$overallRating' } } },
      ]),
    ]);

    return NextResponse.json({
      totalOrders,
      todayOrders,
      pendingOrders,
      completedOrders,
      totalBatches,
      activeBatches,
      totalReviews,
      averageRating: averageRating[0]?.avgRating?.toFixed(1) || '0.0',
    });
  } catch (error) {
    console.error('Error fetching restaurant stats:', error);
    return NextResponse.json(
      { message: 'Failed to fetch restaurant stats' },
      { status: 500 }
    );
  }
}
