import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";
import dbConnect from "@/lib/mongodb";
import { MenuItem } from "@/models/MenuItem";

// GET /api/menu-items/[id]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const menuItem = await MenuItem.findById(id).lean();

    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    logger.info("fetch_menu_item", { context: { menuItemId: id } });

    return NextResponse.json({ data: menuItem });
  } catch (error) {
    logger.error("error_fetching_menu_item", { error: String(error) });
    return NextResponse.json(
      { error: "Failed to fetch menu item" },
      { status: 500 }
    );
  }
}

// PATCH /api/menu-items/[id]
export const PATCH = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedMenuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    logger.info("update_menu_item", { context: { menuItemId: id, updates: Object.keys(body) } });

    return NextResponse.json({
      message: "Menu item updated successfully",
      data: updatedMenuItem,
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
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true, overwrite: true }
    );

    if (!updatedMenuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    logger.info("update_menu_item_put", { context: { menuItemId: id } });

    return NextResponse.json({
      message: "Menu item updated successfully",
      data: updatedMenuItem,
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedMenuItem = await MenuItem.findByIdAndDelete(id);

    if (!deletedMenuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    logger.info("delete_menu_item", { context: { menuItemId: id } });

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
}
