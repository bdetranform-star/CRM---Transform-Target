"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Contact } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  lifecycleStageEnum,
  industryEnum,
  industryDetailEnum,
  leadSourceEnum,
  leadSourceCapturedEnum,
  teamMemberEnum,
} from "@/lib/validations";
import { updateContact, deleteContact } from "@/app/actions/contacts";
import {
  INDUSTRY_LABELS,
  INDUSTRY_DETAIL_LABELS,
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_CAPTURED_LABELS,
  LIFECYCLE_STAGE_LABELS,
  TEAM_MEMBER_LABELS,
} from "@/lib/status-config";
import { z } from "zod";

// A plain (transform-free) schema tailored to react-hook-form's field values.
// The server action re-validates with the authoritative `contactUpdateSchema`,
// so this only needs to match what the inputs below actually produce.
const formSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string(),
  jobTitle: z.string(),
  email: z.string().email("Enter a valid email"),
  workPhone: z.string(),
  cellPhone: z.string(),
  linkedinUrl: z.string(),
  company: z.string(),
  websiteUrl: z.string(),
  numberOfEmployees: z.string(),
  streetAddress: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  zipCode: z.string(),
  contactOwner: teamMemberEnum,
  lifecycleStage: lifecycleStageEnum,
  leadStatus: leadStatusEnum,
  industry: industryEnum,
  industryDetail: z.union([industryDetailEnum, z.literal("")]),
  leadSource: leadSourceEnum,
  leadSourceCaptured: z.union([leadSourceCapturedEnum, z.literal("")]),
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
      jobTitle: contact.jobTitle ?? "",
      email: contact.email,
      workPhone: contact.workPhone ?? "",
      cellPhone: contact.cellPhone ?? "",
      linkedinUrl: contact.linkedinUrl ?? "",
      company: contact.company ?? "",
      websiteUrl: contact.websiteUrl ?? "",
      numberOfEmployees: contact.numberOfEmployees?.toString() ?? "",
      streetAddress: contact.streetAddress ?? "",
      city: contact.city ?? "",
      state: contact.state ?? "",
      country: contact.country ?? "",
      zipCode: contact.zipCode ?? "",
      contactOwner: contact.contactOwner,
      lifecycleStage: contact.lifecycleStage,
      leadStatus: contact.leadStatus,
      industry: contact.industry,
      industryDetail: contact.industryDetail ?? "",
      leadSource: contact.leadSource,
      leadSourceCaptured: contact.leadSourceCaptured ?? "",
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
  const lifecycleStage = watch("lifecycleStage");
  const industry = watch("industry");
  const industryDetail = watch("industryDetail");
  const leadSource = watch("leadSource");
  const leadSourceCaptured = watch("leadSourceCaptured");
  const contactOwner = watch("contactOwner");
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
        <Label>Job title</Label>
        <Input {...register("jobTitle")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Email address</Label>
        <Input type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Work phone number</Label>
          <Input {...register("workPhone")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Cell phone number</Label>
          <Input {...register("cellPhone")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Company name</Label>
        <Input {...register("company")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>LinkedIn URL</Label>
        <Input {...register("linkedinUrl")} placeholder="https://www.linkedin.com/in/..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Website URL</Label>
          <Input {...register("websiteUrl")} placeholder="https://..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Number of employees</Label>
          <Input type="number" min={0} {...register("numberOfEmployees")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Street address</Label>
          <Input {...register("streetAddress")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>City</Label>
          <Input {...register("city")} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>State</Label>
          <Input {...register("state")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Country</Label>
          <Input {...register("country")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Zip code</Label>
          <Input {...register("zipCode")} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Contact owner</Label>
        <Select value={contactOwner} onValueChange={(v) => setValue("contactOwner", v as FormValues["contactOwner"])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TEAM_MEMBER_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Lifecycle stage</Label>
          <Select value={lifecycleStage} onValueChange={(v) => setValue("lifecycleStage", v as FormValues["lifecycleStage"])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LIFECYCLE_STAGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
      </div>

      <div className="grid grid-cols-2 gap-3">
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
          <Select
            value={industryDetail || undefined}
            onValueChange={(v) => setValue("industryDetail", v as FormValues["industryDetail"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {Object.entries(INDUSTRY_DETAIL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div className="flex flex-col gap-1.5">
          <Label>Lead source captured</Label>
          <Select
            value={leadSourceCaptured || undefined}
            onValueChange={(v) => setValue("leadSourceCaptured", v as FormValues["leadSourceCaptured"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LEAD_SOURCE_CAPTURED_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
