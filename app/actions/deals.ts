"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { dealCreateSchema, dealUpdateSchema, dealStageEnum } from "@/lib/validations";

export async function getDeals(stage?: string) {
  await requireAuth();
  const parsedStage = stage ? dealStageEnum.safeParse(stage) : null;

  return prisma.deal.findMany({
    where: parsedStage?.success ? { stage: parsedStage.data } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, company: true } },
    },
  });
}

export async function getDealContactOptions() {
  await requireAuth();
  return prisma.contact.findMany({
    select: { id: true, firstName: true, lastName: true, company: true },
    orderBy: { firstName: "asc" },
    take: 500,
  });
}

export async function createDeal(input: unknown) {
  await requireAuth();
  const data = dealCreateSchema.parse(input);
  const deal = await prisma.deal.create({ data });
  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return deal;
}

export async function updateDeal(input: unknown) {
  await requireAuth();
  const { id, ...data } = dealUpdateSchema.parse(input);

  let closedAt: Date | null | undefined;
  if (data.stage) {
    const isClosedStage = data.stage === "WON" || data.stage === "LOST";
    if (isClosedStage) {
      const existing = await prisma.deal.findUnique({ where: { id }, select: { closedAt: true } });
      closedAt = existing?.closedAt ?? new Date();
    } else {
      closedAt = null;
    }
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: { ...data, closedAt },
  });
  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return deal;
}

export async function deleteDeal(id: string) {
  await requireAuth();
  await prisma.deal.delete({ where: { id } });
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}
