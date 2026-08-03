"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import type { Task } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createTask, updateTask } from "@/app/actions/tasks";
import { TEAM_MEMBER_LABELS } from "@/lib/status-config";

type ContactOption = { id: string; firstName: string; lastName: string | null; company: string | null };

const formSchema = z.object({
  contactId: z.string(),
  title: z.string().min(1, "Task title is required"),
  dueDate: z.string(),
  assignedTo: z.enum([
    "ZOHAIR_PARACHA",
    "MUHAMMAD_SOHAIB",
    "AMMAR_PARACHA",
    "MUHAMMAD_UMER",
    "GHULAM_HUSSAIN",
    "YASIR_AHMAD",
    "ZAINAB_PARACHA",
    "FARAZ_HUSSAIN",
    "MUHAMMAD_SUFYAN",
    "AMIR_BALLI",
    "SALMAN_IBAD",
  ]),
});
type FormValues = z.infer<typeof formSchema>;

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  contacts,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  contacts: ContactOption[];
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactId: task?.contactId ?? "",
      title: task?.title ?? "",
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      assignedTo: task?.assignedTo ?? "ZOHAIR_PARACHA",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      if (task) {
        await updateTask({ id: task.id, ...values });
        toast.success("Task updated");
      } else {
        await createTask(values);
        toast.success("Task created");
      }
      reset();
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Failed to save task");
    }
  }

  const contactId = watch("contactId");
  const assignedTo = watch("assignedTo");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Title</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Related contact (optional)</Label>
            <Select value={contactId || "NONE"} onValueChange={(v) => setValue("contactId", v === "NONE" ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="NONE">None</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName ?? ""} {c.company ? `— ${c.company}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Due date</Label>
              <Input type="date" {...register("dueDate")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Assigned to</Label>
              <Select value={assignedTo} onValueChange={(v) => setValue("assignedTo", v as FormValues["assignedTo"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEAM_MEMBER_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
