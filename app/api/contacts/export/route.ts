import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { INDUSTRY_LABELS, LEAD_STATUS_CONFIG, LEAD_SOURCE_LABELS } from "@/lib/status-config";

const EXPORT_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Phone",
  "LinkedIn URL",
  "Company",
  "Contact Owner",
  "Lead Status",
  "Industry",
  "Industry Detail",
  "Lead Source",
  "Sequence Step",
  "SMS Opt-Out",
] as const;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idsParam = request.nextUrl.searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").filter(Boolean) : null;

  const contacts = await prisma.contact.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    orderBy: { createdAt: "asc" },
  });

  const rows = contacts.map((c) => [
    c.firstName,
    c.lastName ?? "",
    c.email,
    c.phone ?? "",
    c.linkedinUrl ?? "",
    c.company ?? "",
    c.contactOwner,
    LEAD_STATUS_CONFIG[c.leadStatus].label,
    INDUSTRY_LABELS[c.industry],
    c.industryDetail ?? "",
    LEAD_SOURCE_LABELS[c.leadSource],
    String(c.sequenceStep),
    c.smsOptOut ? "Yes" : "No",
  ]);

  const csv = Papa.unparse({ fields: [...EXPORT_HEADERS], data: rows });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
