import type {
  Industry,
  IndustryDetail,
  TeamMember,
  ChannelTag,
  LinkedinConnectionStatus,
  LinkedinLifecycleStage,
  InterestedResponseChannel,
} from "@prisma/client";
import {
  TEAM_MEMBER_LABELS,
  LINKEDIN_CONNECTION_STATUS_LABELS,
  LINKEDIN_LIFECYCLE_STAGE_LABELS,
  INTERESTED_RESPONSE_CHANNEL_LABELS,
} from "@/lib/status-config";
import { CHANNEL_TAG_LABELS, CHANNEL_TAG_ORDER } from "@/lib/channel-tags";

export type ImportField =
  | "firstName"
  | "lastName"
  | "email"
  | "workPhone"
  | "linkedinUrl"
  | "company"
  | "industry"
  | "industryDetail"
  | "contactOwner"
  | "designation"
  | "linkedinConnectionStatus"
  | "linkedinPitchNote"
  | "linkedinFollowUp1"
  | "linkedinFollowUp2"
  | "linkedinFollowUp3"
  | "linkedinFollowUp4"
  | "linkedinLifecycleStage"
  | "interestedResponseFrom"
  | "channelTags"
  | "linkedinConnectedOn";

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
  // designation
  designation: "designation",
  title: "designation",
  jobtitle: "designation",
  // LinkedIn Status / connection status
  linkedinstatus: "linkedinConnectionStatus",
  linkedinconnectionstatus: "linkedinConnectionStatus",
  connectionstatus: "linkedinConnectionStatus",
  finalstatus: "linkedinConnectionStatus",
  // pitch / connection request note
  pitch: "linkedinPitchNote",
  pitchnote: "linkedinPitchNote",
  pitchconnectionrequestnote: "linkedinPitchNote",
  connectionrequestnote: "linkedinPitchNote",
  // follow ups
  "1stfollowup": "linkedinFollowUp1",
  "1stfollowuplinkedin": "linkedinFollowUp1",
  followup1: "linkedinFollowUp1",
  "2ndfollowup": "linkedinFollowUp2",
  "2ndfollowuplinkedin": "linkedinFollowUp2",
  followup2: "linkedinFollowUp2",
  "3rdfollowup": "linkedinFollowUp3",
  "3rdfollowuplinkedin": "linkedinFollowUp3",
  followup3: "linkedinFollowUp3",
  "4thfollowup": "linkedinFollowUp4",
  "4thfollowuplinkedin": "linkedinFollowUp4",
  followup4: "linkedinFollowUp4",
  // lifecycle of linkedin
  lifecycleoflinkedin: "linkedinLifecycleStage",
  linkedinlifecycle: "linkedinLifecycleStage",
  linkedinlifecyclestage: "linkedinLifecycleStage",
  // interested response from
  interestedresponsefrom: "interestedResponseFrom",
  interestedresponse: "interestedResponseFrom",
  response: "interestedResponseFrom",
  responsefrom: "interestedResponseFrom",
  // channel tag
  channeltag: "channelTags",
  channeltags: "channelTags",
  // linkedin connected on
  linkedinconnectedon: "linkedinConnectedOn",
  connectedon: "linkedinConnectedOn",
  connectiondate: "linkedinConnectedOn",
};

function normalizeHeaderKey(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_\-/()]+/g, "");
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

/** Builds a lowercase-label -> enum-value map, plus the raw enum keys themselves (case-insensitive). */
function buildLabelLookup<T extends string>(labels: Record<T, string>): Record<string, T> {
  const map: Record<string, T> = {};
  for (const [value, label] of Object.entries(labels) as [T, string][]) {
    map[label.toLowerCase()] = value;
    map[value.toLowerCase()] = value;
  }
  return map;
}

const LINKEDIN_CONNECTION_STATUS_MAP = buildLabelLookup(LINKEDIN_CONNECTION_STATUS_LABELS);
export function detectLinkedinConnectionStatus(value: string): LinkedinConnectionStatus | undefined {
  return LINKEDIN_CONNECTION_STATUS_MAP[value.trim().toLowerCase()];
}

const LINKEDIN_LIFECYCLE_STAGE_MAP = buildLabelLookup(LINKEDIN_LIFECYCLE_STAGE_LABELS);
export function detectLinkedinLifecycleStage(value: string): LinkedinLifecycleStage | undefined {
  return LINKEDIN_LIFECYCLE_STAGE_MAP[value.trim().toLowerCase()];
}

const INTERESTED_RESPONSE_CHANNEL_MAP = buildLabelLookup(INTERESTED_RESPONSE_CHANNEL_LABELS);
export function detectInterestedResponseChannel(value: string): InterestedResponseChannel | undefined {
  return INTERESTED_RESPONSE_CHANNEL_MAP[value.trim().toLowerCase()];
}

