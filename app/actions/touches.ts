"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import {
  logCallSchema,
  logLinkedinTouchSchema,
  sendSmsSchema,
  markSmsRepliedSchema,
  addNoteSchema,
} from "@/lib/validations";

function revalidateContactViews() {
  revalidatePath("/");
  revalidatePath("/contacts");
  revalidatePath("/calls");
  revalidatePath("/linkedin");
  revalidatePath("/dashboard");
  revalidatePath("/activity-feed");
}

/**
 * Every logged Touch, on any channel, bumps lastContactDate. A Touch with a
 * positive/interested outcome (CONNECTED or REPLIED) also bumps
 * lastInterestedReply — this is the single place both fields are set, so
 * every touch-logging action below calls it right after creating its Touch.
 */
async function recordContactActivity(contactId: string, outcome?: string | null) {
  const now = new Date();
  const isInterested = outcome === "CONNECTED" || outcome === "REPLIED";
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      lastContactDate: now,
      ...(isInterested ? { lastInterestedReply: now } : {}),
    },
  });
}

export async function logCallTouch(input: unknown) {
  await requireAuth();
  const { contactId, outcome, notes } = logCallSchema.parse(input);

  const touch = await prisma.touch.create({
    data: {
      contactId,
      channel: "CALL",
      direction: "OUTBOUND",
      outcome,
      body: notes,
    },
  });

  if (outcome === "CONNECTED") {
    await prisma.contact.update({
      where: { id: contactId },
      data: { leadStatus: "CONNECTED", sequenceStep: 3 },
    });
  }
  await recordContactActivity(contactId, outcome);

  revalidateContactViews();
  return touch;
}

export async function logLinkedinTouch(input: unknown) {
  await requireAuth();
  const { contactId, outcome } = logLinkedinTouchSchema.parse(input);

  const touch = await prisma.touch.create({
    data: {
      contactId,
      channel: "LINKEDIN",
      direction: "OUTBOUND",
      outcome,
    },
  });

  if (outcome === "CONNECTED" || outcome === "REPLIED") {
    await prisma.contact.update({
      where: { id: contactId },
      data: { sequenceStep: 2 },
    });
  }
  await recordContactActivity(contactId, outcome);

  revalidateContactViews();
  return touch;
}

/**
 * Records an SMS send. This is the single seam for actual carrier delivery:
 * swap this body for a Twilio `messages.create(...)` call later without
 * touching any caller — the Touch record and validation stay the same.
 */
async function sendSmsViaProvider(_contact: { workPhone: string | null }, _body: string) {
  // Stretch goal: integrate Twilio here. For now this just simulates a send.
  return { simulated: true };
}

export async function sendSms(input: unknown) {
  await requireAuth();
  const { contactId, body, templateId } = sendSmsSchema.parse(input);

  const contact = await prisma.contact.findUniqueOrThrow({ where: { id: contactId } });
  if (contact.smsOptOut) {
    throw new Error("This contact has opted out of SMS.");
  }

  await sendSmsViaProvider(contact, body);

  const touch = await prisma.touch.create({
    data: {
      contactId,
      channel: "SMS",
      direction: "OUTBOUND",
      outcome: "SENT",
      body,
    },
  });

  void templateId;
  await recordContactActivity(contactId, "SENT");
  revalidateContactViews();
  return touch;
}

export async function markSmsReplied(input: unknown) {
  await requireAuth();
  const { contactId, optOut } = markSmsRepliedSchema.parse(input);

  const lastSms = await prisma.touch.findFirst({
    where: { contactId, channel: "SMS" },
    orderBy: { createdAt: "desc" },
  });

  if (lastSms) {
    await prisma.touch.update({
      where: { id: lastSms.id },
      data: { outcome: "REPLIED" },
    });
  }

  await prisma.touch.create({
    data: {
      contactId,
      channel: "SMS",
      direction: "INBOUND",
      outcome: "REPLIED",
      body: "Reply logged by user.",
    },
  });

  if (optOut) {
    await prisma.contact.update({ where: { id: contactId }, data: { smsOptOut: true } });
  }
  await recordContactActivity(contactId, "REPLIED");

  revalidateContactViews();
}

export async function addNoteTouch(input: unknown) {
  await requireAuth();
  const { contactId, body } = addNoteSchema.parse(input);

  const touch = await prisma.touch.create({
    data: { contactId, channel: "NOTE", direction: "OUTBOUND", body },
  });
  await recordContactActivity(contactId);

  revalidateContactViews();
  return touch;
}

export async function getSequenceCounts() {
  await requireAuth();
  const [email, linkedin, call, sms] = await Promise.all([
    prisma.contact.count({ where: { sequenceStep: 0 } }),
    prisma.contact.count({ where: { sequenceStep: 1 } }),
    prisma.contact.count({ where: { sequenceStep: 2 } }),
    prisma.contact.count({ where: { sequenceStep: 3 } }),
  ]);
  return { email, linkedin, call, sms };
}

export async function getCallQueue() {
  await requireAuth();
  return prisma.contact.findMany({
    where: { sequenceStep: 2 },
    orderBy: { updatedAt: "asc" },
    include: {
      touches: { where: { channel: "CALL" }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getLinkedinQueue() {
  await requireAuth();
  return prisma.contact.findMany({
    where: { sequenceStep: 1 },
    orderBy: { updatedAt: "asc" },
  });
}
