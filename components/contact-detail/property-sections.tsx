"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Contact } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { YesNoSelect } from "@/components/ui/yes-no-select";
import { InlineSelect, type InlineSelectOption } from "@/components/ui/inline-select";
import { updateContact } from "@/app/actions/contacts";
import { ChannelTagToggleGroup, ChannelTagBadges } from "@/components/channel-tags";
import {
  LIFECYCLE_STAGE_LABELS,
  LEAD_STATUS_CONFIG,
  INDUSTRY_LABELS,
  INDUSTRY_DETAIL_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_CAPTURED_LABELS,
  TEAM_MEMBER_LABELS,
  LINKEDIN_CONNECTION_STATUS_LABELS,
  LINKEDIN_LIFECYCLE_STAGE_LABELS,
  INTERESTED_RESPONSE_CHANNEL_LABELS,
  REGION_LABELS,
  LINKEDIN_RESPONSE_TYPE_LABELS,
  EMAIL_HOST_PROVIDER_LABELS,
} from "@/lib/status-config";

function optionsFrom(labels: Record<string, string>): InlineSelectOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

const LIFECYCLE_STAGE_OPTIONS = optionsFrom(LIFECYCLE_STAGE_LABELS);
const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUS_CONFIG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));
const INDUSTRY_OPTIONS = optionsFrom(INDUSTRY_LABELS);
const INDUSTRY_DETAIL_OPTIONS = optionsFrom(INDUSTRY_DETAIL_LABELS);
const TEAM_MEMBER_OPTIONS = optionsFrom(TEAM_MEMBER_LABELS);
const LEAD_SOURCE_OPTIONS = optionsFrom(LEAD_SOURCE_LABELS);
const LEAD_SOURCE_CAPTURED_OPTIONS = optionsFrom(LEAD_SOURCE_CAPTURED_LABELS);
const LINKEDIN_CONNECTION_STATUS_OPTIONS = optionsFrom(LINKEDIN_CONNECTION_STATUS_LABELS);
const LINKEDIN_LIFECYCLE_STAGE_OPTIONS = optionsFrom(LINKEDIN_LIFECYCLE_STAGE_LABELS);
const INTERESTED_RESPONSE_CHANNEL_OPTIONS = optionsFrom(INTERESTED_RESPONSE_CHANNEL_LABELS);
const REGION_OPTIONS = optionsFrom(REGION_LABELS);
const LINKEDIN_RESPONSE_TYPE_OPTIONS = optionsFrom(LINKEDIN_RESPONSE_TYPE_LABELS);
const EMAIL_HOST_PROVIDER_OPTIONS = optionsFrom(EMAIL_HOST_PROVIDER_LABELS);

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value || <span className="text-muted-foreground">--</span>}</p>
    </div>
  );
}

/** An always-live, click-to-edit property row — the HubSpot-style inline editor. */
function InlineSelectField({
  label,
  value,
  options,
  nullable,
  contactId,
  field,
  onSaved,
}: {
  label: string;
  value: string | null;
  options: InlineSelectOption[];
  nullable?: boolean;
  contactId: string;
  field: string;
  onSaved: () => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <InlineSelect
        value={value}
        options={options}
        nullable={nullable}
        onSave={(v) => save({ [field]: v }, contactId, onSaved)}
      />
    </div>
  );
}

