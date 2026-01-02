/**
 * Delivery Person Schema for FoodONtracks
 * Zod validation schema for delivery person data
 */

import { z } from "zod";

export const deliveryPersonSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  phoneNumber: z.string().min(10, "Valid phone number is required").max(20),
  email: z.string().email("Valid email is required"),
  vehicleType: z.enum(["BIKE", "SCOOTER", "CAR", "BICYCLE"]),
  vehicleNumber: z.string().min(1, "Vehicle number is required").max(50),
  isAvailable: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
});

export const deliveryPersonUpdateSchema = deliveryPersonSchema.partial();

export const deliveryPersonLocationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const deliveryPersonAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export type DeliveryPersonInput = z.infer<typeof deliveryPersonSchema>;
export type DeliveryPersonUpdateInput = z.infer<
  typeof deliveryPersonUpdateSchema
>;
export type DeliveryPersonLocationUpdate = z.infer<
  typeof deliveryPersonLocationUpdateSchema
>;
export type DeliveryPersonAvailabilityUpdate = z.infer<
  typeof deliveryPersonAvailabilitySchema
>;
