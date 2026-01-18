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

export const createTrackingSchema = z.object({
  orderId: z.number().int().positive("Order ID must be a positive integer"),
  status: orderStatusEnum,
  location: z
    .string()
    .max(200, "Location must not exceed 200 characters")
    .optional()
    .nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  notes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .optional()
    .nullable(),
});

export const updateTrackingSchema = z.object({
  status: orderStatusEnum.optional(),
  location: z
    .string()
    .max(200, "Location must not exceed 200 characters")
    .optional()
    .nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  notes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .optional()
    .nullable(),
});

export type CreateTrackingInput = z.infer<typeof createTrackingSchema>;
export type UpdateTrackingInput = z.infer<typeof updateTrackingSchema>;
