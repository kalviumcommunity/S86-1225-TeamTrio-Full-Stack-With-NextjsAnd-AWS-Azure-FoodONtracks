/**
 * Order Schema for FoodONtracks
 * Zod validation schema for order data
 */

import { z } from "zod";

export const orderItemSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  price: z.number().min(0, "Price must be positive"),
  specialInstructions: z.string().max(500).optional(),
});

export const orderSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  restaurantId: z.string().uuid("Invalid restaurant ID"),
  items: z
    .array(orderItemSchema)
    .min(1, "Order must contain at least one item"),
  deliveryAddressId: z.string().uuid("Invalid delivery address ID"),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "WALLET"]),
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
