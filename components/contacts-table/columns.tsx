"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import type { Contact } from "@prisma/client";
import { format } from "date-fns";

import { Checkbox } from "@/components/ui/checkbox";
import { StatusPill } from "@/components/status-pill";
import { ContactAvatar } from "@/components/contact-avatar";
import { ChannelTagBadges } from "@/components/channel-tags";
import {
  INDUSTRY_LABELS,
  INDUSTRY_DETAIL_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_SOURCE_CAPTURED_LABELS,
  LIFECYCLE_STAGE_LABELS,
  TEAM_MEMBER_LABELS,
  LINKEDIN_CONNECTION_STATUS_LABELS,
  LINKEDIN_LIFECYCLE_STAGE_LABELS,
  INTERESTED_RESPONSE_CHANNEL_LABELS,
  REGION_LABELS,
  LINKEDIN_RESPONSE_TYPE_LABELS,
} from "@/lib/status-config";

export type ContactRow = Omit<Contact, never> & {
  callCount: number;
  lastCallOutcome: string | null;
};

const columnHelper = createColumnHelper<ContactRow>();

function formatDate(value: Date | null) {
  return value ? format(value, "MMM d, yyyy") : "—";
}

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
  columnHelper.display({
    id: "avatar",
    header: "",
    cell: ({ row }) => (
      <ContactAvatar
        id={row.original.id}
        firstName={row.original.firstName}
        lastName={row.original.lastName}
        avatarUrl={row.original.avatarUrl}
        size={28}
      />
    ),
  }),
  columnHelper.accessor("firstName", {
    header: "First Name",
  }),
  columnHelper.accessor("lastName", {
    header: "Last Name",
    cell: (info) => info.getValue() ?? "",
  }),
  columnHelper.accessor("jobTitle", {
    header: "Job Title",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("email", {
    header: "Email Address",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("workPhone", {
    header: "Work Phone Number",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("cellPhone", {
    header: "Cell Phone Number",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("company", {
    header: "Company Name",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("designation", {
    header: "Designation",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("contactOwner", {
    header: "Contact Owner",
    cell: (info) => TEAM_MEMBER_LABELS[info.getValue()],
  }),
  columnHelper.accessor("lifecycleStage", {
    header: "Lifecycle Stage",
    cell: (info) => LIFECYCLE_STAGE_LABELS[info.getValue()],
  }),
  columnHelper.accessor("leadStatus", {
    header: "Lead Status",
    cell: (info) => <StatusPill status={info.getValue()} />,
  }),
  columnHelper.accessor("industry", {
    header: "Industry",
    cell: (info) => INDUSTRY_LABELS[info.getValue()],
  }),
  columnHelper.accessor("industryDetail", {
    header: "Industry Detail",
    cell: (info) => {
      const v = info.getValue();
      return v ? INDUSTRY_DETAIL_LABELS[v] : "—";
    },
  }),
  columnHelper.accessor("leadSource", {
    header: "Lead Source",
    cell: (info) => LEAD_SOURCE_LABELS[info.getValue()],
  }),
  columnHelper.accessor("leadSourceCaptured", {
    header: "Lead Source Captured",
    cell: (info) => {
      const v = info.getValue();
      return v ? LEAD_SOURCE_CAPTURED_LABELS[v] : "—";
    },
  }),
  columnHelper.accessor("channelTags", {
    header: "Channel Tag",
    cell: (info) => <ChannelTagBadges tags={info.getValue()} />,
    enableSorting: false,
  }),
  columnHelper.accessor("city", {
    header: "City",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("state", {
    header: "State",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("country", {
    header: "Country",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("numberOfEmployees", {
    header: "# Employees",
    cell: (info) => info.getValue()?.toLocaleString() ?? "—",
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
  columnHelper.accessor("linkedinConnectionStatus", {
    header: "LinkedIn Status",
    cell: (info) => {
      const v = info.getValue();
      return v ? LINKEDIN_CONNECTION_STATUS_LABELS[v] : "—";
    },
  }),
  columnHelper.accessor("linkedinConnectedOn", {
    header: "LinkedIn Connected On",
    // US MM/DD/YYYY format, per spec — distinct from the "MMM d, yyyy"
    // convention used by the other date columns below.
    cell: (info) => {
      const v = info.getValue();
      return v ? format(v, "MM/dd/yyyy") : "—";
    },
  }),
  columnHelper.accessor("linkedinPitchNote", {
    header: "Pitch / Connection Request Note",
    enableSorting: false,
    cell: (info) => {
      const v = info.getValue();
      if (!v) return "—";
      return v.length > 60 ? `${v.slice(0, 60)}…` : v;
    },
  }),
  columnHelper.accessor("linkedinFollowUp1", {
    header: "1st Follow Up LinkedIn",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
  columnHelper.accessor("linkedinFollowUp2", {
    header: "2nd Follow Up LinkedIn",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
  columnHelper.accessor("linkedinFollowUp3", {
    header: "3rd Follow Up LinkedIn",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
  columnHelper.accessor("linkedinFollowUp4", {
    header: "4th Follow Up LinkedIn",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
  columnHelper.accessor("linkedinLifecycleStage", {
    header: "Lifecycle of LinkedIn",
    cell: (info) => {
      const v = info.getValue();
      return v ? LINKEDIN_LIFECYCLE_STAGE_LABELS[v] : "—";
    },
  }),
  columnHelper.accessor("interestedResponseFrom", {
    header: "Interested Response From",
    cell: (info) => {
      const v = info.getValue();
      return v ? INTERESTED_RESPONSE_CHANNEL_LABELS[v] : "—";
    },
  }),
  columnHelper.accessor("linkedinRegion", {
    header: "Region",
    cell: (info) => {
      const v = info.getValue();
      return v ? REGION_LABELS[v] : "—";
    },
  }),
  columnHelper.accessor("linkedinRequestSent", {
    header: "Request Sent",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
  columnHelper.accessor("linkedinRequestAccepted", {
    header: "Request Accepted",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
  columnHelper.accessor("linkedinResponse", {
    header: "Response",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
  columnHelper.accessor("linkedinMeetingBooked", {
    header: "Meeting Booked",
    cell: (info) => (info.getValue() ? "Yes" : "No"),
  }),
  columnHelper.accessor("linkedinResponseType", {
    header: "Response Type",
    cell: (info) => {
      const v = info.getValue();
      return v ? LINKEDIN_RESPONSE_TYPE_LABELS[v] : "—";
    },
  }),
  columnHelper.accessor("lastContactDate", {
    header: "Last Contact Date",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("lastInterestedReply", {
    header: "Last Interested Reply",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("createdAt", {
    header: "Created Date",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("updatedAt", {
    header: "Updated",
    cell: (info) => formatDate(info.getValue()),
  }),
];
