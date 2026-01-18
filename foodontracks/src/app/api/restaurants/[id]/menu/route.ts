import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/app/lib/jwtService';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { MenuItem } from '@/models/MenuItem';
import { Restaurant } from '@/models/Restaurant';
import { UserRole } from '@/types/user';
import { logger } from '@/lib/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/restaurants/[id]/menu - Get menu items for a restaurant
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id: restaurantId } = await params;

    const menuItems = await MenuItem.find({ restaurantId })
      .sort({ category: 1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: menuItems,
      total: menuItems.length,
    });
  } catch (error) {
    logger.error('fetch_menu_error', { error: String(error) });
    return NextResponse.json(
      { success: false, message: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

// POST /api/restaurants/[id]/menu - Add menu item (Restaurant Owner only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: restaurantId } = await params;

    // Verify restaurant owner
    if (decoded.role === UserRole.RESTAURANT_OWNER) {
      if (decoded.restaurantId !== restaurantId) {
        return NextResponse.json(
          { message: 'You can only add items to your own restaurant' },
          { status: 403 }
        );
      }
    } else if (decoded.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { message: 'Forbidden - Restaurant owner or admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    // Verify restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { message: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, description, price, category, imageUrl, imagePublicId, isAvailable } = body;

    if (!name || !price) {
      return NextResponse.json(
        { message: 'Name and price are required' },
        { status: 400 }
      );
    }

    const menuItem = await MenuItem.create({
      restaurantId,
      name,
      description: description || '',
      price: parseFloat(price),
      category: category || 'Uncategorized',
      imageUrl,
      imagePublicId,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    logger.info('menu_item_created', {
      context: {
        menuItemId: menuItem._id,
        restaurantId,
        createdBy: decoded.userId,
      }
    });

    return NextResponse.json({
      success: true,
      data: menuItem,
      message: 'Menu item added successfully',
    }, { status: 201 });
  } catch (error) {
    logger.error('create_menu_item_error', { error: String(error) });
    return NextResponse.json(
      { success: false, message: 'Failed to add menu item' },
      { status: 500 }
    );
  }
}

// DELETE /api/restaurants/[id]/menu?itemId=xxx - Delete menu item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: restaurantId } = await params;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { message: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Verify authorization
    if (decoded.role === UserRole.RESTAURANT_OWNER) {
      if (decoded.restaurantId !== restaurantId) {
        return NextResponse.json(
          { message: 'You can only delete items from your own restaurant' },
          { status: 403 }
        );
      }
    } else if (decoded.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { message: 'Forbidden - Restaurant owner or admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const deletedItem = await MenuItem.findOneAndDelete({
      _id: itemId,
      restaurantId,
    });

    if (!deletedItem) {
      return NextResponse.json(
        { message: 'Menu item not found' },
        { status: 404 }
      );
    }

    logger.info('menu_item_deleted', {
      context: {
        menuItemId: itemId,
        restaurantId,
        deletedBy: decoded.userId,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    logger.error('delete_menu_item_error', { error: String(error) });
    return NextResponse.json(
      { success: false, message: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
