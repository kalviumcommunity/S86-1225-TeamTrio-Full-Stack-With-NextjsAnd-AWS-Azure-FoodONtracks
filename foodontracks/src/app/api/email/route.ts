import { NextRequest } from "next/server";
import { sendEmail, isValidEmail, getEmailStats } from "@/app/lib/emailService";
import withLogging from "@/lib/requestLogger";
import { sendSuccess, sendError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
 
import {
  welcomeEmailTemplate,
  orderConfirmationEmailTemplate,
  passwordResetEmailTemplate,
  orderStatusEmailTemplate,
  paymentConfirmationEmailTemplate,
  genericNotificationTemplate,
} from "@/app/lib/emailTemplates";

/**
 * POST /api/email
 * Send transactional email
 *
 * Request Body:
 * - to: string (recipient email)
 * - subject: string (email subject)
 * - message: string (HTML message) OR
 * - template: string (template name: 'welcome', 'order-confirmation', etc.)
 * - templateData: object (data for template)
 */
export const POST = withLogging(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { to, subject, message, template, templateData, replyTo, cc, bcc } =
      body;

    // Validate required fields
    if (!to) {
      return sendError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing 'to' field",
        undefined,
        400
      );
    }

    // Validate email format
    if (!isValidEmail(to)) {
      return sendError(
        ERROR_CODES.VALIDATION_ERROR,
        "Invalid email address format",
        undefined,
        400
      );
    }

    // Determine email content
    let emailSubject = subject;
    let emailHtml = message;

    // If template is specified, use template instead of raw message
    if (template && templateData) {
      switch (template) {
        case "welcome":
          emailSubject = emailSubject || "Welcome to FoodONtracks!";
          emailHtml = welcomeEmailTemplate(templateData);
          break;

        case "order-confirmation":
          emailSubject =
            emailSubject || `Order Confirmed - ${templateData.orderNumber}`;
          emailHtml = orderConfirmationEmailTemplate(templateData);
          break;

        case "password-reset":
          emailSubject = emailSubject || "Reset Your Password";
          emailHtml = passwordResetEmailTemplate(templateData);
          break;

        case "order-status":
          emailSubject =
            emailSubject || `Order Update - ${templateData.orderNumber}`;
          emailHtml = orderStatusEmailTemplate(templateData);
          break;

        case "payment-confirmation":
          emailSubject =
            emailSubject || `Payment Received - ${templateData.orderNumber}`;
          emailHtml = paymentConfirmationEmailTemplate(templateData);
          break;

        case "notification":
          emailSubject = emailSubject || templateData.subject || "Notification";
          emailHtml = genericNotificationTemplate(
            templateData.subject || "Notification",
            templateData.message,
            templateData.userName
          );
          break;

        default:
          return sendError(
            ERROR_CODES.VALIDATION_ERROR,
            `Unknown template: ${template}. Available templates: welcome, order-confirmation, password-reset, order-status, payment-confirmation, notification`,
            undefined,
            400
          );
      }
    }

    // Validate we have content
    if (!emailSubject || !emailHtml) {
      return sendError(
        ERROR_CODES.VALIDATION_ERROR,
        "Missing email content. Provide either 'subject' and 'message', or 'template' and 'templateData'",
        undefined,
        400
      );
    }

    // Send email
    const result = await sendEmail({
      to,
      subject: emailSubject,
      html: emailHtml,
      replyTo,
      cc,
      bcc,
    });

    if (result.success) {
      return sendSuccess(
        {
          messageId: result.messageId,
          to,
          subject: emailSubject,
        },
        "Email sent successfully",
        200
      );
    } else {
      return sendError(
        ERROR_CODES.EMAIL_SERVICE_ERROR,
        result.error || "Failed to send email",
        undefined,
        500
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Email API error:", errorMessage);
    return sendError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to process email request",
      errorMessage,
      500
    );
  }
});

/**
 * GET /api/email
 * Get email service configuration and stats
 */
export const GET = withLogging(async () => {
  try {
    const stats = await getEmailStats();

    return sendSuccess(
      {
        ...stats,
        availableTemplates: [
          "welcome",
          "order-confirmation",
          "password-reset",
          "order-status",
          "payment-confirmation",
          "notification",
        ],
        sandboxMode: process.env.AWS_SES_SANDBOX === "true",
      },
      "Email service configuration retrieved",
      200
    );
  } catch {
    return sendError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Failed to retrieve email configuration",
      undefined,
      500
    );
  }
});
