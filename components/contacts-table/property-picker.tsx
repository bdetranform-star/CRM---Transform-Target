"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";

/**
 * Searchable single-select list of properties — shared by the Advanced
 * Filters panel and the Bulk Edit dialogs so both flows pick a property the
 * same way. `excludeFields` lets a caller hide properties already in use
 * elsewhere in the same form (bulk edit doesn't allow setting the same
 * property twice; Advanced Filters has no such restriction and omits it).
 */
export function PropertyPicker({
  fields,
  onSelect,
  excludeFields,
}: {
  fields: { field: string; label: string }[];
  onSelect: (field: string) => void;
  excludeFields?: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const filtered = fields
    .filter((f) => !excludeFields?.has(f.field))
    .filter((f) => f.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Input
        placeholder="Search properties..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        className="rounded-none border-0 border-b border-border focus-visible:ring-0"
      />
      <div className="max-h-56 overflow-y-auto p-1">
        {filtered.map((f) => (
          <button
            key={f.field}
            type="button"
            onClick={() => onSelect(f.field)}
            className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-secondary"
          >
            {f.label}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matching properties.</p>
        )}
      </div>
    </div>
  );
}
