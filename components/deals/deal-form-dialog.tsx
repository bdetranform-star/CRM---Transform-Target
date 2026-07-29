"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import type { Deal } from "@prisma/client";

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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createDeal, updateDeal } from "@/app/actions/deals";
import { DEAL_STAGE_LABELS } from "@/lib/status-config";

type ContactOption = { id: string; firstName: string; lastName: string | null; company: string | null };

const formSchema = z.object({
  contactId: z.string().min(1, "Choose a contact"),
  title: z.string().min(1, "Deal title is required"),
  value: z.string(),
  stage: z.enum(["NEW", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"]),
});
type FormValues = z.infer<typeof formSchema>;

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  contacts,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
  contacts: ContactOption[];
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactId: deal?.contactId ?? "",
      title: deal?.title ?? "",
      value: deal?.value?.toString() ?? "",
      stage: deal?.stage ?? "NEW",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (deal) {
        await updateDeal({ id: deal.id, ...values });
        toast.success("Deal updated");
      } else {
        await createDeal(values);
        toast.success("Deal created");
      }
      reset();
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Failed to save deal");
    }
  }

  const contactId = watch("contactId");
  const stage = watch("stage");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{deal ? "Edit deal" : "New deal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Contact</Label>
            <Select value={contactId} onValueChange={(v) => setValue("contactId", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a contact" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName ?? ""} {c.company ? `— ${c.company}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contactId && (
              <p className="text-xs text-destructive">{errors.contactId.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Deal title</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Value ($)</Label>
              <Input type="number" min={0} step="0.01" {...register("value")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={(v) => setValue("stage", v as FormValues["stage"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEAL_STAGE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
