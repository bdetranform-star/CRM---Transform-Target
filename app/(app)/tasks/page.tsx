import { getTasks, getTaskContactOptions } from "@/app/actions/tasks";
import { TasksView } from "@/components/tasks/tasks-view";

export default async function TasksPage() {
  const [tasks, contacts] = await Promise.all([getTasks(), getTaskContactOptions()]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-white px-6 py-4">
        <h1 className="text-lg font-semibold">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          {tasks.filter((t) => !t.completed).length} open, {tasks.filter((t) => t.completed).length} completed
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <TasksView initialTasks={tasks} contacts={contacts} />
      </div>
    </div>
  );
}
