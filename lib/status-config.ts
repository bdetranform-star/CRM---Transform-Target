import type { LeadStatus, Industry, LeadSource } from "@prisma/client";

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "OPEN_PROSPECT",
  "SDR_IN_PROCESS",
  "EMAIL_SENT",
  "CONNECTED",
  "BAD_TIMING",
  "NOT_INTERESTED",
  "DEAD_LEAD",
  "DUPLICATE",
];

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; bg: string; fg: string }
> = {
  OPEN_PROSPECT: {
    label: "Open Prospect",
    bg: "var(--status-open-prospect-bg)",
    fg: "var(--status-open-prospect-fg)",
  },
  SDR_IN_PROCESS: {
    label: "SDR In Process",
    bg: "var(--status-sdr-in-process-bg)",
    fg: "var(--status-sdr-in-process-fg)",
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
  BAD_TIMING: {
    label: "Bad Timing",
    bg: "var(--status-bad-timing-bg)",
    fg: "var(--status-bad-timing-fg)",
  },
  NOT_INTERESTED: {
    label: "Not Interested",
    bg: "var(--status-not-interested-bg)",
    fg: "var(--status-not-interested-fg)",
  },
  DEAD_LEAD: {
    label: "Dead Lead",
    bg: "var(--status-dead-lead-bg)",
    fg: "var(--status-dead-lead-fg)",
  },
  DUPLICATE: {
    label: "Duplicate",
    bg: "var(--status-duplicate-bg)",
    fg: "var(--status-duplicate-fg)",
  },
};

export const INDUSTRY_LABELS: Record<Industry, string> = {
  IFM: "IFM",
  FACILITY_MANAGEMENT: "Facility Management",
  FACILITY_SERVICES: "Facility Services",
  FACILITY_MAINTENANCE: "Facility Maintenance",
  JANITORIAL_CLEANING: "Janitorial / Cleaning",
  HVAC: "HVAC",
  FIRE_PROTECTION: "Fire Protection",
  OTHER: "Other",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  COLD_EMAIL: "Cold Email",
  LINKEDIN: "LinkedIn",
  COLD_CALL: "Cold Call",
  SMS: "SMS",
  REFERRAL: "Referral",
  INBOUND: "Inbound",
  EVENT: "Event",
  OTHER: "Other",
};

export const SEQUENCE_STEPS = [
  { step: 0, label: "Email" },
  { step: 1, label: "LinkedIn" },
  { step: 2, label: "Call" },
  { step: 3, label: "SMS" },
] as const;
