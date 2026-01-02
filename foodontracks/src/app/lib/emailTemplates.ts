/**
 * Email Templates for FoodONtracks Transactional Emails
 * These templates use HTML for rich formatting
 */

interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

interface OrderConfirmationData {
  userName: string;
  orderNumber: string;
  totalAmount: number;
  orderItems: Array<{ name: string; quantity: number; price: number }>;
  deliveryAddress: string;
  estimatedDelivery?: string;
}

interface PasswordResetData {
  userName: string;
  resetLink: string;
  expiryTime: string;
}

interface OrderStatusData {
  userName: string;
  orderNumber: string;
  status: string;
  trackingLink?: string;
}

interface PaymentConfirmationData {
  userName: string;
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
}

/**
 * Base email template wrapper
 */
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoodONtracks</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .content {
      padding: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
      color: #666;
      font-size: 12px;
    }
    .order-items {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .order-items th,
    .order-items td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #f0f0f0;
    }
    .order-items th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    .total {
      font-size: 18px;
      font-weight: bold;
      color: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🚆 FoodONtracks</div>
    </div>
    ${content}
    <div class="footer">
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>If you have questions, contact us at <a href="mailto:support@foodontracks.com">support@foodontracks.com</a></p>
      <p>&copy; ${new Date().getFullYear()} FoodONtracks. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Welcome email template
 */
export const welcomeEmailTemplate = (data: WelcomeEmailData): string => {
  const content = `
    <div class="content">
      <h2>Welcome to FoodONtracks, ${data.userName}! 🎉</h2>
      <p>We're thrilled to have you onboard. FoodONtracks brings delicious meals directly to you with transparency and traceability.</p>
      <p>Your account has been successfully created with the email: <strong>${data.userEmail}</strong></p>
      <h3>What's Next?</h3>
      <ul>
        <li>Browse our restaurant partners</li>
        <li>Explore diverse menu options</li>
        <li>Place your first order and track it in real-time</li>
      </ul>
      <a href="${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "")}" class="button">Start Ordering</a>
      <p>Thank you for choosing FoodONtracks for your food delivery needs!</p>
    </div>
  `;
  return emailWrapper(content);
};

/**
 * Order confirmation email template
 */
export const orderConfirmationEmailTemplate = (
  data: OrderConfirmationData
): string => {
  const itemsHtml = data.orderItems
    .map(
      (item) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>₹${item.price.toFixed(2)}</td>
      <td>₹${(item.quantity * item.price).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  const content = `
    <div class="content">
      <h2>Order Confirmed! 🎊</h2>
      <p>Hi ${data.userName},</p>
      <p>Thank you for your order! We've received your order and it's being prepared.</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
        ${data.estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ""}
      </div>
      <h3>Order Details</h3>
      <table class="order-items">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <p class="total">Total Amount: ₹${data.totalAmount.toFixed(2)}</p>
      <p>You can track your order status in real-time from your dashboard.</p>
      <a href="${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "")}/orders/${data.orderNumber}" class="button">Track Your Order</a>
    </div>
  `;
  return emailWrapper(content);
};

/**
 * Password reset email template
 */
export const passwordResetEmailTemplate = (data: PasswordResetData): string => {
  const content = `
    <div class="content">
      <h2>Password Reset Request 🔐</h2>
      <p>Hi ${data.userName},</p>
      <p>We received a request to reset your password for your FoodONtracks account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${data.resetLink}" class="button">Reset Password</a>
      <p><strong>This link will expire in ${data.expiryTime}.</strong></p>
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p style="margin: 0;"><strong>Security Tip:</strong> Never share this link with anyone. FoodONtracks will never ask for your password via email.</p>
      </div>
    </div>
  `;
  return emailWrapper(content);
};

/**
 * Order status update email template
 */
export const orderStatusEmailTemplate = (data: OrderStatusData): string => {
  const statusMessages: Record<string, string> = {
    CONFIRMED: "Your order has been confirmed and is being prepared! 👨‍🍳",
    PREPARING: "Your delicious meal is being prepared with care! 🍳",
    READY: "Your order is ready and will be picked up soon! 📦",
    PICKED_UP: "Your order is on its way to you! 🚗",
    DELIVERED: "Your order has been delivered! Enjoy your meal! 🎉",
    CANCELLED: "Your order has been cancelled. 😔",
  };

  const content = `
    <div class="content">
      <h2>Order Status Update</h2>
      <p>Hi ${data.userName},</p>
      <p>${statusMessages[data.status] || "Your order status has been updated."}</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Current Status:</strong> <span style="color: #2563eb; font-weight: 600;">${data.status.replace(/_/g, " ")}</span></p>
      </div>
      ${data.trackingLink ? `<a href="${data.trackingLink}" class="button">Track Order</a>` : ""}
      <p>Thank you for choosing FoodONtracks!</p>
    </div>
  `;
  return emailWrapper(content);
};

/**
 * Payment confirmation email template
 */
export const paymentConfirmationEmailTemplate = (
  data: PaymentConfirmationData
): string => {
  const content = `
    <div class="content">
      <h2>Payment Successful! ✅</h2>
      <p>Hi ${data.userName},</p>
      <p>We've successfully received your payment. Here are the details:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ₹${data.amount.toFixed(2)}</p>
        <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${data.paymentMethod}</p>
        <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p>This email serves as your payment receipt. Keep it for your records.</p>
      <p>Your order is now being processed and you'll receive updates as it progresses.</p>
    </div>
  `;
  return emailWrapper(content);
};

/**
 * Generic notification email template
 */
export const genericNotificationTemplate = (
  subject: string,
  message: string,
  userName?: string
): string => {
  const content = `
    <div class="content">
      <h2>${subject}</h2>
      ${userName ? `<p>Hi ${userName},</p>` : ""}
      ${message}
    </div>
  `;
  return emailWrapper(content);
};

// Export all template types for type safety
export type {
  WelcomeEmailData,
  OrderConfirmationData,
  PasswordResetData,
  OrderStatusData,
  PaymentConfirmationData,
};
