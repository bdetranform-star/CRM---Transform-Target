"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Contact } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  leadStatusEnum,
  industryEnum,
  leadSourceEnum,
} from "@/lib/validations";
import { updateContact, deleteContact } from "@/app/actions/contacts";
import { INDUSTRY_LABELS, LEAD_STATUS_CONFIG, LEAD_SOURCE_LABELS } from "@/lib/status-config";
import { z } from "zod";

// A plain (transform-free) schema tailored to react-hook-form's field values.
// The server action re-validates with the authoritative `contactUpdateSchema`,
// so this only needs to match what the inputs below actually produce.
const formSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string(),
  email: z.string().email("Enter a valid email"),
  phone: z.string(),
  linkedinUrl: z.string(),
  company: z.string(),
  contactOwner: z.string().min(1, "Contact owner is required"),
  leadStatus: leadStatusEnum,
  industry: industryEnum,
  industryDetail: z.string(),
  leadSource: leadSourceEnum,
  sequenceStep: z.number(),
  smsOptOut: z.boolean(),
});
type FormValues = z.infer<typeof formSchema>;

export function ContactEditForm({
  contact,
  onSaved,
  onDeleted,
}: {
  contact: Contact;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName ?? "",
      email: contact.email,
      phone: contact.phone ?? "",
      linkedinUrl: contact.linkedinUrl ?? "",
      company: contact.company ?? "",
      contactOwner: contact.contactOwner,
      leadStatus: contact.leadStatus,
      industry: contact.industry,
      industryDetail: contact.industryDetail ?? "",
      leadSource: contact.leadSource,
      sequenceStep: contact.sequenceStep,
      smsOptOut: contact.smsOptOut,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await updateContact(values);
      toast.success("Contact saved");
      onSaved?.();
    } catch {
      toast.error("Failed to save contact");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    try {
      await deleteContact(contact.id);
      toast.success("Contact deleted");
      onDeleted?.();
    } catch {
      toast.error("Failed to delete contact");
    }
  }

  const leadStatus = watch("leadStatus");
  const industry = watch("industry");
  const leadSource = watch("leadSource");
  const smsOptOut = watch("smsOptOut");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>First name</Label>
          <Input {...register("firstName")} />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Last name</Label>
          <Input {...register("lastName")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Email</Label>
        <Input type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Phone</Label>
          <Input {...register("phone")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Company</Label>
          <Input {...register("company")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>LinkedIn URL</Label>
        <Input {...register("linkedinUrl")} placeholder="https://www.linkedin.com/in/..." />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Contact owner</Label>
        <Input {...register("contactOwner")} />
        {errors.contactOwner && (
          <p className="text-xs text-destructive">{errors.contactOwner.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Lead status</Label>
          <Select value={leadStatus} onValueChange={(v) => setValue("leadStatus", v as FormValues["leadStatus"])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEAD_STATUS_CONFIG).map(([value, cfg]) => (
                <SelectItem key={value} value={value}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Lead source</Label>
          <Select value={leadSource} onValueChange={(v) => setValue("leadSource", v as FormValues["leadSource"])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Industry</Label>
        <Select value={industry} onValueChange={(v) => setValue("industry", v as FormValues["industry"])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(INDUSTRY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Industry detail</Label>
        <Textarea {...register("industryDetail")} rows={2} placeholder="Free-text niche notes" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={smsOptOut}
          onCheckedChange={(checked) => setValue("smsOptOut", checked === true)}
        />
        SMS opt-out
      </label>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button type="button" variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
