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
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
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
      await dbConnect();
      const user = request.user!;

      // If customer, only return their own data
      if (user.role === "CUSTOMER") {
        const userData = await User.findById(user.userId).select(
          'name email phoneNumber role createdAt'
        );

        return NextResponse.json({
          success: true,
          data: [userData], // Return as array for consistency
          total: 1,
          message: "Your profile data",
        });
      }

      // Admin and Restaurant Owner can see all users
      const users = await User.find()
        .select('-password')
        .sort({ createdAt: -1 });

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
      await dbConnect();
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
      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "User with this email already exists" },
          { status: 409 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        phoneNumber: phoneNumber || undefined,
        password: hashedPassword,
        role: role || "user",
      });

      const userResponse: any = newUser.toObject();
      delete userResponse.password;

      return NextResponse.json(
        {
          success: true,
          data: userResponse,
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
      await dbConnect();
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

      const updateData: any = {};
      if (name) updateData.name = name;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true }
      ).select('-password');

      if (!updatedUser) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

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
      await dbConnect();
      const { searchParams } = request.nextUrl;
      const userId = searchParams.get("userId");

      if (!userId) {
        return NextResponse.json(
          { success: false, error: "User ID is required" },
          { status: 400 }
        );
      }

      // Delete user
      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

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
