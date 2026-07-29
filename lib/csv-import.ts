import type { Industry, IndustryDetail, TeamMember } from "@prisma/client";
import { TEAM_MEMBER_LABELS } from "@/lib/status-config";

export type ImportField =
  | "firstName"
  | "lastName"
  | "email"
  | "workPhone"
  | "linkedinUrl"
  | "company"
  | "industry"
  | "industryDetail"
  | "contactOwner";

const HEADER_ALIASES: Record<string, ImportField> = {
  // name
  firstname: "firstName",
  first: "firstName",
  fname: "firstName",
  lastname: "lastName",
  last: "lastName",
  lname: "lastName",
  surname: "lastName",
  // email
  email: "email",
  emailaddress: "email",
  workemail: "email",
  work_email: "email",
  // phone
  phone: "workPhone",
  workphone: "workPhone",
  phonenumber: "workPhone",
  mobile: "workPhone",
  cell: "workPhone",
  // linkedin
  linkedin: "linkedinUrl",
  linkedinurl: "linkedinUrl",
  linkedinprofile: "linkedinUrl",
  // company
  company: "company",
  companyname: "company",
  organization: "company",
  employer: "company",
  // industry
  industry: "industry",
  vertical: "industry",
  sector: "industry",
  // industry detail
  industrydetail: "industryDetail",
  niche: "industryDetail",
  subvertical: "industryDetail",
  // contact owner
  contactowner: "contactOwner",
  owner: "contactOwner",
  accountowner: "contactOwner",
  rep: "contactOwner",
  salesrep: "contactOwner",
};

function normalizeHeaderKey(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

/**
 * Maps a raw CSV header to a known Contact import field, if recognizable.
 * Handles the "Name" (full name) case specially by returning null — callers
 * should split full-name columns themselves.
 */
export function detectField(header: string): ImportField | null {
  const key = normalizeHeaderKey(header);
  return HEADER_ALIASES[key] ?? null;
}

export function isFullNameHeader(header: string): boolean {
  const key = normalizeHeaderKey(header);
  return key === "name" || key === "fullname" || key === "contactname";
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

const INDUSTRY_TEXT_MAP: Record<string, Industry> = {
  "facility maintenance": "FACILITY_MAINTENANCE_COMPANIES",
  "facility maintenance companies": "FACILITY_MAINTENANCE_COMPANIES",
  "facilities maintenance": "FACILITY_MAINTENANCE_COMPANIES",
  ifm: "INTEGRATED_FACILITY_MANAGEMENT",
  "integrated facility management": "INTEGRATED_FACILITY_MANAGEMENT",
  "facility management": "INTEGRATED_FACILITY_MANAGEMENT",
  "facilities management": "INTEGRATED_FACILITY_MANAGEMENT",
  restaurant: "MULTI_UNIT_RESTAURANT_FRANCHISE_GROUPS",
  "restaurant group": "MULTI_UNIT_RESTAURANT_FRANCHISE_GROUPS",
  franchise: "MULTI_UNIT_RESTAURANT_FRANCHISE_GROUPS",
  "multi-unit restaurant": "MULTI_UNIT_RESTAURANT_FRANCHISE_GROUPS",
  logistics: "TRANSPORTATION_LOGISTICS",
  transportation: "TRANSPORTATION_LOGISTICS",
  "transportation & logistics": "TRANSPORTATION_LOGISTICS",
  construction: "CONSTRUCTION_COMPANIES",
  "construction companies": "CONSTRUCTION_COMPANIES",
  healthcare: "HEALTHCARE_FACILITIES",
  "healthcare facilities": "HEALTHCARE_FACILITIES",
};

export function detectIndustry(value: string): Industry {
  const key = value.trim().toLowerCase();
  return INDUSTRY_TEXT_MAP[key] ?? "FACILITY_MAINTENANCE_COMPANIES";
}

const INDUSTRY_DETAIL_KEYWORDS: Array<[RegExp, IndustryDetail]> = [
  [/hvac/i, "HVAC"],
  [/electrical/i, "ELECTRICAL"],
  [/plumbing/i, "PLUMBING"],
  [/roofing/i, "ROOFING"],
  [/handyman/i, "HANDYMAN"],
  [/janitorial|cleaning|cleanroom/i, "JANITORIAL"],
  [/landscap/i, "LANDSCAPING"],
  [/pest/i, "PEST_CONTROL"],
  [/security/i, "SECURITY"],
  [/office|corporate campus/i, "COMMERCIAL_OFFICES"],
  [/manufactur|industrial/i, "INDUSTRIAL_MANUFACTURING"],
  [/retail/i, "RETAIL_CHAINS"],
  [/school|campus|educat/i, "EDUCATIONAL_CAMPUSES"],
  [/fast food|qsr/i, "QSR_FAST_FOOD"],
  [/dining|restaurant/i, "CASUAL_DINING"],
  [/freight|3pl|brokerage/i, "FREIGHT_BROKERAGE_3PL"],
  [/warehous/i, "WAREHOUSING"],
  [/delivery/i, "LAST_MILE_DELIVERY"],
  [/urgent care/i, "URGENT_CARE_CHAINS"],
  [/hospital/i, "HOSPITALS"],
  [/clinic/i, "MULTI_SPECIALTY_CLINICS"],
  [/senior living|assisted living/i, "SENIOR_LIVING_FACILITIES"],
];

export function detectIndustryDetail(value: string): IndustryDetail | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  for (const [pattern, detail] of INDUSTRY_DETAIL_KEYWORDS) {
    if (pattern.test(trimmed)) return detail;
  }
  return undefined;
}

const TEAM_MEMBER_NAME_MAP: Record<string, TeamMember> = Object.fromEntries(
  (Object.entries(TEAM_MEMBER_LABELS) as [TeamMember, string][]).map(([member, label]) => [
    label.toLowerCase(),
    member,
  ])
);

export function detectContactOwner(value: string): TeamMember | undefined {
  const key = value.trim().toLowerCase();
  return TEAM_MEMBER_NAME_MAP[key];
}

export type MappedImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  workPhone: string;
  linkedinUrl: string;
  company: string;
  industry: Industry;
  industryDetail?: IndustryDetail;
  contactOwner?: TeamMember;
};

