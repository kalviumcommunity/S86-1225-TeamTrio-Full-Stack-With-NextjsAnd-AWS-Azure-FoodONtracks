/**
 * Alternative Email Implementation using SendGrid
 *
 * To use SendGrid instead of AWS SES:
 * 1. Install: npm install @sendgrid/mail
 * 2. Set SENDGRID_API_KEY in .env
 * 3. Replace the sendEmail function in emailService.ts with this implementation
 */

import sendgrid from "@sendgrid/mail";
import { logger } from "@/app/lib/logger";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using SendGrid
 */
export async function sendEmailWithSendGrid(
  options: EmailOptions
): Promise<EmailResult> {
  try {
    const { to, subject, html, text, replyTo, cc, bcc } = options;

    const emailData = {
      to: Array.isArray(to) ? to : [to],
      from: process.env.SENDGRID_SENDER || "noreply@foodontracks.com",
      subject,
      html,
      ...(text && { text }),
      ...(replyTo && { replyTo }),
      ...(cc && cc.length > 0 && { cc }),
      ...(bcc && bcc.length > 0 && { bcc }),
    };

    const response = await sendgrid.send(emailData);

    logger.info("sendgrid_email_sent", {
      status: response[0].statusCode,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
    });

    return {
      success: true,
      messageId: response[0].headers["x-message-id"] as string,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("sendgrid_email_failed", { error: errorMessage });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Example: How to switch between providers
 *
 * In emailService.ts, you can add a provider check:
 *
 * export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
 *   const provider = process.env.EMAIL_PROVIDER || 'ses';
 *
 *   if (provider === 'sendgrid') {
 *     return sendEmailWithSendGrid(options);
 *   } else {
 *     return sendEmailWithSES(options);
 *   }
 * }
 */

// Export types
export type { EmailOptions, EmailResult };
