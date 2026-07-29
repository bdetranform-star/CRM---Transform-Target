"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { createContact, getContactOwnerPool } from "@/app/actions/contacts";
import { INDUSTRY_LABELS, LEAD_STATUS_CONFIG, LEAD_SOURCE_LABELS } from "@/lib/status-config";

// Transform-free schema matching what the inputs below actually produce —
// same split rationale as ContactEditForm; the server action re-validates
// with the authoritative contactCreateSchema regardless.
const formSchema = z.object({
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
});
type FormValues = z.infer<typeof formSchema>;

export function ContactCreateForm({
  onCreated,
  onCancel,
}: {
  onCreated: (contactId: string) => void;
  onCancel: () => void;
}) {
  const [owners, setOwners] = useState<string[]>([]);

  useEffect(() => {
    getContactOwnerPool().then(setOwners);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      linkedinUrl: "",
      company: "",
      contactOwner: "",
      leadStatus: "OPEN_PROSPECT",
      industry: "OTHER",
      industryDetail: "",
      leadSource: "OTHER",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const contact = await createContact(values);
      toast.success("Contact created");
      onCreated(contact.id);
    } catch {
      toast.error("Failed to create contact");
    }
  }

  const leadStatus = watch("leadStatus");
  const industry = watch("industry");
  const leadSource = watch("leadSource");
  const contactOwner = watch("contactOwner");

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
        <Select value={contactOwner} onValueChange={(v) => setValue("contactOwner", v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose an owner" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {owners.map((owner) => (
              <SelectItem key={owner} value={owner}>
                {owner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create contact"}
        </Button>
      </div>
    </form>
  );
}
