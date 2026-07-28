"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import type { Contact } from "@prisma/client";
import { format } from "date-fns";

import { Checkbox } from "@/components/ui/checkbox";
import { StatusPill } from "@/components/status-pill";
import { INDUSTRY_LABELS, LEAD_SOURCE_LABELS } from "@/lib/status-config";

export type ContactRow = Omit<Contact, never> & {
  callCount: number;
  lastCallOutcome: string | null;
};

const columnHelper = createColumnHelper<ContactRow>();

export const contactColumns = [
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("firstName", {
    header: "First Name",
  }),
  columnHelper.accessor("lastName", {
    header: "Last Name",
    cell: (info) => info.getValue() ?? "",
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("phone", {
    header: "Phone",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("company", {
    header: "Company",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("contactOwner", {
    header: "Contact Owner",
  }),
  columnHelper.accessor("leadStatus", {
    header: "Lead Status",
    cell: (info) => <StatusPill status={info.getValue()} />,
  }),
  columnHelper.accessor("industry", {
    header: "Industry",
    cell: (info) => INDUSTRY_LABELS[info.getValue()],
  }),
  columnHelper.accessor("leadSource", {
    header: "Lead Source",
    cell: (info) => LEAD_SOURCE_LABELS[info.getValue()],
  }),
  columnHelper.accessor("sequenceStep", {
    header: "Sequence Step",
  }),
  columnHelper.accessor("callCount", {
    header: "Calls",
    enableSorting: false,
  }),
  columnHelper.accessor("lastCallOutcome", {
    header: "Last Call Outcome",
    enableSorting: false,
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("smsOptOut", {
    header: "SMS Opt-out",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
  columnHelper.accessor("linkedinUrl", {
    header: "LinkedIn",
    enableSorting: false,
    cell: (info) =>
      info.getValue() ? (
        <a
          href={info.getValue() ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[var(--channel-linkedin)] hover:underline"
        >
          <ExternalLink className="size-3.5" />
          Profile
        </a>
      ) : (
        "—"
      ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Created",
    cell: (info) => format(info.getValue(), "MMM d, yyyy"),
  }),
  columnHelper.accessor("updatedAt", {
    header: "Updated",
    cell: (info) => format(info.getValue(), "MMM d, yyyy"),
  }),
];
