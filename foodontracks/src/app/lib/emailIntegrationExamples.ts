/**
 * Example Integration: Using Email Service in API Routes
 *
 * This file shows how to integrate the email service into your existing API endpoints.
 * Copy these examples into your actual route files.
 */

// ============================================
// Example 1: Send Welcome Email on Signup
// ============================================
// In: src/app/api/auth/signup/route.ts

import { sendEmail } from "@/app/lib/emailService";
import { welcomeEmailTemplate } from "@/app/lib/emailTemplates";

// After creating user in database
const user = await prisma.user.create({
  data: { name, email, password: hashedPassword, role },
});

// Send welcome email (non-blocking)
sendEmail({
  to: user.email,
  subject: "Welcome to FoodONtracks!",
  html: welcomeEmailTemplate({
    userName: user.name,
    userEmail: user.email,
  }),
}).catch((error) => {
  // Log but don't fail the signup if email fails
  import("@/app/lib/logger").then(({ logger }) => logger.error("failed_send_welcome_email", { error: String(error) }));
});

// ============================================
// Example 2: Send Order Confirmation
// ============================================
// In: src/app/api/orders/route.ts

import { sendEmail } from "@/app/lib/emailService";
import { orderConfirmationEmailTemplate } from "@/app/lib/emailTemplates";

// After creating order
const order = await prisma.order.create({
  data: orderData,
  include: {
    user: true,
    orderItems: {
      include: { menuItem: true },
    },
    address: true,
  },
});

// Send order confirmation email
sendEmail({
  to: order.user.email,
  subject: `Order Confirmed - ${order.orderNumber}`,
  html: orderConfirmationEmailTemplate({
    userName: order.user.name,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    deliveryAddress: `${order.address.addressLine1}, ${order.address.city}, ${order.address.state} ${order.address.zipCode}`,
    estimatedDelivery: order.estimatedDeliveryTime
      ? new Date(order.estimatedDeliveryTime).toLocaleString()
      : "30-45 minutes",
    orderItems: order.orderItems.map((item) => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.priceAtTime,
    })),
  }),
}).catch((error) => {
  import("@/app/lib/logger").then(({ logger }) => logger.error("failed_send_order_confirmation", { error: String(error) }));
});

// ============================================
// Example 3: Send Password Reset Email
// ============================================
// In: src/app/api/auth/forgot-password/route.ts

import { sendEmail } from "@/app/lib/emailService";
import { passwordResetEmailTemplate } from "@/app/lib/emailTemplates";

// Generate reset token
const resetToken = generateResetToken();
const resetLink = `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "")}/reset-password?token=${resetToken}`;

// Send reset email
await sendEmail({
  to: user.email,
  subject: "Reset Your Password",
  html: passwordResetEmailTemplate({
    userName: user.name,
    resetLink,
    expiryTime: "15 minutes",
  }),
});

// ============================================
// Example 4: Send Order Status Update
// ============================================
// In: src/app/api/orders/[id]/route.ts (PATCH handler)

import { sendEmail } from "@/app/lib/emailService";
import { orderStatusEmailTemplate } from "@/app/lib/emailTemplates";

// After updating order status
const updatedOrder = await prisma.order.update({
  where: { id: orderId },
  data: { status: newStatus },
  include: { user: true },
});

// Send status update email
sendEmail({
  to: updatedOrder.user.email,
  subject: `Order Update - ${updatedOrder.orderNumber}`,
  html: orderStatusEmailTemplate({
    userName: updatedOrder.user.name,
    orderNumber: updatedOrder.orderNumber,
    status: updatedOrder.status,
    trackingLink: `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "")}/track/${updatedOrder.orderNumber}`,
  }),
}).catch((error) => {
  import("@/app/lib/logger").then(({ logger }) => logger.error("failed_send_status_update", { error: String(error) }));
});

// ============================================
// Example 5: Send Payment Confirmation
// ============================================
// In: src/app/api/payments/route.ts

import { sendEmail } from "@/app/lib/emailService";
import { paymentConfirmationEmailTemplate } from "@/app/lib/emailTemplates";

// After payment processing
const payment = await prisma.payment.create({
  data: paymentData,
  include: {
    order: {
      include: { user: true },
    },
  },
});

// Send payment confirmation
sendEmail({
  to: payment.order.user.email,
  subject: `Payment Received - ${payment.order.orderNumber}`,
  html: paymentConfirmationEmailTemplate({
    userName: payment.order.user.name,
    orderNumber: payment.order.orderNumber,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    transactionId: payment.transactionId,
  }),
}).catch((error) => {
  import("@/app/lib/logger").then(({ logger }) => logger.error("failed_send_payment_confirmation", { error: String(error) }));
});

// ============================================
// Example 6: Bulk Email Notifications
// ============================================
// Send notifications to multiple users

import { sendBulkEmails } from "@/app/lib/emailService";
import { genericNotificationTemplate } from "@/app/lib/emailTemplates";

const users = await prisma.user.findMany({
  where: { role: "CUSTOMER" },
});

const emailPromises = users.map((user) => ({
  to: user.email,
  subject: "New Feature Announcement",
  html: genericNotificationTemplate(
    "New Feature Announcement",
    `<p>Hi ${user.name},</p><p>We've added exciting new features to FoodONtracks! Check them out in your dashboard.</p>`,
    user.name
  ),
}));

await sendBulkEmails(emailPromises);

// ============================================
// Example 7: Error Handling Best Practice
// ============================================

try {
  // Create order
  const order = await prisma.order.create({ data: orderData });

  // Try to send email, but don't fail the order if email fails
  try {
    await sendEmail({
      to: order.user.email,
      subject: `Order Confirmed - ${order.orderNumber}`,
      html: orderConfirmationEmailTemplate(orderData),
    });
  } catch (emailError) {
    // Log email error but continue
    logger.error("email_send_failed", { error: emailError instanceof Error ? emailError.message : String(emailError) });
    // Optionally: Store failed email in queue for retry
  }

  // Return success response
  return NextResponse.json({
    success: true,
    data: order,
  });
} catch (error) {
  // Handle order creation error (critical)
  return NextResponse.json(
    { success: false, error: "Order creation failed" },
    { status: 500 }
  );
}

// ============================================
// Example 8: Using Email API from Frontend
// ============================================
// In client-side code

async function sendCustomEmail(to: string, subject: string, message: string) {
  const response = await fetch("/api/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, message }),
  });

  const result = await response.json();
  return result;
}

// Usage
await sendCustomEmail(
  "user@example.com",
  "Custom Notification",
  "<h2>Hello!</h2><p>This is a custom message.</p>"
);

// ============================================
// Example 9: Template Usage from Frontend
// ============================================

async function sendTemplateEmail(
  to: string,
  template: string,
  templateData: object
) {
  const response = await fetch("/api/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, template, templateData }),
  });

  return response.json();
}

// Usage
await sendTemplateEmail("user@example.com", "welcome", {
  userName: "John Doe",
  userEmail: "user@example.com",
});

// ============================================
// Example 10: Queue-Based Email Sending (Advanced)
// ============================================
// For high-volume scenarios, use a queue (e.g., Bull with Redis)

// import { Queue } from 'bull';
// const emailQueue = new Queue('email-queue', process.env.REDIS_URL);

// // Add to queue instead of sending immediately
// await emailQueue.add('send-email', {
//   to: user.email,
//   subject: 'Welcome',
//   html: welcomeEmailTemplate(data)
// });

// // Process queue in background worker
// emailQueue.process('send-email', async (job) => {
//   await sendEmail(job.data);
// });
