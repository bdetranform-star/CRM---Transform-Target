import { getSequenceCounts } from "@/app/actions/touches";
import {
  getContactsByStatus,
  getContactsByIndustry,
  getNewContactsCreatedSummary,
  getContactSourcesBreakdown,
  getContactsAddedOverTime,
  getDealsCreatedOverTime,
  getDealsByStage,
  getActivityTypeBreakdown,
  getTeamActivitySummary,
  getOpenTasksSummary,
  getTaskStatusBreakdown,
  type DashboardRange,
} from "@/app/actions/dashboard";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { StatTile } from "@/components/dashboard/stat-tile";
import { SequenceTrackerWidget } from "@/components/dashboard/sequence-tracker-widget";
import { StatusBarChart } from "@/components/dashboard/status-bar-chart";
import { IndustryPieChart } from "@/components/dashboard/industry-pie-chart";
import { DailyLineChart } from "@/components/dashboard/daily-line-chart";
import { ActivityTypeChart } from "@/components/dashboard/activity-type-chart";
import { ContactSourcesChart } from "@/components/dashboard/contact-sources-chart";
import { DealsByStageChart } from "@/components/dashboard/deals-by-stage-chart";
import { TeamActivityChart } from "@/components/dashboard/team-activity-chart";
import { TaskStatusChart } from "@/components/dashboard/task-status-chart";
import { OpenTasksSummary } from "@/components/dashboard/open-tasks-summary";

const VALID_RANGES: DashboardRange[] = ["7", "30", "90", "365", "all"];

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const range: DashboardRange = VALID_RANGES.includes(params.range as DashboardRange)
    ? (params.range as DashboardRange)
    : "30";
  const owner = params.owner;

  const [
    sequenceCounts,
    byStatus,
    byIndustry,
    newContactsSummary,
    contactSources,
    contactsOverTime,
    dealsOverTime,
    dealsByStage,
    activityBreakdown,
    teamActivity,
    openTasks,
    taskStatus,
    byStatusColdEmail,
    byStatusLinkedin,
    byStatusSmsWhatsapp,
    byStatusColdCalling,
  ] = await Promise.all([
    getSequenceCounts(),
    getContactsByStatus(range, owner),
    getContactsByIndustry(),
    getNewContactsCreatedSummary(range, owner),
    getContactSourcesBreakdown(range, owner),
    getContactsAddedOverTime(range, owner),
    getDealsCreatedOverTime(range),
    getDealsByStage(),
    getActivityTypeBreakdown(range, owner),
    getTeamActivitySummary(range),
    getOpenTasksSummary(),
    getTaskStatusBreakdown(),
    getContactsByStatus(range, owner, ["COLD_EMAIL"]),
    getContactsByStatus(range, owner, ["LINKEDIN"]),
    getContactsByStatus(range, owner, ["SMS", "WHATSAPP"]),
    getContactsByStatus(range, owner, ["COLD_CALL"]),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Welcome back, BDE Team</h1>
        <h2 className="mt-3 text-lg font-semibold">Dashboards</h2>
        <p className="text-sm text-muted-foreground">
          Pipeline health and outreach activity at a glance.
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <DashboardFilters />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            title="New contacts created"
            value={newContactsSummary.current}
            changePct={newContactsSummary.changePct}
            subLabel={
              newContactsSummary.previous !== null
                ? `${newContactsSummary.previous} in previous period`
                : undefined
            }
          />
          <OpenTasksSummary open={openTasks.open} overdue={openTasks.overdue} />
        </div>

        <SequenceTrackerWidget counts={sequenceCounts} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatusBarChart data={byStatus} />
          <IndustryPieChart data={byIndustry} />
          <ContactSourcesChart data={contactSources} />
          <DailyLineChart title="Contacts added over time" data={contactsOverTime} />
          <DailyLineChart title="Deals created over time" data={dealsOverTime} />
          <DealsByStageChart data={dealsByStage} />
          <ActivityTypeChart data={activityBreakdown} />
          <TeamActivityChart data={teamActivity} />
          <TaskStatusChart data={taskStatus} />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Contacts by status, by outreach channel
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StatusBarChart title="Cold Email outreach — Contacts by status" data={byStatusColdEmail} />
            <StatusBarChart title="LinkedIn outreach — Contacts by status" data={byStatusLinkedin} />
            <StatusBarChart title="SMS / WhatsApp outreach — Contacts by status" data={byStatusSmsWhatsapp} />
            <StatusBarChart title="Cold Calling outreach — Contacts by status" data={byStatusColdCalling} />
          </div>
        </div>
      </div>
    </div>
  );
}