/**
 * Given papaparse's parsed headers + rows (array of string arrays, first row
 * excluded), maps each row to our Contact import shape using best-effort
 * header detection. Rows missing a usable email are dropped.
 */
export function mapCsvRows(headers: string[], rows: string[][]): MappedImportRow[] {
  const fieldByColumn = new Map<number, ImportField>();
  let fullNameColumn: number | null = null;

  headers.forEach((header, index) => {
    if (isFullNameHeader(header)) {
      fullNameColumn = index;
      return;
    }
    const field = detectField(header);
    if (field) fieldByColumn.set(index, field);
  });

  return rows
    .map((row): MappedImportRow => {
      const result: MappedImportRow = {
        firstName: "",
        lastName: "",
        email: "",
        workPhone: "",
        linkedinUrl: "",
        company: "",
        industry: "FACILITY_MAINTENANCE_COMPANIES",
      };

      if (fullNameColumn !== null) {
        const { firstName, lastName } = splitFullName(row[fullNameColumn] ?? "");
        result.firstName = firstName;
        result.lastName = lastName;
      }

      for (const [colIndex, field] of fieldByColumn.entries()) {
        const value = (row[colIndex] ?? "").trim();
        if (!value) continue;
        if (field === "industry") {
          result.industry = detectIndustry(value);
        } else if (field === "industryDetail") {
          result.industryDetail = detectIndustryDetail(value);
        } else if (field === "contactOwner") {
          result.contactOwner = detectContactOwner(value);
        } else {
          result[field] = value;
        }
      }

      return result;
    })
    .filter((row) => row.email);
}
