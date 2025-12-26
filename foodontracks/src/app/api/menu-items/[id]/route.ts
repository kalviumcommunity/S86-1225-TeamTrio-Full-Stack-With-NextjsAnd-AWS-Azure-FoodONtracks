import { NextRequest, NextResponse } from "next/server";

// Mock implementation for SWR demo

// GET /api/menu-items/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    console.log("📡 Fetching menu item:", menuItemId);

    return NextResponse.json({ data: mockItem });
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu item" },
      { status: 500 }
    );
  }
}

// PATCH /api/menu-items/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    console.log("🔄 Updating menu item:", menuItemId, body);

    return NextResponse.json({
      message: "Menu item updated successfully",
      data: { id: menuItemId, ...body },
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// PUT /api/menu-items/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    console.log("🔄 Updating menu item (PUT):", menuItemId, body);

    return NextResponse.json({
      message: "Menu item updated successfully",
      data: { id: menuItemId, ...body },
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE /api/menu-items/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    console.log("🗑️ Deleting menu item:", menuItemId);

    return NextResponse.json({
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
