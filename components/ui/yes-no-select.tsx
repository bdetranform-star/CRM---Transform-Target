"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

/** A Yes/No dropdown for a nullable boolean property — no third "None" option to pick, but starts unset (placeholder) until a value is chosen. */
export function YesNoSelect({
  value,
  onChange,
}: {
  value: boolean | null | undefined;
  onChange: (value: boolean) => void;
}) {
  return (
    <Select
      value={value === true ? "true" : value === false ? "false" : undefined}
      onValueChange={(v) => onChange(v === "true")}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="None" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">Yes</SelectItem>
        <SelectItem value="false">No</SelectItem>
      </SelectContent>
    </Select>
  );
}
