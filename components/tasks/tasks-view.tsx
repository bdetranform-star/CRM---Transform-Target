"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ListChecks } from "lucide-react";
import type { Task } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { TaskFormDialog } from "./task-form-dialog";
import { toggleTaskCompleted } from "@/app/actions/tasks";
import { TEAM_MEMBER_LABELS } from "@/lib/status-config";
import { cn } from "@/lib/utils";

type TaskWithContact = Task & {
  contact: { id: string; firstName: string; lastName: string | null; company: string | null } | null;
};
type ContactOption = { id: string; firstName: string; lastName: string | null; company: string | null };

export function TasksView({
  initialTasks,
  contacts,
}: {
  initialTasks: TaskWithContact[];
  contacts: ContactOption[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);

  async function handleToggle(task: Task) {
    try {
      await toggleTaskCompleted(task.id, !task.completed);
      router.refresh();
    } catch {
      toast.error("Failed to update task");
    }
  }

  function handleNew() {
    setEditingTask(null);
    setDialogOpen(true);
  }

  function handleEdit(task: Task) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  const visibleTasks = showCompleted ? initialTasks : initialTasks.filter((t) => !t.completed);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant={showCompleted ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowCompleted((v) => !v)}
        >
          {showCompleted ? "Showing all tasks" : "Open tasks only"}
        </Button>
        <Button size="sm" className="ml-auto" onClick={handleNew}>
          <Plus className="size-4" />
          New Task
        </Button>
      </div>

      {visibleTasks.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <ListChecks className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No tasks</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Title</TableHead>
                <TableHead>Related Contact</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Assigned To</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="cursor-pointer"
                  onClick={() => handleEdit(task)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={task.completed} onCheckedChange={() => handleToggle(task)} />
                  </TableCell>
                  <TableCell className={cn("font-medium", task.completed && "text-muted-foreground line-through")}>
                    {task.title}
                  </TableCell>
                  <TableCell>
                    {task.contact
                      ? `${task.contact.firstName} ${task.contact.lastName ?? ""}${task.contact.company ? ` — ${task.contact.company}` : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</TableCell>
                  <TableCell>{TEAM_MEMBER_LABELS[task.assignedTo]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        contacts={contacts}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
