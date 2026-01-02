import { NextRequest, NextResponse } from "next/server";
import { sendEmail, isValidEmail, getEmailStats } from "@/app/lib/emailService";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/app/lib/responseHandler";
import { logger } from "@/lib/logger";
import withLogging from "@/lib/requestLogger";
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
      return NextResponse.json(
        createErrorResponse("Missing 'to' field", "VALIDATION_ERROR"),
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(to)) {
      return NextResponse.json(
        createErrorResponse("Invalid email address format", "VALIDATION_ERROR"),
        { status: 400 }
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
          return NextResponse.json(
            createErrorResponse(
              `Unknown template: ${template}. Available templates: welcome, order-confirmation, password-reset, order-status, payment-confirmation, notification`,
              "INVALID_TEMPLATE"
            ),
            { status: 400 }
          );
      }
    }

    // Validate we have content
    if (!emailSubject || !emailHtml) {
      return NextResponse.json(
        createErrorResponse(
          "Missing email content. Provide either 'subject' and 'message', or 'template' and 'templateData'",
          "VALIDATION_ERROR"
        ),
        { status: 400 }
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
      return NextResponse.json(
        createSuccessResponse(
          {
            messageId: result.messageId,
            to,
            subject: emailSubject,
          },
          "Email sent successfully"
        ),
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        createErrorResponse(
          result.error || "Failed to send email",
          "EMAIL_SEND_FAILED"
        ),
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("email_api_error", { error: errorMessage });
    return NextResponse.json(
      createErrorResponse(
        "Failed to process email request",
        "EMAIL_API_ERROR",
        errorMessage
      ),
      { status: 500 }
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

    return NextResponse.json(
      createSuccessResponse(
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
        "Email service configuration retrieved"
      ),
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      createErrorResponse(
        "Failed to retrieve email configuration",
        "CONFIG_ERROR"
      ),
      { status: 500 }
    );
  }
});
