"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChannelTagToggleGroup } from "@/components/channel-tags";
import { DatePicker } from "@/components/ui/date-picker";
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
  linkedinConnectionStatusEnum,
  linkedinLifecycleStageEnum,
  interestedResponseChannelEnum,
  channelTagEnum,
} from "@/lib/validations";
import { createContact, getContactOwnerPool } from "@/app/actions/contacts";
import {
  INDUSTRY_LABELS,
  INDUSTRY_DETAIL_LABELS,
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_CAPTURED_LABELS,
  LIFECYCLE_STAGE_LABELS,
  TEAM_MEMBER_LABELS,
  LINKEDIN_CONNECTION_STATUS_LABELS,
  LINKEDIN_LIFECYCLE_STAGE_LABELS,
  INTERESTED_RESPONSE_CHANNEL_LABELS,
} from "@/lib/status-config";

// Transform-free schema matching what the inputs below actually produce —
// the server action re-validates with the authoritative contactCreateSchema
// regardless (see the "Forms" convention note in CLAUDE.md).
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string(),
  jobTitle: z.string(),
  email: z.string().email("Enter a valid email"),
  workPhone: z.string(),
  cellPhone: z.string(),
  linkedinUrl: z.string(),
  company: z.string(),
  designation: z.string(),
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
  channelTags: z.array(channelTagEnum),
  linkedinConnectionStatus: z.union([linkedinConnectionStatusEnum, z.literal("")]),
  linkedinConnectedOn: z.date().optional(),
  linkedinPitchNote: z.string(),
  linkedinFollowUp1: z.boolean(),
  linkedinFollowUp2: z.boolean(),
  linkedinFollowUp3: z.boolean(),
  linkedinFollowUp4: z.boolean(),
  linkedinLifecycleStage: z.union([linkedinLifecycleStageEnum, z.literal("")]),
  interestedResponseFrom: z.union([interestedResponseChannelEnum, z.literal("")]),
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
      jobTitle: "",
      email: "",
      workPhone: "",
      cellPhone: "",
      linkedinUrl: "",
      company: "",
      designation: "",
      websiteUrl: "",
      numberOfEmployees: "",
      streetAddress: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
      contactOwner: "" as never,
      lifecycleStage: "LEAD",
      leadStatus: "NEW_LEAD",
      industry: "FACILITY_MAINTENANCE_COMPANIES",
      industryDetail: "",
      leadSource: "OTHER",
      leadSourceCaptured: "",
      channelTags: [],
      linkedinConnectionStatus: "",
      linkedinPitchNote: "",
      linkedinFollowUp1: false,
      linkedinFollowUp2: false,
      linkedinFollowUp3: false,
      linkedinFollowUp4: false,
      linkedinLifecycleStage: "",
      interestedResponseFrom: "",
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
  const lifecycleStage = watch("lifecycleStage");
  const industry = watch("industry");
  const industryDetail = watch("industryDetail");
  const leadSource = watch("leadSource");
  const leadSourceCaptured = watch("leadSourceCaptured");
  const channelTags = watch("channelTags");
  const contactOwner = watch("contactOwner");
  const linkedinConnectionStatus = watch("linkedinConnectionStatus");
  const linkedinConnectedOn = watch("linkedinConnectedOn");
  const linkedinLifecycleStage = watch("linkedinLifecycleStage");
  const interestedResponseFrom = watch("interestedResponseFrom");
  const linkedinFollowUp1 = watch("linkedinFollowUp1");
  const linkedinFollowUp2 = watch("linkedinFollowUp2");
  const linkedinFollowUp3 = watch("linkedinFollowUp3");
  const linkedinFollowUp4 = watch("linkedinFollowUp4");

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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Company name</Label>
          <Input {...register("company")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Designation</Label>
          <Input {...register("designation")} />
        </div>
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
            <SelectValue placeholder="Choose an owner" />
          </SelectTrigger>
          <SelectContent>
            {owners.map((owner) => (
              <SelectItem key={owner} value={owner}>
                {TEAM_MEMBER_LABELS[owner as keyof typeof TEAM_MEMBER_LABELS]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.contactOwner && (
          <p className="text-xs text-destructive">Contact owner is required</p>
        )}
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

      <div className="flex flex-col gap-1.5">
        <Label>Channel Tag</Label>
        <ChannelTagToggleGroup
          value={channelTags}
          onChange={(next) => setValue("channelTags", next)}
        />
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 text-sm font-semibold">LinkedIn Outreach</h3>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>LinkedIn Status</Label>
              <Select
                value={linkedinConnectionStatus || undefined}
                onValueChange={(v) =>
                  setValue("linkedinConnectionStatus", v as FormValues["linkedinConnectionStatus"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LINKEDIN_CONNECTION_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Lifecycle of LinkedIn</Label>
              <Select
                value={linkedinLifecycleStage || undefined}
                onValueChange={(v) =>
                  setValue("linkedinLifecycleStage", v as FormValues["linkedinLifecycleStage"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LINKEDIN_LIFECYCLE_STAGE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>LinkedIn Connected On</Label>
            <DatePicker
              value={linkedinConnectedOn}
              onChange={(date) => setValue("linkedinConnectedOn", date)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Pitch / Connection Request Note</Label>
            <Textarea {...register("linkedinPitchNote")} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between gap-2 rounded-md border border-input px-3 py-2">
              <Label className="font-normal">1st Follow Up LinkedIn</Label>
              <Switch
                checked={linkedinFollowUp1}
                onCheckedChange={(v) => setValue("linkedinFollowUp1", v)}
              />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-input px-3 py-2">
              <Label className="font-normal">2nd Follow Up LinkedIn</Label>
              <Switch
                checked={linkedinFollowUp2}
                onCheckedChange={(v) => setValue("linkedinFollowUp2", v)}
              />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-input px-3 py-2">
              <Label className="font-normal">3rd Follow Up LinkedIn</Label>
              <Switch
                checked={linkedinFollowUp3}
                onCheckedChange={(v) => setValue("linkedinFollowUp3", v)}
              />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-input px-3 py-2">
              <Label className="font-normal">4th Follow Up LinkedIn</Label>
              <Switch
                checked={linkedinFollowUp4}
                onCheckedChange={(v) => setValue("linkedinFollowUp4", v)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Interested Response From</Label>
            <Select
              value={interestedResponseFrom || undefined}
              onValueChange={(v) => setValue("interestedResponseFrom", v as FormValues["interestedResponseFrom"])}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INTERESTED_RESPONSE_CHANNEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
