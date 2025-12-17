# API Response Examples

This document provides comprehensive examples of API responses using the standardized response format.

## Table of Contents
- [Success Responses](#success-responses)
- [Error Responses](#error-responses)
- [Pagination Examples](#pagination-examples)
- [Common Error Scenarios](#common-error-scenarios)

---

## Success Responses

### GET /api/users
**Fetch all users with pagination**

**Request:**
```bash
GET /api/users?page=1&limit=10&role=CUSTOMER
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phoneNumber": "+91-9876543210",
        "role": "CUSTOMER",
        "createdAt": "2025-12-15T10:30:00.000Z",
        "updatedAt": "2025-12-15T10:30:00.000Z"
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phoneNumber": "+91-9876543211",
        "role": "CUSTOMER",
        "createdAt": "2025-12-15T11:00:00.000Z",
        "updatedAt": "2025-12-15T11:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "totalPages": 5
    }
  },
  "timestamp": "2025-12-17T10:00:00.000Z"
}
```

---

### POST /api/users
**Create a new user**

**Request:**
```bash
POST /api/users
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "phoneNumber": "+91-9876543212",
  "password": "SecureP@ss123",
  "role": "CUSTOMER"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 43,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "phoneNumber": "+91-9876543212",
    "role": "CUSTOMER",
    "createdAt": "2025-12-17T10:15:00.000Z"
  },
  "timestamp": "2025-12-17T10:15:00.000Z"
}
```

---

### GET /api/restaurants?city=Mumbai&minRating=4.0
**Fetch restaurants with filters**

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Restaurants fetched successfully",
  "data": {
    "restaurants": [
      {
        "id": 5,
        "name": "Spice Garden",
        "email": "contact@spicegarden.com",
        "phoneNumber": "+91-2212345678",
        "description": "Authentic Indian cuisine",
        "address": "123 MG Road",
        "city": "Mumbai",
        "state": "Maharashtra",
        "zipCode": "400001",
        "rating": 4.5,
        "isActive": true,
        "createdAt": "2025-12-10T08:00:00.000Z",
        "_count": {
          "menuItems": 45,
          "orders": 1234,
          "reviews": 567
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 12,
      "totalPages": 2
    }
  },
  "timestamp": "2025-12-17T10:20:00.000Z"
}
```

---

### POST /api/orders
**Create a new order**

**Request:**
```bash
POST /api/orders
Content-Type: application/json

{
  "userId": 1,
  "restaurantId": 5,
  "addressId": 3,
  "orderItems": [
    { "menuItemId": 10, "quantity": 2 },
    { "menuItemId": 15, "quantity": 1 }
  ],
  "deliveryFee": 3.99,
  "tax": 5.50,
  "discount": 2.00,
  "specialInstructions": "Extra spicy, please!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 789,
    "userId": 1,
    "restaurantId": 5,
    "addressId": 3,
    "status": "PENDING",
    "totalAmount": 45.49,
    "deliveryFee": 3.99,
    "tax": 5.50,
    "discount": 2.00,
    "specialInstructions": "Extra spicy, please!",
    "createdAt": "2025-12-17T10:30:00.000Z",
    "orderItems": [
      {
        "id": 1234,
        "orderId": 789,
        "menuItemId": 10,
        "quantity": 2,
        "priceAtTime": 15.99,
        "menuItem": {
          "id": 10,
          "name": "Butter Chicken",
          "category": "Main Course",
          "price": 15.99
        }
      },
      {
        "id": 1235,
        "orderId": 789,
        "menuItemId": 15,
        "quantity": 1,
        "priceAtTime": 12.00,
        "menuItem": {
          "id": 15,
          "name": "Garlic Naan",
          "category": "Bread",
          "price": 12.00
        }
      }
    ]
  },
  "timestamp": "2025-12-17T10:30:00.000Z"
}
```

---

## Error Responses

### 400 Bad Request - Missing Required Fields

**Request:**
```bash
POST /api/users
Content-Type: application/json

{
  "email": "incomplete@example.com"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Name, email, and password are required",
  "error": {
    "code": "E002"
  },
  "timestamp": "2025-12-17T10:35:00.000Z"
}
```

---

### 404 Not Found - Resource Does Not Exist

**Request:**
```bash
GET /api/restaurants/99999
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Restaurant not found",
  "error": {
    "code": "E202"
  },
  "timestamp": "2025-12-17T10:40:00.000Z"
}
```

---

### 409 Conflict - Duplicate Entry

**Request:**
```bash
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (409 Conflict):**
```json
{
  "success": false,
  "message": "User with this email or phone number already exists",
  "error": {
    "code": "E305",
    "details": "Duplicate entry detected"
  },
  "timestamp": "2025-12-17T10:45:00.000Z"
}
```

---

### 500 Internal Server Error - Database Failure

**Request:**
```bash
GET /api/orders
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Failed to fetch orders",
  "error": {
    "code": "E300",
    "details": "Database connection timeout"
  },
  "timestamp": "2025-12-17T10:50:00.000Z"
}
```

---

## Pagination Examples

### Empty Result Set

**Request:**
```bash
GET /api/menu-items?restaurantId=999&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Menu items fetched successfully",
  "data": {
    "menuItems": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0
    }
  },
  "timestamp": "2025-12-17T11:00:00.000Z"
}
```

---

### Last Page with Partial Results

**Request:**
```bash
GET /api/restaurants?page=5&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Restaurants fetched successfully",
  "data": {
    "restaurants": [
      {
        "id": 43,
        "name": "The Last Restaurant",
        "city": "Delhi",
        "rating": 4.2
      }
    ],
    "pagination": {
      "page": 5,
      "limit": 10,
      "total": 41,
      "totalPages": 5
    }
  },
  "timestamp": "2025-12-17T11:05:00.000Z"
}
```

---

## Common Error Scenarios

### Validation Error - Invalid Format

**Error Code:** E003  
**Status:** 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid email format",
  "error": {
    "code": "E004"
  },
  "timestamp": "2025-12-17T11:10:00.000Z"
}
```

---

### Business Logic Error - Insufficient Stock

**Error Code:** E400  
**Status:** 400 Bad Request

```json
{
  "success": false,
  "message": "Insufficient stock available",
  "error": {
    "code": "E400",
    "details": "Only 3 units available, requested 5"
  },
  "timestamp": "2025-12-17T11:15:00.000Z"
}
```

---

### Business Logic Error - Order Already Completed

**Error Code:** E401  
**Status:** 400 Bad Request

```json
{
  "success": false,
  "message": "Order is already completed",
  "error": {
    "code": "E401",
    "details": "Cannot modify completed orders"
  },
  "timestamp": "2025-12-17T11:20:00.000Z"
}
```

---

## Benefits of Standardized Responses

### 1. Predictable Error Handling
Frontend can use a single error handler:

```typescript
async function apiRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const json = await response.json();
  
  if (!json.success) {
    throw new APIError(json.message, json.error.code);
  }
  
  return json.data;
}
```

### 2. Consistent UI Feedback
```typescript
if (error.code === 'E002') {
  showToast('Please fill in all required fields', 'warning');
} else if (error.code === 'E305') {
  showToast('This email is already registered', 'error');
} else {
  showToast('Something went wrong. Please try again.', 'error');
}
```

### 3. Better Monitoring & Logging
```typescript
logger.error('API Error', {
  code: error.code,
  message: error.message,
  timestamp: error.timestamp,
  endpoint: request.url
});
```

### 4. Type-Safe Frontend Code
```typescript
interface APIResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
}

// Usage
const response: APIResponse<User[]> = await fetch('/api/users');
```

---

## Testing Checklist

When testing API endpoints, verify:

- ✅ Success responses include `success: true`
- ✅ Error responses include `success: false`
- ✅ All responses have `message` field
- ✅ All responses have `timestamp` field
- ✅ Error responses include `error.code`
- ✅ HTTP status codes match response type (200/201 for success, 4xx/5xx for errors)
- ✅ Pagination includes all required fields (page, limit, total, totalPages)
- ✅ Error details are helpful but don't expose sensitive information

---

*This standardized format ensures consistency, predictability, and improved developer experience across all API endpoints.*
