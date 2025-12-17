# API Response Handler - Quick Reference Guide

## 📖 Quick Start

### Import the handlers
```typescript
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
```

---

## ✅ Success Responses

### Basic Success Response
```typescript
export async function GET() {
  const data = await fetchData();
  return sendSuccess(data, "Data fetched successfully");
}
```

### Success with Custom Status Code
```typescript
export async function POST(req: Request) {
  const newItem = await createItem(data);
  return sendSuccess(newItem, "Item created successfully", 201);
}
```

### Success with Pagination
```typescript
export async function GET(req: NextRequest) {
  const { items, total, page, limit } = await fetchWithPagination();
  
  return sendSuccess(
    {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    },
    "Items fetched successfully"
  );
}
```

---

## ❌ Error Responses

### Validation Error (400)
```typescript
if (!name || !email) {
  return sendError(
    "Name and email are required",
    ERROR_CODES.MISSING_REQUIRED_FIELD,
    400
  );
}
```

### Not Found Error (404)
```typescript
const user = await prisma.user.findUnique({ where: { id } });

if (!user) {
  return sendError(
    "User not found",
    ERROR_CODES.USER_NOT_FOUND,
    404
  );
}
```

### Duplicate Entry Error (409)
```typescript
const existing = await prisma.user.findUnique({ where: { email } });

if (existing) {
  return sendError(
    "User with this email already exists",
    ERROR_CODES.DUPLICATE_ENTRY,
    409
  );
}
```

### Database Error (500)
```typescript
try {
  const result = await prisma.user.create({ data });
  return sendSuccess(result, "User created successfully", 201);
} catch (error) {
  return sendError(
    "Failed to create user",
    ERROR_CODES.DATABASE_FAILURE,
    500,
    error
  );
}
```

### Business Logic Error (400)
```typescript
if (orderItem.stock < quantity) {
  return sendError(
    "Insufficient stock available",
    ERROR_CODES.INSUFFICIENT_STOCK,
    400,
    `Only ${orderItem.stock} units available`
  );
}
```

---

## 🔢 Common Error Codes Reference

| Error Code | Constant | Usage |
|------------|----------|-------|
| **E001** | `ERROR_CODES.VALIDATION_ERROR` | General validation error |
| **E002** | `ERROR_CODES.MISSING_REQUIRED_FIELD` | Required field missing |
| **E003** | `ERROR_CODES.INVALID_FORMAT` | Invalid data format |
| **E007** | `ERROR_CODES.INVALID_ID` | Invalid ID format |
| **E200** | `ERROR_CODES.NOT_FOUND` | Generic resource not found |
| **E201** | `ERROR_CODES.USER_NOT_FOUND` | User not found |
| **E202** | `ERROR_CODES.RESTAURANT_NOT_FOUND` | Restaurant not found |
| **E203** | `ERROR_CODES.MENU_ITEM_NOT_FOUND` | Menu item not found |
| **E204** | `ERROR_CODES.ORDER_NOT_FOUND` | Order not found |
| **E300** | `ERROR_CODES.DATABASE_FAILURE` | Database operation failed |
| **E305** | `ERROR_CODES.DUPLICATE_ENTRY` | Duplicate entry detected |
| **E400** | `ERROR_CODES.INSUFFICIENT_STOCK` | Not enough stock |
| **E500** | `ERROR_CODES.INTERNAL_ERROR` | Internal server error |

[See all error codes →](../src/app/lib/errorCodes.ts)

---

## 🎯 Complete API Route Example

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";

// GET /api/users
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit }),
      prisma.user.count(),
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

// POST /api/users
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // Validation
    if (!name || !email || !password) {
      return sendError(
        "Name, email, and password are required",
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        400
      );
    }

    // Check for duplicates
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return sendError(
        "User with this email already exists",
        ERROR_CODES.DUPLICATE_ENTRY,
        409
      );
    }

    // Create user
    const user = await prisma.user.create({
      data: { name, email, password },
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
```

---

## 📋 Response Format Cheat Sheet

### Success Response Structure
```typescript
{
  success: true,         // Always true for success
  message: string,       // Human-readable message
  data: T,               // Your response payload
  timestamp: string      // ISO 8601 timestamp
}
```

### Error Response Structure
```typescript
{
  success: false,        // Always false for errors
  message: string,       // Human-readable error message
  error: {
    code: string,        // Error code (e.g., "E001")
    details?: unknown    // Optional error details
  },
  timestamp: string      // ISO 8601 timestamp
}
```

---

## 🧪 Testing Your Endpoints

### Test Success Response
```bash
curl -X GET "http://localhost:3000/api/users?page=1&limit=5"
```

**Expected:**
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": { /* user data */ },
  "timestamp": "2025-12-17T10:00:00.000Z"
}
```

### Test Validation Error
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Expected:**
```json
{
  "success": false,
  "message": "Name, email, and password are required",
  "error": { "code": "E002" },
  "timestamp": "2025-12-17T10:00:00.000Z"
}
```

---

## ⚡ Pro Tips

### 1. Always Use Try-Catch
```typescript
export async function GET() {
  try {
    // Your logic here
    return sendSuccess(data, "Success message");
  } catch (error) {
    return sendError("Error message", ERROR_CODES.XXX, 500, error);
  }
}
```

### 2. Choose Appropriate Error Codes
- Use `E002` for missing required fields
- Use `E200-E299` for not found errors
- Use `E300` for database errors
- Use `E305` for duplicate entries

### 3. Include Error Details for Debugging
```typescript
return sendError(
  "Failed to create order",
  ERROR_CODES.DATABASE_FAILURE,
  500,
  error  // Include the actual error for debugging
);
```

### 4. Use Descriptive Messages
```typescript
// ❌ Bad
return sendError("Error", ERROR_CODES.VALIDATION_ERROR, 400);

// ✅ Good
return sendError(
  "Email format is invalid. Please provide a valid email address.",
  ERROR_CODES.INVALID_EMAIL,
  400
);
```

### 5. Log Errors for Debugging
```typescript
try {
  // Your logic
} catch (error) {
  console.error("Error creating user:", error);  // Log for debugging
  return sendError("Failed to create user", ERROR_CODES.DATABASE_FAILURE, 500, error);
}
```

---

## 📚 Additional Resources

- [Complete Error Codes List](../src/app/lib/errorCodes.ts)
- [Response Handler Implementation](../src/app/lib/responseHandler.ts)
- [API Response Examples](./api_response_examples.md)
- [Implementation Summary](./STANDARDIZED_RESPONSE_IMPLEMENTATION.md)

---

## ✅ Checklist for New API Routes

When creating a new API route, ensure:

- [ ] Import `sendSuccess` and `sendError`
- [ ] Import `ERROR_CODES`
- [ ] Wrap logic in try-catch block
- [ ] Use `sendSuccess()` for successful responses
- [ ] Use `sendError()` with appropriate error codes
- [ ] Validate required fields and return E002 if missing
- [ ] Check for duplicates and return E305 if found
- [ ] Check if resources exist and return E200-E299 if not found
- [ ] Include helpful error messages
- [ ] Log errors with console.error()
- [ ] Test both success and error cases

---

**Remember:** Consistency is key! All endpoints should follow the same pattern for a professional, maintainable API.
