import { Mail, Users2, Phone, MessageSquare } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const ITEMS = [
  { key: "email", label: "Email", icon: Mail, color: "var(--channel-email)" },
  { key: "linkedin", label: "LinkedIn", icon: Users2, color: "var(--channel-linkedin)" },
  { key: "call", label: "Call", icon: Phone, color: "var(--channel-call)" },
  { key: "sms", label: "SMS", icon: MessageSquare, color: "var(--channel-sms)" },
] as const;

export function SequenceTrackerWidget({
  counts,
}: {
  counts: { email: number; linkedin: number; call: number; sms: number };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Due today, by channel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-4 text-center"
              >
                <Icon className="size-5" style={{ color: item.color }} />
                <span className="text-2xl font-semibold">{counts[item.key]}</span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
