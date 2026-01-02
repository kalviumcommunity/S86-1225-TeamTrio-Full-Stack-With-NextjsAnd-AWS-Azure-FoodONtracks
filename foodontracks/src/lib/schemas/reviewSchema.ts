/**
 * Review Schema for FoodONtracks
 * Zod validation schema for review data
 */

import { z } from "zod";

export const reviewSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  restaurantId: z.string().uuid("Invalid restaurant ID"),
  userId: z.string().uuid("Invalid user ID"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z.string().max(1000).optional(),
  foodRating: z.number().int().min(1).max(5).optional(),
  deliveryRating: z.number().int().min(1).max(5).optional(),
  packagingRating: z.number().int().min(1).max(5).optional(),
});

export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  foodRating: z.number().int().min(1).max(5).optional(),
  deliveryRating: z.number().int().min(1).max(5).optional(),
  packagingRating: z.number().int().min(1).max(5).optional(),
});

export const reviewResponseSchema = z.object({
  response: z.string().min(1, "Response cannot be empty").max(1000),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
export type ReviewResponseInput = z.infer<typeof reviewResponseSchema>;
