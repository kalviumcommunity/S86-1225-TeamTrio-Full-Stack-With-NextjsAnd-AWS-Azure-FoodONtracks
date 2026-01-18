
/**
 * Address Schema for FoodONtracks
 * Zod validation schema for address data
 */

import { z } from "zod";

export const addressSchema = z.object({
  addressLine1: z.string().min(1, "Address line 1 is required").max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  zipCode: z.string().min(1, "Zip code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
  isDefault: z.boolean().optional(),
});

export const addressUpdateSchema = addressSchema.partial();

export const addressCreateSchema = addressSchema.extend({
  userId: z.string().min(1, "User ID is required"),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
export type AddressCreateInput = z.infer<typeof addressCreateSchema>;

