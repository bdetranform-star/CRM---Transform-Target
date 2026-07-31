import { getLinkedinLifecycleBoardContacts } from "@/app/actions/contacts";
import { LinkedinBoardView } from "@/components/linkedin-board/linkedin-board-view";

export default async function LinkedinLifecyclePage() {
  const contacts = await getLinkedinLifecycleBoardContacts();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">LinkedIn Lifecycle</h1>
        <p className="text-sm text-muted-foreground">
          Drag cards between stages to update a contact&apos;s LinkedIn outreach lifecycle.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <LinkedinBoardView initialContacts={contacts} />
      </div>
    </div>
  );
}
