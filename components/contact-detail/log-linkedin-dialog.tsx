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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { logLinkedinTouch } from "@/app/actions/touches";

const LINKEDIN_OUTCOMES = [
  { value: "CONNECTION_SENT", label: "Connection Sent" },
  { value: "CONNECTED", label: "Connected" },
  { value: "MESSAGE_SENT", label: "Message Sent" },
  { value: "REPLIED", label: "Replied" },
] as const;

export function LogLinkedinDialog({
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
  const [outcome, setOutcome] = useState<string>("CONNECTION_SENT");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await logLinkedinTouch({ contactId, outcome });
      toast.success("LinkedIn touch logged");
      onOpenChange(false);
      onLogged?.();
    } catch {
      toast.error("Failed to log touch");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log LinkedIn touch</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>Outcome</Label>
          <Select value={outcome} onValueChange={setOutcome}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINKEDIN_OUTCOMES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Log touch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
