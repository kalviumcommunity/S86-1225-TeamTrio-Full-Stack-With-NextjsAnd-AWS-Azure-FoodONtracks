/**
 * Restaurant Schema for FoodONtracks
 * Zod validation schema for restaurant data
 */

import { z } from "zod";

export const restaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required").max(200),
  description: z.string().max(1000).optional(),
  cuisineType: z.string().min(1, "Cuisine type is required").max(100),
  phone: z.string().min(10, "Valid phone number is required").max(20),
  email: z.string().email("Valid email is required"),
  address: z.string().min(1, "Address is required").max(500),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  openingTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
  closingTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().optional(),
  minimumOrder: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  estimatedDeliveryTime: z.number().int().min(0).optional(), // in minutes
});

export const restaurantUpdateSchema = restaurantSchema.partial();

export const restaurantCreateSchema = restaurantSchema.extend({
  ownerId: z.string().uuid("Invalid owner ID"),
});

export type RestaurantInput = z.infer<typeof restaurantSchema>;
export type RestaurantUpdateInput = z.infer<typeof restaurantUpdateSchema>;
export type RestaurantCreateInput = z.infer<typeof restaurantCreateSchema>;
