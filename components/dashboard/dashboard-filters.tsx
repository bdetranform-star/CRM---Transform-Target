"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { TEAM_MEMBER_LABELS } from "@/lib/status-config";

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

export function DashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "ALL") next.delete(key);
    else next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Quick filters</span>
      <Select value={searchParams.get("range") ?? "30"} onValueChange={(v) => update("range", v)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RANGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={searchParams.get("owner") ?? "ALL"} onValueChange={(v) => update("owner", v)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All owners" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All owners</SelectItem>
          {Object.entries(TEAM_MEMBER_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
