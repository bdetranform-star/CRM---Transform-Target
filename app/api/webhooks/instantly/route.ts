import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { instantlyWebhookSchema, mapInstantlyEventToLeadStatus } from "@/lib/instantly";

/**
 * Receives campaign-activity webhooks from Instantly.ai and syncs lead status.
 *
 * Configure this URL in your Instantly.ai campaign webhook settings. If
 * INSTANTLY_WEBHOOK_SECRET is set, Instantly must send it back as either the
 * `x-instantly-secret` header or a `?secret=` query param — never trust an
 * unauthenticated webhook body for a write like this.
 */
export async function POST(request: NextRequest) {
  const configuredSecret = process.env.INSTANTLY_WEBHOOK_SECRET;
  if (configuredSecret) {
    const providedSecret =
      request.headers.get("x-instantly-secret") ?? request.nextUrl.searchParams.get("secret");
    if (providedSecret !== configuredSecret) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }
  }

  const body = await request.json().catch(() => null);
  const parsed = instantlyWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { event_type, lead_email, campaign_name } = parsed.data;

  const contact = await prisma.contact.findUnique({ where: { email: lead_email } });
  if (!contact) {
    // Not an error — Instantly may fire events for leads outside this CRM.
    return NextResponse.json({ status: "ignored", reason: "contact not found" });
  }

  const nextStatus = mapInstantlyEventToLeadStatus(event_type);

  await prisma.touch.create({
    data: {
      contactId: contact.id,
      channel: "EMAIL",
      direction: "INBOUND",
      outcome: event_type,
      body: campaign_name ? `Instantly.ai campaign: ${campaign_name}` : "Instantly.ai event",
    },
  });

  if (nextStatus) {
    await prisma.contact.update({
      where: { id: contact.id },
      data: { leadStatus: nextStatus },
    });
  }

  return NextResponse.json({ status: "ok", updatedStatus: nextStatus });
}
