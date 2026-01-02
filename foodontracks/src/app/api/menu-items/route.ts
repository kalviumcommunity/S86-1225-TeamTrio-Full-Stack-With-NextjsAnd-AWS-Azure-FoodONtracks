import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// Mock menu items data for demo purposes
const mockMenuItems = [
  {
    id: 1,
    name: "Margherita Pizza",
    description: "Classic tomato and mozzarella",
    price: 12.99,
    category: "Pizza",
    available: true,
    restaurantId: 1,
  },
  {
    id: 2,
    name: "Chicken Burger",
    description: "Grilled chicken with lettuce and tomato",
    price: 9.99,
    category: "Burgers",
    available: true,
    restaurantId: 1,
  },
  {
    id: 3,
    name: "Caesar Salad",
    description: "Fresh romaine with caesar dressing",
    price: 8.5,
    category: "Salads",
    available: true,
    restaurantId: 1,
  },
  {
    id: 4,
    name: "Pasta Carbonara",
    description: "Creamy pasta with bacon",
    price: 14.99,
    category: "Pasta",
    available: false,
    restaurantId: 1,
  },
];

// GET /api/menu-items - Get all menu items
export const GET = withLogging(async () => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  logger.info("fetch_menu_items_mock", {});

  return NextResponse.json({
    data: mockMenuItems,
    total: mockMenuItems.length,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/menu-items - Create a new menu item
export const POST = withLogging(async (req: NextRequest) => {
  try {
    const body = await req.json();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newItem = {
      id: Date.now(),
      name: body.name,
      description: body.description || "",
      price: parseFloat(body.price),
      category: body.category || "New",
      available: body.available !== undefined ? body.available : true,
      restaurantId: body.restaurantId || 1,
    };

    mockMenuItems.push(newItem);

    logger.info("menu_item_created", { newItem });

    return NextResponse.json(
      {
        data: newItem,
        message: "Menu item created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("error_creating_menu_item", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
});
