import { z } from "zod";
import type { Prisma } from "@prisma/client";

import {
  LIFECYCLE_STAGE_LABELS,
  INDUSTRY_LABELS,
  INDUSTRY_DETAIL_LABELS,
  LEAD_STATUS_CONFIG,
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
import { CHANNEL_TAG_LABELS } from "@/lib/channel-tags";

export type BulkEditFieldType = "string" | "enum" | "number" | "boolean" | "array_enum" | "date";

export type BulkEditFieldDef = {
  field: string;
  label: string;
  type: BulkEditFieldType;
  options?: { value: string; label: string }[];
};

function optionsFrom(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

/**
 * Every Contact property that's sensible to overwrite in bulk, across
 * multiple selected rows, with one shared value. Deliberately excludes:
 * - `email` — unique per contact; setting the same value on 2+ rows in one
 *   `updateMany` would violate the unique constraint.
 * - `firstName`/`lastName` — per-person identity; setting the same name
 *   across a batch of different people is never actually what's wanted.
 * - `avatarUrl`, `id`, `createdAt`, `updatedAt`, `lastContactDate`,
 *   `lastInterestedReply`, `aiInsightsSummary`, `aiInsightsGeneratedAt` —
 *   system-managed/computed fields, not meant to be hand-overwritten.
 */
export const BULK_EDIT_FIELDS: BulkEditFieldDef[] = [
  { field: "jobTitle", label: "Job Title", type: "string" },
  {
    field: "emailHostProvider",
    label: "Email Host Provider",
    type: "enum",
    options: optionsFrom(EMAIL_HOST_PROVIDER_LABELS),
  },
  { field: "workPhone", label: "Work Phone Number", type: "string" },
  { field: "cellPhone", label: "Cell Phone Number", type: "string" },
  { field: "linkedinUrl", label: "LinkedIn URL", type: "string" },
  { field: "company", label: "Company Name", type: "string" },
  { field: "designation", label: "Designation", type: "string" },
  { field: "websiteUrl", label: "Website URL", type: "string" },
  { field: "streetAddress", label: "Street Address", type: "string" },
  { field: "city", label: "City", type: "string" },
  { field: "state", label: "State", type: "string" },
  { field: "country", label: "Country", type: "string" },
  { field: "zipCode", label: "Zip Code", type: "string" },
  { field: "lifecycleStage", label: "Lifecycle Stage", type: "enum", options: optionsFrom(LIFECYCLE_STAGE_LABELS) },
  {
    field: "leadStatus",
    label: "Lead Status",
    type: "enum",
    options: Object.entries(LEAD_STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })),
  },
  { field: "industry", label: "Industry", type: "enum", options: optionsFrom(INDUSTRY_LABELS) },
  { field: "industryDetail", label: "Industry Detail", type: "enum", options: optionsFrom(INDUSTRY_DETAIL_LABELS) },
  { field: "contactOwner", label: "Contact Owner", type: "enum", options: optionsFrom(TEAM_MEMBER_LABELS) },
  { field: "leadSource", label: "Lead Source", type: "enum", options: optionsFrom(LEAD_SOURCE_LABELS) },
  {
    field: "leadSourceCaptured",
    label: "Lead Source Captured",
    type: "enum",
    options: optionsFrom(LEAD_SOURCE_CAPTURED_LABELS),
  },
  { field: "channelTags", label: "Channel Tag", type: "array_enum", options: optionsFrom(CHANNEL_TAG_LABELS) },
  { field: "websiteTraffic", label: "Website Traffic", type: "number" },
  { field: "numberOfEmployees", label: "Number of Employees", type: "number" },
  { field: "sequenceStep", label: "Sequence Step", type: "number" },
  { field: "smsOptOut", label: "SMS Opted Out", type: "boolean" },
  // LinkedIn Outreach
  {
    field: "linkedinConnectionStatus",
    label: "LinkedIn Status",
    type: "enum",
    options: optionsFrom(LINKEDIN_CONNECTION_STATUS_LABELS),
  },
  { field: "linkedinConnectedOn", label: "LinkedIn Connected On", type: "date" },
  { field: "linkedinPitchNote", label: "Pitch / Connection Request Note", type: "string" },
  { field: "linkedinFollowUp1", label: "1st Follow Up LinkedIn", type: "boolean" },
  { field: "linkedinFollowUp2", label: "2nd Follow Up LinkedIn", type: "boolean" },
  { field: "linkedinFollowUp3", label: "3rd Follow Up LinkedIn", type: "boolean" },
  { field: "linkedinFollowUp4", label: "4th Follow Up LinkedIn", type: "boolean" },
  {
    field: "linkedinLifecycleStage",
    label: "Lifecycle of LinkedIn",
    type: "enum",
    options: optionsFrom(LINKEDIN_LIFECYCLE_STAGE_LABELS),
  },
  {
    field: "interestedResponseFrom",
    label: "Interested Response From",
    type: "enum",
    options: optionsFrom(INTERESTED_RESPONSE_CHANNEL_LABELS),
  },
  // LinkedIn Connection Breakdown
  { field: "linkedinRegion", label: "Region", type: "enum", options: optionsFrom(REGION_LABELS) },
  { field: "linkedinRequestSent", label: "Request Sent", type: "boolean" },
  { field: "linkedinRequestAccepted", label: "Request Accepted", type: "boolean" },
  { field: "linkedinResponse", label: "Response", type: "boolean" },
  { field: "linkedinMeetingBooked", label: "Meeting Booked", type: "boolean" },
  {
    field: "linkedinResponseType",
    label: "Response Type",
    type: "enum",
    options: optionsFrom(LINKEDIN_RESPONSE_TYPE_LABELS),
  },
];

