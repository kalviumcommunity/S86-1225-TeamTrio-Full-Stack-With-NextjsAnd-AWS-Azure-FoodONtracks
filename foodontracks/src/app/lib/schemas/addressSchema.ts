import { z } from "zod";

export const createAddressSchema = z.object({
  userId: z.number().int().positive("User ID must be a positive integer"),
  addressLine1: z.string().min(5, "Address must be at least 5 characters long").max(200, "Address must not exceed 200 characters"),
  addressLine2: z.string().max(200, "Address line 2 must not exceed 200 characters").optional().nullable(),
  city: z.string().min(2, "City must be at least 2 characters long").max(50, "City must not exceed 50 characters"),
  state: z.string().min(2, "State must be at least 2 characters long").max(50, "State must not exceed 50 characters"),
  zipCode: z.string().regex(/^[0-9\-]+$/, "Invalid zip code format").max(10, "Zip code must not exceed 10 characters"),
  country: z.string().max(50, "Country must not exceed 50 characters").optional().default("USA"),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = z.object({
  addressLine1: z.string().min(5, "Address must be at least 5 characters long").max(200, "Address must not exceed 200 characters").optional(),
  addressLine2: z.string().max(200, "Address line 2 must not exceed 200 characters").optional().nullable(),
  city: z.string().min(2, "City must be at least 2 characters long").max(50, "City must not exceed 50 characters").optional(),
  state: z.string().min(2, "State must be at least 2 characters long").max(50, "State must not exceed 50 characters").optional(),
  zipCode: z.string().regex(/^[0-9\-]+$/, "Invalid zip code format").max(10, "Zip code must not exceed 10 characters").optional(),
  country: z.string().max(50, "Country must not exceed 50 characters").optional(),
  isDefault: z.boolean().optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
