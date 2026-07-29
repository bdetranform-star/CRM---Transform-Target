import type { Prisma } from "@prisma/client";

import {
  LEAD_STATUS_CONFIG,
  LIFECYCLE_STAGE_LABELS,
  INDUSTRY_LABELS,
  INDUSTRY_DETAIL_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_CAPTURED_LABELS,
  TEAM_MEMBER_LABELS,
} from "@/lib/status-config";

export type FilterFieldType = "string" | "enum" | "number" | "date";

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
  { field: "jobTitle", label: "Job Title", type: "string" },
  { field: "email", label: "Email Address", type: "string" },
  { field: "workPhone", label: "Work Phone Number", type: "string" },
  { field: "cellPhone", label: "Cell Phone Number", type: "string" },
  { field: "company", label: "Company Name", type: "string" },
  { field: "lifecycleStage", label: "Lifecycle Stage", type: "enum", options: optionsFrom(LIFECYCLE_STAGE_LABELS) },
  { field: "leadStatus", label: "Lead Status", type: "enum", options: Object.entries(LEAD_STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })) },
  { field: "industry", label: "Industry", type: "enum", options: optionsFrom(INDUSTRY_LABELS) },
  { field: "industryDetail", label: "Industry Detail", type: "enum", options: optionsFrom(INDUSTRY_DETAIL_LABELS) },
  { field: "contactOwner", label: "Contact Owner", type: "enum", options: optionsFrom(TEAM_MEMBER_LABELS) },
  { field: "leadSource", label: "Lead Source", type: "enum", options: optionsFrom(LEAD_SOURCE_LABELS) },
  { field: "leadSourceCaptured", label: "Lead Source Captured", type: "enum", options: optionsFrom(LEAD_SOURCE_CAPTURED_LABELS) },
  { field: "websiteUrl", label: "Website URL", type: "string" },
  { field: "websiteTraffic", label: "Website Traffic", type: "number" },
  { field: "numberOfEmployees", label: "Number of Employees", type: "number" },
  { field: "streetAddress", label: "Street Address", type: "string" },
  { field: "city", label: "City", type: "string" },
  { field: "state", label: "State", type: "string" },
  { field: "country", label: "Country", type: "string" },
  { field: "zipCode", label: "Zip Code", type: "string" },
  { field: "lastInterestedReply", label: "Last Interested Reply", type: "date" },
  { field: "lastContactDate", label: "Last Contact Date", type: "date" },
  { field: "createdAt", label: "Created Date", type: "date" },
];

export const FILTER_FIELD_MAP = Object.fromEntries(FILTERABLE_FIELDS.map((f) => [f.field, f]));

export type FilterOperator = "contains" | "equals" | "gt" | "lt" | "before" | "after";

export const OPERATORS_BY_TYPE: Record<FilterFieldType, { value: FilterOperator; label: string }[]> = {
  string: [
    { value: "contains", label: "contains" },
    { value: "equals", label: "is exactly" },
  ],
  enum: [{ value: "equals", label: "is" }],
  number: [
    { value: "equals", label: "=" },
    { value: "gt", label: ">" },
    { value: "lt", label: "<" },
  ],
  date: [
    { value: "after", label: "is after" },
    { value: "before", label: "is before" },
  ],
};

export type ContactFilter = {
  field: string;
  operator: FilterOperator;
  value: string;
};

export function buildWhereFromFilters(filters: ContactFilter[]): Prisma.ContactWhereInput {
  const and: Prisma.ContactWhereInput[] = [];

  for (const filter of filters) {
    const def = FILTER_FIELD_MAP[filter.field];
    if (!def || !filter.value) continue;

    if (def.type === "string") {
      if (filter.operator === "equals") {
        and.push({ [def.field]: { equals: filter.value } });
      } else {
        and.push({ [def.field]: { contains: filter.value } });
      }
    } else if (def.type === "enum") {
      and.push({ [def.field]: filter.value });
    } else if (def.type === "number") {
      const num = Number(filter.value);
      if (Number.isNaN(num)) continue;
      if (filter.operator === "gt") and.push({ [def.field]: { gt: num } });
      else if (filter.operator === "lt") and.push({ [def.field]: { lt: num } });
      else and.push({ [def.field]: { equals: num } });
    } else if (def.type === "date") {
      const date = new Date(filter.value);
      if (Number.isNaN(date.getTime())) continue;
      if (filter.operator === "before") and.push({ [def.field]: { lt: date } });
      else and.push({ [def.field]: { gt: date } });
    }
  }

  return and.length > 0 ? { AND: and } : {};
}

export function describeFilter(filter: ContactFilter): string {
  const def = FILTER_FIELD_MAP[filter.field];
  if (!def) return "";
  const opLabel =
    OPERATORS_BY_TYPE[def.type].find((o) => o.value === filter.operator)?.label ?? filter.operator;
  const valueLabel =
    def.type === "enum" ? def.options?.find((o) => o.value === filter.value)?.label ?? filter.value : filter.value;
  return `${def.label} ${opLabel} ${valueLabel}`;
}
