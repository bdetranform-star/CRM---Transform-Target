import { getBoardContacts } from "@/app/actions/contacts";
import { BoardView } from "@/components/board/board-view";

export default async function BoardPage() {
  const contacts = await getBoardContacts();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Lead Board</h1>
        <p className="text-sm text-muted-foreground">
          Drag cards between stages to update lead status.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <BoardView initialContacts={contacts} />
      </div>
    </div>
  );
}
