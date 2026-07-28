import { Mail, Users2, Phone, MessageSquare, StickyNote, type LucideIcon } from "lucide-react";
import type { Channel } from "@prisma/client";

export const CHANNEL_CONFIG: Record<
  Channel,
  { label: string; icon: LucideIcon; color: string }
> = {
  EMAIL: { label: "Email", icon: Mail, color: "var(--channel-email)" },
  LINKEDIN: { label: "LinkedIn", icon: Users2, color: "var(--channel-linkedin)" },
  CALL: { label: "Call", icon: Phone, color: "var(--channel-call)" },
  SMS: { label: "SMS", icon: MessageSquare, color: "var(--channel-sms)" },
  NOTE: { label: "Note", icon: StickyNote, color: "var(--channel-note)" },
};

export function ChannelIcon({ channel, className }: { channel: Channel; className?: string }) {
  const config = CHANNEL_CONFIG[channel];
  const Icon = config.icon;
  return <Icon className={className} style={{ color: config.color }} />;
}
