import { z } from "zod";

export const leadStatusEnum = z.enum([
  "OPEN_PROSPECT",
  "SDR_IN_PROCESS",
  "EMAIL_SENT",
  "CONNECTED",
  "BAD_TIMING",
  "NOT_INTERESTED",
  "DEAD_LEAD",
  "DUPLICATE",
]);

export const industryEnum = z.enum([
  "IFM",
  "FACILITY_MANAGEMENT",
  "FACILITY_SERVICES",
  "FACILITY_MAINTENANCE",
  "JANITORIAL_CLEANING",
  "HVAC",
  "FIRE_PROTECTION",
  "OTHER",
]);

export const leadSourceEnum = z.enum([
  "COLD_EMAIL",
  "LINKEDIN",
  "COLD_CALL",
  "SMS",
  "REFERRAL",
  "INBOUND",
  "EVENT",
  "OTHER",
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

export const setupAdminSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const contactCreateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: optionalTrimmedString,
  email: z.string().trim().email("Enter a valid email"),
  phone: optionalTrimmedString,
  linkedinUrl: optionalTrimmedString,
  company: optionalTrimmedString,
  contactOwner: z.string().trim().min(1, "Contact owner is required"),
  leadStatus: leadStatusEnum.default("OPEN_PROSPECT"),
  industry: industryEnum.default("OTHER"),
  industryDetail: optionalTrimmedString,
  leadSource: leadSourceEnum.default("OTHER"),
  sequenceStep: z.coerce.number().int().min(0).max(10).default(0),
  smsOptOut: z.boolean().default(false),
});

export const contactUpdateSchema = contactCreateSchema.partial().extend({
  id: z.string().uuid(),
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
  phone: z.string().trim().optional().default(""),
  linkedinUrl: z.string().trim().optional().default(""),
  company: z.string().trim().optional().default(""),
  industry: industryEnum.optional().default("OTHER"),
  contactOwner: z.string().trim().optional().default(""),
});

export const importContactsSchema = z.object({
  contacts: z.array(importContactRowSchema).min(1).max(5000),
  defaultOwner: z.string().trim().min(1),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
