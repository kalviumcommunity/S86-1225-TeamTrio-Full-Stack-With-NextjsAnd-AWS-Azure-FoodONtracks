import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// Mock implementation for SWR demo

// GET /api/menu-items/[id]
export const GET = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const menuItemId = parseInt(id);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (isNaN(menuItemId)) {
      return NextResponse.json(
        { error: "Invalid menu item ID" },
        { status: 400 }
      );
    }

    // Mock data
    const mockItem = {
      id: menuItemId,
      name: "Sample Item",
      description: "Sample description",
      price: 10.99,
      category: "Sample",
      available: true,
    };

    logger.info("fetch_menu_item", { menuItemId });

    return NextResponse.json({ data: mockItem });
  } catch (error) {
    logger.error("error_fetching_menu_item", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch menu item" },
      { status: 500 }
    );
  }
});

// PATCH /api/menu-items/[id]
export const PATCH = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const menuItemId = parseInt(id);
    const body = await req.json();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (isNaN(menuItemId)) {
      return NextResponse.json(
        { error: "Invalid menu item ID" },
        { status: 400 }
      );
    }

    logger.info("update_menu_item", { menuItemId, body });

    return NextResponse.json({
      message: "Menu item updated successfully",
      data: { id: menuItemId, ...body },
    });
  } catch (error) {
    logger.error("error_updating_menu_item", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
});

// PUT /api/menu-items/[id]
export const PUT = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const menuItemId = parseInt(id);
    const body = await req.json();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (isNaN(menuItemId)) {
      return NextResponse.json(
        { error: "Invalid menu item ID" },
        { status: 400 }
      );
    }

    logger.info("update_menu_item_put", { menuItemId, body });

    return NextResponse.json({
      message: "Menu item updated successfully",
      data: { id: menuItemId, ...body },
    });
  } catch (error) {
    logger.error("error_updating_menu_item_put", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
});

// DELETE /api/menu-items/[id]
export const DELETE = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const menuItemId = parseInt(id);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (isNaN(menuItemId)) {
      return NextResponse.json(
        { error: "Invalid menu item ID" },
        { status: 400 }
      );
    }

    logger.info("delete_menu_item", { menuItemId });

    return NextResponse.json({
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    logger.error("error_deleting_menu_item", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
});
