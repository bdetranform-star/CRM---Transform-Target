import type { Industry } from "@prisma/client";

export type ImportField =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "linkedinUrl"
  | "company"
  | "industry"
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
  phone: "phone",
  phonenumber: "phone",
  mobile: "phone",
  cell: "phone",
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
  ifm: "IFM",
  "integrated facility management": "IFM",
  "facility management": "FACILITY_MANAGEMENT",
  "facilities management": "FACILITY_MANAGEMENT",
  "facility services": "FACILITY_SERVICES",
  "facility maintenance": "FACILITY_MAINTENANCE",
  "facilities maintenance": "FACILITY_MAINTENANCE",
  janitorial: "JANITORIAL_CLEANING",
  cleaning: "JANITORIAL_CLEANING",
  "janitorial/cleaning": "JANITORIAL_CLEANING",
  hvac: "HVAC",
  "fire protection": "FIRE_PROTECTION",
};

export function detectIndustry(value: string): Industry {
  const key = value.trim().toLowerCase();
  return INDUSTRY_TEXT_MAP[key] ?? "OTHER";
}

export type MappedImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  company: string;
  industry: Industry;
  contactOwner: string;
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
        phone: "",
        linkedinUrl: "",
        company: "",
        industry: "OTHER",
        contactOwner: "",
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
        } else {
          result[field] = value;
        }
      }

      return result;
    })
    .filter((row) => row.email);
}
