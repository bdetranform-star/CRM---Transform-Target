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
} from "@/lib/status-config";

export type BulkEditFieldType = "string" | "enum" | "number" | "boolean";

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
  { field: "workPhone", label: "Work Phone Number", type: "string" },
  { field: "cellPhone", label: "Cell Phone Number", type: "string" },
  { field: "linkedinUrl", label: "LinkedIn URL", type: "string" },
  { field: "company", label: "Company Name", type: "string" },
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
  { field: "websiteTraffic", label: "Website Traffic", type: "number" },
  { field: "numberOfEmployees", label: "Number of Employees", type: "number" },
  { field: "sequenceStep", label: "Sequence Step", type: "number" },
  { field: "smsOptOut", label: "SMS Opted Out", type: "boolean" },
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
  return change.value.trim() !== "";
}

export function describeBulkEditChange(change: BulkEditChange): string {
  const def = BULK_EDIT_FIELD_MAP[change.field];
  if (!def) return "";
  if (def.type === "enum") {
    const label = def.options?.find((o) => o.value === change.value)?.label ?? change.value;
    return `${def.label} → ${label}`;
  }
  if (def.type === "boolean") {
    return `${def.label} → ${change.value === "true" ? "Yes" : "No"}`;
  }
  if (def.type === "number") {
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
    } else if (def.type === "number") {
      const num = Number(change.value);
      if (!Number.isNaN(num)) data[def.field] = num;
    } else if (def.type === "boolean") {
      if (change.value === "true" || change.value === "false") data[def.field] = change.value === "true";
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
