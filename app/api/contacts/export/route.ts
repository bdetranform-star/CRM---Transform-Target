import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  INDUSTRY_LABELS,
  INDUSTRY_DETAIL_LABELS,
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_CAPTURED_LABELS,
  LIFECYCLE_STAGE_LABELS,
  TEAM_MEMBER_LABELS,
} from "@/lib/status-config";

const EXPORT_HEADERS = [
  "First Name",
  "Last Name",
  "Job Title",
  "Email Address",
  "Work Phone Number",
  "Cell Phone Number",
  "LinkedIn URL",
  "Company Name",
  "Lifecycle Stage",
  "Lead Status",
  "Industry",
  "Industry Detail",
  "Contact Owner",
  "Lead Source",
  "Lead Source Captured",
  "Website URL",
  "Website Traffic",
  "Number of Employees",
  "Street Address",
  "City",
  "State",
  "Country",
  "Zip Code",
  "Last Interested Reply",
  "Last Contact Date",
  "Created Date",
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
    c.jobTitle ?? "",
    c.email ?? "",
    c.workPhone ?? "",
    c.cellPhone ?? "",
    c.linkedinUrl ?? "",
    c.company ?? "",
    LIFECYCLE_STAGE_LABELS[c.lifecycleStage],
    LEAD_STATUS_CONFIG[c.leadStatus].label,
    INDUSTRY_LABELS[c.industry],
    c.industryDetail ? INDUSTRY_DETAIL_LABELS[c.industryDetail] : "",
    TEAM_MEMBER_LABELS[c.contactOwner],
    LEAD_SOURCE_LABELS[c.leadSource],
    c.leadSourceCaptured ? LEAD_SOURCE_CAPTURED_LABELS[c.leadSourceCaptured] : "",
    c.websiteUrl ?? "",
    c.websiteTraffic?.toString() ?? "",
    c.numberOfEmployees?.toString() ?? "",
    c.streetAddress ?? "",
    c.city ?? "",
    c.state ?? "",
    c.country ?? "",
    c.zipCode ?? "",
    c.lastInterestedReply?.toISOString() ?? "",
    c.lastContactDate?.toISOString() ?? "",
    c.createdAt.toISOString(),
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
