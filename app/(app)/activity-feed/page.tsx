import { getActivityFeed } from "@/app/actions/activity-feed";
import { ActivityFeedView } from "@/components/activity-feed/activity-feed-view";

export default async function ActivityFeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;
  const data = await getActivityFeed(page);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Activity Feed</h1>
        <p className="text-sm text-muted-foreground">
          Every touch logged across all contacts, newest first. {data.total} total.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <ActivityFeedView data={data} />
      </div>
    </div>
  );
}
