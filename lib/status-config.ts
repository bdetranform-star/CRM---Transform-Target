import type {
  LeadStatus,
  Industry,
  IndustryDetail,
  LeadSource,
  LeadSourceCaptured,
  LifecycleStage,
  TeamMember,
  DealStage,
} from "@prisma/client";

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "NEW_LEAD",
  "OPEN_PROSPECT",
  "IN_PROCESS",
  "EMAIL_SENT",
  "CONNECTED",
  "OPEN_OPPORTUNITIES",
  "CURRENT_CUSTOMER",
  "CHURNED",
  "DEAD_LEAD",
];

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; fg: string }
> = {
  NEW_LEAD: {
    label: "New Lead",
    bg: "var(--status-new-lead-bg)",
    fg: "var(--status-new-lead-fg)",
  },
  OPEN_PROSPECT: {
    label: "Open Prospect",
    bg: "var(--status-open-prospect-bg)",
    fg: "var(--status-open-prospect-fg)",
  },
  IN_PROCESS: {
    label: "In Process",
    bg: "var(--status-in-process-bg)",
    fg: "var(--status-in-process-fg)",
  },
  EMAIL_SENT: {
    label: "Email Sent",
    bg: "var(--status-email-sent-bg)",
    fg: "var(--status-email-sent-fg)",
  },
  CONNECTED: {
    label: "Connected",
    bg: "var(--status-connected-bg)",
    fg: "var(--status-connected-fg)",
  },
  OPEN_OPPORTUNITIES: {
    label: "Open Opportunities",
    bg: "var(--status-open-opportunities-bg)",
    fg: "var(--status-open-opportunities-fg)",
  },
  CURRENT_CUSTOMER: {
    label: "Current Customer",
    bg: "var(--status-current-customer-bg)",
    fg: "var(--status-current-customer-fg)",
  },
  CHURNED: {
    label: "Churned",
    bg: "var(--status-churned-bg)",
    fg: "var(--status-churned-fg)",
  },
  DEAD_LEAD: {
    label: "Dead Lead",
    bg: "var(--status-dead-lead-bg)",
    fg: "var(--status-dead-lead-fg)",
  },
};

export const LIFECYCLE_STAGE_ORDER: LifecycleStage[] = [
  "SUBSCRIBER",
  "LEAD",
  "MARKETING_QUALIFIED_LEAD",
  "SALES_QUALIFIED_LEAD",
  "OPPORTUNITY",
  "CUSTOMER",
];

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, string> = {
  SUBSCRIBER: "Subscriber",
  LEAD: "Lead",
  MARKETING_QUALIFIED_LEAD: "Marketing Qualified Lead",
  SALES_QUALIFIED_LEAD: "Sales Qualified Lead",
  OPPORTUNITY: "Opportunity",
  CUSTOMER: "Customer",
};

export const INDUSTRY_LABELS: Record<Industry, string> = {
  FACILITY_MAINTENANCE_COMPANIES: "Facility Maintenance Companies",
  INTEGRATED_FACILITY_MANAGEMENT: "Integrated Facility Management",
  MULTI_UNIT_RESTAURANT_FRANCHISE_GROUPS: "Multi-Unit Restaurant / Franchise Groups",
  TRANSPORTATION_LOGISTICS: "Transportation & Logistics",
  CONSTRUCTION_COMPANIES: "Construction Companies",
  HEALTHCARE_FACILITIES: "Healthcare Facilities",
};

export const INDUSTRY_DETAIL_LABELS: Record<IndustryDetail, string> = {
  HVAC: "HVAC",
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  ROOFING: "Roofing",
  HANDYMAN: "Handyman",
  JANITORIAL: "Janitorial",
  LANDSCAPING: "Landscaping",
  PEST_CONTROL: "Pest Control",
  SECURITY: "Security",
  COMMERCIAL_OFFICES: "Commercial Offices",
  INDUSTRIAL_MANUFACTURING: "Industrial & Manufacturing",
  RETAIL_CHAINS: "Retail Chains",
  EDUCATIONAL_CAMPUSES: "Educational Campuses",
  QSR_FAST_FOOD: "QSR (Fast Food)",
  CASUAL_DINING: "Casual Dining",
  MULTI_BRAND_OPERATOR: "Multi-Brand Operator",
  FREIGHT_BROKERAGE_3PL: "Freight Brokerage (3PL)",
  ASSET_BASED_FLEET: "Asset-Based Fleet",
  WAREHOUSING: "Warehousing",
  LAST_MILE_DELIVERY: "Last-Mile Delivery",
  COMMERCIAL: "Commercial",
  RESIDENTIAL: "Residential",
  INFRASTRUCTURE: "Infrastructure",
  SPECIALTY_SUBCONTRACTOR: "Specialty Subcontractor",
  URGENT_CARE_CHAINS: "Urgent Care Chains",
  HOSPITALS: "Hospitals",
  MULTI_SPECIALTY_CLINICS: "Multi-Specialty Clinics",
  SENIOR_LIVING_FACILITIES: "Senior Living Facilities",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  COLD_EMAIL: "Cold Email",
  LINKEDIN: "LinkedIn",
  COLD_CALL: "Cold Call",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Referral",
  INBOUND: "Inbound",
  EVENT: "Event",
  OTHER: "Other",
};

export const LEAD_SOURCE_CAPTURED_LABELS: Record<LeadSourceCaptured, string> = {
  LINKEDIN_SALES_NAVIGATOR: "LinkedIn Sales Navigator",
  GOOGLE_MAPS: "Google Maps",
  GOOGLE_DORK: "Google Dork",
  ONLINE_DIRECTORY: "Online Directory",
};

export const TEAM_MEMBER_LABELS: Record<TeamMember, string> = {
  SAAD_AHMED: "Saad Ahmed",
  SHARMIN: "Sharmin",
  MUHAMMAD_NAUMAN: "Muhammad Nauman",
  SALMAN: "Salman",
  SHAHMIR: "Shahmir",
};

export const TEAM_MEMBER_ORDER: TeamMember[] = [
  "SAAD_AHMED",
  "SHARMIN",
  "MUHAMMAD_NAUMAN",
  "SALMAN",
  "SHAHMIR",
];

export const DEAL_STAGE_ORDER: DealStage[] = [
  "NEW",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  NEW: "New",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const SEQUENCE_STEPS = [
  { step: 0, label: "Email" },
  { step: 1, label: "LinkedIn" },
  { step: 2, label: "Call" },
  { step: 3, label: "SMS" },
] as const;
