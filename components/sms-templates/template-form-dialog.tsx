"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { SmsTemplate } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSmsTemplate, updateSmsTemplate } from "@/app/actions/sms-templates";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  body: z.string().trim().min(1, "Body is required"),
});
type FormValues = z.infer<typeof formSchema>;

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: SmsTemplate | null;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: template?.name ?? "", body: template?.body ?? "" },
  });

  useEffect(() => {
    reset({ name: template?.name ?? "", body: template?.body ?? "" });
  }, [template, reset]);

  async function onSubmit(values: FormValues) {
    try {
      if (template) {
        await updateSmsTemplate({ id: template.id, ...values });
        toast.success("Template updated");
      } else {
        await createSmsTemplate(values);
        toast.success("Template created");
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Failed to save template");
    }
  }

  const bodyValue = watch("body") ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{template ? "Edit template" : "New template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input {...register("name")} placeholder="e.g. Post-call follow-up" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Body</Label>
            <Textarea
              {...register("body")}
              rows={5}
              placeholder="Hi {{firstName}}, following up about {{company}}..."
            />
            {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
            <p className="text-xs text-muted-foreground">
              {bodyValue.length} characters. Tokens: {"{{firstName}}"}, {"{{company}}"},{" "}
              {"{{industryDetail}}"}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
