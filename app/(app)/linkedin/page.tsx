import { getLinkedinQueue } from "@/app/actions/touches";
import { LinkedinTasksView } from "@/components/linkedin-tasks/linkedin-tasks-view";

export default async function LinkedinPage() {
  const contacts = await getLinkedinQueue();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">LinkedIn Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Contacts due for a LinkedIn touch (sequence step 2 of 4). {contacts.length} pending.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <LinkedinTasksView initialContacts={contacts} />
      </div>
    </div>
  );
}
