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
  // existing emails (and within the batch itself) before inserting.
  const emails = contacts.map((row) => row.email);
  const existing = await prisma.contact.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const existingEmails = new Set(existing.map((c) => c.email));
  const seenInBatch = new Set<string>();

  const rowsToInsert = contacts.filter((row) => {
    if (existingEmails.has(row.email) || seenInBatch.has(row.email)) return false;
    seenInBatch.add(row.email);
    return true;
  });

  const result = await prisma.contact.createMany({
    data: rowsToInsert.map((row) => ({
      firstName: row.firstName,
      lastName: row.lastName || null,
      email: row.email,
      workPhone: row.workPhone || null,
      linkedinUrl: row.linkedinUrl || null,
      company: row.company || null,
      contactOwner: row.contactOwner || defaultOwner,
      industry: row.industry,
    })),
  });

  return NextResponse.json({
    imported: result.count,
    submitted: contacts.length,
    skipped: contacts.length - result.count,
  });
}
