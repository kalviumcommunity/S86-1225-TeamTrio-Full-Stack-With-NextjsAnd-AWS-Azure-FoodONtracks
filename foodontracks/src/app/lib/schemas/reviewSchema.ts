import { z } from "zod";

export const createReviewSchema = z.object({
  userId: z.number().int().positive("User ID must be a positive integer"),
  restaurantId: z.number().int().positive("Restaurant ID must be a positive integer"),
  orderId: z.number().int().positive("Order ID must be a positive integer"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must not exceed 5"),
  comment: z.string().max(500, "Comment must not exceed 500 characters").optional().nullable(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must not exceed 5").optional(),
  comment: z.string().max(500, "Comment must not exceed 500 characters").optional().nullable(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
