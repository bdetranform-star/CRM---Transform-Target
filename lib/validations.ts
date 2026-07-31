import { z } from "zod";

export const leadStatusEnum = z.enum([
  "NEW_LEAD",
  "OPEN_PROSPECT",
  "IN_PROCESS",
  "EMAIL_SENT",
  "CONNECTED",
  "OPEN_OPPORTUNITIES",
  "CURRENT_CUSTOMER",
  "CHURNED",
  "DEAD_LEAD",
]);

export const lifecycleStageEnum = z.enum([
  "SUBSCRIBER",
  "LEAD",
  "MARKETING_QUALIFIED_LEAD",
  "SALES_QUALIFIED_LEAD",
  "OPPORTUNITY",
  "CUSTOMER",
]);

export const industryEnum = z.enum([
  "FACILITY_MAINTENANCE_COMPANIES",
  "INTEGRATED_FACILITY_MANAGEMENT",
  "MULTI_UNIT_RESTAURANT_FRANCHISE_GROUPS",
  "TRANSPORTATION_LOGISTICS",
  "CONSTRUCTION_COMPANIES",
  "HEALTHCARE_FACILITIES",
]);

export const industryDetailEnum = z.enum([
  "HVAC",
  "ELECTRICAL",
  "PLUMBING",
  "ROOFING",
  "HANDYMAN",
  "JANITORIAL",
  "LANDSCAPING",
  "PEST_CONTROL",
  "SECURITY",
  "COMMERCIAL_OFFICES",
  "INDUSTRIAL_MANUFACTURING",
  "RETAIL_CHAINS",
  "EDUCATIONAL_CAMPUSES",
  "QSR_FAST_FOOD",
  "CASUAL_DINING",
  "MULTI_BRAND_OPERATOR",
  "FREIGHT_BROKERAGE_3PL",
  "ASSET_BASED_FLEET",
  "WAREHOUSING",
  "LAST_MILE_DELIVERY",
  "COMMERCIAL",
  "RESIDENTIAL",
  "INFRASTRUCTURE",
  "SPECIALTY_SUBCONTRACTOR",
  "URGENT_CARE_CHAINS",
  "HOSPITALS",
  "MULTI_SPECIALTY_CLINICS",
  "SENIOR_LIVING_FACILITIES",
]);

export const leadSourceEnum = z.enum([
  "COLD_EMAIL",
  "LINKEDIN",
  "COLD_CALL",
  "SMS",
  "WHATSAPP",
  "REFERRAL",
  "INBOUND",
  "EVENT",
  "OTHER",
]);

export const leadSourceCapturedEnum = z.enum([
  "LINKEDIN_SALES_NAVIGATOR",
  "GOOGLE_MAPS",
  "GOOGLE_DORK",
  "ONLINE_DIRECTORY",
]);

export const teamMemberEnum = z.enum([
  "SAAD_AHMED",
  "SHARMIN",
  "MUHAMMAD_NAUMAN",
  "SALMAN",
  "SHAHMIR",
]);