export const BULK_EDIT_FIELD_MAP: Record<string, BulkEditFieldDef> = Object.fromEntries(
  BULK_EDIT_FIELDS.map((f) => [f.field, f])
);

/** A single "set this property to this value" row in a bulk edit. */
export type BulkEditChange = {
  field: string;
  value: string;
};

/**
 * Server-side re-validation for changes coming off the client. Confirms the
 * field is actually one of the bulk-editable properties — a raw zod object
 * schema alone can't express that, hence the `.refine()`.
 */
export const bulkEditChangeSchema = z
  .object({
    field: z.string(),
    value: z.string(),
  })
  .refine((c) => BULK_EDIT_FIELD_MAP[c.field] !== undefined, { message: "Unknown property" });

export const bulkEditContactsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  changes: z.array(bulkEditChangeSchema).min(1),
});

export function isBulkEditChangeComplete(change: BulkEditChange): boolean {
  const def = BULK_EDIT_FIELD_MAP[change.field];
  if (!def) return false;
  if (def.type === "boolean") return change.value === "true" || change.value === "false";
  if (def.type === "enum") return def.options?.some((o) => o.value === change.value) ?? false;
  if (def.type === "array_enum") {
    const allowed = new Set(def.options?.map((o) => o.value));
    return change.value.split(",").filter(Boolean).some((v) => allowed.has(v));
  }
  if (def.type === "date") return !Number.isNaN(new Date(change.value).getTime());
  return change.value.trim() !== "";
}

export function describeBulkEditChange(change: BulkEditChange): string {
  const def = BULK_EDIT_FIELD_MAP[change.field];
  if (!def) return "";
  if (def.type === "enum") {
    const label = def.options?.find((o) => o.value === change.value)?.label ?? change.value;
    return `${def.label} → ${label}`;
  }
  if (def.type === "array_enum") {
    const labels = change.value
      .split(",")
      .filter(Boolean)
      .map((v) => def.options?.find((o) => o.value === v)?.label ?? v);
    return `${def.label} → ${labels.join(", ")}`;
  }
  if (def.type === "boolean") {
    return `${def.label} → ${change.value === "true" ? "Yes" : "No"}`;
  }
  if (def.type === "number") {
    return `${def.label} → ${change.value}`;
  }
  if (def.type === "date") {
    return `${def.label} → ${change.value}`;
  }
  return `${def.label} → "${change.value}"`;
}

/**
 * Builds the Prisma `updateMany` data payload from a set of changes,
 * coercing/validating each value against its field's real type — the same
 * "don't trust a hand-crafted request" posture as `buildWhereFromFilters()`
 * (an invalid enum literal or non-numeric string is dropped rather than
 * passed straight to Prisma). Invalid or incomplete changes are silently
 * skipped, matching `buildWhereFromFilters()`'s own convention.
 */
export function buildBulkUpdateData(changes: BulkEditChange[]): Prisma.ContactUpdateManyMutationInput {
  const data: Record<string, unknown> = {};

  for (const change of changes) {
    const def = BULK_EDIT_FIELD_MAP[change.field];
    if (!def) continue;

    if (def.type === "enum") {
      const allowed = new Set(def.options?.map((o) => o.value));
      if (allowed.has(change.value)) data[def.field] = change.value;
    } else if (def.type === "array_enum") {
      const allowed = new Set(def.options?.map((o) => o.value));
      const values = change.value.split(",").filter((v) => allowed.has(v));
      if (values.length > 0) data[def.field] = values;
    } else if (def.type === "number") {
      const num = Number(change.value);
      if (!Number.isNaN(num)) data[def.field] = num;
    } else if (def.type === "boolean") {
      if (change.value === "true" || change.value === "false") data[def.field] = change.value === "true";
    } else if (def.type === "date") {
      const date = new Date(change.value);
      if (!Number.isNaN(date.getTime())) data[def.field] = date;
    } else if (change.value.trim() !== "") {
      data[def.field] = change.value;
    }
  }

  return data as Prisma.ContactUpdateManyMutationInput;
}

export const companyBulkEditFieldEnum = z.enum(["industry", "contactOwner"]);

export const companyBulkEditSchema = z.object({
  companyNames: z.array(z.string().min(1)).min(1),
  field: companyBulkEditFieldEnum,
  value: z.string().min(1),
});
