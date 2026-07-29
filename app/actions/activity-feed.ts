"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const PAGE_SIZE = 50;

export async function getActivityFeed(page = 1) {
  await requireAuth();
  const skip = (Math.max(1, page) - 1) * PAGE_SIZE;

  const [touches, total] = await Promise.all([
    prisma.touch.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, company: true } },
      },
    }),
    prisma.touch.count(),
  ]);

  return { touches, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
