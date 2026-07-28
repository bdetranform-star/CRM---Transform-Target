import { formatDistanceToNow } from "date-fns";
import type { Touch } from "@prisma/client";

import { ChannelIcon, CHANNEL_CONFIG } from "@/lib/channel-config";

export function TouchTimeline({ touches }: { touches: Touch[] }) {
  if (touches.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No touches logged yet.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {touches.map((touch) => (
        <li key={touch.id} className="flex gap-3">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
            <ChannelIcon channel={touch.channel} className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1 border-b border-border pb-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {CHANNEL_CONFIG[touch.channel].label}
                {touch.direction === "INBOUND" ? " (inbound)" : ""}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(touch.createdAt, { addSuffix: true })}
              </span>
            </div>
            {touch.outcome && (
              <span className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {touch.outcome}
              </span>
            )}
            {touch.body && (
              <p className="mt-1.5 text-sm text-foreground/80 break-words">{touch.body}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
