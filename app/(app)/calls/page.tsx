import { getCallQueue } from "@/app/actions/touches";
import { CallQueueView } from "@/components/call-queue/call-queue-view";

export default async function CallsPage() {
  const queue = await getCallQueue();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Call Queue</h1>
        <p className="text-sm text-muted-foreground">
          Contacts due for a call (sequence step 3 of 4). {queue.length} in queue.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <CallQueueView initialQueue={queue} />
      </div>
    </div>
  );
}
