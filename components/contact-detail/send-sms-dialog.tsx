"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { SmsTemplate } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { listSmsTemplates } from "@/app/actions/sms-templates";
import { fillTemplateTokens } from "@/lib/sms-template-tokens";
import { sendSms } from "@/app/actions/touches";

export function SendSmsDialog({
  contactId,
  contact,
  open,
  onOpenChange,
  onSent,
}: {
  contactId: string;
  contact: { firstName: string; company: string | null; industryDetail: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
}) {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      listSmsTemplates().then(setTemplates);
    }
  }, [open]);

  function handleTemplateChange(id: string) {
    setTemplateId(id);
    const template = templates.find((t) => t.id === id);
    if (template) {
      setBody(fillTemplateTokens(template.body, contact));
    }
  }

  async function handleSubmit() {
    if (!body.trim()) {
      toast.error("Message body cannot be empty");
      return;
    }
    setSubmitting(true);
    try {
      await sendSms({ contactId, body, templateId: templateId || undefined });
      toast.success("SMS logged as sent");
      setBody("");
      setTemplateId("");
      onOpenChange(false);
      onSent?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send SMS");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send SMS</DialogTitle>
          <DialogDescription>
            Choose a template to prefill, then edit as needed. This records the send as a Touch.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a template (optional)" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Type your message..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending..." : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
