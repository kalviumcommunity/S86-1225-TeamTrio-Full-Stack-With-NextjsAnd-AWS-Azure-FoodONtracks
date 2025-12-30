import { NextRequest, NextResponse } from "next/server";
import { sanitizeStrictInput } from "@/utils/sanitize";

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
export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  console.log("📡 Fetching menu items from mock data");

  return NextResponse.json({
    data: mockMenuItems,
    total: mockMenuItems.length,
    timestamp: new Date().toISOString(),
  });
}

// POST /api/menu-items - Create a new menu item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Sanitize text inputs to prevent XSS
    const sanitizedName = sanitizeStrictInput(body.name || "");
    const sanitizedDescription = sanitizeStrictInput(body.description || "");
    const sanitizedCategory = sanitizeStrictInput(body.category || "New");

    const newItem = {
      id: Date.now(),
      name: sanitizedName,
      description: sanitizedDescription,
      price: parseFloat(body.price),
      category: sanitizedCategory,
      available: body.available !== undefined ? body.available : true,
      restaurantId: body.restaurantId || 1,
    };

    mockMenuItems.push(newItem);

    console.log("✅ Created new menu item:", newItem);

    return NextResponse.json(
      {
        data: newItem,
        message: "Menu item created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}
