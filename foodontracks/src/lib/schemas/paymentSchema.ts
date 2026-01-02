/**
 * Payment Schema for FoodONtracks
 * Zod validation schema for payment data
 */

import { z } from "zod";

export const paymentSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  amount: z.number().min(0, "Amount must be positive"),
  method: z.enum(["CASH", "CARD", "UPI", "WALLET"]),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]).optional(),
  transactionId: z.string().max(200).optional(),
  paymentGateway: z.string().max(100).optional(),
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.string().max(50).optional(),
});

export const paymentUpdateSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]),
  transactionId: z.string().max(200).optional(),
  failureReason: z.string().max(500).optional(),
});

export const refundSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
  amount: z.number().min(0, "Refund amount must be positive"),
  reason: z.string().min(1, "Reason is required").max(500),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
