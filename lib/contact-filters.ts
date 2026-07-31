import { z } from "zod";
import { subDays, endOfDay, format } from "date-fns";
import type { Prisma } from "@prisma/client";

import {
  LEAD_STATUS_CONFIG,
  LIFECYCLE_STAGE_LABELS,
  INDUSTRY_LABELS,
  INDUSTRY_DETAIL_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_CAPTURED_LABELS,
  TEAM_MEMBER_LABELS,
  LINKEDIN_CONNECTION_STATUS_LABELS,
  LINKEDIN_LIFECYCLE_STAGE_LABELS,
  INTERESTED_RESPONSE_CHANNEL_LABELS,
} from "@/lib/status-config";
import { CHANNEL_TAG_LABELS } from "@/lib/channel-tags";

export type FilterFieldType = "string" | "phone" | "enum" | "number" | "date" | "boolean" | "array_enum";

export type FilterFieldDef = {
  field: string;
  label: string;
  type: FilterFieldType;
  options?: { value: string; label: string }[];
};

function optionsFrom(labels: Record<string, string>) {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

export const FILTERABLE_FIELDS: FilterFieldDef[] = [
  // Text properties
  { field: "firstName", label: "First Name", type: "string" },
  { field: "lastName", label: "Last Name", type: "string" },
  { field: "jobTitle", label: "Job Title", type: "string" },
  { field: "email", label: "Email Address", type: "string" },
  { field: "company", label: "Company Name", type: "string" },
  { field: "websiteUrl", label: "Website URL", type: "string" },
  { field: "linkedinUrl", label: "LinkedIn URL", type: "string" },
  { field: "streetAddress", label: "Street Address", type: "string" },
  { field: "city", label: "City", type: "string" },
  { field: "state", label: "State", type: "string" },
  { field: "country", label: "Country", type: "string" },
  { field: "zipCode", label: "Zip Code", type: "string" },
  // Phone properties — no "is equal to", just contains/known/unknown
  { field: "workPhone", label: "Work Phone Number", type: "phone" },
  { field: "cellPhone", label: "Cell Phone Number", type: "phone" },
  // Dropdown/enum properties
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
  // Multi-select tag property — a Contact can carry any combination of these
  { field: "channelTags", label: "Channel Tag", type: "array_enum", options: optionsFrom(CHANNEL_TAG_LABELS) },
  // Number properties
  { field: "websiteTraffic", label: "Website Traffic", type: "number" },
  { field: "numberOfEmployees", label: "Number of Employees", type: "number" },
  // Date properties
  { field: "lastInterestedReply", label: "Last Interested Reply", type: "date" },
  { field: "lastContactDate", label: "Last Contact Date", type: "date" },
  { field: "createdAt", label: "Created Date", type: "date" },
  // LinkedIn outreach properties
  { field: "designation", label: "Designation", type: "string" },
  {
    field: "linkedinConnectionStatus",
    label: "LinkedIn Status",
    type: "enum",
    options: optionsFrom(LINKEDIN_CONNECTION_STATUS_LABELS),
  },
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
];

export const FILTER_FIELD_MAP: Record<string, FilterFieldDef> = Object.fromEntries(
  FILTERABLE_FIELDS.map((f) => [f.field, f])
);

export type FilterOperator =
  | "contains"
  | "equals"
  | "is_known"
  | "is_unknown"
  | "is_any_of"
  | "is_none_of"
  | "gt"
  | "lt"
  | "between"
  | "after"
  | "before"
  | "in_last_days"
  | "is_true"
  | "is_false";

export const OPERATORS_BY_TYPE: Record<FilterFieldType, { value: FilterOperator; label: string }[]> = {
  string: [
    { value: "contains", label: "contains" },
    { value: "equals", label: "is equal to" },
    { value: "is_known", label: "is known" },
    { value: "is_unknown", label: "is unknown" },
  ],
  phone: [
    { value: "contains", label: "contains" },
    { value: "is_known", label: "is known" },
    { value: "is_unknown", label: "is unknown" },
  ],
  enum: [
    { value: "is_any_of", label: "is any of" },
    { value: "is_none_of", label: "is none of" },
  ],
  array_enum: [
    { value: "is_any_of", label: "is any of" },
    { value: "is_none_of", label: "is none of" },
  ],
  number: [
    { value: "equals", label: "equals" },
    { value: "gt", label: "greater than" },
    { value: "lt", label: "less than" },
    { value: "between", label: "between" },
  ],
  date: [
    { value: "after", label: "is after" },
    { value: "before", label: "is before" },
    { value: "between", label: "is between" },
    { value: "in_last_days", label: "in the last (days)" },
  ],
  boolean: [
    { value: "is_true", label: "is Yes" },
    { value: "is_false", label: "is No" },
  ],
};

/**
 * A filter's value lives in one of three shapes depending on its operator:
 * `value` (single scalar — contains/equals/gt/lt/after/before/in_last_days),
 * `values` (multi-select — is_any_of/is_none_of), or `valueMin`/`valueMax`
 * (between). is_known/is_unknown need none of them.
 */
export type ContactFilter = {
  field: string;
  operator: FilterOperator;
  value?: string;
  values?: string[];
  valueMin?: string;
  valueMax?: string;
};

const filterOperatorSchema = z.enum([
  "contains",
  "equals",
  "is_known",
  "is_unknown",
  "is_any_of",
  "is_none_of",
  "gt",
  "lt",
  "between",
  "after",
  "before",
  "in_last_days",
  "is_true",
  "is_false",
]);

/**
 * Server-side re-validation for filters coming off the client (URL param
 * JSON). Confirms the field actually exists and the operator is one this
 * field's type actually supports — a raw zod object schema alone can't
 * express that cross-field dependency, hence the .refine()s.
 */
export const contactFilterSchema = z
  .object({
    field: z.string(),
    operator: filterOperatorSchema,
    value: z.string().optional(),
    values: z.array(z.string()).optional(),
    valueMin: z.string().optional(),
    valueMax: z.string().optional(),
  })
  .refine((f) => FILTER_FIELD_MAP[f.field] !== undefined, { message: "Unknown filter field" })
  .refine(
    (f) => {
      const def = FILTER_FIELD_MAP[f.field];
      return def ? OPERATORS_BY_TYPE[def.type].some((o) => o.value === f.operator) : false;
    },
    { message: "Operator not valid for this field's type" }
  );

export function isFilterComplete(filter: ContactFilter): boolean {
  const def = FILTER_FIELD_MAP[filter.field];
  if (!def) return false;
  if (filter.operator === "is_known" || filter.operator === "is_unknown") return true;
  if (filter.operator === "is_true" || filter.operator === "is_false") return true;
  if (filter.operator === "is_any_of" || filter.operator === "is_none_of") {
    return (filter.values?.length ?? 0) > 0;
  }
  if (filter.operator === "between") return !!filter.valueMin && !!filter.valueMax;
  return !!filter.value && filter.value.trim() !== "";
}

export function buildWhereFromFilters(filters: ContactFilter[]): Prisma.ContactWhereInput {
  const and: Prisma.ContactWhereInput[] = [];

  for (const filter of filters) {
    const def = FILTER_FIELD_MAP[filter.field];
    if (!def) continue;

    if (def.type === "string" || def.type === "phone") {
      if (filter.operator === "is_known") {
        and.push({ [def.field]: { not: null } } as Prisma.ContactWhereInput);
      } else if (filter.operator === "is_unknown") {
        and.push({ [def.field]: null } as Prisma.ContactWhereInput);
      } else if (filter.operator === "equals" && filter.value) {
        and.push({ [def.field]: { equals: filter.value } } as Prisma.ContactWhereInput);
      } else if (filter.operator === "contains" && filter.value) {
        and.push({ [def.field]: { contains: filter.value, mode: "insensitive" } } as Prisma.ContactWhereInput);
      }
    } else if (def.type === "enum") {
      const allowed = new Set(def.options?.map((o) => o.value));
      const values = (filter.values ?? []).filter((v) => allowed.has(v));
      if (values.length === 0) continue;
      if (filter.operator === "is_any_of") {
        and.push({ [def.field]: { in: values } } as Prisma.ContactWhereInput);
      } else if (filter.operator === "is_none_of") {
        and.push({ [def.field]: { notIn: values } } as Prisma.ContactWhereInput);
      }
    } else if (def.type === "array_enum") {
      const allowed = new Set(def.options?.map((o) => o.value));
      const values = (filter.values ?? []).filter((v) => allowed.has(v));
      if (values.length === 0) continue;
      if (filter.operator === "is_any_of") {
        and.push({ [def.field]: { hasSome: values } } as Prisma.ContactWhereInput);
      } else if (filter.operator === "is_none_of") {
        and.push({ NOT: { [def.field]: { hasSome: values } } } as Prisma.ContactWhereInput);
      }
    } else if (def.type === "number") {
      if (filter.operator === "between") {
        const min = Number(filter.valueMin);
        const max = Number(filter.valueMax);
        if (Number.isNaN(min) || Number.isNaN(max)) continue;
        and.push({ [def.field]: { gte: min, lte: max } } as Prisma.ContactWhereInput);
      } else {
        const num = Number(filter.value);
        if (Number.isNaN(num)) continue;
        if (filter.operator === "gt") and.push({ [def.field]: { gt: num } } as Prisma.ContactWhereInput);
        else if (filter.operator === "lt") and.push({ [def.field]: { lt: num } } as Prisma.ContactWhereInput);
        else and.push({ [def.field]: { equals: num } } as Prisma.ContactWhereInput);
      }
    } else if (def.type === "date") {
      if (filter.operator === "between") {
        const start = new Date(filter.valueMin ?? "");
        const end = new Date(filter.valueMax ?? "");
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
        and.push({ [def.field]: { gte: start, lte: endOfDay(end) } } as Prisma.ContactWhereInput);
      } else if (filter.operator === "in_last_days") {
        const days = Number(filter.value);
        if (Number.isNaN(days) || days <= 0) continue;
        and.push({ [def.field]: { gte: subDays(new Date(), days) } } as Prisma.ContactWhereInput);
      } else {
        const date = new Date(filter.value ?? "");
        if (Number.isNaN(date.getTime())) continue;
        if (filter.operator === "before") and.push({ [def.field]: { lt: date } } as Prisma.ContactWhereInput);
        else and.push({ [def.field]: { gt: date } } as Prisma.ContactWhereInput);
      }
    } else if (def.type === "boolean") {
      if (filter.operator === "is_true") {
        and.push({ [def.field]: true } as Prisma.ContactWhereInput);
      } else if (filter.operator === "is_false") {
        // Nullable booleans: "is No" should catch both an explicit `false`
        // and a never-touched `null`, not just literal false.
        and.push({ [def.field]: { not: true } } as Prisma.ContactWhereInput);
      }
    }
  }

  return and.length > 0 ? { AND: and } : {};
}

function formatDateShort(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : format(date, "MMM d, yyyy");
}

export function describeFilter(filter: ContactFilter): string {
  const def = FILTER_FIELD_MAP[filter.field];
  if (!def) return "";
  const opLabel = OPERATORS_BY_TYPE[def.type].find((o) => o.value === filter.operator)?.label ?? filter.operator;

  if (
    filter.operator === "is_known" ||
    filter.operator === "is_unknown" ||
    filter.operator === "is_true" ||
    filter.operator === "is_false"
  ) {
    return `${def.label} ${opLabel}`;
  }
  if (filter.operator === "is_any_of" || filter.operator === "is_none_of") {
    const labels = (filter.values ?? []).map((v) => def.options?.find((o) => o.value === v)?.label ?? v);
    return `${def.label} ${opLabel} ${labels.join(", ")}`;
  }
  if (filter.operator === "between") {
    const min = def.type === "date" ? formatDateShort(filter.valueMin ?? "") : filter.valueMin;
    const max = def.type === "date" ? formatDateShort(filter.valueMax ?? "") : filter.valueMax;
    return `${def.label} is between ${min} and ${max}`;
  }
  if (filter.operator === "in_last_days") {
    return `${def.label} in the last ${filter.value} days`;
  }
  if (def.type === "date" && filter.value) {
    return `${def.label} ${opLabel} ${formatDateShort(filter.value)}`;
  }
  return `${def.label} ${opLabel} ${filter.value ?? ""}`;
}
