import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';

export const runtime = "nodejs";
import { User } from '@/models/User';
import { Restaurant } from '@/models/Restaurant';
import { Order } from '@/models/Order';
import { Batch } from '@/models/Batch';
import { Review } from '@/models/Review';
import { DeliveryAgent } from '@/models/DeliveryAgent';
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
    };

    if (decoded.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Get summary stats
    const [
      totalUsers,
      totalRestaurants,
      totalOrders,
      totalBatches,
      totalReviews,
      activeDeliveryAgents,
      pendingBatches,
      flaggedReviews,
    ] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments(),
      Order.countDocuments(),
      Batch.countDocuments(),
      Review.countDocuments(),
      DeliveryAgent.countDocuments({ isActive: true, isAvailable: true }),
      Batch.countDocuments({ status: { $nin: ['DELIVERED', 'CANCELLED'] } }),
      Review.countDocuments({ isFlagged: true }),
    ]);

    // Get recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const [recentOrders, recentBatches, recentReviews] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: yesterday } }),
      Batch.countDocuments({ createdAt: { $gte: yesterday } }),
      Review.countDocuments({ createdAt: { $gte: yesterday } }),
    ]);

    // Role breakdown
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    return NextResponse.json({
      summary: {
        totalUsers,
        totalRestaurants,
        totalOrders,
        totalBatches,
        totalReviews,
        activeDeliveryAgents,
        pendingBatches,
        flaggedReviews,
      },
      recentActivity: {
        recentOrders,
        recentBatches,
        recentReviews,
      },
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Error fetching admin summary:', error);
    return NextResponse.json(
      { message: 'Failed to fetch admin summary' },
      { status: 500 }
    );
  }
}
