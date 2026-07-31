import { Mail, Users2, Phone, MessageSquare, type LucideIcon } from "lucide-react";
import type { ChannelTag } from "@prisma/client";

export const CHANNEL_TAG_ORDER: ChannelTag[] = [
  "EMAIL_CHANNEL",
  "LINKEDIN_CHANNEL",
  "COLD_CALLING_CHANNEL",
  "TEXT_WHATSAPP_CHANNEL",
];

/**
 * Labels/icons/colors for the Channel Tag multi-select. Colors are the
 * light-tint/saturated-fg pairs in app/globals.css (--channel-tag-*),
 * derived from the same hues as the existing per-channel Touch colors
 * (lib/channel-config.tsx) for visual consistency, but distinct CSS
 * variables since those are validated for a *filled* bg (Touch pills),
 * not a chip's tint bg + colored fg.
 */
export const CHANNEL_TAG_CONFIG: Record<
  ChannelTag,
  { label: string; icon: LucideIcon; bg: string; fg: string }
> = {
  EMAIL_CHANNEL: {
    label: "Email Channel",
    icon: Mail,
    bg: "var(--channel-tag-email-bg)",
    fg: "var(--channel-tag-email-fg)",
  },
  LINKEDIN_CHANNEL: {
    label: "LinkedIn Channel",
    icon: Users2,
    bg: "var(--channel-tag-linkedin-bg)",
    fg: "var(--channel-tag-linkedin-fg)",
  },
  COLD_CALLING_CHANNEL: {
    label: "Cold Calling Channel",
    icon: Phone,
    bg: "var(--channel-tag-call-bg)",
    fg: "var(--channel-tag-call-fg)",
  },
  TEXT_WHATSAPP_CHANNEL: {
    label: "Text / WhatsApp Channel",
    icon: MessageSquare,
    bg: "var(--channel-tag-sms-bg)",
    fg: "var(--channel-tag-sms-fg)",
  },
};

/** Plain label map — for Advanced Filters' optionsFrom() and other label-only consumers. */
export const CHANNEL_TAG_LABELS: Record<ChannelTag, string> = Object.fromEntries(
  CHANNEL_TAG_ORDER.map((tag) => [tag, CHANNEL_TAG_CONFIG[tag].label])
) as Record<ChannelTag, string>;
