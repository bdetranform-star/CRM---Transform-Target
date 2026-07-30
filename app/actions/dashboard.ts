"use server";

import { subDays, startOfDay, endOfDay, format, differenceInCalendarDays } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import {
  LEAD_STATUS_ORDER,
  LEAD_STATUS_CONFIG,
  INDUSTRY_LABELS,
  LEAD_SOURCE_CAPTURED_LABELS,
  DEAL_STAGE_ORDER,
  DEAL_STAGE_LABELS,
  TEAM_MEMBER_ORDER,
  TEAM_MEMBER_LABELS,
} from "@/lib/status-config";
import { CHANNEL_CONFIG } from "@/lib/channel-config";
import { teamMemberEnum } from "@/lib/validations";
import type { Prisma, TeamMember, LeadSource } from "@prisma/client";

export type DashboardRange = "7" | "30" | "90" | "365" | "all";

function rangeToDays(range: DashboardRange): number | null {
  if (range === "all") return null;
  return Number(range);
}

function rangeStart(range: DashboardRange): Date | null {
  const days = rangeToDays(range);
  return days ? startOfDay(subDays(new Date(), days - 1)) : null;
}

function contactOwnerFilter(owner?: string): TeamMember | undefined {
  const parsed = owner ? teamMemberEnum.safeParse(owner) : null;
  return parsed?.success ? parsed.data : undefined;
}

/**
 * Contacts by status, optionally scoped to a set of leadSource values — the
 * same shared query backs the overall "Contacts by status" chart (no
 * `sources` filter) and the four per-channel variants below it.
 */
export async function getContactsByStatus(range: DashboardRange, owner?: string, sources?: LeadSource[]) {
  await requireAuth();
  const ownerFilter = contactOwnerFilter(owner);
  const start = rangeStart(range);

  const where: Prisma.ContactWhereInput = {
    ...(start ? { createdAt: { gte: start } } : {}),
    ...(ownerFilter ? { contactOwner: ownerFilter } : {}),
    ...(sources && sources.length > 0 ? { leadSource: { in: sources } } : {}),
  };

  const grouped = await prisma.contact.groupBy({ by: ["leadStatus"], _count: true, where });
  const counts = new Map(grouped.map((g) => [g.leadStatus, g._count]));
  return LEAD_STATUS_ORDER.map((status) => ({
    status,
    label: LEAD_STATUS_CONFIG[status].label,
    count: counts.get(status) ?? 0,
  }));
}

export async function getContactsByIndustry() {
  await requireAuth();
  const grouped = await prisma.contact.groupBy({ by: ["industry"], _count: true });
  return grouped
    .map((g) => ({
      industry: g.industry,
      label: INDUSTRY_LABELS[g.industry],
      count: g._count,
    }))
    .filter((g) => g.count > 0);
}

/** New Contacts Created widget: current-period count vs the prior period of equal length. */
export async function getNewContactsCreatedSummary(range: DashboardRange, owner?: string) {
  await requireAuth();
  const ownerFilter = contactOwnerFilter(owner);
  const start = rangeStart(range);

  if (!start) {
    const total = await prisma.contact.count({
      where: ownerFilter ? { contactOwner: ownerFilter } : undefined,
    });
    return { current: total, previous: null, changePct: null };
  }

  const days = differenceInCalendarDays(new Date(), start) + 1;
  const previousStart = subDays(start, days);
  const previousEnd = subDays(start, 1);

  const [current, previous] = await Promise.all([
    prisma.contact.count({
      where: { createdAt: { gte: start }, ...(ownerFilter ? { contactOwner: ownerFilter } : {}) },
    }),
    prisma.contact.count({
      where: {
        createdAt: { gte: previousStart, lte: endOfDay(previousEnd) },
        ...(ownerFilter ? { contactOwner: ownerFilter } : {}),
      },
    }),
  ]);

  const changePct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  return { current, previous, changePct };
}

