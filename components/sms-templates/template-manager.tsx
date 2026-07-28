"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { SmsTemplate } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { listSmsTemplates, deleteSmsTemplate } from "@/app/actions/sms-templates";
import { TemplateFormDialog } from "./template-form-dialog";

export function TemplateManager({ initialTemplates }: { initialTemplates: SmsTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);

  async function refresh() {
    setTemplates(await listSmsTemplates());
  }

  function handleNew() {
    setEditingTemplate(null);
    setDialogOpen(true);
  }

  function handleEdit(template: SmsTemplate) {
    setEditingTemplate(template);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    try {
      await deleteSmsTemplate(id);
      toast.success("Template deleted");
      refresh();
    } catch {
      toast.error("Failed to delete template");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={handleNew}>
          <Plus className="size-4" />
          New template
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="flex-row items-start justify-between">
              <CardTitle className="text-sm">{template.name}</CardTitle>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => handleEdit(template)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{template.body}</p>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <p className="text-sm text-muted-foreground">No templates yet. Create your first one.</p>
        )}
      </div>

      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        onSaved={refresh}
      />
    </div>
  );
}
