import { format } from "date-fns";
import type { Contact, Touch } from "@prisma/client";

import {
  LEAD_STATUS_CONFIG,
  LIFECYCLE_STAGE_LABELS,
  INDUSTRY_LABELS,
  INDUSTRY_DETAIL_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_CAPTURED_LABELS,
  TEAM_MEMBER_LABELS,
} from "@/lib/status-config";
import { CHANNEL_CONFIG } from "@/lib/channel-config";

function fmt(date: Date | null): string {
  return date ? format(date, "MMM d, yyyy") : "unknown";
}

/**
 * Renders a contact's properties + full touch history as plain text for an
 * Anthropic prompt — shared by insights generation and the per-contact chat
 * so both features see exactly the same facts. Deliberately includes only
 * this one contact's data: the chat/insights features must never leak other
 * contacts' information.
 */
export function buildContactContext(contact: Contact, touches: Touch[]): string {
  const lines = [
    `Name: ${contact.firstName} ${contact.lastName ?? ""}`.trim(),
    contact.jobTitle ? `Job title: ${contact.jobTitle}` : null,
    `Email: ${contact.email}`,
    contact.workPhone ? `Work phone: ${contact.workPhone}` : null,
    contact.cellPhone ? `Cell phone: ${contact.cellPhone}` : null,
    contact.company ? `Company: ${contact.company}` : null,
    contact.websiteUrl ? `Website: ${contact.websiteUrl}` : null,
    contact.numberOfEmployees ? `Number of employees: ${contact.numberOfEmployees}` : null,
    [contact.city, contact.state, contact.country].filter(Boolean).length > 0
      ? `Location: ${[contact.city, contact.state, contact.country].filter(Boolean).join(", ")}`
      : null,
    `Lifecycle stage: ${LIFECYCLE_STAGE_LABELS[contact.lifecycleStage]}`,
    `Lead status: ${LEAD_STATUS_CONFIG[contact.leadStatus].label}`,
    `Industry: ${INDUSTRY_LABELS[contact.industry]}`,
    contact.industryDetail ? `Industry detail: ${INDUSTRY_DETAIL_LABELS[contact.industryDetail]}` : null,
    `Contact owner: ${TEAM_MEMBER_LABELS[contact.contactOwner]}`,
    `Lead source: ${LEAD_SOURCE_LABELS[contact.leadSource]}`,
    contact.leadSourceCaptured
      ? `Lead source captured: ${LEAD_SOURCE_CAPTURED_LABELS[contact.leadSourceCaptured]}`
      : null,
    `Created: ${fmt(contact.createdAt)}`,
    `Last contact date: ${fmt(contact.lastContactDate)}`,
    `Last interested reply: ${fmt(contact.lastInterestedReply)}`,
    contact.smsOptOut ? "This contact has opted out of SMS." : null,
  ].filter((line): line is string => Boolean(line));

  const touchLines =
    touches.length === 0
      ? ["No touches have been logged yet."]
      : touches.map((touch) => {
          const parts = [
            fmt(touch.createdAt),
            CHANNEL_CONFIG[touch.channel].label,
            touch.direction === "INBOUND" ? "inbound" : "outbound",
          ];
          if (touch.outcome) parts.push(`outcome: ${touch.outcome}`);
          if (touch.body) parts.push(`note: "${touch.body}"`);
          return `- ${parts.join(" · ")}`;
        });

  return [
    "CONTACT PROPERTIES", //
    ...lines,
    "",
    "TOUCH HISTORY (oldest first)",
    ...touchLines,
  ].join("\n");
}
