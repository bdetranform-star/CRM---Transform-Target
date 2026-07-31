import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { importContactsSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = importContactsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid import payload", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { contacts, defaultOwner } = parsed.data;

  // SQLite's `createMany` doesn't support `skipDuplicates`, so de-dupe against
  // existing emails (and within the batch itself) before inserting. Rows with
  // no email (null) are never deduped against each other or against existing
  // no-email contacts — only a real, non-null email can collide, matching the
  // nullable @unique column's own semantics (Postgres allows any number of
  // NULLs in a unique index).
  const emails = contacts.map((row) => row.email).filter((email): email is string => email !== null);
  const existing = emails.length
    ? await prisma.contact.findMany({
        where: { email: { in: emails } },
        select: { email: true },
      })
    : [];
  const existingEmails = new Set(existing.map((c) => c.email));
  const seenInBatch = new Set<string>();

  const rowsToInsert = contacts.filter((row) => {
    if (row.email === null) return true;
    if (existingEmails.has(row.email) || seenInBatch.has(row.email)) return false;
    seenInBatch.add(row.email);
    return true;
  });

  const result = await prisma.contact.createMany({
    data: rowsToInsert.map((row) => ({
      firstName: row.firstName || "",
      lastName: row.lastName || null,
      email: row.email,
      workPhone: row.workPhone || null,
      linkedinUrl: row.linkedinUrl || null,
      company: row.company || null,
      contactOwner: row.contactOwner || defaultOwner,
      industry: row.industry,
      designation: row.designation || null,
      linkedinConnectionStatus: row.linkedinConnectionStatus || null,
      linkedinPitchNote: row.linkedinPitchNote || null,
      linkedinFollowUp1: row.linkedinFollowUp1 ?? null,
      linkedinFollowUp2: row.linkedinFollowUp2 ?? null,
      linkedinFollowUp3: row.linkedinFollowUp3 ?? null,
      linkedinFollowUp4: row.linkedinFollowUp4 ?? null,
      linkedinLifecycleStage: row.linkedinLifecycleStage || null,
      interestedResponseFrom: row.interestedResponseFrom || null,
      channelTags: row.channelTags,
      linkedinConnectedOn: row.linkedinConnectedOn ?? null,
    })),
  });

  return NextResponse.json({
    imported: result.count,
    submitted: contacts.length,
    skipped: contacts.length - result.count,
  });
}
