"use client";

import { useState } from "react";
import { Plus, Trash2, SlidersHorizontal, X, Lock } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  isFilterComplete,
  type ContactFilter,
  type FilterFieldDef,
  type FilterOperator,
} from "@/lib/contact-filters";
import { PropertyPicker } from "./property-picker";

function emptyFilter(): ContactFilter {
  return { field: "", operator: "contains" };
}

/** Searchable multi-select checklist — used by "is any of" / "is none of". */
function SearchableChecklist({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="overflow-hidden rounded-md border border-border">
      {options.length > 6 && (
        <Input
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-none border-0 border-b border-border focus-visible:ring-0"
        />
      )}
      <div className="max-h-48 overflow-y-auto p-1">
        {filtered.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-secondary"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => {
                  if (v === true) onChange([...selected, opt.value]);
                  else onChange(selected.filter((s) => s !== opt.value));
                }}
              />
              {opt.label}
            </label>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matches.</p>
        )}
      </div>
    </div>
  );
}

/** Renders the right-shaped value input(s) for the filter's current operator. */
function ValueEditor({
  filter,
  def,
  onChange,
}: {
  filter: ContactFilter;
  def: FilterFieldDef;
  onChange: (patch: Partial<ContactFilter>) => void;
}) {
  if (
    filter.operator === "is_known" ||
    filter.operator === "is_unknown" ||
    filter.operator === "is_true" ||
    filter.operator === "is_false"
  ) {
    return null;
  }

  if (filter.operator === "is_any_of" || filter.operator === "is_none_of") {
    return (
      <SearchableChecklist
        options={def.options ?? []}
        selected={filter.values ?? []}
        onChange={(values) => onChange({ values })}
      />
    );
  }

  if (filter.operator === "between") {
    if (def.type === "date") {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filter.valueMin ?? ""}
            onChange={(e) => onChange({ valueMin: e.target.value })}
          />
          <span className="text-xs text-muted-foreground">and</span>
          <Input
            type="date"
            value={filter.valueMax ?? ""}
            onChange={(e) => onChange({ valueMax: e.target.value })}
          />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={filter.valueMin ?? ""}
          onChange={(e) => onChange({ valueMin: e.target.value })}
        />
        <span className="text-xs text-muted-foreground">and</span>
        <Input
          type="number"
          placeholder="Max"
          value={filter.valueMax ?? ""}
          onChange={(e) => onChange({ valueMax: e.target.value })}
        />
      </div>
    );
  }

  if (filter.operator === "in_last_days") {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          className="w-24"
          value={filter.value ?? ""}
          onChange={(e) => onChange({ value: e.target.value })}
        />
        <span className="text-sm text-muted-foreground">days</span>
      </div>
    );
  }

  if (def.type === "date") {
    return <Input type="date" value={filter.value ?? ""} onChange={(e) => onChange({ value: e.target.value })} />;
  }

  if (def.type === "number") {
    return <Input type="number" value={filter.value ?? ""} onChange={(e) => onChange({ value: e.target.value })} />;
  }

  return <Input value={filter.value ?? ""} onChange={(e) => onChange({ value: e.target.value })} />;
}

export function AdvancedFiltersPanel({
  filters,
  onChange,
  lockedFilter,
}: {
  filters: ContactFilter[];
  onChange: (filters: ContactFilter[]) => void;
  lockedFilter?: ContactFilter;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ContactFilter[]>(filters);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function openPanel() {
    setDraft(filters);
    setEditingIndex(null);
    setOpen(true);
  }

  function updateRow(index: number, patch: Partial<ContactFilter>) {
    setDraft((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function selectField(index: number, field: string) {
    const def = FILTER_FIELD_MAP[field];
    updateRow(index, {
      field,
      operator: OPERATORS_BY_TYPE[def.type][0].value,
      value: undefined,
      values: undefined,
      valueMin: undefined,
      valueMax: undefined,
    });
    setEditingIndex(null);
  }

  function changeOperator(index: number, operator: FilterOperator) {
    updateRow(index, { operator, value: undefined, values: undefined, valueMin: undefined, valueMax: undefined });
  }

  function removeRow(index: number) {
    setDraft((rows) => rows.filter((_, i) => i !== index));
    setEditingIndex(null);
  }

  function addRow() {
    setDraft((rows) => {
      const next = [...rows, emptyFilter()];
      setEditingIndex(next.length - 1);
      return next;
    });
  }

  function apply() {
    onChange(draft.filter(isFilterComplete));
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

      {lockedFilter && (
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Lock className="size-3" />
          {describeFilter(lockedFilter)}
        </span>
      )}

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
                        <PropertyPicker fields={FILTERABLE_FIELDS} onSelect={(field) => selectField(index, field)} />
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Select
                            value={filter.operator}
                            onValueChange={(v) => changeOperator(index, v as FilterOperator)}
                          >
                            <SelectTrigger className="w-full">
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
                          <ValueEditor filter={filter} def={def} onChange={(patch) => updateRow(index, patch)} />
                        </div>
                      )}
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
