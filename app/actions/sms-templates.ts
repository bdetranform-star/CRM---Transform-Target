"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { smsTemplateSchema, smsTemplateUpdateSchema } from "@/lib/validations";

export async function listSmsTemplates() {
  await requireAuth();
  return prisma.smsTemplate.findMany({ orderBy: { createdAt: "asc" } });
}

export async function createSmsTemplate(input: unknown) {
  await requireAuth();
  const data = smsTemplateSchema.parse(input);
  const template = await prisma.smsTemplate.create({ data });
  revalidatePath("/sms-templates");
  return template;
}

export async function updateSmsTemplate(input: unknown) {
  await requireAuth();
  const { id, ...data } = smsTemplateUpdateSchema.parse(input);
  const template = await prisma.smsTemplate.update({ where: { id }, data });
  revalidatePath("/sms-templates");
  return template;
}

export async function deleteSmsTemplate(id: string) {
  await requireAuth();
  const parsedId = z.string().uuid().parse(id);
  await prisma.smsTemplate.delete({ where: { id: parsedId } });
  revalidatePath("/sms-templates");
}
