"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PropertyPicker } from "./property-picker";
import { ChannelTagToggleGroup } from "@/components/channel-tags";
import { DatePicker } from "@/components/ui/date-picker";
import {
  BULK_EDIT_FIELDS,
  BULK_EDIT_FIELD_MAP,
  isBulkEditChangeComplete,
  describeBulkEditChange,
  type BulkEditChange,
  type BulkEditFieldDef,
} from "@/lib/contact-bulk-edit";
import { bulkUpdateContactProperties } from "@/app/actions/contacts";
import type { ChannelTag } from "@prisma/client";

function emptyChange(): BulkEditChange {
  return { field: "", value: "" };
}

/** Renders the right-shaped single value input for a bulk-editable field's type. */
function BulkValueEditor({
  def,
  value,
  onChange,
}: {
  def: BulkEditFieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  if (def.type === "enum") {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a value" />
        </SelectTrigger>
        <SelectContent>
          {def.options?.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (def.type === "boolean") {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a value" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (def.type === "number") {
    return <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} />;
  }

  if (def.type === "array_enum") {
    const selected = value ? (value.split(",") as ChannelTag[]) : [];
    return (
      <ChannelTagToggleGroup value={selected} onChange={(next) => onChange(next.join(","))} />
    );
  }

  if (def.type === "date") {
    return (
      <DatePicker
        value={value ? new Date(value) : undefined}
        onChange={(date) => onChange(date ? date.toISOString().slice(0, 10) : "")}
      />
    );
  }

  return <Input value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function BulkEditDialog({
  selectedIds,
  open,
  onOpenChange,
  onApplied,
}: {
  selectedIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied: () => void;
}) {
  const [rows, setRows] = useState<BulkEditChange[]>([emptyChange()]);
  const [editingIndex, setEditingIndex] = useState<number | null>(0);
  const [stage, setStage] = useState<"edit" | "review">("edit");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setRows([emptyChange()]);
    setEditingIndex(0);
    setStage("edit");
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function updateRow(index: number, patch: Partial<BulkEditChange>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function selectField(index: number, field: string) {
    updateRow(index, { field, value: "" });
    setEditingIndex(null);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setEditingIndex(null);
  }

  function addRow() {
    setRows((prev) => {
      const next = [...prev, emptyChange()];
      setEditingIndex(next.length - 1);
      return next;
    });
  }

  const usedFields = new Set(rows.map((r) => r.field).filter(Boolean));
  const completeRows = rows.filter(isBulkEditChangeComplete);
  const contactWord = selectedIds.length === 1 ? "contact" : "contacts";

  async function handleApply() {
    setSubmitting(true);
    try {
      const count = await bulkUpdateContactProperties({ ids: selectedIds, changes: completeRows });
      toast.success(`Updated ${count} contact${count === 1 ? "" : "s"}`);
      onApplied();
      handleClose(false);
    } catch {
      toast.error("Failed to apply bulk edit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Bulk edit {selectedIds.length} {contactWord}
          </DialogTitle>
        </DialogHeader>

        {stage === "edit" ? (
          <>
            <div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto">
              {rows.map((row, index) => {
                const def = BULK_EDIT_FIELD_MAP[row.field];
                const isPicking = editingIndex === index || !def;
                return (
                  <div key={index} className="rounded-lg border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      {def && !isPicking ? (
                        <button
                          type="button"
                          onClick={() => setEditingIndex(index)}
                          className="text-sm font-medium hover:underline"
                        >
                          {def.label}
                        </button>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">Choose a property</span>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => removeRow(index)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {isPicking ? (
                      <PropertyPicker
                        fields={BULK_EDIT_FIELDS}
                        excludeFields={usedFields}
                        onSelect={(field) => selectField(index, field)}
                      />
                    ) : (
                      <BulkValueEditor
                        def={def}
                        value={row.value}
                        onChange={(value) => updateRow(index, { value })}
                      />
                    )}
                  </div>
                );
              })}
              <Button variant="outline" size="sm" onClick={addRow} className="self-start">
                <Plus className="size-4" />
                Add property
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button disabled={completeRows.length === 0} onClick={() => setStage("review")}>
                Review changes
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                This will update the following for all {selectedIds.length} selected {contactWord}:
              </p>
              <ul className="flex flex-col gap-1.5 rounded-lg border border-border p-3 text-sm">
                {completeRows.map((row, i) => (
                  <li key={i}>{describeBulkEditChange(row)}</li>
                ))}
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStage("edit")} disabled={submitting}>
                Back
              </Button>
              <Button onClick={handleApply} disabled={submitting}>
                {submitting ? "Applying..." : `Apply to ${selectedIds.length} ${contactWord}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
