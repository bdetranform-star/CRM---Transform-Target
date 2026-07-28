"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { logCallTouch } from "@/app/actions/touches";

const CALL_OUTCOMES = [
  { value: "CONNECTED", label: "Connected" },
  { value: "VOICEMAIL", label: "Voicemail" },
  { value: "NO_ANSWER", label: "No Answer" },
  { value: "WRONG_NUMBER", label: "Wrong Number" },
  { value: "CALLBACK_SCHEDULED", label: "Callback Scheduled" },
] as const;

export function LogCallDialog({
  contactId,
  open,
  onOpenChange,
  onLogged,
}: {
  contactId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogged?: () => void;
}) {
  const [outcome, setOutcome] = useState<string>("CONNECTED");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await logCallTouch({ contactId, outcome, notes });
      toast.success("Call logged");
      setNotes("");
      onOpenChange(false);
      onLogged?.();
    } catch {
      toast.error("Failed to log call");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a call</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Outcome</Label>
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
              placeholder="What was discussed?"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Log call"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
