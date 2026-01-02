import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/schemas/userSchema";
import { handleError, AppError, ErrorType } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";

// GET /api/users/[id] - Get a specific user by ID
export const GET = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        400,
        'Invalid user ID format',
        { providedId: id }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          select: {
            id: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            zipCode: true,
            isDefault: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(
        ErrorType.NOT_FOUND_ERROR,
        404,
        'User not found',
        { userId }
      );
    }

    logger.info('User retrieved', { userId });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return handleError(error, `GET /api/users/[id]`);
  }
});

// PUT /api/users/[id] - Update a user
export const PUT = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        400,
        'Invalid user ID format',
        { providedId: id }
      );
    }

    const body = await req.json();

    // Validate input using Zod schema
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError(
        ErrorType.NOT_FOUND_ERROR,
        404,
        'User not found',
        { userId }
      );
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        updatedAt: true,
      },
    });

    logger.info('User updated successfully', {
      userId,
      updatedFields: Object.keys(validatedData),
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
export const DELETE = withLogging(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new AppError(
        ErrorType.VALIDATION_ERROR,
        400,
        'Invalid user ID format',
        { providedId: id }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError(
        ErrorType.NOT_FOUND_ERROR,
        404,
        'User not found',
        { userId }
      );
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info('User deleted', { userId });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return handleError(error, `DELETE /api/users/[id]`);
  }
});
