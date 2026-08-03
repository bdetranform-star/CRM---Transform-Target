"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type InlineSelectOption = { value: string; label: string };

/**
 * HubSpot-style inline property editor: click the current value, a popover
 * opens directly below with a search box and a scrollable option list;
 * picking an option saves immediately (via `onSave`) and closes the popover
 * — no separate Save/Cancel step, unlike the section-level edit forms this
 * sits alongside in property-sections.tsx.
 */
export function InlineSelect({
  value,
  options,
  placeholder = "—",
  nullable = false,
  nullLabel = "None",
  onSave,
  disabled,
}: {
  value: string | null | undefined;
  options: InlineSelectOption[];
  placeholder?: string;
  nullable?: boolean;
  nullLabel?: string;
  onSave: (value: string | null) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const currentLabel = options.find((o) => o.value === value)?.label;

  async function handleSelect(next: string | null) {
    setOpen(false);
    setSearch("");
    if (next === (value ?? null)) return;
    setSaving(true);
    try {
      await onSave(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || saving}
          className="-mx-1.5 -my-0.5 block w-full rounded px-1.5 py-0.5 text-left text-sm hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {currentLabel ?? <span className="text-muted-foreground">{placeholder}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="border-b border-border p-1.5">
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-8"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {nullable && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={cn(
                "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-secondary",
                (value ?? null) === null && "font-medium"
              )}
            >
              <span className="text-muted-foreground">{nullLabel}</span>
              {(value ?? null) === null && <Check className="size-3.5" />}
            </button>
          )}
          {filtered.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => handleSelect(o.value)}
              className={cn(
                "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-secondary",
                o.value === value && "font-medium"
              )}
            >
              <span>{o.label}</span>
              {o.value === value && <Check className="size-3.5" />}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No matches</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
