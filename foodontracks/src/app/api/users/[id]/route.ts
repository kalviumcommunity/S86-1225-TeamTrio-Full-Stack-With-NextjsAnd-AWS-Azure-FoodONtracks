import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";

export const runtime = "nodejs";
import { userUpdateSchema } from "@/lib/schemas/userSchema";
import { handleError, AppError, ErrorType } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/users/[id] - Get a specific user by ID

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      throw new AppError(ErrorType.NOT_FOUND_ERROR, 404, "User not found", { userId: id });
    }

    logger.info("User retrieved", { userId: id });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return handleError(error, `GET /api/users/[id]`);
  }
}

// PUT /api/users/[id] - Update a user
export const PUT = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // Validate input using Zod schema
    const validatedData = userUpdateSchema.parse(body);

    // Check if user exists
    const existingUser = await User.findById(id);

    if (!existingUser) {
      throw new AppError(ErrorType.NOT_FOUND_ERROR, 404, "User not found", { userId: id });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true }
    ).select('-password');

    logger.info("User updated successfully", {
      userId: id,
      context: { updatedFields: Object.keys(validatedData) }
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    return handleError(error, `PUT /api/users/[id]`);
  }
});

// DELETE /api/users/[id] - Delete a user

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete user (cascade will handle related records)
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new AppError(ErrorType.NOT_FOUND_ERROR, 404, "User not found", {
        userId: id,
      });
    }

    logger.info("User deleted", { userId: id });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return handleError(error, `DELETE /api/users/[id]`);
  }
}
