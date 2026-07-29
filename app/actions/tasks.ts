"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validations";

export async function getTasks() {
  await requireAuth();
  return prisma.task.findMany({
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, company: true } },
    },
  });
}

export async function getTaskContactOptions() {
  await requireAuth();
  return prisma.contact.findMany({
    select: { id: true, firstName: true, lastName: true, company: true },
    orderBy: { firstName: "asc" },
    take: 500,
  });
}

export async function createTask(input: unknown) {
  await requireAuth();
  const data = taskCreateSchema.parse(input);
  const task = await prisma.task.create({ data });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}

export async function updateTask(input: unknown) {
  await requireAuth();
  const { id, ...data } = taskUpdateSchema.parse(input);
  const task = await prisma.task.update({ where: { id }, data });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}

export async function toggleTaskCompleted(id: string, completed: boolean) {
  await requireAuth();
  const task = await prisma.task.update({ where: { id }, data: { completed } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return task;
}

export async function deleteTask(id: string) {
  await requireAuth();
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
