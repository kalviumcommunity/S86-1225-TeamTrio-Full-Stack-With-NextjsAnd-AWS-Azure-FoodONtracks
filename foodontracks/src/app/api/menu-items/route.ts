import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";
import dbConnect from "@/lib/mongodb";
import { MenuItem } from "@/models/MenuItem";

export const runtime = "nodejs";

// GET /api/menu-items - Get all menu items or by restaurantId
export const GET = withLogging(async (req: NextRequest) => {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const category = searchParams.get("category");
    const isAvailable = searchParams.get("isAvailable");

    const filter: any = {};
    if (restaurantId) filter.restaurantId = restaurantId;
    if (category) filter.category = category;
    if (isAvailable !== null && isAvailable !== undefined) {
      filter.isAvailable = isAvailable === "true";
    }

    const menuItems = await MenuItem.find(filter)
      .sort({ category: 1, name: 1 })
      .lean();

    logger.info("fetch_menu_items", { 
      context: {
        restaurantId, 
        count: menuItems.length
      }
    });

    return NextResponse.json({
      data: menuItems,
      total: menuItems.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("error_fetching_menu_items", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
});

// POST /api/menu-items - Create a new menu item
export const POST = withLogging(async (req: NextRequest) => {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.price || !body.restaurantId) {
      return NextResponse.json(
        { 
          success: false,
          error: "Missing required fields: name, price, and restaurantId are required" 
        },
        { status: 400 }
      );
    }

    // Validate price
    const price = parseFloat(body.price);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid price. Price must be a positive number" 
        },
        { status: 400 }
      );
    }

    const newItem = await MenuItem.create({
      name: body.name,
      description: body.description || "",
      price: price,
      category: body.category || "Uncategorized",
      isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
      restaurantId: body.restaurantId,
      imageUrl: body.imageUrl,
      imagePublicId: body.imagePublicId,
    });

    logger.info("menu_item_created", { context: { menuItemId: newItem._id } });

    return NextResponse.json(
      {
        success: true,
        data: newItem,
        message: "Menu item created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error("error_creating_menu_item", { 
      context: {
        error: String(error),
        message: error.message,
        stack: error.stack
      }
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create menu item",
        details: error.message 
      },
      { status: 500 }
    );
  }
});
