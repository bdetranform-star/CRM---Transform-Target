"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChannelIcon, CHANNEL_CONFIG } from "@/lib/channel-config";
import { ContactDetailPanel } from "@/components/contact-detail/contact-detail-panel";
import type { getActivityFeed } from "@/app/actions/activity-feed";

type FeedData = Awaited<ReturnType<typeof getActivityFeed>>;

export function ActivityFeedView({ data }: { data: FeedData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  function goToPage(page: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(page));
    router.push(`${pathname}?${next.toString()}`);
  }

  if (data.touches.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No activity logged yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-white">
        {data.touches.map((touch) => (
          <li
            key={touch.id}
            className="flex cursor-pointer gap-3 p-4 hover:bg-secondary/40"
            onClick={() => setSelectedContactId(touch.contact.id)}
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary">
              <ChannelIcon channel={touch.channel} className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {touch.contact.firstName} {touch.contact.lastName ?? ""}
                  {touch.contact.company ? ` — ${touch.contact.company}` : ""}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(touch.createdAt, { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {CHANNEL_CONFIG[touch.channel].label}
                {touch.direction === "INBOUND" ? " · inbound" : ""}
                {touch.outcome ? ` · ${touch.outcome}` : ""}
              </p>
              {touch.body && <p className="mt-1 text-sm text-foreground/80">{touch.body}</p>}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {data.page} of {data.pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() => goToPage(data.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.pageCount}
            onClick={() => goToPage(data.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <ContactDetailPanel contactId={selectedContactId} onClose={() => setSelectedContactId(null)} />
    </div>
  );
}
