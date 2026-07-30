"use client";

import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { Touch, Channel } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChannelIcon, CHANNEL_CONFIG } from "@/lib/channel-config";
import { addNoteTouch } from "@/app/actions/touches";
import { cn } from "@/lib/utils";

const SUB_TABS: { value: string; label: string; channel: Channel | null }[] = [
  { value: "ALL", label: "All activities", channel: null },
  { value: "NOTE", label: "Notes", channel: "NOTE" },
  { value: "EMAIL", label: "Emails", channel: "EMAIL" },
  { value: "CALL", label: "Calls", channel: "CALL" },
  { value: "LINKEDIN", label: "LinkedIn", channel: "LINKEDIN" },
  { value: "SMS", label: "SMS", channel: "SMS" },
];

function ActivityBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = body.length > 220;
  return (
    <p className="mt-1.5 text-sm text-foreground/80 break-words">
      {isLong && !expanded ? `${body.slice(0, 220)}...` : body}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="ml-1 text-xs font-medium text-[var(--accent-teal)] hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </p>
  );
}

export function ActivityTimelineTab({
  contactId,
  touches,
  onLogged,
}: {
  contactId: string;
  touches: Touch[];
  onLogged: () => void;
}) {
  const [subTab, setSubTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const filtered = useMemo(() => {
    const channel = SUB_TABS.find((t) => t.value === subTab)?.channel;
    return touches
      .filter((t) => !channel || t.channel === channel)
      .filter((t) => !search.trim() || (t.body ?? "").toLowerCase().includes(search.trim().toLowerCase()))
      .filter((t) => !dateFrom || t.createdAt >= new Date(dateFrom))
      .filter((t) => !dateTo || t.createdAt <= new Date(`${dateTo}T23:59:59`))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [touches, subTab, search, dateFrom, dateTo]);

  async function handleLogNote() {
    if (!noteBody.trim()) return;
    setSubmittingNote(true);
    try {
      await addNoteTouch({ contactId, body: noteBody.trim() });
      toast.success("Note logged");
      setNoteBody("");
      onLogged();
    } catch {
      toast.error("Failed to log note");
    } finally {
      setSubmittingNote(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-white p-3">
        <p className="mb-2 text-sm font-medium">Log a note</p>
        <Textarea
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          placeholder="Add ad-hoc context about this contact..."
          rows={2}
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={handleLogNote} disabled={submittingNote || !noteBody.trim()}>
            {submittingNote ? "Logging..." : "Log note"}
          </Button>
        </div>
      </div>

      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList>
          {SUB_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search activities"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        <span className="text-xs text-muted-foreground">to</span>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No activity matches these filters.</p>
      ) : (
        <ul className="flex flex-col">
          {filtered.map((touch) => (
            <li key={touch.id} className="flex gap-3 border-b border-border py-4 last:border-0">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                <ChannelIcon channel={touch.channel} className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {CHANNEL_CONFIG[touch.channel].label}
                    {touch.direction === "INBOUND" ? " (inbound)" : ""}
                  </span>
                  <span
                    className="shrink-0 text-xs text-muted-foreground"
                    title={format(touch.createdAt, "MMM d, yyyy h:mm a")}
                  >
                    {formatDistanceToNow(touch.createdAt, { addSuffix: true })}
                  </span>
                </div>
                {touch.outcome && (
                  <span
                    className={cn(
                      "mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                    )}
                  >
                    {touch.outcome}
                  </span>
                )}
                {touch.body && <ActivityBody body={touch.body} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