/** Contact Sources widget: breakdown by "Lead Source Captured". */
export async function getContactSourcesBreakdown(range: DashboardRange, owner?: string) {
  await requireAuth();
  const ownerFilter = contactOwnerFilter(owner);
  const start = rangeStart(range);

  const where: Prisma.ContactWhereInput = {
    ...(start ? { createdAt: { gte: start } } : {}),
    ...(ownerFilter ? { contactOwner: ownerFilter } : {}),
  };

  const grouped = await prisma.contact.groupBy({ by: ["leadSourceCaptured"], _count: true, where });
  return grouped
    .filter((g) => g.leadSourceCaptured !== null)
    .map((g) => ({
      source: g.leadSourceCaptured as string,
      label: LEAD_SOURCE_CAPTURED_LABELS[g.leadSourceCaptured!],
      count: g._count,
    }));
}

function dailyBuckets(range: DashboardRange, dates: Date[]) {
  const days = rangeToDays(range) ?? 90;
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    buckets.set(format(subDays(new Date(), days - 1 - i), "MMM d"), 0);
  }
  for (const date of dates) {
    const key = format(date, "MMM d");
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export async function getContactsAddedOverTime(range: DashboardRange, owner?: string) {
  await requireAuth();
  const ownerFilter = contactOwnerFilter(owner);
  const start = rangeStart(range) ?? subDays(new Date(), 89);

  const contacts = await prisma.contact.findMany({
    where: { createdAt: { gte: start }, ...(ownerFilter ? { contactOwner: ownerFilter } : {}) },
    select: { createdAt: true },
  });

  return dailyBuckets(range === "all" ? "90" : range, contacts.map((c) => c.createdAt));
}

export async function getDealsCreatedOverTime(range: DashboardRange) {
  await requireAuth();
  const start = rangeStart(range) ?? subDays(new Date(), 89);

  const deals = await prisma.deal.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true },
  });

  return dailyBuckets(range === "all" ? "90" : range, deals.map((d) => d.createdAt));
}

export async function getDealsByStage() {
  await requireAuth();
  const grouped = await prisma.deal.groupBy({ by: ["stage"], _count: true });
  const counts = new Map(grouped.map((g) => [g.stage, g._count]));
  return DEAL_STAGE_ORDER.map((stage) => ({
    stage,
    label: DEAL_STAGE_LABELS[stage],
    count: counts.get(stage) ?? 0,
  })).filter((s) => s.count > 0);
}

export async function getActivityTypeBreakdown(range: DashboardRange, owner?: string) {
  await requireAuth();
  const ownerFilter = contactOwnerFilter(owner);
  const start = rangeStart(range);

  const grouped = await prisma.touch.groupBy({
    by: ["channel"],
    _count: true,
    where: {
      ...(start ? { createdAt: { gte: start } } : {}),
      ...(ownerFilter ? { contact: { contactOwner: ownerFilter } } : {}),
    },
  });
  const counts = new Map(grouped.map((g) => [g.channel, g._count]));
  return (Object.keys(CHANNEL_CONFIG) as Array<keyof typeof CHANNEL_CONFIG>).map((channel) => ({
    channel,
    label: CHANNEL_CONFIG[channel].label,
    count: counts.get(channel) ?? 0,
  }));
}

/** Team Activity Summary: touches logged per owner, filterable by date range. */
export async function getTeamActivitySummary(range: DashboardRange) {
  await requireAuth();
  const start = rangeStart(range);

  const touches = await prisma.touch.findMany({
    where: start ? { createdAt: { gte: start } } : undefined,
    select: { contact: { select: { contactOwner: true } } },
  });

  const counts = new Map<TeamMember, number>();
  for (const touch of touches) {
    const owner = touch.contact.contactOwner;
    counts.set(owner, (counts.get(owner) ?? 0) + 1);
  }

  return TEAM_MEMBER_ORDER.map((member) => ({
    member,
    label: TEAM_MEMBER_LABELS[member],
    count: counts.get(member) ?? 0,
  }));
}

export async function getOpenTasksSummary() {
  await requireAuth();
  const [open, overdue] = await Promise.all([
    prisma.task.count({ where: { completed: false } }),
    prisma.task.count({ where: { completed: false, dueDate: { lt: new Date() } } }),
  ]);
  return { open, overdue };
}

export async function getTaskStatusBreakdown() {
  await requireAuth();
  const [open, completed] = await Promise.all([
    prisma.task.count({ where: { completed: false } }),
    prisma.task.count({ where: { completed: true } }),
  ]);
  return [
    { status: "OPEN", label: "Open", count: open },
    { status: "COMPLETED", label: "Completed", count: completed },
  ];
}
