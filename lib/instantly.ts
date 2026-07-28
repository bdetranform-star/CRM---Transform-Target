import { z } from "zod";

/**
 * Instantly.ai webhook payload (subset we care about). Instantly's actual
 * webhook shape includes more fields; we only validate what we use so this
 * stays forward-compatible with additional event types/fields.
 */
export const instantlyWebhookSchema = z.object({
  event_type: z.string(),
  lead_email: z.string().email(),
  campaign_name: z.string().optional(),
});

export type InstantlyEventType =
  | "email_sent"
  | "email_opened"
  | "link_clicked"
  | "reply_received"
  | "lead_interested"
  | (string & {});

/**
 * Maps an Instantly.ai campaign event to our internal LeadStatus, or null if
 * the event shouldn't move the lead's status.
 */
export function mapInstantlyEventToLeadStatus(
  eventType: InstantlyEventType
): "EMAIL_SENT" | "CONNECTED" | null {
  switch (eventType) {
    case "email_sent":
      return "EMAIL_SENT";
    case "reply_received":
    case "lead_interested":
      return "CONNECTED";
    default:
      return null;
  }
}

export function getInstantlyApiKey(): string | undefined {
  return process.env.INSTANTLY_API_KEY;
}
