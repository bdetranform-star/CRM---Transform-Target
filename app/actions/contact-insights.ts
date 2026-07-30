"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";
import { generateContactInsightsSchema } from "@/lib/validations";
import { buildContactContext } from "@/lib/contact-ai-context";
import { callAnthropic, describeAnthropicError } from "@/lib/anthropic";

const INSIGHTS_SYSTEM_PROMPT = `You are a sales assistant embedded in a B2B cold-outreach CRM for the
Facility Maintenance / IFM industry. You'll be given one contact's full
properties and touch history. Write a short (3-5 sentence) plain-text
summary covering: where this lead currently stands, what's happened in the
outreach so far, and one concrete suggested next action. Be specific and
reference actual details (dates, outcomes, stated objections) rather than
generic sales advice. Do not use markdown formatting — plain prose only.`;

/**
 * Regenerates and caches the contact detail page's AI Insights summary.
 * Deliberately NOT called automatically on every page view — only from an
 * explicit user action (initial load with no cached summary yet, or a
 * manual "Regenerate" click) — to keep Anthropic API cost bounded.
 */
export async function generateContactInsights(
  input: unknown
): Promise<
  { success: true; summary: string; generatedAt: Date } | { success: false; error: string }
> {
  await requireAuth();
  const { contactId } = generateContactInsightsSchema.parse(input);

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) return { success: false, error: "Contact not found." };

  const touches = await prisma.touch.findMany({
    where: { contactId },
    orderBy: { createdAt: "asc" },
  });
  const context = buildContactContext(contact, touches);

  try {
    const summary = await callAnthropic({
      system: INSIGHTS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is everything known about this contact:\n\n${context}\n\nWrite the summary now.`,
        },
      ],
      maxTokens: 500,
    });

    const generatedAt = new Date();
    await prisma.contact.update({
      where: { id: contactId },
      data: { aiInsightsSummary: summary, aiInsightsGeneratedAt: generatedAt },
    });

    revalidatePath(`/contacts/${contactId}`);
    return { success: true, summary, generatedAt };
  } catch (err) {
    return { success: false, error: describeAnthropicError(err) };
  }
}

export async function getContactChatMessages(contactId: unknown) {
  await requireAuth();
  const id = z.string().uuid().parse(contactId);
  return prisma.contactChatMessage.findMany({
    where: { contactId: id },
    orderBy: { createdAt: "asc" },
  });
}
