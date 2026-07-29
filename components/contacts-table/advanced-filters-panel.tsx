"use client";

import { useState } from "react";
import { Plus, Trash2, SlidersHorizontal, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FILTERABLE_FIELDS,
  FILTER_FIELD_MAP,
  OPERATORS_BY_TYPE,
  describeFilter,
  type ContactFilter,
  type FilterOperator,
} from "@/lib/contact-filters";

function emptyFilter(): ContactFilter {
  const first = FILTERABLE_FIELDS[0];
  return { field: first.field, operator: OPERATORS_BY_TYPE[first.type][0].value, value: "" };
}

export function AdvancedFiltersPanel({
  filters,
  onChange,
}: {
  filters: ContactFilter[];
  onChange: (filters: ContactFilter[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ContactFilter[]>(filters);

  function openPanel() {
    setDraft(filters.length > 0 ? filters : [emptyFilter()]);
    setOpen(true);
  }

  function updateRow(index: number, patch: Partial<ContactFilter>) {
    setDraft((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function updateField(index: number, field: string) {
    const def = FILTER_FIELD_MAP[field];
    updateRow(index, { field, operator: OPERATORS_BY_TYPE[def.type][0].value, value: "" });
  }

  function removeRow(index: number) {
    setDraft((rows) => rows.filter((_, i) => i !== index));
  }

  function addRow() {
    setDraft((rows) => [...rows, emptyFilter()]);
  }

  function apply() {
    onChange(draft.filter((f) => f.value.trim() !== ""));
    setOpen(false);
  }

  function clearAll() {
    onChange([]);
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={openPanel}>
        <SlidersHorizontal className="size-4" />
        Advanced filters {filters.length > 0 ? `(${filters.length})` : ""}
      </Button>

      {filters.map((filter, index) => (
        <span
          key={`${filter.field}-${index}`}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium"
        >
          {describeFilter(filter)}
          <button
            onClick={() => onChange(filters.filter((_, i) => i !== index))}
            className="rounded-full hover:bg-black/10"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {filters.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Clear all
        </button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>All filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {draft.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-muted-foreground">No filters yet.</p>
                <Button size="sm" onClick={addRow}>
                  <Plus className="size-4" />
                  Add filter
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {draft.map((filter, index) => {
                  const def = FILTER_FIELD_MAP[filter.field];
                  return (
                    <div key={index} className="flex items-start gap-2 rounded-lg border border-border p-3">
                      <div className="flex flex-1 flex-col gap-2">
                        <Select value={filter.field} onValueChange={(v) => updateField(index, v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {FILTERABLE_FIELDS.map((f) => (
                              <SelectItem key={f.field} value={f.field}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Select
                            value={filter.operator}
                            onValueChange={(v) => updateRow(index, { operator: v as FilterOperator })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERATORS_BY_TYPE[def.type].map((op) => (
                                <SelectItem key={op.value} value={op.value}>
                                  {op.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {def.type === "enum" ? (
                            <Select
                              value={filter.value}
                              onValueChange={(v) => updateRow(index, { value: v })}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Choose..." />
                              </SelectTrigger>
                              <SelectContent className="max-h-72">
                                {def.options?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : def.type === "date" ? (
                            <Input
                              type="date"
                              className="flex-1"
                              value={filter.value}
                              onChange={(e) => updateRow(index, { value: e.target.value })}
                            />
                          ) : def.type === "number" ? (
                            <Input
                              type="number"
                              className="flex-1"
                              value={filter.value}
                              onChange={(e) => updateRow(index, { value: e.target.value })}
                            />
                          ) : (
                            <Input
                              className="flex-1"
                              value={filter.value}
                              onChange={(e) => updateRow(index, { value: e.target.value })}
                            />
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeRow(index)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  );
                })}
                <Button variant="outline" size="sm" onClick={addRow} className="self-start">
                  <Plus className="size-4" />
                  Add filter
                </Button>
              </div>
            )}
          </div>
          <SheetFooter className="flex-row justify-between">
            <Button variant="ghost" onClick={clearAll}>
              Clear all
            </Button>
            <Button onClick={apply}>Apply filters</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
