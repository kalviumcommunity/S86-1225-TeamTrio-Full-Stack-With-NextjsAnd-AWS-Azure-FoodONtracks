
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";

export const runtime = "nodejs";
import { Order } from "@/models/Order";
import { MenuItem } from "@/models/MenuItem";
import { NextResponse } from "next/server";
import { paymentSchema } from "@/lib/schemas/paymentSchema";
import { validateData } from "@/lib/validationUtils";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";
 

export const POST = withLogging(async (request: Request) => {
  const body = await request.json();

  // For transaction endpoint, we'll validate the payment method and amount only
  const validationResult = validateData(paymentSchema.omit({ orderId: true }), {
    amount: body.totalAmount,
    paymentMethod: body.paymentMethod,
    transactionId: "temp",
  });

  if (!validationResult.success || !validationResult.data) {
    return NextResponse.json(validationResult, { status: 400 });
  }

  const { userId, items, paymentMethod, fail = false } = body;

  try {
    await dbConnect();
    const session = await mongoose.startSession();
    let result;

    try {
      await session.withTransaction(async () => {
        // Create order skeleton
        const orderData = {
          userId,
          restaurantId: items[0].restaurantId,
          addressId: body.addressId,
          orderNumber: `ORD-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
          status: "PENDING",
          totalAmount: items.reduce(
            (s: number, it: { price: number; quantity: number }) =>
              s + it.price * it.quantity,
            0
          ),
        };
        
        const [order] = await Order.create([orderData], { session });

        // Process items & decrement stock
        for (const it of items) {
          const menuItem = await MenuItem.findById(it.menuItemId).session(session);
          
          if (!menuItem) {
            throw new Error(`MenuItem ${it.menuItemId} not found`);
          }
          
          if ((menuItem as any).stock < it.quantity) {
            throw new Error(`Insufficient stock for item ${menuItem.name}`);
          }

          // Decrement stock
          await MenuItem.findByIdAndUpdate(
            it.menuItemId,
            { $inc: { stock: -it.quantity } },
            { session }
          );

          // Note: Order items are stored in the Order model's items array
          // If you have a separate OrderItem model, create records here
        }

        // Optionally trigger a failure to demo rollback
        if (fail) {
          throw new Error("Forced failure to demonstrate rollback");
        }

        // Create payment record (stored in Order model or separate Payment model)
        const payment = {
          orderId: order._id,
          amount: order.totalAmount,
          paymentMethod: paymentMethod || "CREDIT_CARD",
          transactionId:
            "TXN-" + Math.random().toString(36).substring(7).toUpperCase(),
          status: "COMPLETED",
        };

        // Mark order as CONFIRMED
        await Order.findByIdAndUpdate(
          order._id,
          { $set: { status: "CONFIRMED", paymentStatus: "COMPLETED" } },
          { session }
        );

        result = { order, payment };
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ ok: true, result });

  } catch (error: unknown) {
    logger.error("transaction_error", { error: String(error) });
    const err = error as Error;
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 400 }
    );
  }
});
