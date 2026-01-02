/**
 * User Schema for FoodONtracks
 * Zod validation schema for user data
 */

import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Valid email is required"),
  phone: z
    .string()
    .min(10, "Valid phone number is required")
    .max(20)
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  role: z
    .enum(["CUSTOMER", "RESTAURANT_OWNER", "DELIVERY_PERSON", "ADMIN"])
    .optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
  isActive: z.boolean().optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).optional(),
  phone: z
    .string()
    .min(10, "Valid phone number is required")
    .max(20)
    .optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
  isActive: z.boolean().optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const userRegistrationSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    email: z.string().email("Valid email is required"),
    phone: z
      .string()
      .min(10, "Valid phone number is required")
      .max(20)
      .optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
    role: z
      .enum(["CUSTOMER", "RESTAURANT_OWNER", "DELIVERY_PERSON"])
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(100),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const passwordResetSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(100),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type UserInput = z.infer<typeof userSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type PasswordResetConfirmInput = z.infer<
  typeof passwordResetConfirmSchema
>;
