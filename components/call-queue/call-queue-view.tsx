"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, Phone, SkipForward, ArrowRight } from "lucide-react";
import type { Contact, Touch } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CallScriptPanel } from "./call-script-panel";
import { logCallTouch } from "@/app/actions/touches";
import { INDUSTRY_LABELS } from "@/lib/status-config";
import type { Industry } from "@prisma/client";

const CALL_OUTCOMES = [
  { value: "CONNECTED", label: "Connected" },
  { value: "VOICEMAIL", label: "Voicemail" },
  { value: "NO_ANSWER", label: "No Answer" },
  { value: "WRONG_NUMBER", label: "Wrong Number" },
  { value: "CALLBACK_SCHEDULED", label: "Callback Scheduled" },
] as const;

type QueueContact = Contact & { touches: Touch[] };

export function CallQueueView({ initialQueue }: { initialQueue: QueueContact[] }) {
  const [queue, setQueue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [outcome, setOutcome] = useState<string>("CONNECTED");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const current = queue[index];

  function advance() {
    setOutcome("CONNECTED");
    setNotes("");
    setIndex((i) => Math.min(i + 1, queue.length));
  }

  function handleSkip() {
    advance();
  }

  async function handleLogCall() {
    if (!current) return;
    setSubmitting(true);
    try {
      await logCallTouch({ contactId: current.id, outcome, notes });
      toast.success("Call logged");
      // Contact leaves the call queue once logged (sequenceStep moves off 2 for CONNECTED,
      // but stays queued for other outcomes so it can be retried later this session).
      setQueue((q) => q.filter((c) => c.id !== current.id || outcome !== "CONNECTED"));
      advance();
    } catch {
      toast.error("Failed to log call");
    } finally {
      setSubmitting(false);
    }
  }

  if (queue.length === 0 || index >= queue.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Phone className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Call queue is empty</p>
          <p className="text-sm text-muted-foreground">
            No contacts are currently due for a call.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Contact {index + 1} of {queue.length}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            <SkipForward className="size-4" />
            Skip
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {current.firstName} {current.lastName}
            </CardTitle>
            {current.company && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="size-4" />
                {current.company}
              </p>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{current.phone ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Industry</p>
                <p className="font-medium">{INDUSTRY_LABELS[current.industry as Industry]}</p>
              </div>
            </div>
            {current.industryDetail && (
              <div className="text-sm">
                <p className="text-muted-foreground">Notes</p>
                <p>{current.industryDetail}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5 pt-2">
              <Label>Call outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALL_OUTCOMES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="What was discussed?"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={handleLogCall} disabled={submitting}>
                {submitting ? "Saving..." : "Log call & next"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <CallScriptPanel />
    </div>
  );
}
