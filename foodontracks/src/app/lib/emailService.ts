import { SendEmailCommand } from "@aws-sdk/client-ses";
import { sesClient, SES_EMAIL_SENDER, SES_REPLY_TO } from "./sesClient";
import { logger } from "@/app/lib/logger";

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
 * Send email using AWS SES
 * @param options Email options including recipient, subject, and content
 * @returns Result object with success status and message ID
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const { to, subject, html, text, replyTo, cc, bcc } = options;

    // Convert single recipient to array
    const toAddresses = Array.isArray(to) ? to : [to];

    // Prepare email parameters
    const params = {
      Destination: {
        ToAddresses: toAddresses,
        ...(cc && cc.length > 0 && { CcAddresses: cc }),
        ...(bcc && bcc.length > 0 && { BccAddresses: bcc }),
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: html,
          },
          ...(text && {
            Text: {
              Charset: "UTF-8",
              Data: text,
            },
          }),
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
      Source: SES_EMAIL_SENDER,
      ...(replyTo && { ReplyToAddresses: [replyTo] }),
      // Default reply-to if not specified
      ...(!replyTo && SES_REPLY_TO && { ReplyToAddresses: [SES_REPLY_TO] }),
    };

    // Send email using SES
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);

    logger.info("ses_email_sent", {
      messageId: response.MessageId,
      to: toAddresses.join(", "),
      subject,
    });

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("ses_email_failed", { error: errorMessage, details: error });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send bulk emails (useful for batch notifications)
 * @param emails Array of email options
 * @returns Array of results for each email
 */
export async function sendBulkEmails(
  emails: EmailOptions[]
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);

    // Add small delay between emails to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Validate email address format
 * @param email Email address to validate
 * @returns True if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get email sending statistics (for monitoring)
 */
export async function getEmailStats() {
  // This could be extended to fetch SES statistics using GetSendStatistics
  // For now, return basic info
  return {
    provider: "AWS SES",
    region: process.env.AWS_REGION,
    sender: SES_EMAIL_SENDER,
    replyTo: SES_REPLY_TO,
  };
}

// Export types
export type { EmailOptions, EmailResult };
