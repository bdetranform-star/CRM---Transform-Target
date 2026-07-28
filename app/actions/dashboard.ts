"use server";

import { startOfWeek, subWeeks, format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { LEAD_STATUS_ORDER, LEAD_STATUS_CONFIG, INDUSTRY_LABELS } from "@/lib/status-config";
import { CHANNEL_CONFIG } from "@/lib/channel-config";

export async function getContactsByStatus() {
  await requireAuth();
  const grouped = await prisma.contact.groupBy({ by: ["leadStatus"], _count: true });
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

export async function getContactsCreatedPerWeek(weeks = 8) {
  await requireAuth();
  const since = startOfWeek(subWeeks(new Date(), weeks - 1));
  const contacts = await prisma.contact.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < weeks; i++) {
    const weekStart = startOfWeek(subWeeks(new Date(), weeks - 1 - i));
    buckets.set(format(weekStart, "MMM d"), 0);
  }
  for (const contact of contacts) {
    const weekStart = startOfWeek(contact.createdAt);
    const key = format(weekStart, "MMM d");
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([week, count]) => ({ week, count }));
}

export async function getTouchesPerChannelThisWeek() {
  await requireAuth();
  const since = startOfWeek(new Date());
  const grouped = await prisma.touch.groupBy({
    by: ["channel"],
    where: { createdAt: { gte: since } },
    _count: true,
  });
  const counts = new Map(grouped.map((g) => [g.channel, g._count]));
  return (Object.keys(CHANNEL_CONFIG) as Array<keyof typeof CHANNEL_CONFIG>).map((channel) => ({
    channel,
    label: CHANNEL_CONFIG[channel].label,
    count: counts.get(channel) ?? 0,
  }));
}
