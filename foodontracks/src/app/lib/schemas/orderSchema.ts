import { z } from "zod";

export const orderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "PICKED_UP",
  "DELIVERED",
  "CANCELLED",
]);

export const paymentMethodEnum = z.enum([
  "CREDIT_CARD",
  "DEBIT_CARD",
  "UPI",
  "CASH_ON_DELIVERY",
  "WALLET",
]);

export const orderItemSchema = z.object({
  menuItemId: z
    .number()
    .int()
    .positive("Menu item ID must be a positive integer"),
  quantity: z
    .number()
    .int()
    .positive("Quantity must be at least 1")
    .max(999, "Quantity must not exceed 999"),
  priceAtTime: z
    .number()
    .positive("Price must be greater than 0")
    .max(9999.99, "Price must not exceed 9999.99"),
});

export const createOrderSchema = z.object({
  userId: z.number().int().positive("User ID must be a positive integer"),
  restaurantId: z
    .number()
    .int()
    .positive("Restaurant ID must be a positive integer"),
  addressId: z.number().int().positive("Address ID must be a positive integer"),
  specialInstructions: z
    .string()
    .optional()
    .nullable()
    .max(500, "Special instructions must not exceed 500 characters"),
  orderItems: z
    .array(orderItemSchema)
    .min(1, "Order must contain at least one item"),
  deliveryFee: z
    .number()
    .nonnegative("Delivery fee cannot be negative")
    .optional()
    .default(0),
  tax: z.number().nonnegative("Tax cannot be negative").optional().default(0),
  discount: z
    .number()
    .nonnegative("Discount cannot be negative")
    .optional()
    .default(0),
});

export const updateOrderSchema = z.object({
  status: orderStatusEnum.optional(),
  specialInstructions: z
    .string()
    .optional()
    .nullable()
    .max(500, "Special instructions must not exceed 500 characters"),
  deliveryPersonId: z
    .number()
    .int()
    .positive("Delivery person ID must be a positive integer")
    .optional()
    .nullable(),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