export const dealStageEnum = z.enum([
  "NEW",
  "QUALIFIED",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

export const linkedinConnectionStatusEnum = z.enum([
  "NOT_SENT",
  "REQUEST_SENT",
  "PENDING",
  "CONNECTED",
  "REJECTED",
]);

export const linkedinLifecycleStageEnum = z.enum([
  "NOT_CONTACTED",
  "CONNECTION_SENT",
  "CONNECTED",
  "FOLLOW_UP_IN_PROGRESS",
  "INTERESTED",
  "NOT_INTERESTED",
]);

export const interestedResponseChannelEnum = z.enum(["EMAIL", "LINKEDIN", "CALLING", "TEXT"]);

export const channelTagEnum = z.enum([
  "EMAIL_CHANNEL",
  "LINKEDIN_CHANNEL",
  "COLD_CALLING_CHANNEL",
  "TEXT_WHATSAPP_CHANNEL",
]);

export const channelEnum = z.enum(["EMAIL", "LINKEDIN", "CALL", "SMS", "NOTE"]);
export const directionEnum = z.enum(["OUTBOUND", "INBOUND"]);

export const callOutcomeEnum = z.enum([
  "CONNECTED",
  "VOICEMAIL",
  "NO_ANSWER",
  "WRONG_NUMBER",
  "CALLBACK_SCHEDULED",
]);

export const smsOutcomeEnum = z.enum(["SENT", "DELIVERED", "REPLIED", "OPTED_OUT"]);

export const linkedinOutcomeEnum = z.enum([
  "CONNECTION_SENT",
  "CONNECTED",
  "MESSAGE_SENT",
  "REPLIED",
]);

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const optionalNonNegativeInt = z
  .union([z.coerce.number().int().min(0), z.literal("")])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

export const setupAdminSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const contactCreateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: optionalTrimmedString,
  jobTitle: optionalTrimmedString,
  email: z.string().trim().email("Enter a valid email"),
  workPhone: optionalTrimmedString,
  cellPhone: optionalTrimmedString,
  linkedinUrl: optionalTrimmedString,
  company: optionalTrimmedString,
  designation: optionalTrimmedString,
  lifecycleStage: lifecycleStageEnum.default("LEAD"),
  leadStatus: leadStatusEnum.default("NEW_LEAD"),
  industry: industryEnum.default("FACILITY_MAINTENANCE_COMPANIES"),
  industryDetail: z
    .union([industryDetailEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  contactOwner: teamMemberEnum,
  leadSource: leadSourceEnum.default("OTHER"),
  leadSourceCaptured: z
    .union([leadSourceCapturedEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  channelTags: z.array(channelTagEnum).default([]),
  websiteUrl: optionalTrimmedString,
  websiteTraffic: optionalNonNegativeInt,
  numberOfEmployees: optionalNonNegativeInt,
  streetAddress: optionalTrimmedString,
  city: optionalTrimmedString,
  state: optionalTrimmedString,
  country: optionalTrimmedString,
  zipCode: optionalTrimmedString,
  sequenceStep: z.coerce.number().int().min(0).max(10).default(0),
  smsOptOut: z.boolean().default(false),
  linkedinConnectionStatus: z
    .union([linkedinConnectionStatusEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  linkedinConnectedOn: z
    .union([z.coerce.date(), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  linkedinPitchNote: optionalTrimmedString,
  linkedinFollowUp1: z.boolean().optional(),
  linkedinFollowUp2: z.boolean().optional(),
  linkedinFollowUp3: z.boolean().optional(),
  linkedinFollowUp4: z.boolean().optional(),
  linkedinLifecycleStage: z
    .union([linkedinLifecycleStageEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  interestedResponseFrom: z
    .union([interestedResponseChannelEnum, z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
});

export const contactUpdateSchema = contactCreateSchema.partial().extend({
  id: z.string().uuid(),
  // .partial() wraps every field in .optional(), but a field that already
  // has .default() still has that default applied when the key is missing
  // from the input — .optional() only means "undefined is also a valid
  // parsed value", it doesn't stop the inner .default() from firing first.
  // Left as-is, a genuinely partial update (e.g. saving just the "Contact
  // info" section on the contact detail page) would silently reset
  // leadStatus/industry/etc. back to their defaults on every save. Override
  // each defaulted field here with a plain .optional() (no default) so an
  // omitted key truly stays untouched.
  lifecycleStage: lifecycleStageEnum.optional(),
  leadStatus: leadStatusEnum.optional(),
  industry: industryEnum.optional(),
  leadSource: leadSourceEnum.optional(),
  sequenceStep: z.coerce.number().int().min(0).max(10).optional(),
  smsOptOut: z.boolean().optional(),
  channelTags: z.array(channelTagEnum).optional(),
});

export const bulkStatusChangeSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  leadStatus: leadStatusEnum,
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const logCallSchema = z.object({
  contactId: z.string().uuid(),
  outcome: callOutcomeEnum,
  notes: optionalTrimmedString,
});

export const logLinkedinTouchSchema = z.object({
  contactId: z.string().uuid(),
  outcome: linkedinOutcomeEnum,
});

export const sendSmsSchema = z.object({
  contactId: z.string().uuid(),
  body: z.string().trim().min(1, "Message body cannot be empty"),
  templateId: z.string().uuid().optional(),
});

export const markSmsRepliedSchema = z.object({
  contactId: z.string().uuid(),
  optOut: z.boolean().default(false),
});

export const addNoteSchema = z.object({
  contactId: z.string().uuid(),
  body: z.string().trim().min(1, "Note cannot be empty"),
});

export const smsTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required"),
  body: z.string().trim().min(1, "Template body is required"),
});

export const smsTemplateUpdateSchema = smsTemplateSchema.partial().extend({
  id: z.string().uuid(),
});

export const importContactRowSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().optional().default(""),
  email: z.string().trim().email(),
  workPhone: z.string().trim().optional().default(""),
  linkedinUrl: z.string().trim().optional().default(""),
  company: z.string().trim().optional().default(""),
  industry: industryEnum.optional().default("FACILITY_MAINTENANCE_COMPANIES"),
  contactOwner: z.union([teamMemberEnum, z.literal("")]).optional().default(""),
});

export const importContactsSchema = z.object({
  contacts: z.array(importContactRowSchema).min(1).max(5000),
  defaultOwner: teamMemberEnum,
});

export const dealCreateSchema = z.object({
  contactId: z.string().uuid(),
  title: z.string().trim().min(1, "Deal title is required"),
  value: z
    .union([z.coerce.number().min(0), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  stage: dealStageEnum.default("NEW"),
});

export const dealUpdateSchema = dealCreateSchema.partial().extend({
  id: z.string().uuid(),
  // see contactUpdateSchema's comment above: .partial() alone doesn't stop
  // .default() from firing on a missing key.
  stage: dealStageEnum.optional(),
});

export const taskCreateSchema = z.object({
  contactId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  title: z.string().trim().min(1, "Task title is required"),
  dueDate: z
    .union([z.coerce.date(), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  assignedTo: teamMemberEnum,
  completed: z.boolean().default(false),
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  id: z.string().uuid(),
  // see contactUpdateSchema's comment above: .partial() alone doesn't stop
  // .default() from firing on a missing key.
  completed: z.boolean().optional(),
});

export const generateContactInsightsSchema = z.object({
  contactId: z.string().uuid(),
});

export const sendContactChatMessageSchema = z.object({
  contactId: z.string().uuid(),
  question: z.string().trim().min(1, "Question cannot be empty").max(2000),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
