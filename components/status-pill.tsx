import type { LeadStatus } from "@prisma/client";

import { LEAD_STATUS_CONFIG } from "@/lib/status-config";
import { cn } from "@/lib/utils";

export function StatusPill({ status, className }: { status: LeadStatus; className?: string }) {
  const config = LEAD_STATUS_CONFIG[status];
  return (
    <span
      className={cn("status-pill", className)}
      style={{ backgroundColor: config.bg, color: config.fg }}
    >
      {config.label}
    </span>
  );
}
