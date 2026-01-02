import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createPaymentSchema } from '@/lib/schemas/paymentSchema';
import { validateData } from '@/lib/validationUtils';
import { logger } from '@/lib/logger';
import withLogging from '@/lib/requestLogger';

export const POST = withLogging(async (request: Request) => {
  const body = await request.json();

  // For transaction endpoint, we'll validate the payment method and amount only
  const validationResult = validateData(
    createPaymentSchema.omit({ orderId: true }),
    { amount: body.totalAmount, paymentMethod: body.paymentMethod, transactionId: 'temp' }
  );
  
  if (!validationResult.success) {
    return NextResponse.json(validationResult, { status: 400 });
  }

  const { userId, items, paymentMethod, fail = false } = body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create order skeleton
      const order = await tx.order.create({
        data: {
          userId,
          restaurantId: items[0].restaurantId,
          addressId: body.addressId,
          orderNumber: `ORD-${Math.random().toString(36).slice(2,9).toUpperCase()}`,
          status: 'PENDING',
          totalAmount: items.reduce((s: number, it: any) => s + it.price * it.quantity, 0),
        },
      });

      // Process items & decrement stock
      for (const it of items) {
        const menuItem = await tx.menuItem.findUnique({ where: { id: it.menuItemId } });
        if (!menuItem) throw new Error(`MenuItem ${it.menuItemId} not found`);
        if (menuItem.stock < it.quantity) throw new Error(`Insufficient stock for item ${menuItem.name}`);

        await tx.menuItem.update({ where: { id: it.menuItemId }, data: { stock: { decrement: it.quantity } } });

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: it.menuItemId,
            quantity: it.quantity,
            priceAtTime: it.price,
          },
        });
      }

      // Optionally trigger a failure to demo rollback
      if (fail) throw new Error('Forced failure to demonstrate rollback');

      // Record payment
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount,
          paymentMethod: paymentMethod || 'CREDIT_CARD',
          transactionId: 'TXN-' + Math.random().toString(36).substring(7).toUpperCase(),
          status: 'COMPLETED',
        },
      });

      // Mark order as CONFIRMED
      await tx.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED' } });

      return { order, payment };
    });

    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    logger.error('transaction_create_error', { error: error?.message || String(error) });
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
});
