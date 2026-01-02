/**
 * Users API Route
 *
 * Demonstrates RBAC implementation:
 * - GET: Requires 'read' permission on 'users' resource
 * - POST: Requires 'create' permission on 'users' resource
 * - PUT: Requires 'update' permission on 'users' resource
 * - DELETE: Requires 'delete' permission on 'users' resource (Admin only)
 */

import { NextResponse } from "next/server";
import { withRbac, AuthenticatedRequest } from "@/middleware/rbac";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

/**
 * GET /api/users
 *
 * Get list of users
 * Requires: 'read' permission on 'users' resource
 *
 * Access:
 * - ADMIN: ✅ Can view all users
 * - RESTAURANT_OWNER: ✅ Can view basic user info
 * - CUSTOMER: ✅ Can view their own profile
 */
export const GET = withRbac(
  async (request: AuthenticatedRequest) => {
    try {
      const user = request.user!;

      // If customer, only return their own data
      if (user.role === "CUSTOMER") {
        const userData = await prisma.user.findUnique({
          where: { id: user.userId },
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
            createdAt: true,
          },
        });

        return NextResponse.json({
          success: true,
          data: [userData], // Return as array for consistency
          total: 1,
          message: "Your profile data",
        });
      }

      // Admin and Restaurant Owner can see all users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          // Don't expose password
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        data: users,
        total: users.length,
      });
    } catch (error) {
      logger.error("users_api_get_error", { error: String(error) });
      return NextResponse.json(
        { success: false, error: "Failed to fetch users" },
        { status: 500 }
      );
    }
  },
  { resource: "users", permission: "read" }
);

/**
 * POST /api/users
 *
 * Create a new user
 * Requires: 'create' permission on 'users' resource
 *
 * Access:
 * - ADMIN: ✅ Can create any user
 * - RESTAURANT_OWNER: ❌ Cannot create users
 * - CUSTOMER: ❌ Cannot create users
 */
export const POST = withRbac(
  async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { name, email, phoneNumber, password, role } = body;

      // Validate required fields
      if (!name || !email || !password) {
        return NextResponse.json(
          { success: false, error: "Name, email, and password are required" },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "User with this email already exists" },
          { status: 409 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          phoneNumber: phoneNumber || null,
          password: hashedPassword,
          role: role || "CUSTOMER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: newUser,
          message: "User created successfully",
        },
        { status: 201 }
      );
    } catch (error) {
      logger.error("users_api_post_error", { error: String(error) });
      return NextResponse.json(
        { success: false, error: "Failed to create user" },
        { status: 500 }
      );
    }
  },
  { resource: "users", permission: "create" }
);

/**
 * PUT /api/users
 *
 * Update a user
 * Requires: 'update' permission on 'users' resource
 *
 * Access:
 * - ADMIN: ✅ Can update any user
 * - RESTAURANT_OWNER: ❌ Cannot update users
 * - CUSTOMER: ✅ Can update their own profile
 */
export const PUT = withRbac(
  async (request: AuthenticatedRequest) => {
    try {
      const user = request.user!;
      const body = await request.json();
      const { userId, name, phoneNumber } = body;

      // Customers can only update themselves
      if (user.role === "CUSTOMER" && userId !== user.userId) {
        return NextResponse.json(
          { success: false, error: "You can only update your own profile" },
          { status: 403 }
        );
      }

      if (!userId) {
        return NextResponse.json(
          { success: false, error: "User ID is required" },
          { status: 400 }
        );
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(phoneNumber && { phoneNumber }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: "User updated successfully",
      });
    } catch (error) {
      logger.error("users_api_put_error", { error: String(error) });
      return NextResponse.json(
        { success: false, error: "Failed to update user" },
        { status: 500 }
      );
    }
  },
  { resource: "users", permission: "update" }
);

/**
 * DELETE /api/users
 *
 * Delete a user
 * Requires: 'delete' permission on 'users' resource
 *
 * Access:
 * - ADMIN: ✅ Can delete any user
 * - RESTAURANT_OWNER: ❌ Cannot delete users
 * - CUSTOMER: ❌ Cannot delete users
 */
export const DELETE = withRbac(
  async (request: AuthenticatedRequest) => {
    try {
      const { searchParams } = request.nextUrl;
      const userId = searchParams.get("userId");

      if (!userId) {
        return NextResponse.json(
          { success: false, error: "User ID is required" },
          { status: 400 }
        );
      }

      // Delete user
      await prisma.user.delete({
        where: { id: parseInt(userId) },
      });

      return NextResponse.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      logger.error("users_api_delete_error", { error: String(error) });
      return NextResponse.json(
        { success: false, error: "Failed to delete user" },
        { status: 500 }
      );
    }
  },
  { resource: "users", permission: "delete" }
);