function SectionShell({
  title,
  editing,
  onEdit,
  children,
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border py-4 first:pt-0 last:border-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Edit ${title}`}
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

async function save(patch: Record<string, unknown>, id: string, onSaved: () => void) {
  try {
    await updateContact({ id, ...patch });
    toast.success("Saved");
    onSaved();
  } catch {
    toast.error("Failed to save");
  }
}

export function ContactInfoSection({ contact, onSaved }: { contact: Contact; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName ?? "",
    jobTitle: contact.jobTitle ?? "",
    email: contact.email ?? "",
    workPhone: contact.workPhone ?? "",
    cellPhone: contact.cellPhone ?? "",
    linkedinUrl: contact.linkedinUrl ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    await save(values, contact.id, () => {
      setEditing(false);
      onSaved();
    });
    setSubmitting(false);
  }

  return (
    <SectionShell title="Contact info" editing={editing} onEdit={() => setEditing(true)}>
      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label>First name</Label>
              <Input
                value={values.firstName}
                onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Last name</Label>
              <Input
                value={values.lastName}
                onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Job title</Label>
            <Input
              value={values.jobTitle}
              onChange={(e) => setValues((v) => ({ ...v, jobTitle: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Work phone</Label>
            <Input
              value={values.workPhone}
              onChange={(e) => setValues((v) => ({ ...v, workPhone: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Cell phone</Label>
            <Input
              value={values.cellPhone}
              onChange={(e) => setValues((v) => ({ ...v, cellPhone: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>LinkedIn URL</Label>
            <Input
              value={values.linkedinUrl}
              onChange={(e) => setValues((v) => ({ ...v, linkedinUrl: e.target.value }))}
              placeholder="https://www.linkedin.com/in/..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={submitting}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label="Email" value={contact.email} />
          <Field label="Work phone" value={contact.workPhone} />
          <Field label="Cell phone" value={contact.cellPhone} />
          <Field
            label="LinkedIn"
            value={
              contact.linkedinUrl ? (
                <a
                  href={contact.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-teal)] hover:underline"
                >
                  View profile
                </a>
              ) : null
            }
          />
        </div>
      )}
    </SectionShell>
  );
}

export function CompanyInfoSection({ contact, onSaved }: { contact: Contact; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    company: contact.company ?? "",
    designation: contact.designation ?? "",
    websiteUrl: contact.websiteUrl ?? "",
    numberOfEmployees: contact.numberOfEmployees?.toString() ?? "",
    streetAddress: contact.streetAddress ?? "",
    city: contact.city ?? "",
    state: contact.state ?? "",
    country: contact.country ?? "",
    zipCode: contact.zipCode ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    await save(values, contact.id, () => {
      setEditing(false);
      onSaved();
    });
    setSubmitting(false);
  }

  return (
    <SectionShell title="Company info" editing={editing} onEdit={() => setEditing(true)}>
      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label>Company name</Label>
            <Input
              value={values.company}
              onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Designation</Label>
            <Input
              value={values.designation}
              onChange={(e) => setValues((v) => ({ ...v, designation: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Website URL</Label>
            <Input
              value={values.websiteUrl}
              onChange={(e) => setValues((v) => ({ ...v, websiteUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Number of employees</Label>
            <Input
              type="number"
              min={0}
              value={values.numberOfEmployees}
              onChange={(e) => setValues((v) => ({ ...v, numberOfEmployees: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Street address</Label>
            <Input
              value={values.streetAddress}
              onChange={(e) => setValues((v) => ({ ...v, streetAddress: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label>City</Label>
              <Input value={values.city} onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>State</Label>
              <Input value={values.state} onChange={(e) => setValues((v) => ({ ...v, state: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <Label>Country</Label>
              <Input
                value={values.country}
                onChange={(e) => setValues((v) => ({ ...v, country: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Zip code</Label>
              <Input
                value={values.zipCode}
                onChange={(e) => setValues((v) => ({ ...v, zipCode: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={submitting}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Field label="Company name" value={contact.company} />
          <Field label="Designation" value={contact.designation} />
          <Field
            label="Website"
            value={
              contact.websiteUrl ? (
                <a
                  href={contact.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-teal)] hover:underline"
                >
                  {contact.websiteUrl}
                </a>
              ) : null
            }
          />
          <Field label="Number of employees" value={contact.numberOfEmployees?.toLocaleString()} />
          <Field
            label="Address"
            value={[contact.streetAddress, contact.city, contact.state, contact.country, contact.zipCode]
              .filter(Boolean)
              .join(", ")}
          />
        </div>
      )}
      <InlineSelectField
        label="Email Host Provider"
        value={contact.emailHostProvider}
        options={EMAIL_HOST_PROVIDER_OPTIONS}
        nullable
        contactId={contact.id}
        field="emailHostProvider"
        onSaved={onSaved}
      />
    </SectionShell>
  );
}

export function LeadInfoSection({ contact, onSaved }: { contact: Contact; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [channelTags, setChannelTags] = useState(contact.channelTags);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    await save({ channelTags }, contact.id, () => {
      setEditing(false);
      onSaved();
    });
    setSubmitting(false);
  }

  return (
    <SectionShell title="Lead info" editing={editing} onEdit={() => setEditing(true)}>
      <div className="flex flex-col gap-3">
        <InlineSelectField
          label="Lifecycle stage"
          value={contact.lifecycleStage}
          options={LIFECYCLE_STAGE_OPTIONS}
          contactId={contact.id}
          field="lifecycleStage"
          onSaved={onSaved}
        />
        <InlineSelectField
          label="Lead status"
          value={contact.leadStatus}
          options={LEAD_STATUS_OPTIONS}
          contactId={contact.id}
          field="leadStatus"
          onSaved={onSaved}
        />
        <InlineSelectField
          label="Industry"
          value={contact.industry}
          options={INDUSTRY_OPTIONS}
          contactId={contact.id}
          field="industry"
          onSaved={onSaved}
        />
        <InlineSelectField
          label="Industry detail"
          value={contact.industryDetail}
          options={INDUSTRY_DETAIL_OPTIONS}
          nullable
          contactId={contact.id}
          field="industryDetail"
          onSaved={onSaved}
        />
        <InlineSelectField
          label="Contact owner"
          value={contact.contactOwner}
          options={TEAM_MEMBER_OPTIONS}
          contactId={contact.id}
          field="contactOwner"
          onSaved={onSaved}
        />
        <InlineSelectField
          label="Lead source"
          value={contact.leadSource}
          options={LEAD_SOURCE_OPTIONS}
          contactId={contact.id}
          field="leadSource"
          onSaved={onSaved}
        />
        <InlineSelectField
          label="Lead source captured"
          value={contact.leadSourceCaptured}
          options={LEAD_SOURCE_CAPTURED_OPTIONS}
          nullable
          contactId={contact.id}
          field="leadSourceCaptured"
          onSaved={onSaved}
        />
        {editing ? (
          <div className="flex flex-col gap-1">
            <Label>Channel Tag</Label>
            <ChannelTagToggleGroup value={channelTags} onChange={setChannelTags} />
            <div className="mt-2 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={submitting}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <Field label="Channel Tag" value={<ChannelTagBadges tags={contact.channelTags} />} />
        )}
      </div>
    </SectionShell>
  );
}

export function LinkedinOutreachSection({ contact, onSaved }: { contact: Contact; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    linkedinConnectedOn: contact.linkedinConnectedOn ?? undefined,
    linkedinPitchNote: contact.linkedinPitchNote ?? "",
    linkedinFollowUp1: contact.linkedinFollowUp1 ?? false,
    linkedinFollowUp2: contact.linkedinFollowUp2 ?? false,
    linkedinFollowUp3: contact.linkedinFollowUp3 ?? false,
    linkedinFollowUp4: contact.linkedinFollowUp4 ?? false,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    await save(values, contact.id, () => {
      setEditing(false);
      onSaved();
    });
    setSubmitting(false);
  }

  return (
    <SectionShell title="LinkedIn Outreach" editing={editing} onEdit={() => setEditing(true)}>
      <div className="flex flex-col gap-3">
        <InlineSelectField
          label="LinkedIn Status"
          value={contact.linkedinConnectionStatus}
          options={LINKEDIN_CONNECTION_STATUS_OPTIONS}
          nullable
          contactId={contact.id}
          field="linkedinConnectionStatus"
          onSaved={onSaved}
        />
        {editing ? (
          <>
            <div className="flex flex-col gap-1">
              <Label>LinkedIn Connected On</Label>
              <DatePicker
                value={values.linkedinConnectedOn}
                onChange={(date) => setValues((s) => ({ ...s, linkedinConnectedOn: date }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Pitch / Connection Request Note</Label>
              <Textarea
                value={values.linkedinPitchNote}
                onChange={(e) => setValues((v) => ({ ...v, linkedinPitchNote: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between gap-2 rounded-md border border-input px-3 py-2">
                <Label className="font-normal">1st Follow Up LinkedIn</Label>
                <Switch
                  checked={values.linkedinFollowUp1}
                  onCheckedChange={(v) => setValues((s) => ({ ...s, linkedinFollowUp1: v }))}
                />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md border border-input px-3 py-2">
                <Label className="font-normal">2nd Follow Up LinkedIn</Label>
                <Switch
                  checked={values.linkedinFollowUp2}
                  onCheckedChange={(v) => setValues((s) => ({ ...s, linkedinFollowUp2: v }))}
                />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md border border-input px-3 py-2">
                <Label className="font-normal">3rd Follow Up LinkedIn</Label>
                <Switch
                  checked={values.linkedinFollowUp3}
                  onCheckedChange={(v) => setValues((s) => ({ ...s, linkedinFollowUp3: v }))}
                />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md border border-input px-3 py-2">
                <Label className="font-normal">4th Follow Up LinkedIn</Label>
                <Switch
                  checked={values.linkedinFollowUp4}
                  onCheckedChange={(v) => setValues((s) => ({ ...s, linkedinFollowUp4: v }))}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <Field
              label="LinkedIn Connected On"
              value={contact.linkedinConnectedOn ? format(contact.linkedinConnectedOn, "MM/dd/yyyy") : null}
            />
            <Field label="Pitch / Connection Request Note" value={contact.linkedinPitchNote} />
            <Field label="1st Follow Up LinkedIn" value={contact.linkedinFollowUp1 ? "Yes" : "No"} />
            <Field label="2nd Follow Up LinkedIn" value={contact.linkedinFollowUp2 ? "Yes" : "No"} />
            <Field label="3rd Follow Up LinkedIn" value={contact.linkedinFollowUp3 ? "Yes" : "No"} />
            <Field label="4th Follow Up LinkedIn" value={contact.linkedinFollowUp4 ? "Yes" : "No"} />
          </>
        )}
        <InlineSelectField
          label="Lifecycle of LinkedIn"
          value={contact.linkedinLifecycleStage}
          options={LINKEDIN_LIFECYCLE_STAGE_OPTIONS}
          nullable
          contactId={contact.id}
          field="linkedinLifecycleStage"
          onSaved={onSaved}
        />
        <InlineSelectField
          label="Interested Response From"
          value={contact.interestedResponseFrom}
          options={INTERESTED_RESPONSE_CHANNEL_OPTIONS}
          nullable
          contactId={contact.id}
          field="interestedResponseFrom"
          onSaved={onSaved}
        />
        {editing && (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={submitting}>
              Save
            </Button>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

export function LinkedinConnectionBreakdownSection({
  contact,
  onSaved,
}: {
  contact: Contact;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    linkedinRequestSent: contact.linkedinRequestSent ?? null,
    linkedinRequestAccepted: contact.linkedinRequestAccepted ?? null,
    linkedinResponse: contact.linkedinResponse ?? null,
    linkedinMeetingBooked: contact.linkedinMeetingBooked ?? null,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    setSubmitting(true);
    await save(values, contact.id, () => {
      setEditing(false);
      onSaved();
    });
    setSubmitting(false);
  }

  return (
    <SectionShell
      title="LinkedIn Connection Breakdown"
      editing={editing}
      onEdit={() => setEditing(true)}
    >
      <div className="flex flex-col gap-3">
        <InlineSelectField
          label="Region"
          value={contact.linkedinRegion}
          options={REGION_OPTIONS}
          nullable
          contactId={contact.id}
          field="linkedinRegion"
          onSaved={onSaved}
        />
        {editing ? (
          <>
            <div className="flex flex-col gap-1">
              <Label>Request Sent</Label>
              <YesNoSelect
                value={values.linkedinRequestSent}
                onChange={(v) => setValues((s) => ({ ...s, linkedinRequestSent: v }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Request Accepted</Label>
              <YesNoSelect
                value={values.linkedinRequestAccepted}
                onChange={(v) => setValues((s) => ({ ...s, linkedinRequestAccepted: v }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Response</Label>
              <YesNoSelect
                value={values.linkedinResponse}
                onChange={(v) => setValues((s) => ({ ...s, linkedinResponse: v }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Meeting Booked</Label>
              <YesNoSelect
                value={values.linkedinMeetingBooked}
                onChange={(v) => setValues((s) => ({ ...s, linkedinMeetingBooked: v }))}
              />
            </div>
          </>
        ) : (
          <>
            <Field label="Request Sent" value={contact.linkedinRequestSent ? "Yes" : "No"} />
            <Field label="Request Accepted" value={contact.linkedinRequestAccepted ? "Yes" : "No"} />
            <Field label="Response" value={contact.linkedinResponse ? "Yes" : "No"} />
            <Field label="Meeting Booked" value={contact.linkedinMeetingBooked ? "Yes" : "No"} />
          </>
        )}
        <InlineSelectField
          label="Response Type"
          value={contact.linkedinResponseType}
          options={LINKEDIN_RESPONSE_TYPE_OPTIONS}
          nullable
          contactId={contact.id}
          field="linkedinResponseType"
          onSaved={onSaved}
        />
        {editing && (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={submitting}>
              Save
            </Button>
          </div>
        )}
      </div>
    </SectionShell>
  );
}

export function DatesSection({ contact }: { contact: Contact }) {
  function fmt(date: Date | null) {
    return date ? format(new Date(date), "MMM d, yyyy") : null;
  }

  return (
    <div className="py-4">
      <h3 className="mb-3 text-sm font-semibold">Dates</h3>
      <div className="flex flex-col gap-3">
        <Field label="Last interested reply" value={fmt(contact.lastInterestedReply)} />
        <Field label="Last contact date" value={fmt(contact.lastContactDate)} />
        <Field label="Created date" value={fmt(contact.createdAt)} />
      </div>
    </div>
  );
}
