import { getSequenceCounts } from "@/app/actions/touches";
import {
  getContactsByStatus,
  getContactsByIndustry,
  getContactsCreatedPerWeek,
  getTouchesPerChannelThisWeek,
} from "@/app/actions/dashboard";
import { SequenceTrackerWidget } from "@/components/dashboard/sequence-tracker-widget";
import { StatusBarChart } from "@/components/dashboard/status-bar-chart";
import { IndustryPieChart } from "@/components/dashboard/industry-pie-chart";
import { CreatedPerWeekChart } from "@/components/dashboard/created-per-week-chart";
import { TouchesPerChannelChart } from "@/components/dashboard/touches-per-channel-chart";

export default async function DashboardPage() {
  const [sequenceCounts, byStatus, byIndustry, perWeek, perChannel] = await Promise.all([
    getSequenceCounts(),
    getContactsByStatus(),
    getContactsByIndustry(),
    getContactsCreatedPerWeek(),
    getTouchesPerChannelThisWeek(),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Pipeline health and outreach activity at a glance.
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <SequenceTrackerWidget counts={sequenceCounts} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatusBarChart data={byStatus} />
          <IndustryPieChart data={byIndustry} />
          <CreatedPerWeekChart data={perWeek} />
          <TouchesPerChannelChart data={perChannel} />
        </div>
      </div>
    </div>
  );
}