const CHANNEL_TAG_MAP = buildLabelLookup(CHANNEL_TAG_LABELS);
/** Channel Tag is multi-value — splits on comma/semicolon/pipe, matches each piece independently. */
export function detectChannelTags(value: string): ChannelTag[] {
  const tags = value
    .split(/[,;|]/)
    .map((piece) => CHANNEL_TAG_MAP[piece.trim().toLowerCase()])
    .filter((tag): tag is ChannelTag => Boolean(tag));
  // De-dupe while preserving CHANNEL_TAG_ORDER for stable output.
  const found = new Set(tags);
  return CHANNEL_TAG_ORDER.filter((tag) => found.has(tag));
}

const TRUE_WORDS = new Set(["yes", "y", "true", "1"]);
const FALSE_WORDS = new Set(["no", "n", "false", "0"]);

export function parseBooleanLike(value: string): boolean | undefined {
  const key = value.trim().toLowerCase();
  if (TRUE_WORDS.has(key)) return true;
  if (FALSE_WORDS.has(key)) return false;
  return undefined;
}

/**
 * Parses a date cell that may arrive as US MM/DD/YYYY (this app's own export
 * format), ISO YYYY-MM-DD, or anything else `Date` can parse. Returns
 * undefined rather than throwing on anything unrecognizable.
 */
export function parseDateLike(value: string): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
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
  designation: string;
  linkedinConnectionStatus?: LinkedinConnectionStatus;
  linkedinPitchNote: string;
  linkedinFollowUp1?: boolean;
  linkedinFollowUp2?: boolean;
  linkedinFollowUp3?: boolean;
  linkedinFollowUp4?: boolean;
  linkedinLifecycleStage?: LinkedinLifecycleStage;
  interestedResponseFrom?: InterestedResponseChannel;
  channelTags: ChannelTag[];
  linkedinConnectedOn?: Date;
};

/** True only when every recognized field on the row is blank/unset — the sole reason to skip a row. */
function isRowEffectivelyEmpty(row: MappedImportRow): boolean {
  return (
    !row.firstName &&
    !row.lastName &&
    !row.email &&
    !row.workPhone &&
    !row.linkedinUrl &&
    !row.company &&
    !row.designation &&
    !row.linkedinPitchNote &&
    row.industryDetail === undefined &&
    row.contactOwner === undefined &&
    row.linkedinConnectionStatus === undefined &&
    row.linkedinLifecycleStage === undefined &&
    row.interestedResponseFrom === undefined &&
    row.linkedinFollowUp1 === undefined &&
    row.linkedinFollowUp2 === undefined &&
    row.linkedinFollowUp3 === undefined &&
    row.linkedinFollowUp4 === undefined &&
    row.linkedinConnectedOn === undefined &&
    row.channelTags.length === 0
    // industry is deliberately excluded — it always carries a default value
    // (FACILITY_MAINTENANCE_COMPANIES) regardless of whether the row had any
    // real data, so its presence alone must never count as "has data".
  );
}

export type MapCsvRowsResult = {
  rows: MappedImportRow[];
  /** Rows dropped because every recognized column was blank — not because email was missing. */
  skippedEmpty: number;
};

/**
 * Given papaparse's parsed headers + rows (array of string arrays, first row
 * excluded), maps each row to our Contact import shape using best-effort
 * header detection. A row is only dropped when it has no data at all in any
 * recognized column — a missing Email (or any other single field) never
 * blocks a row from importing.
 */
export function mapCsvRows(headers: string[], rows: string[][]): MapCsvRowsResult {
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

  const mapped = rows.map((row): MappedImportRow => {
    const result: MappedImportRow = {
      firstName: "",
      lastName: "",
      email: "",
      workPhone: "",
      linkedinUrl: "",
      company: "",
      industry: "FACILITY_MAINTENANCE_COMPANIES",
      designation: "",
      linkedinPitchNote: "",
      channelTags: [],
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
      } else if (field === "linkedinConnectionStatus") {
        result.linkedinConnectionStatus = detectLinkedinConnectionStatus(value);
      } else if (field === "linkedinLifecycleStage") {
        result.linkedinLifecycleStage = detectLinkedinLifecycleStage(value);
      } else if (field === "interestedResponseFrom") {
        result.interestedResponseFrom = detectInterestedResponseChannel(value);
      } else if (field === "channelTags") {
        result.channelTags = detectChannelTags(value);
      } else if (
        field === "linkedinFollowUp1" ||
        field === "linkedinFollowUp2" ||
        field === "linkedinFollowUp3" ||
        field === "linkedinFollowUp4"
      ) {
        result[field] = parseBooleanLike(value);
      } else if (field === "linkedinConnectedOn") {
        result.linkedinConnectedOn = parseDateLike(value);
      } else {
        result[field] = value;
      }
    }

    return result;
  });

  const nonEmptyRows = mapped.filter((row) => !isRowEffectivelyEmpty(row));

  return {
    rows: nonEmptyRows,
    skippedEmpty: mapped.length - nonEmptyRows.length,
  };
}
