import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import * as bcrypt from "bcrypt";

// GET /api/users - Get all users with pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const role = searchParams.get("role"); // Optional filter by role

    const skip = (page - 1) * limit;

    const where = role
      ? { role: role as "CUSTOMER" | "ADMIN" | "RESTAURANT_OWNER" }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // Exclude password from response
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return sendSuccess(
      {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Users fetched successfully"
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return sendError(
      "Failed to fetch users",
      ERROR_CODES.DATABASE_FAILURE,
      500,
      error
    );
  }
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phoneNumber, password, role } = body;

    // Validation
    if (!name || !email || !password) {
      return sendError(
        "Name, email, and password are required",
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        400
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber: phoneNumber || undefined }],
      },
    });

    if (existingUser) {
      return sendError(
        "User with this email or phone number already exists",
        ERROR_CODES.DUPLICATE_ENTRY,
        409
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phoneNumber,
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

    return sendSuccess(user, "User created successfully", 201);
  } catch (error) {
    console.error("Error creating user:", error);
    return sendError(
      "Failed to create user",
      ERROR_CODES.DATABASE_FAILURE,
      500,
      error
    );
  }
}
