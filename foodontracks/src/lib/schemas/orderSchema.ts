
/**
 * Order Schema for FoodONtracks
 * Zod validation schema for order data
 */

import { z } from "zod";

export const orderItemSchema = z.object({
  menuItemId: z.string().min(1, "Invalid menu item ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be positive"),
  specialInstructions: z.string().max(500).optional(),
});

export const orderSchema = z.object({
  userId: z.string().min(1, "Invalid user ID"),
  restaurantId: z.string().min(1, "Invalid restaurant ID"),
  orderItems: z
    .array(orderItemSchema)
    .min(1, "Order must contain at least one item"),
  addressId: z.string().min(1, "Invalid delivery address ID"),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "WALLET"]),
  deliveryFee: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  specialInstructions: z.string().max(1000).optional(),
  scheduledFor: z.string().datetime().optional(),
});

export const orderUpdateSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY",
      "PICKED_UP",
      "DELIVERED",
      "CANCELLED",
    ])
    .optional(),
  specialInstructions: z.string().max(1000).optional(),
  deliveryPersonId: z.string().uuid("Invalid delivery person ID").optional(),
  estimatedDeliveryTime: z.string().datetime().optional(),
  actualDeliveryTime: z.string().datetime().optional(),
  cancellationReason: z.string().max(500).optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "PICKED_UP",
    "DELIVERED",
    "CANCELLED",
  ]),
  notes: z.string().max(500).optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type OrderUpdateInput = z.infer<typeof orderUpdateSchema>;
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

